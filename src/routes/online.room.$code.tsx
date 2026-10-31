import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  buzz,
  success as hapticSuccess,
  error as hapticError,
  reveal as hapticReveal,
} from "@/lib/haptics";
import {
  playRoleRevealSound,
  playDiscussionStartSound,
  playTimerTickSound,
  playTimerAlarmSound,
  playVoteConfirmSound,
  playVerdictSound,
} from "@/lib/audio";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Crown,
  Zap,
  Flame,
  Ghost,
  Skull,
  Gamepad2,
  Heart,
  Star,
  Trophy,
  Target,
  Shield,
  Eye,
  Bot,
  Sun,
  Smile,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  Send,
  CheckCircle2,
  Play,
  RefreshCw,
  XCircle,
  Fingerprint,
  MessageSquare,
} from "lucide-react";
import { PACKS } from "@/lib/mcp/packs";
import { fetchCustomPacks } from "@/lib/customPacks";
import { renderAvatar } from "./play.setup";
import {
  OnlineGameState,
  OnlinePlayer,
  assignOnlineRoles,
  assignHotseatRoles,
  GameCategory,
  PanelSubMode,
  SoloBluffPayload,
  TripleClaimPayload,
  PhotoCounterfeitPayload,
} from "@/lib/online-engine";

export const Route = createFileRoute("/online/room/$code")({
  component: OnlineRoom,
  head: () => ({
    meta: [
      { title: "Online Room — Bro or Fraud?" },
      { name: "description", content: "Active multiplayer game room." },
    ],
  }),
});

const AVATARS = [
  "Zap",
  "Crown",
  "Flame",
  "Ghost",
  "Skull",
  "Gamepad2",
  "Heart",
  "Star",
  "Trophy",
  "Target",
  "Shield",
  "Eye",
  "Bot",
  "Sun",
  "Smile",
  "User",
];

const ROASTS_WIN = [
  "Bros saw right through you. Go back to acting school.",
  "Bro got cooked faster than Maggi in a hostel kettle.",
  "Bros caught the Fraud red-handed. Better luck next time.",
  "Fraud got exposed. Rizz level: -100.",
];

const ROASTS_LOSE = [
  "Fraud escaped. Bros got played worse than a proxy attendance scam.",
  "The Fraud was right there and you voted for a Bro. Brain cells: 0.",
  "Fraud gaslit the entire room. Rizz Master at work.",
  "Bros are certified clowns. You got absolutely cooked.",
];

export function OnlineRoom() {
  const { code: roomCode } = Route.useParams();
  const navigate = useNavigate();

  // Profile setup states - always ask player to name themselves when entering
  const [profileSet, setProfileSet] = useState(false);
  const [myName, setMyName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bof:username") || "";
    }
    return "";
  });
  const [myAvatar, setMyAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bof:user_avatar") || "Zap";
    }
    return "Zap";
  });

  // Client Identification
  const [myPlayerId] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("bof_online_pid");
      if (saved) return saved;
      const newId = "p_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("bof_online_pid", newId);
      return newId;
    }
    return "p_host";
  });

  // Master Room States
  const [gameState, setGameState] = useState<OnlineGameState>({
    roomCode: roomCode.toUpperCase(),
    hostId: "",
    phase: "LOBBY",
    players: [],
    selectedPackId: "hostel-life",
    targetWord: "",
    decoyWord: "",
    fraudPlayerId: "",
    votes: {},
    clueTurnIndex: 0,
    timerSeconds: 60,
    secondsLeft: 60,
    timerActive: false,
    currentRound: 1,
    usedWords: [],
    category: "WORD_DEDUCTION",
    subMode: "SOLO_BLUFF",
    panelIds: [],
    audienceIds: [],
    maxRounds: 3,
    payload: null,
  });

  // Network PeerJS references
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<any[]>([]); // For host to track guests
  const connRef = useRef<any>(null); // For guest to track connection to host
  const [statusMessage, setStatusMessage] = useState("Initializing WebRTC...");
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Local game states
  const [cardFlipped, setCardFlipped] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [myClue, setMyClue] = useState("");
  const [submittedClue, setSubmittedClue] = useState(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [submittedVote, setSubmittedVote] = useState(false);
  const [myPanelClaim, setMyPanelClaim] = useState("");
  const [submittedPanelClaim, setSubmittedPanelClaim] = useState(false);

  const isHost =
    typeof window !== "undefined" &&
    sessionStorage.getItem("bof:hosting") === roomCode.toUpperCase();

  // 1. Save Profile
  const handleSaveProfile = () => {
    const trimmed = myName.trim();
    if (!trimmed) return;
    localStorage.setItem("bof:username", trimmed);
    localStorage.setItem("bof:user_avatar", myAvatar);
    setProfileSet(true);
    buzz(15);
  };

  // 2. Broadcast Helper (Host only)
  const broadcastState = (state: OnlineGameState) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({ type: "state", state });
      }
    });
  };

  const updateAndBroadcast = (updater: (prev: OnlineGameState) => OnlineGameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      broadcastState(next);
      return next;
    });
  };

  // 3. WebRTC Setup via PeerJS
  useEffect(() => {
    if (!profileSet) return;

    let activePeer: any = null;
    let retryTimer: any = null;

    const peerOptions = {
      debug: 2,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
        ],
      },
    };

    import("peerjs").then(({ Peer }) => {
      if (isHost) {
        // HOST SETUP
        const peerId = `bofr-room-${roomCode.toUpperCase()}`;
        activePeer = new Peer(peerId, peerOptions);

        activePeer.on("open", () => {
          console.log("Host registered peer ID:", peerId);
          setStatusMessage("Waiting for players...");
          setIsConnected(true);
          setGameState((prev) => ({
            ...prev,
            hostId: myPlayerId,
            players: [
              {
                id: myPlayerId,
                name: myName,
                avatar: myAvatar,
                isReady: false,
                score: 0,
                isHost: true,
              },
            ],
          }));
        });

        activePeer.on("connection", (conn: any) => {
          console.log("Guest connecting:", conn.peer);

          conn.on("open", () => {
            connectionsRef.current.push(conn);
          });

          conn.on("data", (data: any) => {
            if (!data || typeof data !== "object") return;

            if (data.type === "join") {
              setGameState((prev) => {
                // Check if player is already added
                const exists = prev.players.some((p) => p.id === data.id);
                let updatedPlayers = [...prev.players];
                if (!exists) {
                  updatedPlayers.push({
                    id: data.id,
                    name: data.name,
                    avatar: data.avatar,
                    isReady: false,
                    score: 0,
                    isHost: false,
                  });
                } else {
                  // Reconnect: update avatar/name
                  updatedPlayers = updatedPlayers.map((p) =>
                    p.id === data.id ? { ...p, name: data.name, avatar: data.avatar } : p,
                  );
                }
                const nextState = { ...prev, players: updatedPlayers };
                // Send fresh state back to everyone
                connectionsRef.current.forEach((c) => {
                  if (c.open) c.send({ type: "state", state: nextState });
                });
                return nextState;
              });
            } else if (data.type === "ready") {
              updateAndBroadcast((prev) => ({
                ...prev,
                players: prev.players.map((p) =>
                  p.id === data.playerId ? { ...p, isReady: data.isReady } : p,
                ),
              }));
            } else if (data.type === "clue") {
              updateAndBroadcast((prev) => {
                const nextPlayers = prev.players.map((p) =>
                  p.id === data.playerId ? { ...p, clue: data.clue } : p,
                );

                // Determine turn increments
                const nextTurnIndex = prev.clueTurnIndex + 1;
                let nextPhase = prev.phase;
                let timerActive = prev.timerActive;
                let secondsLeft = prev.secondsLeft;

                if (nextTurnIndex >= prev.players.length) {
                  // All players submitted clues, trigger interrogation phase
                  nextPhase = "DISCUSSION";
                  timerActive = true;
                  secondsLeft = prev.timerSeconds;
                }

                return {
                  ...prev,
                  players: nextPlayers,
                  clueTurnIndex: nextTurnIndex,
                  phase: nextPhase,
                  timerActive,
                  secondsLeft,
                };
              });
            } else if (data.type === "panel-claim") {
              updateAndBroadcast((prev) => {
                if (!prev.payload) return prev;
                return {
                  ...prev,
                  payload: {
                    ...prev.payload,
                    panelClaims: { ...prev.payload.panelClaims, [data.playerId]: data.claim },
                  },
                };
              });
            } else if (data.type === "go-to-voting") {
              updateAndBroadcast((prev) => ({ ...prev, phase: "VOTING" }));
            } else if (data.type === "vote") {
              updateAndBroadcast((prev) => {
                const nextVotes = { ...prev.votes, [data.voterId]: data.targetId };
                const nextPlayers = prev.players.map((p) =>
                  p.id === data.voterId ? { ...p, vote: data.targetId } : p,
                );

                // If everyone has voted, reveal the score/verdict
                let nextPhase = prev.phase;
                if (prev.category === "HOTSEAT_PANELS") {
                  const totalAudienceVotes = Object.keys(nextVotes).filter((vid) =>
                    prev.audienceIds?.includes(vid),
                  ).length;
                  const totalExpected = prev.audienceIds?.length || 0;
                  if (totalAudienceVotes >= totalExpected) {
                    nextPhase = "REVEAL";
                  }
                } else {
                  const totalVotesCast = Object.keys(nextVotes).length;
                  if (totalVotesCast >= prev.players.length) {
                    nextPhase = "RESULTS";
                  }
                }

                return {
                  ...prev,
                  votes: nextVotes,
                  players: nextPlayers,
                  phase: nextPhase,
                };
              });
            }
          });

          conn.on("close", () => {
            console.log("Guest disconnected:", conn.peer);
            connectionsRef.current = connectionsRef.current.filter((c) => c !== conn);
            // Optionally remove players or mark offline
          });

          conn.on("error", (err: any) => {
            console.error("Host connection error:", err);
          });
        });

        activePeer.on("close", () => {
          setIsConnected(false);
          setStatusMessage("Room closed.");
        });

        activePeer.on("disconnected", () => {
          setIsConnected(false);
          setStatusMessage("Disconnected from matchmaking.");
        });

        activePeer.on("error", (err: any) => {
          console.error("Host PeerJS error:", err);
          setIsConnected(false);
          if (err.type === "unavailable-id") {
            // Already active host. Change code.
            alert("This room code is already active. Redirecting to lobby.");
            navigate({ to: "/online/lobby" });
          } else {
            setStatusMessage(`Connection failed (${err.type || "unknown"}).`);
          }
        });

        peerRef.current = activePeer;
      } else {
        // GUEST SETUP
        activePeer = new Peer(peerOptions);
        let retryCount = 0;
        const maxRetries = 3;

        const attemptConnect = () => {
          if (!activePeer || activePeer.destroyed) return;
          console.log(`Connecting to host (attempt ${retryCount + 1}/${maxRetries + 1})...`);
          setStatusMessage(`Connecting to host... (Attempt ${retryCount + 1}/${maxRetries + 1})`);

          const conn = activePeer.connect(`bofr-room-${roomCode.toUpperCase()}`, {
            reliable: true,
          });

          conn.on("open", () => {
            console.log("Connected to host room");
            setStatusMessage("Joined room!");
            setIsConnected(true);
            conn.send({ type: "join", id: myPlayerId, name: myName, avatar: myAvatar });
          });

          conn.on("data", (data: any) => {
            if (data && data.type === "state") {
              setGameState(data.state);
            }
          });

          conn.on("close", () => {
            console.warn("Host connection closed");
            setStatusMessage("Disconnected from host.");
            setIsConnected(false);
          });

          conn.on("error", (err: any) => {
            console.error("Guest connection error:", err);
            setIsConnected(false);
          });

          connRef.current = conn;
        };

        activePeer.on("open", () => {
          attemptConnect();
        });

        activePeer.on("error", (err: any) => {
          console.error("Guest PeerJS error:", err);
          setIsConnected(false);

          if (err.type === "peer-unavailable" && retryCount < maxRetries) {
            retryCount++;
            setStatusMessage(
              `Room not active yet. Retrying in 2.5s... (${retryCount}/${maxRetries})`,
            );
            retryTimer = setTimeout(() => {
              attemptConnect();
            }, 2500);
          } else if (err.type === "peer-unavailable") {
            setStatusMessage("Host room not found. Please check the code.");
          } else {
            setStatusMessage(`Connection failed (${err.type || "unknown"}).`);
          }
        });

        peerRef.current = activePeer;
      }
    });

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      activePeer?.destroy();
    };
  }, [profileSet, reconnectTrigger]);

  // 4. Synchronized Countdowns (Host only updates & broadcasts)
  useEffect(() => {
    if (!isHost || !gameState.timerActive || gameState.secondsLeft <= 0) return;

    const interval = setInterval(() => {
      updateAndBroadcast((prev) => {
        const nextSec = prev.secondsLeft - 1;
        if (nextSec <= 10 && nextSec >= 0) {
          buzz(15);
        }

        let nextPhase = prev.phase;
        let timerActive = prev.timerActive;

        if (nextSec === 0) {
          nextPhase = "VOTING";
          timerActive = false;
        }

        return {
          ...prev,
          secondsLeft: nextSec,
          phase: nextPhase,
          timerActive,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, gameState.timerActive, gameState.secondsLeft]);

  // 5. Sound trigger for phase transitions and reset local UI states
  const prevPhaseRef = useRef(gameState.phase);
  useEffect(() => {
    if (gameState.phase !== prevPhaseRef.current) {
      if (gameState.phase === "DISCUSSION" || gameState.phase === "STAGE_ACTION") {
        playDiscussionStartSound();
      } else if (gameState.phase === "RESULTS") {
        const voteCounts: Record<string, number> = {};
        Object.values(gameState.votes || {}).forEach((targetId) => {
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });
        let highestVotedId = "";
        let highestCount = -1;
        Object.entries(voteCounts).forEach(([id, count]) => {
          if (count > highestCount) {
            highestCount = count;
            highestVotedId = id;
          }
        });
        const broWon = highestVotedId === gameState.fraudPlayerId;
        const myIsFraud = myPlayerId === gameState.fraudPlayerId;
        const isWin = myIsFraud ? !broWon : broWon;
        playVerdictSound(isWin);
      }
      prevPhaseRef.current = gameState.phase;
    }

    if (gameState.phase === "ROLE_REVEAL" || gameState.phase === "PREPARATION") {
      setCardFlipped(false);
      setHasRevealed(false);
      setMyClue("");
      setSubmittedClue(false);
      setSelectedSuspectId(null);
      setSubmittedVote(false);
      setMyPanelClaim("");
      setSubmittedPanelClaim(false);
    }
  }, [gameState.phase, gameState.votes, gameState.fraudPlayerId, myPlayerId]);

  // Audio countdown ticks on synchronized timer
  useEffect(() => {
    if (!gameState.timerActive) return;
    if (gameState.secondsLeft <= 5 && gameState.secondsLeft > 0) {
      buzz(15);
      playTimerTickSound(true);
    } else if (gameState.secondsLeft === 0) {
      playTimerAlarmSound();
    }
  }, [gameState.secondsLeft, gameState.timerActive]);

  // 6. Automatically transition host from ROLE_REVEAL to DISCUSSION once all players are ready (Word Deduction)
  useEffect(() => {
    if (!isHost) return;
    const allReady = gameState.players.length > 0 && gameState.players.every((p) => p.isReady);
    if (gameState.phase === "ROLE_REVEAL" && allReady) {
      const timer = setTimeout(() => {
        updateAndBroadcast((prev) => ({ ...prev, phase: "DISCUSSION", clueTurnIndex: 0 }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHost, gameState.phase, gameState.players]);

  // 7. Automatically transition host from PREPARATION to STAGE_ACTION once all panel players are ready (Hotseat Panels)
  useEffect(() => {
    if (!isHost || gameState.category !== "HOTSEAT_PANELS") return;
    if (gameState.phase === "PREPARATION") {
      const panelPlayers = gameState.players.filter((p) => gameState.panelIds?.includes(p.id));
      const allPanelReady = panelPlayers.length > 0 && panelPlayers.every((p) => p.isReady);
      if (allPanelReady) {
        const timer = setTimeout(() => {
          updateAndBroadcast((prev) => ({ ...prev, phase: "STAGE_ACTION" }));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isHost, gameState.phase, gameState.players, gameState.category, gameState.panelIds]);

  // Actions
  const toggleReady = () => {
    buzz(15);
    const newReady = !gameState.players.find((p) => p.id === myPlayerId)?.isReady;
    if (isHost) {
      updateAndBroadcast((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === myPlayerId ? { ...p, isReady: newReady } : p)),
      }));
    } else {
      connRef.current?.send({ type: "ready", playerId: myPlayerId, isReady: newReady });
    }
  };

  const handleStartGame = () => {
    if (gameState.category === "HOTSEAT_PANELS") {
      if (gameState.players.length < 4) {
        alert("Need at least 4 players to start Hotseat Panels!");
        return;
      }
      buzz([30, 20, 30]);
      const nextState = assignHotseatRoles(gameState);
      updateAndBroadcast((_) => nextState);
    } else {
      if (gameState.players.length < 3) {
        alert("Need at least 3 players to start!");
        return;
      }
      buzz([30, 20, 30]);
      const nextState = assignOnlineRoles(gameState);
      updateAndBroadcast((_) => nextState);
    }
  };

  const submitClue = () => {
    if (!myClue.trim()) return;
    buzz(20);
    setSubmittedClue(true);
    const word = myClue.trim().split(" ")[0] || "Sus";

    if (isHost) {
      updateAndBroadcast((prev) => {
        const nextPlayers = prev.players.map((p) =>
          p.id === myPlayerId ? { ...p, clue: word } : p,
        );
        const nextTurn = prev.clueTurnIndex + 1;
        let nextPhase = prev.phase;
        let timerActive = prev.timerActive;
        let secondsLeft = prev.secondsLeft;

        if (nextTurn >= prev.players.length) {
          nextPhase = "DISCUSSION";
          timerActive = true;
          secondsLeft = prev.timerSeconds;
        }

        return {
          ...prev,
          players: nextPlayers,
          clueTurnIndex: nextTurn,
          phase: nextPhase,
          timerActive,
          secondsLeft,
        };
      });
    } else {
      connRef.current?.send({ type: "clue", playerId: myPlayerId, clue: word });
    }
  };

  const submitPanelClaim = () => {
    if (!myPanelClaim.trim()) return;
    buzz(20);
    setSubmittedPanelClaim(true);
    const claim = myPanelClaim.trim();

    if (isHost) {
      updateAndBroadcast((prev) => {
        if (!prev.payload) return prev;
        return {
          ...prev,
          payload: {
            ...prev.payload,
            panelClaims: { ...prev.payload.panelClaims, [myPlayerId]: claim },
          },
        };
      });
    } else {
      connRef.current?.send({ type: "panel-claim", playerId: myPlayerId, claim });
    }
  };

  const advanceToVoting = () => {
    buzz(30);
    if (isHost) {
      updateAndBroadcast((prev) => ({ ...prev, phase: "VOTING" }));
    } else {
      connRef.current?.send({ type: "go-to-voting" });
    }
  };

  const submitVote = () => {
    if (!selectedSuspectId) return;
    buzz([40, 20, 60]);
    playVoteConfirmSound();
    setSubmittedVote(true);

    if (isHost) {
      updateAndBroadcast((prev) => {
        const nextVotes = { ...prev.votes, [myPlayerId]: selectedSuspectId };
        const nextPlayers = prev.players.map((p) =>
          p.id === myPlayerId ? { ...p, vote: selectedSuspectId } : p,
        );

        let nextPhase = prev.phase;
        if (prev.category === "HOTSEAT_PANELS") {
          const totalAudienceVotes = Object.keys(nextVotes).filter((vid) =>
            prev.audienceIds?.includes(vid),
          ).length;
          const totalExpected = prev.audienceIds?.length || 0;
          if (totalAudienceVotes >= totalExpected) {
            nextPhase = "REVEAL";
          }
        } else {
          const totalVotesCast = Object.keys(nextVotes).length;
          if (totalVotesCast >= prev.players.length) {
            nextPhase = "RESULTS";
          }
        }

        return {
          ...prev,
          votes: nextVotes,
          players: nextPlayers,
          phase: nextPhase,
        };
      });
    } else {
      connRef.current?.send({ type: "vote", voterId: myPlayerId, targetId: selectedSuspectId });
    }
  };

  const handleNextRound = () => {
    if (!isHost) return;
    buzz(30);

    if (gameState.category === "HOTSEAT_PANELS") {
      if (gameState.currentRound >= (gameState.maxRounds || 3)) {
        // Go back to Lobby
        updateAndBroadcast((prev) => ({
          ...prev,
          phase: "LOBBY",
          currentRound: 1,
          players: prev.players.map((p) => ({ ...p, isReady: false, vote: "", clue: "" })),
        }));
      } else {
        const nextState = assignHotseatRoles({
          ...gameState,
          currentRound: gameState.currentRound + 1,
        });
        updateAndBroadcast((_) => nextState);
      }
    } else {
      const nextState = assignOnlineRoles({
        ...gameState,
        currentRound: gameState.currentRound + 1,
      });
      updateAndBroadcast((_) => nextState);
    }
  };

  const copyRoomCode = async () => {
    buzz(15);
    try {
      await navigator.clipboard.writeText(roomCode.toUpperCase());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions / insecure context). The code is
      // selectable, so fall back to selecting it for manual copy.
      const el = document.getElementById("room-code-display");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // Renders the secret word as a clean, highly-legible text block
  const renderCleanWord = (word: string, isFraud: boolean) => {
    if (!word) return null;
    return (
      <div className="my-2 py-2.5 px-4 rounded-xl bg-void/80 border border-white/5 flex flex-col items-center justify-center min-h-[60px] w-full">
        <div
          className={`text-2xl font-black tracking-widest uppercase font-mono select-none ${
            isFraud
              ? "text-magenta drop-shadow-[0_0_10px_rgba(255,45,85,0.4)]"
              : "text-lime drop-shadow-[0_0_10px_rgba(255,214,0,0.4)]"
          }`}
        >
          {word}
        </div>
      </div>
    );
  };

  // Profile Setup Screen
  if (!profileSet) {
    return (
      <div className="min-h-dvh bg-void text-foreground grid place-items-center px-5">
        <div className="w-full max-w-sm rounded-2xl border-2 border-border bg-surface p-6 brutal-shadow-magenta">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-magenta text-center">
            // JOIN ROOM {roomCode.toUpperCase()}
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase text-center text-off-white">
            Set Up Profile
          </h1>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Priyanshu"
                maxLength={12}
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full mt-1.5 rounded-xl border-2 border-white/10 bg-void px-4 py-3 text-sm font-bold text-foreground focus:border-magenta focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
                Select Avatar
              </label>
              <div className="grid grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-1.5 border border-white/5 bg-void/50 rounded-xl">
                {AVATARS.map((avatar) => {
                  const active = myAvatar === avatar;
                  return (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => {
                        buzz(10);
                        setMyAvatar(avatar);
                      }}
                      className={`grid aspect-square place-items-center rounded-lg border-2 text-lime tactile transition-all ${
                        active ? "border-lime bg-lime/10" : "border-white/5 bg-surface"
                      }`}
                    >
                      {renderAvatar(avatar, "size-6")}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={!myName.trim()}
              className="w-full mt-4 rounded-xl bg-magenta py-4 text-center text-md font-black uppercase tracking-wide text-white border-2 border-void brutal-shadow-white tactile tactile-press disabled:opacity-50"
            >
              Enter Room →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Room view
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const isMyTurn = gameState.players[gameState.clueTurnIndex]?.id === myPlayerId;
  const isMyFraud = gameState.fraudPlayerId === myPlayerId;
  const wordToDisplay = isMyFraud ? gameState.decoyWord : gameState.targetWord;

  const renderHotseatPreparation = () => {
    const isPanelist = gameState.panelIds?.includes(myPlayerId);

    if (isPanelist) {
      const payload = gameState.payload;
      if (!payload) return null;

      let isFraud = false;
      let displayRoleName = "BRO";
      let displaySecretTitle = "Secret Prompt";
      let displaySecretValue = "";
      let displayInstruction = "";

      if (gameState.subMode === "SOLO_BLUFF") {
        const p = payload as SoloBluffPayload;
        isFraud = p.fraudId === myPlayerId;
        displayRoleName = isFraud ? "FRAUD" : "BRO";
        displaySecretTitle = isFraud ? "Your Decoy Word" : "Secret Word";
        displaySecretValue = isFraud ? p.bluffPrompt : p.realPrompt;
        displayInstruction = isFraud
          ? "Pretend you have the real word. Say a clue for this Decoy Word!"
          : "Say a clue related to this word. Don't let the Fraud guess it!";
      } else if (gameState.subMode === "TRIPLE_CLAIM") {
        const p = payload as TripleClaimPayload;
        const isOwner = p.ownerId === myPlayerId;
        isFraud = !isOwner;
        displayRoleName = isOwner ? "BRO (Real Owner)" : "FRAUD (Bluffer)";
        displaySecretTitle = "The Claim Story";
        displaySecretValue = p.claim;
        displayInstruction = isOwner
          ? "This is your real secret! Defend it with a believable description."
          : "This is NOT your story! You must lie and convince the audience it's yours.";
      } else if (gameState.subMode === "PHOTO_COUNTERFEIT") {
        const p = payload as PhotoCounterfeitPayload;
        const isCounterfeiter = p.counterfeitId === myPlayerId;
        isFraud = isCounterfeiter;
        displayRoleName = isCounterfeiter ? "FRAUD (Counterfeiter)" : "BRO";
        displaySecretTitle = isCounterfeiter
          ? "Counterfeit Image Description"
          : "Original Image Description";
        displaySecretValue = isCounterfeiter
          ? p.counterfeitPhotoDescription
          : p.realPhotoDescription;
        displayInstruction = isCounterfeiter
          ? "Describe this counterfeit description. Convince the audience you saw the original!"
          : "Describe this photo description. Don't make it too obvious, but prove you saw it!";
      }

      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center mt-6">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            // VERIFY SECRET ROLE
          </span>

          <div
            className="relative mx-auto mt-6 w-72 h-[380px] cursor-pointer"
            style={{ perspective: 1000 }}
            onClick={() => {
              buzz(20);
              const nextFlipped = !cardFlipped;
              setCardFlipped(nextFlipped);
              if (nextFlipped) {
                setHasRevealed(true);
                playRoleRevealSound();
              }
            }}
          >
            <motion.div
              className="w-full h-full relative preserve-3d"
              animate={{ rotateY: cardFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front Side: Cyber badge */}
              <div
                className="absolute inset-0 backface-hidden bg-[#12121A] border-4 border-dashed border-lime/40 rounded-3xl flex flex-col items-center justify-center p-6 text-center shadow-[0_0_20px_rgba(255,214,0,0.15)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-2 border border-lime/10 rounded-2xl pointer-events-none" />
                <Eye size={48} className="text-lime/60 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-lime mt-4 bg-lime/10 px-2 py-0.5 rounded border border-lime/20">
                  PANEL SENSITIVE
                </span>
                <h2 className="mt-3 text-3xl font-title uppercase tracking-wider text-foreground">
                  TAP TO PEEK
                </h2>
                <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase max-w-[20ch]">
                  Keep your screen hidden from the audience!
                </p>
              </div>

              {/* Back Side: Details */}
              <div
                className={`absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col items-center justify-between text-center border-3 bg-gradient-to-b from-[#12121A] ${
                  isFraud
                    ? "to-[#231119] border-magenta shadow-[0_0_25px_rgba(255,45,85,0.3)]"
                    : "to-[#181C12] border-lime shadow-[0_0_25px_rgba(255,214,0,0.3)]"
                }`}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    buzz(15);
                    setCardFlipped(false);
                  }}
                  className={`absolute -top-3.5 right-6 border-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-[#12121A] hover:scale-105 active:scale-95 transition-all shadow-md z-20 ${
                    isFraud
                      ? "border-magenta text-magenta shadow-magenta/15"
                      : "border-lime text-lime shadow-lime/15"
                  }`}
                >
                  Hide Card
                </button>

                <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-2">
                  <span>ROUND {gameState.currentRound}</span>
                  <span className={isFraud ? "text-magenta font-black" : "text-lime font-black"}>
                    {gameState.subMode}
                  </span>
                </div>

                <div className="my-auto text-center flex flex-col items-center">
                  <div
                    className={`p-4 rounded-full border-2 mb-3 bg-surface ${
                      isFraud
                        ? "border-magenta/40 text-magenta bg-magenta/5 shadow-[0_0_12px_rgba(255,45,85,0.2)] animate-pulse"
                        : "border-lime/40 text-lime bg-lime/5 shadow-[0_0_12px_rgba(255,214,0,0.2)]"
                    }`}
                  >
                    {isFraud ? <ShieldAlert size={36} /> : <User size={36} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">
                    YOU ARE A
                  </span>
                  <h2
                    className={`text-3xl font-black uppercase tracking-wide mt-1.5 font-title leading-none ${
                      isFraud
                        ? "text-magenta drop-shadow-[0_2px_10px_rgba(255,45,85,0.5)]"
                        : "text-lime drop-shadow-[0_2px_10px_rgba(255,214,0,0.5)]"
                    }`}
                  >
                    {displayRoleName}
                  </h2>
                </div>

                <div
                  className={`w-full rounded-2xl p-4 border bg-surface/90 flex flex-col justify-center items-center ${
                    isFraud
                      ? "border-magenta/35 shadow-[0_0_15px_rgba(255,45,85,0.08)]"
                      : "border-lime/35 shadow-[0_0_15px_rgba(255,214,0,0.08)]"
                  }`}
                >
                  <div className="w-full text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                      {displaySecretTitle}
                    </span>

                    <div className="my-2 py-2.5 px-3 rounded-xl bg-void/80 border border-white/5 flex flex-col items-center justify-center min-h-[60px] w-full">
                      <div
                        className={`text-sm font-black tracking-wide uppercase font-mono select-none text-center ${
                          isFraud ? "text-magenta" : "text-lime"
                        }`}
                      >
                        {displaySecretValue}
                      </div>
                    </div>

                    <p
                      className={`text-[9px] font-bold uppercase tracking-wider leading-tight ${isFraud ? "text-magenta/90" : "text-lime/90"}`}
                    >
                      {displayInstruction}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <p className="mt-6 text-xs text-muted-foreground max-w-[28ch]">
            {cardFlipped
              ? "Tap 'Hide Card' or flip to secure view"
              : "Tap card to flip it and read your secret prompt"}
          </p>

          <div className="flex-1" />

          <button
            type="button"
            disabled={!hasRevealed || myPlayer?.isReady}
            onClick={toggleReady}
            className="w-full rounded-xl bg-lime px-6 py-5 text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-white tactile tactile-press disabled:opacity-50 disabled:pointer-events-none"
          >
            {myPlayer?.isReady ? "Waiting for other panelists..." : "I'm Ready! →"}
          </button>
        </div>
      );
    } else {
      // Audience View
      return (
        <div className="flex flex-1 flex-col mt-6 text-center">
          <div className="my-auto py-10 px-5 rounded-2xl border-2 border-white/10 bg-surface/50 brutal-shadow-pink">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta animate-pulse block mb-3">
              [ STAGE PREPARATION ]
            </span>
            <h2 className="text-3xl font-black uppercase text-off-white">Panel is Preparing</h2>
            <p className="mt-3 text-xs text-muted-foreground max-w-[26ch] mx-auto leading-relaxed">
              The 4 chosen panelists are viewing their prompts and secrets. Watch their faces and
              prep behavior carefully!
            </p>

            <div className="mt-8 space-y-3 max-w-xs mx-auto text-left">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block border-b border-white/5 pb-1">
                Panelists Readiness
              </span>
              {gameState.players
                .filter((p) => gameState.panelIds?.includes(p.id))
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      {renderAvatar(p.avatar, "size-4 text-lime")}
                      <span className="text-xs font-bold uppercase text-off-white">{p.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${p.isReady ? "text-lime" : "text-magenta animate-pulse"}`}
                    >
                      {p.isReady ? "READY" : "WAITING"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
    }
  };

  const renderHotseatStageAction = () => {
    const isPanelist = gameState.panelIds?.includes(myPlayerId);
    const payload = gameState.payload;
    if (!payload) return null;

    const panelPlayers = gameState.players.filter((p) => gameState.panelIds?.includes(p.id));
    const allSubmitted = panelPlayers.every((p) => !!payload.panelClaims[p.id]);

    let inputPlaceholder = "Say something...";
    let secretWordLabel = "Your Prompt";
    let secretWordValue = "";

    if (gameState.subMode === "SOLO_BLUFF") {
      const p = payload as SoloBluffPayload;
      const isFraud = p.fraudId === myPlayerId;
      secretWordLabel = isFraud ? "Decoy Word" : "Secret Word";
      secretWordValue = isFraud ? p.bluffPrompt : p.realPrompt;
      inputPlaceholder = "Enter ONE word clue...";
    } else if (gameState.subMode === "TRIPLE_CLAIM") {
      const p = payload as TripleClaimPayload;
      secretWordLabel = "The Claim Story";
      secretWordValue = p.claim;
      inputPlaceholder = "Explain why this story is yours...";
    } else if (gameState.subMode === "PHOTO_COUNTERFEIT") {
      const p = payload as PhotoCounterfeitPayload;
      const isCounterfeiter = p.counterfeitId === myPlayerId;
      secretWordLabel = isCounterfeiter ? "Decoy Photo Prompt" : "Real Photo Prompt";
      secretWordValue = isCounterfeiter ? p.counterfeitPhotoDescription : p.realPhotoDescription;
      inputPlaceholder = "Describe what you saw in the photo...";
    }

    const claimSubmittedAlready = !!payload.panelClaims[myPlayerId];

    return (
      <div className="flex flex-1 flex-col mt-6">
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta animate-pulse">
            [ PANEL ACTION ]
          </span>
          <h1 className="mt-2 text-3xl font-black uppercase text-off-white leading-tight">
            {allSubmitted ? "Let the Roast Begin!" : "Panel is Presenting"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[28ch] mx-auto">
            {allSubmitted
              ? "All claims are on stage. Discuss, ask questions, and spot the bluffer!"
              : "Panelists are writing down their claims. Wait until everyone submits."}
          </p>
        </div>

        {/* Input area for active panelist */}
        {isPanelist && !submittedPanelClaim && !claimSubmittedAlready && (
          <div className="mt-6 rounded-2xl border-2 border-lime bg-lime/5 p-4 brutal-shadow-yellow text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-lime block">
              {secretWordLabel}
            </span>
            <span className="text-sm font-black text-off-white uppercase tracking-wide">
              {secretWordValue}
            </span>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder={inputPlaceholder}
                maxLength={gameState.subMode === "SOLO_BLUFF" ? 15 : 100}
                value={myPanelClaim}
                onChange={(e) => {
                  if (gameState.subMode === "SOLO_BLUFF") {
                    setMyPanelClaim(e.target.value.replace(/[^A-Za-z]/g, ""));
                  } else {
                    setMyPanelClaim(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitPanelClaim();
                }}
                className="flex-1 rounded-xl border border-white/10 bg-void px-4 py-3 text-sm font-bold text-foreground focus:border-lime focus:outline-none uppercase"
              />
              <button
                type="button"
                onClick={submitPanelClaim}
                disabled={!myPanelClaim.trim()}
                className="grid size-12 place-items-center rounded-xl bg-lime text-void border-2 border-void brutal-shadow-white tactile tactile-press disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Status for panelists who have submitted */}
        {isPanelist && (submittedPanelClaim || claimSubmittedAlready) && !allSubmitted && (
          <div className="mt-6 rounded-2xl border border-white/5 bg-surface/50 p-6 flex flex-col items-center justify-center">
            <CheckCircle2 size={32} className="text-lime animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider text-lime mt-3">
              Response Submitted!
            </span>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">
              Waiting for other panelists...
            </p>
          </div>
        )}

        {/* Panel submissions list */}
        <div className="mt-6 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
            Panel Submissions:
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            {panelPlayers.map((p) => {
              const claim = payload.panelClaims[p.id];
              return (
                <div
                  key={p.id}
                  className="rounded-xl bg-surface border border-white/5 p-3 flex flex-col gap-1.5 brutal-shadow-pink"
                >
                  <div className="flex items-center gap-2">
                    {renderAvatar(p.avatar, "size-4 text-lime")}
                    <span className="text-xs font-bold uppercase text-muted-foreground">
                      {p.name}
                    </span>
                    {p.id === myPlayerId && (
                      <span className="text-[8px] bg-lime/10 text-lime px-1.5 py-0.5 rounded font-black">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    {claim ? (
                      <p className="text-sm font-black text-off-white uppercase font-mono tracking-wide bg-void/50 p-2 rounded-lg border border-white/5">
                        "{claim}"
                      </p>
                    ) : (
                      <p className="text-xs italic text-magenta/40 bg-void/25 p-2 rounded-lg border border-dashed border-white/5">
                        writing claim...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Trigger for Host to move to Voting */}
        <div className="mt-8 flex-1 flex flex-col justify-end">
          {isHost && allSubmitted && (
            <button
              type="button"
              onClick={advanceToVoting}
              className="w-full rounded-xl bg-magenta px-6 py-5 text-lg font-black uppercase tracking-wide text-white border-2 border-void brutal-shadow-white tactile tactile-press"
            >
              Start Audience Voting
            </button>
          )}
          {!isHost && allSubmitted && (
            <div className="rounded-xl border border-white/5 bg-surface/30 p-4 text-center text-xs font-bold text-muted-foreground uppercase">
              Host is moderating debate. Prepare to vote!
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHotseatVoting = () => {
    const isAudience = gameState.audienceIds?.includes(myPlayerId);
    const payload = gameState.payload;
    if (!payload) return null;

    const panelPlayers = gameState.players.filter((p) => gameState.panelIds?.includes(p.id));
    const audienceVotes = Object.keys(gameState.votes).filter((vid) =>
      gameState.audienceIds?.includes(vid),
    );
    const totalExpected = gameState.audienceIds?.length || 0;

    let voteHeader = "Who is the FRAUD?";
    let voteDesc = "Cast your vote secretly. Spot the player who is bluffing.";

    if (gameState.subMode === "TRIPLE_CLAIM") {
      voteHeader = "Who is the BRO?";
      voteDesc = "Only ONE panelist is telling the truth. Who is the real owner?";
    }

    if (isAudience) {
      return (
        <div className="flex flex-1 flex-col mt-6">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta">
              [ AUDIENCE BALLOT ]
            </span>
            <h1 className="mt-2 text-3xl font-black uppercase leading-tight text-off-white">
              {voteHeader}
            </h1>
            <p className="text-xs text-muted-foreground mt-2 max-w-[28ch] mx-auto">{voteDesc}</p>
          </div>

          {/* List of Panelists to vote on */}
          <div className="mt-6 space-y-3">
            {panelPlayers.map((p) => {
              const active = selectedSuspectId === p.id;
              const claim = payload.panelClaims[p.id] || "No claim submitted";

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={submittedVote}
                  onClick={() => {
                    setSelectedSuspectId(p.id);
                    buzz(20);
                  }}
                  className={`w-full relative rounded-2xl border-3 p-4 text-left bg-surface transition-all duration-200 tactile flex flex-col gap-2 ${
                    active
                      ? "border-magenta scale-102 shadow-[0_0_20px_rgba(255,45,85,0.3)] z-10"
                      : "border-white/10 opacity-70"
                  } disabled:opacity-80`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderAvatar(p.avatar, "size-6 text-magenta")}
                      <span className="text-sm font-black uppercase text-off-white">{p.name}</span>
                    </div>
                    {active && (
                      <span className="text-[9px] font-black uppercase bg-magenta/20 text-magenta px-2 py-0.5 rounded animate-pulse">
                        VOTE TARGET
                      </span>
                    )}
                  </div>
                  <div className="bg-void/60 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black uppercase text-muted-foreground block mb-0.5">
                      CLAIM
                    </span>
                    <p className="text-xs font-mono text-off-white uppercase truncate">"{claim}"</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Confirm Vote Button */}
          {!submittedVote && selectedSuspectId && (
            <button
              type="button"
              onClick={submitVote}
              className="w-full mt-6 rounded-xl bg-lime px-6 py-5 text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-white tactile tactile-press"
            >
              Confirm Vote →
            </button>
          )}

          {submittedVote && (
            <div className="mt-6 rounded-2xl border border-white/5 bg-surface/50 p-5 text-center">
              <CheckCircle2 size={32} className="text-lime mx-auto mb-2" />
              <span className="text-xs font-black uppercase tracking-wider text-lime">
                Vote Confirmed!
              </span>
              <p className="text-[10px] text-muted-foreground uppercase mt-1">
                Waiting for other audience members ({audienceVotes.length} / {totalExpected})
              </p>
            </div>
          )}
        </div>
      );
    } else {
      // Panelist View (waiting for audience)
      return (
        <div className="flex flex-1 flex-col mt-6 text-center justify-center">
          <div className="my-auto py-10 px-5 rounded-2xl border-2 border-white/10 bg-surface/50 brutal-shadow-yellow max-w-sm mx-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-lime animate-pulse block mb-3">
              [ VOTING IN PROGRESS ]
            </span>
            <h2 className="text-3xl font-black uppercase text-off-white">Audience is Voting</h2>
            <p className="mt-3 text-xs text-muted-foreground max-w-[26ch] mx-auto leading-relaxed">
              Keep a straight face! Do not give away your secrets. The audience is voting on who the
              bluffer is.
            </p>

            <div className="mt-6 rounded-xl bg-void/50 border border-white/5 p-4">
              <span className="text-[10px] font-black uppercase text-muted-foreground block mb-1">
                Voting Status
              </span>
              <span className="text-2xl font-mono text-lime font-black">
                {audienceVotes.length} / {totalExpected}
              </span>
              <p className="text-[9px] text-muted-foreground uppercase mt-0.5">
                Audience Votes Submitted
              </p>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={() => updateAndBroadcast((prev) => ({ ...prev, phase: "REVEAL" }))}
                className="mt-6 w-full rounded-xl bg-magenta px-4 py-2.5 text-xs font-black uppercase text-white border-2 border-void brutal-shadow-white tactile"
              >
                Skip & Show Results
              </button>
            )}
          </div>
        </div>
      );
    }
  };

  const renderHotseatReveal = () => {
    const payload = gameState.payload;
    if (!payload) return null;

    // Calculate votes
    const voteCounts: Record<string, number> = {};
    Object.values(gameState.votes).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    let highestVotedId = "";
    let highestVotes = 0;
    Object.entries(voteCounts).forEach(([tid, count]) => {
      if (count > highestVotes) {
        highestVotes = count;
        highestVotedId = tid;
      }
    });

    const subMode = gameState.subMode || "SOLO_BLUFF";
    let isWin = false;
    let verdictTitle = "";
    let verdictSubtitle = "";
    let correctId = "";
    let roleText = "FRAUD";

    if (subMode === "SOLO_BLUFF") {
      const pld = payload as SoloBluffPayload;
      correctId = pld.fraudId;
      isWin = highestVotedId === correctId;
      verdictTitle = isWin ? "Fraud Exposed!" : "Fraud Escaped!";
      verdictSubtitle = isWin
        ? "The audience successfully found the Solo Bluffer."
        : "The bluffer gaslit the entire audience.";
    } else if (subMode === "TRIPLE_CLAIM") {
      const pld = payload as TripleClaimPayload;
      correctId = pld.ownerId;
      roleText = "BRO (Owner)";
      isWin = highestVotedId === correctId;
      verdictTitle = isWin ? "Bro Found!" : "Bros Gaslit!";
      verdictSubtitle = isWin
        ? "The audience spotted the real story owner."
        : "The audience fell for a fake claim.";
    } else {
      // PHOTO_COUNTERFEIT
      const pld = payload as PhotoCounterfeitPayload;
      correctId = pld.counterfeitId;
      isWin = highestVotedId === correctId;
      verdictTitle = isWin ? "Counterfeit Artist Exposed!" : "Counterfeit Escaped!";
      verdictSubtitle = isWin
        ? "The audience caught the photo counterfeiter."
        : "The counterfeiter's description was too believable.";
    }

    const correctName = gameState.players.find((p) => p.id === correctId)?.name || "Target";

    return (
      <div className="flex flex-1 flex-col items-center justify-between text-center mt-6 animate-[fade-in_0.3s_ease-out_both]">
        <div className="w-full flex flex-col items-center">
          <img
            src="/split-mask.png"
            alt="Verdict"
            className="size-20 rounded-2xl brutal-shadow-pink mb-3"
          />

          <p className="text-cyber-yellow text-2xl uppercase font-title tracking-wider">
            {isWin ? "Nice Job, Audience!" : "Better luck next time!"}
          </p>
          <h1 className="mt-1 text-3xl font-title uppercase tracking-tight text-off-white">
            {verdictTitle}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground max-w-[28ch] leading-relaxed">
            {verdictSubtitle}
          </p>

          {/* Reveal details card */}
          <div className="mt-5 w-full rounded-2xl border-2 border-border bg-surface p-4 text-left">
            <div className="rounded-xl bg-void border border-white/5 p-3 mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                The Secret Role Reveal
              </span>
              <p className="text-sm font-bold text-off-white uppercase">
                {roleText}: <span className="text-lime">{correctName}</span>
              </p>

              {subMode === "SOLO_BLUFF" && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[8px] font-black uppercase text-muted-foreground block">
                      Real Word
                    </span>
                    <span className="text-xs uppercase text-lime font-bold">
                      {(payload as SoloBluffPayload).realPrompt}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-muted-foreground block">
                      Decoy Word
                    </span>
                    <span className="text-xs uppercase text-magenta font-bold">
                      {(payload as SoloBluffPayload).bluffPrompt}
                    </span>
                  </div>
                </div>
              )}

              {subMode === "TRIPLE_CLAIM" && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <span className="text-[8px] font-black uppercase text-muted-foreground block">
                    The Claim Story
                  </span>
                  <span className="text-xs uppercase text-lime font-bold">
                    {(payload as TripleClaimPayload).claim}
                  </span>
                </div>
              )}

              {subMode === "PHOTO_COUNTERFEIT" && (
                <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[8px] font-black uppercase text-muted-foreground block">
                      Real Photo Description
                    </span>
                    <span className="text-xs uppercase text-lime font-bold font-mono">
                      {(payload as PhotoCounterfeitPayload).realPhotoDescription}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[8px] font-black uppercase text-muted-foreground block">
                      Counterfeit Description
                    </span>
                    <span className="text-xs uppercase text-magenta font-bold font-mono">
                      {(payload as PhotoCounterfeitPayload).counterfeitPhotoDescription}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Score updates for Hotseat Panel */}
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2.5">
              Round Score Changes
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {gameState.players.map((p) => {
                let gained = 0;
                const isAudience = gameState.audienceIds?.includes(p.id);

                if (subMode === "SOLO_BLUFF") {
                  const pld = payload as SoloBluffPayload;
                  const fraudId = pld.fraudId;
                  const fraudEscaped = highestVotedId !== fraudId;
                  if (p.id === fraudId) {
                    gained = fraudEscaped ? 150 : 0;
                  } else if (isAudience) {
                    gained = gameState.votes[p.id] === fraudId ? 100 : 0;
                  }
                } else if (subMode === "TRIPLE_CLAIM") {
                  const pld = payload as TripleClaimPayload;
                  const ownerId = pld.ownerId;
                  const ownerFound = highestVotedId === ownerId;
                  if (p.id === ownerId) {
                    gained = ownerFound ? 100 : 0;
                  } else if (pld.bluffers.includes(p.id)) {
                    gained = highestVotedId === p.id ? 150 : 0;
                  } else if (isAudience) {
                    gained = gameState.votes[p.id] === ownerId ? 100 : 0;
                  }
                } else {
                  // PHOTO_COUNTERFEIT
                  const pld = payload as PhotoCounterfeitPayload;
                  const counterfeitId = pld.counterfeitId;
                  const counterfeitEscaped = highestVotedId !== counterfeitId;
                  if (p.id === counterfeitId) {
                    gained = counterfeitEscaped ? 150 : 0;
                  } else if (isAudience) {
                    gained = gameState.votes[p.id] === counterfeitId ? 100 : 0;
                  }
                }

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-void px-3 py-2 border border-white/5 text-xs font-bold"
                  >
                    <div className="flex items-center gap-2">
                      {renderAvatar(p.avatar, "size-4 text-lime shrink-0")}
                      <span className="uppercase text-off-white">{p.name}</span>
                      {gameState.panelIds?.includes(p.id) && (
                        <span className="text-[7px] font-black bg-lime/10 text-lime px-1.5 py-0.5 rounded uppercase">
                          PANEL
                        </span>
                      )}
                      {p.id === correctId && (
                        <span className="text-[7px] font-black bg-magenta/25 text-magenta px-1.5 py-0.5 rounded uppercase">
                          {subMode === "TRIPLE_CLAIM" ? "OWNER" : "FRAUD"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {gained > 0 && (
                        <span className="text-lime text-[11px] font-black">+{gained}</span>
                      )}
                      <span className="font-mono text-off-white">{p.score + gained} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next Round controls */}
        <div className="w-full mt-6">
          {isHost ? (
            <button
              type="button"
              onClick={handleNextRound}
              className="w-full bg-electric-pink text-off-white px-8 py-4.5 rounded-xl text-lg font-title uppercase tracking-wider border-2 border-void brutal-shadow-white active:scale-95 transition-transform"
            >
              {gameState.currentRound >= (gameState.maxRounds || 3)
                ? "Finish Match"
                : "Next Round →"}
            </button>
          ) : (
            <div className="w-full bg-surface border border-white/5 rounded-xl p-4 text-center text-xs font-bold text-muted-foreground">
              Waiting for Host to start next round...
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHotseatPhase = () => {
    switch (gameState.phase) {
      case "PREPARATION":
        return renderHotseatPreparation();
      case "STAGE_ACTION":
        return renderHotseatStageAction();
      case "VOTING":
        return renderHotseatVoting();
      case "REVEAL":
        return renderHotseatReveal();
      default:
        return null;
    }
  };

  const getUpdatedPlayersWithScores = (prev: OnlineGameState): OnlinePlayer[] => {
    const voteCounts: Record<string, number> = {};
    Object.values(prev.votes).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    let highestVotedId = "";
    let highestVotes = 0;
    Object.entries(voteCounts).forEach(([tid, count]) => {
      if (count > highestVotes) {
        highestVotes = count;
        highestVotedId = tid;
      }
    });

    if (prev.category === "HOTSEAT_PANELS") {
      const subMode = prev.subMode || "SOLO_BLUFF";
      const payload = prev.payload;
      if (!payload) return prev.players;

      if (subMode === "SOLO_BLUFF") {
        const pld = payload as SoloBluffPayload;
        const fraudId = pld.fraudId;
        const fraudEscaped = highestVotedId !== fraudId;

        return prev.players.map((p) => {
          let gained = 0;
          if (p.id === fraudId) {
            gained = fraudEscaped ? 150 : 0;
          } else if (prev.audienceIds?.includes(p.id)) {
            gained = prev.votes[p.id] === fraudId ? 100 : 0;
          }
          return { ...p, score: p.score + gained };
        });
      } else if (subMode === "TRIPLE_CLAIM") {
        const pld = payload as TripleClaimPayload;
        const ownerId = pld.ownerId;
        const ownerFound = highestVotedId === ownerId;

        return prev.players.map((p) => {
          let gained = 0;
          if (p.id === ownerId) {
            gained = ownerFound ? 100 : 0;
          } else if (pld.bluffers.includes(p.id)) {
            gained = highestVotedId === p.id ? 150 : 0;
          } else if (prev.audienceIds?.includes(p.id)) {
            gained = prev.votes[p.id] === ownerId ? 100 : 0;
          }
          return { ...p, score: p.score + gained };
        });
      } else {
        const pld = payload as PhotoCounterfeitPayload;
        const counterfeitId = pld.counterfeitId;
        const counterfeitEscaped = highestVotedId !== counterfeitId;

        return prev.players.map((p) => {
          let gained = 0;
          if (p.id === counterfeitId) {
            gained = counterfeitEscaped ? 150 : 0;
          } else if (prev.audienceIds?.includes(p.id)) {
            gained = prev.votes[p.id] === counterfeitId ? 100 : 0;
          }
          return { ...p, score: p.score + gained };
        });
      }
    } else {
      const fraudEscaped = highestVotedId !== prev.fraudPlayerId;
      return prev.players.map((p) => {
        let gained = 0;
        if (p.id === prev.fraudPlayerId) {
          gained = fraudEscaped ? 150 : 0;
        } else {
          gained = prev.votes[p.id] === prev.fraudPlayerId ? 100 : 0;
        }
        return { ...p, score: p.score + gained };
      });
    }
  };

  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-28">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link
            to="/online/lobby"
            onClick={() => buzz(20)}
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            ← Exit
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-lime animate-pulse" />
            Room <span className="selectable">{roomCode.toUpperCase()}</span>
          </span>
        </header>

        {/* ======================================================== */}
        {/* PHASE 1: LOBBY */}
        {gameState.phase === "LOBBY" && (
          <div className="flex flex-1 flex-col mt-6">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                {statusMessage}
              </span>
              <h1
                id="room-code-display"
                className="mt-2 text-6xl font-black uppercase tracking-wider text-lime select-all cursor-pointer"
                onClick={copyRoomCode}
              >
                {roomCode.toUpperCase()}
              </h1>
              <button
                onClick={copyRoomCode}
                className="mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-surface border border-white/5 px-2.5 py-1 rounded hover:text-lime"
              >
                {copiedCode ? "Copied Room Code!" : "Tap Code to Copy"}
              </button>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="mt-6 rounded-2xl border-2 border-white/10 bg-surface p-4 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-lime block">
                  // Host Settings
                </span>

                {/* Game Category Toggle */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                    Game Category
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: "WORD_DEDUCTION", label: "Word Deduction" },
                      { id: "HOTSEAT_PANELS", label: "Hotseat Panels" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          buzz(15);
                          updateAndBroadcast((prev) => ({
                            ...prev,
                            category: cat.id as GameCategory,
                          }));
                        }}
                        className={`flex-1 py-2 text-[10px] font-bold border rounded-lg uppercase tracking-wide transition-all ${
                          (gameState.category || "WORD_DEDUCTION") === cat.id
                            ? "border-lime text-lime bg-lime/5"
                            : "border-white/5 bg-void text-muted-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {gameState.category === "HOTSEAT_PANELS" ? (
                  <>
                    {/* Hotseat Sub-mode Selection */}
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                        Sub-Mode
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "SOLO_BLUFF", label: "Solo Bluff" },
                          { id: "TRIPLE_CLAIM", label: "Triple Claim" },
                          { id: "PHOTO_COUNTERFEIT", label: "Photo Counterfeit" },
                        ].map((sm) => (
                          <button
                            key={sm.id}
                            type="button"
                            onClick={() => {
                              buzz(15);
                              updateAndBroadcast((prev) => ({
                                ...prev,
                                subMode: sm.id as PanelSubMode,
                              }));
                            }}
                            className={`py-2 px-1 text-[9px] font-bold border rounded-lg uppercase text-center transition-all ${
                              (gameState.subMode || "SOLO_BLUFF") === sm.id
                                ? "border-magenta text-magenta bg-magenta/5"
                                : "border-white/5 bg-void text-muted-foreground"
                            }`}
                          >
                            {sm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pack Selection for Solo Bluff */}
                    {gameState.subMode === "SOLO_BLUFF" && (
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                          Select Word Pack
                        </label>
                        <select
                          value={gameState.selectedPackId}
                          onChange={(e) =>
                            updateAndBroadcast((prev) => ({
                              ...prev,
                              selectedPackId: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-void p-3 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-lime"
                        >
                          {PACKS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.wordCount}w)
                            </option>
                          ))}
                          {fetchCustomPacks().map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              [Custom] {cp.title} ({cp.words.length}w)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Max Rounds Selection */}
                    <div>
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                        <span>Max Rounds</span>
                        <span className="text-lime">{gameState.maxRounds || 3} Rounds</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {[3, 5, 10].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              buzz(15);
                              updateAndBroadcast((prev) => ({ ...prev, maxRounds: r }));
                            }}
                            className={`flex-1 py-1.5 text-[10px] font-bold border rounded-lg uppercase ${
                              (gameState.maxRounds || 3) === r
                                ? "border-lime text-lime bg-lime/5"
                                : "border-white/5 bg-void text-muted-foreground"
                            }`}
                          >
                            {r} Rounds
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Pack Selection */}
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                        Select Word Pack
                      </label>
                      <select
                        value={gameState.selectedPackId}
                        onChange={(e) =>
                          updateAndBroadcast((prev) => ({
                            ...prev,
                            selectedPackId: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-void p-3 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-lime"
                      >
                        {PACKS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.wordCount}w)
                          </option>
                        ))}
                        {fetchCustomPacks().map((cp) => (
                          <option key={cp.id} value={cp.id}>
                            [Custom] {cp.title} ({cp.words.length}w)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Timer Duration */}
                    <div>
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                        <span>Timer Limit</span>
                        <span className="text-lime">
                          {gameState.timerSeconds === 0 ? "No Limit" : `${gameState.timerSeconds}s`}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {[30, 60, 90, 0].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              buzz(15);
                              updateAndBroadcast((prev) => ({ ...prev, timerSeconds: t }));
                            }}
                            className={`flex-1 py-1.5 text-[10px] font-bold border rounded-lg uppercase ${
                              gameState.timerSeconds === t
                                ? "border-lime text-lime bg-lime/5"
                                : "border-white/5 bg-void text-muted-foreground"
                            }`}
                          >
                            {t === 0 ? "Infinite" : `${t}s`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Guest Settings Display */}
            {!isHost && (
              <div className="mt-4 rounded-xl border border-white/5 bg-surface/30 p-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>Category: </span>
                <span className="text-lime font-black">
                  {(gameState.category || "WORD_DEDUCTION") === "HOTSEAT_PANELS"
                    ? "Hotseat Panels"
                    : "Word Deduction"}
                </span>
                {(gameState.category || "WORD_DEDUCTION") === "HOTSEAT_PANELS" && (
                  <>
                    <span className="mx-1 opacity-20">|</span>
                    <span>Mode: </span>
                    <span className="text-magenta font-black">
                      {(gameState.subMode || "SOLO_BLUFF") === "SOLO_BLUFF"
                        ? "Solo Bluff"
                        : (gameState.subMode || "SOLO_BLUFF") === "TRIPLE_CLAIM"
                          ? "Triple Claim"
                          : "Photo Counterfeit"}
                    </span>
                    <span className="mx-1 opacity-20">|</span>
                    <span className="text-lime font-black">{gameState.maxRounds || 3} Rounds</span>
                  </>
                )}
              </div>
            )}

            {/* Connected players grid */}
            <div className="mt-6 flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2.5">
                Connected Players ({gameState.players.length})
              </span>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {gameState.players.map((p) => (
                  <div
                    key={p.id}
                    className="relative rounded-2xl border border-white/10 bg-surface p-3.5 flex items-center gap-3"
                  >
                    <div className="grid size-11 place-items-center rounded-xl bg-void border border-white/5 text-lime">
                      {renderAvatar(p.avatar, "size-6")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black uppercase text-off-white flex items-center gap-1.5">
                        {p.name}
                        {p.isHost && (
                          <Crown size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <div
                        className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${
                          p.isReady ? "text-lime" : "text-magenta animate-pulse"
                        }`}
                      >
                        {p.isReady ? "Ready" : "Waiting"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6">
              {!isConnected ? (
                <button
                  onClick={() => {
                    buzz(15);
                    setReconnectTrigger((prev) => prev + 1);
                  }}
                  className="w-full rounded-xl bg-magenta text-white py-4.5 text-center text-lg font-black uppercase tracking-wide border-2 border-void brutal-shadow-white tactile tactile-press flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} className="animate-spin" />
                  {isHost ? "Re-register Room" : "Retry Connection"}
                </button>
              ) : isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={
                    gameState.category === "HOTSEAT_PANELS"
                      ? gameState.players.length < 4
                      : gameState.players.length < 3
                  }
                  className="w-full rounded-xl bg-lime px-6 py-4.5 text-center text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink tactile tactile-press disabled:opacity-30 disabled:pointer-events-none"
                >
                  Start Online Match ({gameState.players.length}) →
                </button>
              ) : (
                <button
                  onClick={toggleReady}
                  className={`w-full rounded-xl py-4.5 text-center text-lg font-black uppercase tracking-wide border-2 border-void brutal-shadow-white tactile tactile-press ${
                    myPlayer?.isReady
                      ? "bg-surface text-lime border-lime/30"
                      : "bg-magenta text-white"
                  }`}
                >
                  {myPlayer?.isReady ? "I'm Ready! (Cancel)" : "Ready Up"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* HOTSEAT PANELS GAME CATEGORY */}
        {gameState.category === "HOTSEAT_PANELS" &&
          gameState.phase !== "LOBBY" &&
          renderHotseatPhase()}

        {/* WORD DEDUCTION GAME CATEGORY */}
        {(gameState.category || "WORD_DEDUCTION") === "WORD_DEDUCTION" &&
          gameState.phase !== "LOBBY" && (
            <>
              {/* PHASE 2: ROLE REVEAL */}
              {gameState.phase === "ROLE_REVEAL" && (
                <div className="flex flex-1 flex-col items-center justify-center text-center mt-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                    // VERIFY SECRET ROLE
                  </span>

                  <div
                    className="relative mx-auto mt-6 w-72 h-[380px] cursor-pointer"
                    style={{ perspective: 1000 }}
                    onClick={() => {
                      buzz(20);
                      const nextFlipped = !cardFlipped;
                      setCardFlipped(nextFlipped);
                      if (nextFlipped) {
                        setHasRevealed(true);
                        playRoleRevealSound();
                      }
                    }}
                  >
                    <motion.div
                      className="w-full h-full relative preserve-3d"
                      animate={{ rotateY: cardFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Front Side: Cyber ID badge with Peek Prompt */}
                      <div
                        className="absolute inset-0 backface-hidden bg-[#12121A] border-4 border-dashed border-lime/40 rounded-3xl flex flex-col items-center justify-center p-6 text-center shadow-[0_0_20px_rgba(255,214,0,0.15)]"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="absolute inset-2 border border-lime/10 rounded-2xl pointer-events-none" />
                        <Eye size={48} className="text-lime/60 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-lime mt-4 bg-lime/10 px-2 py-0.5 rounded border border-lime/20">
                          PRIVATE SENSITIVE
                        </span>
                        <h2 className="mt-3 text-3xl font-title uppercase tracking-wider text-foreground">
                          TAP TO PEEK
                        </h2>
                        <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase max-w-[20ch]">
                          Keep your screen hidden from friends nearby!
                        </p>
                      </div>

                      {/* Back Side: Holographic Card details */}
                      <div
                        className={`absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col items-center justify-between text-center border-3 bg-gradient-to-b from-[#12121A] ${
                          isMyFraud
                            ? "to-[#231119] border-magenta shadow-[0_0_25px_rgba(255,45,85,0.3)]"
                            : "to-[#181C12] border-lime shadow-[0_0_25px_rgba(255,214,0,0.3)]"
                        }`}
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        {/* Hide Card Button floating on top */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            buzz(15);
                            setCardFlipped(false);
                          }}
                          className={`absolute -top-3.5 right-6 border-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-[#12121A] hover:scale-105 active:scale-95 transition-all shadow-md ${
                            isMyFraud
                              ? "border-magenta text-magenta shadow-magenta/15"
                              : "border-lime text-lime shadow-lime/15"
                          }`}
                        >
                          Hide Role
                        </button>

                        <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-2">
                          <span>TOPIC</span>
                          <span
                            className={
                              isMyFraud ? "text-magenta font-black" : "text-lime font-black"
                            }
                          >
                            {PACKS.find((p) => p.id === gameState.selectedPackId)?.name ||
                              "Custom Pack"}
                          </span>
                        </div>

                        <div className="my-auto text-center flex flex-col items-center">
                          <div
                            className={`p-4 rounded-full border-2 mb-3 bg-surface ${
                              isMyFraud
                                ? "border-magenta/40 text-magenta bg-magenta/5 shadow-[0_0_12px_rgba(255,45,85,0.2)] animate-pulse"
                                : "border-lime/40 text-lime bg-lime/5 shadow-[0_0_12px_rgba(255,214,0,0.2)]"
                            }`}
                          >
                            {isMyFraud ? <ShieldAlert size={36} /> : <User size={36} />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">
                            YOU ARE THE
                          </span>
                          <h2
                            className={`text-4xl font-black uppercase tracking-wide mt-1.5 font-title ${
                              isMyFraud
                                ? "text-magenta drop-shadow-[0_2px_10px_rgba(255,45,85,0.5)]"
                                : "text-lime drop-shadow-[0_2px_10px_rgba(255,214,0,0.5)]"
                            }`}
                          >
                            {isMyFraud ? "FRAUD!" : "BRO!"}
                          </h2>
                        </div>

                        <div
                          className={`w-full rounded-2xl p-4 border bg-surface/90 flex flex-col justify-center items-center ${
                            isMyFraud
                              ? "border-magenta/35 shadow-[0_0_15px_rgba(255,45,85,0.08)]"
                              : "border-lime/35 shadow-[0_0_15px_rgba(255,214,0,0.08)]"
                          }`}
                        >
                          <div className="w-full text-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                              {isMyFraud ? "Your Decoy Word" : "Secret Word"}
                            </span>

                            {renderCleanWord(wordToDisplay, isMyFraud)}

                            {isMyFraud ? (
                              <p className="text-[9px] font-bold uppercase tracking-widest text-magenta/90 leading-tight">
                                Pretend you have the real word.
                                <br />
                                Say a clue for this Decoy Word!
                              </p>
                            ) : (
                              <p className="text-[9px] font-bold uppercase tracking-widest text-lime/90 leading-tight">
                                Say a clue related to this word.
                                <br />
                                Don't let the Fraud guess it!
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <p className="mt-6 text-xs text-muted-foreground max-w-[28ch]">
                    {cardFlipped
                      ? "Tap 'Hide Role' or flip card to secure view"
                      : "Tap card to flip it and read your secret role"}
                  </p>

                  <div className="flex-1" />

                  <button
                    disabled={!hasRevealed || myPlayer?.isReady}
                    onClick={toggleReady}
                    className="w-full rounded-xl bg-lime px-6 py-5 text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-white tactile tactile-press disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {myPlayer?.isReady ? "Waiting for Others..." : "Ready to Interrogate →"}
                  </button>
                </div>
              )}

              {gameState.phase === "DISCUSSION" && (
                <div className="flex flex-1 flex-col mt-6">
                  {/* Clue Turn Broadcast Banner */}
                  {gameState.clueTurnIndex < gameState.players.length ? (
                    <div className="text-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta animate-pulse">
                        [ SUBMITTING CLUES ]
                      </span>
                      <h1 className="mt-2 text-3xl font-black uppercase text-off-white leading-tight">
                        It is{" "}
                        <span className="text-lime">
                          {gameState.players[gameState.clueTurnIndex]?.name}
                        </span>
                        's Turn
                      </h1>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[28ch] mx-auto">
                        Submit ONE word clues only. Keep it related to your secret word.
                      </p>

                      {/* Submitting Interface */}
                      {isMyTurn ? (
                        <div className="mt-6 rounded-2xl border-2 border-lime bg-lime/5 p-4 brutal-shadow-yellow text-left">
                          <span className="text-[9px] font-black uppercase tracking-widest text-lime block">
                            Your Word
                          </span>
                          <span className="text-xl font-black text-off-white uppercase">
                            {wordToDisplay}
                          </span>

                          <div className="mt-4 flex gap-2">
                            <input
                              type="text"
                              placeholder="Say ONE word only..."
                              maxLength={15}
                              disabled={submittedClue}
                              value={myClue}
                              onChange={(e) => setMyClue(e.target.value.replace(/[^A-Za-z]/g, ""))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitClue();
                              }}
                              className="flex-1 rounded-xl border border-white/10 bg-void px-4 py-3 text-sm font-bold text-foreground focus:border-lime focus:outline-none uppercase"
                            />
                            <button
                              onClick={submitClue}
                              disabled={submittedClue || !myClue.trim()}
                              className="grid size-12 place-items-center rounded-xl bg-lime text-void border-2 border-void brutal-shadow-white tactile tactile-press disabled:opacity-50"
                            >
                              <Send size={18} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-2xl border border-white/5 bg-surface/50 p-6 flex flex-col items-center justify-center">
                          <RefreshCw size={24} className="text-muted-foreground/30 animate-spin" />
                          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground mt-3">
                            Waiting for clue...
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // General discussion timer active
                    <div className="text-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-lime animate-pulse">
                        [ DEBATING PHASE ]
                      </span>
                      <h1 className="mt-2 text-4xl font-black uppercase text-off-white leading-[0.9]">
                        Let the
                        <br />
                        <span className="text-magenta">Interrogation</span> Begin!
                      </h1>

                      {/* Synced Timer Display */}
                      {gameState.timerSeconds > 0 ? (
                        <div className="mt-6 rounded-2xl border-2 border-white/10 bg-surface p-6">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              Time Remaining
                            </span>
                            <span
                              className={`font-display text-4xl font-black tabular-nums ${
                                gameState.secondsLeft <= 10
                                  ? "text-magenta animate-timer-warn"
                                  : "text-lime"
                              }`}
                            >
                              0:{gameState.secondsLeft.toString().padStart(2, "0")}
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-void border border-white/5">
                            <div
                              className={`h-full transition-all duration-1000 ease-linear ${
                                gameState.secondsLeft > 15
                                  ? "bg-lime"
                                  : gameState.secondsLeft > 5
                                    ? "bg-yellow-400"
                                    : "bg-magenta"
                              }`}
                              style={{
                                width: `${(gameState.secondsLeft / gameState.timerSeconds) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-2xl border border-white/10 bg-surface px-6 py-5">
                          <MessageSquare size={32} className="text-lime mx-auto" />
                          <div className="text-sm font-black uppercase tracking-widest text-lime mt-2">
                            No Time Limit
                          </div>
                          {isHost && (
                            <button
                              onClick={() =>
                                updateAndBroadcast((prev) => ({ ...prev, phase: "VOTING" }))
                              }
                              className="mt-4 w-full rounded-xl bg-magenta px-4 py-3 text-sm font-black uppercase text-white border-2 border-void brutal-shadow-white tactile tactile-press"
                            >
                              Force Start Voting
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display clues submitted so far */}
                  <div className="mt-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2.5">
                      Player Clues:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {gameState.players.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl bg-surface/50 border border-white/5 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {renderAvatar(p.avatar, "size-4 text-lime shrink-0")}
                            <span className="text-xs font-bold uppercase truncate text-muted-foreground">
                              {p.name}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-black uppercase truncate max-w-[12ch] ${
                              p.clue ? "text-lime" : "text-magenta/40 italic text-[10px]"
                            }`}
                          >
                            {p.clue || "thinking..."}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PHASE 4: VOTING */}
              {gameState.phase === "VOTING" && (
                <div className="flex flex-1 flex-col mt-6">
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-magenta">
                      [ CAST BALLOTS ]
                    </span>
                    <h1 className="mt-2 text-4xl font-black uppercase leading-[0.9] text-off-white">
                      Who is the
                      <br />
                      <span className="text-magenta text-glitch">FRAUD?</span>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-2 max-w-[28ch] mx-auto">
                      Cast your vote secretly. You cannot change after submission.
                    </p>
                  </div>

                  {/* Grid of Players */}
                  <div className="mt-6 grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                    {gameState.players.map((p) => {
                      const active = selectedSuspectId === p.id;
                      const isSelf = p.id === myPlayerId;
                      const hasVoted = !!gameState.votes[p.id];

                      return (
                        <button
                          key={p.id}
                          disabled={isSelf || submittedVote}
                          onClick={() => {
                            setSelectedSuspectId(p.id);
                            buzz(20);
                          }}
                          className={`relative rounded-2xl border-3 p-3.5 text-left bg-surface transition-all duration-200 tactile ${
                            active
                              ? "border-magenta scale-105 shadow-[0_0_25px_rgba(255,45,85,0.45)] z-10"
                              : "border-white/10 opacity-70"
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center justify-between">
                            {renderAvatar(p.avatar, "size-8 text-magenta")}
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                              {hasVoted ? "Voted" : "Voting..."}
                            </span>
                          </div>
                          <div className="mt-4 text-base font-black uppercase truncate text-off-white">
                            {p.name}
                          </div>
                          <div className="mt-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            {isSelf ? "YOU" : active ? "NOMINATED" : "SELECT SUSPECT"}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1" />

                  {/* Confirm Vote Button */}
                  {!submittedVote && selectedSuspectId && (
                    <button
                      onClick={submitVote}
                      className="w-full rounded-xl bg-lime px-6 py-5 text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-white tactile tactile-press"
                    >
                      Confirm Vote →
                    </button>
                  )}

                  {/* Voting progress counts */}
                  <div className="mt-4 rounded-xl border border-white/5 bg-surface/30 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Votes submitted: {Object.keys(gameState.votes).length} of{" "}
                      {gameState.players.length}
                    </span>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PHASE 5: RESULTS/RESULTS */}
              {gameState.phase === "RESULTS" && (
                <div className="flex flex-1 flex-col items-center justify-between text-center mt-6 animate-[fade-in_0.3s_ease-out_both]">
                  {/* Verdict Header */}
                  <div className="w-full flex flex-col items-center">
                    <img
                      src="/split-mask.png"
                      alt="Dual Mask"
                      className="size-20 rounded-2xl brutal-shadow-pink mb-3"
                    />

                    {(() => {
                      // Calculate if Bros won (the player voted out most is the Fraud)
                      const voteCounts: Record<string, number> = {};
                      Object.values(gameState.votes).forEach((targetId) => {
                        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
                      });

                      let highestVotedId = "";
                      let highestVotes = 0;
                      Object.entries(voteCounts).forEach(([tid, count]) => {
                        if (count > highestVotes) {
                          highestVotes = count;
                          highestVotedId = tid;
                        }
                      });

                      const broWon = highestVotedId === gameState.fraudPlayerId;
                      const fraudName =
                        gameState.players.find((p) => p.id === gameState.fraudPlayerId)?.name ||
                        "Impostor";
                      const fraudAvatar =
                        gameState.players.find((p) => p.id === gameState.fraudPlayerId)?.avatar ||
                        "Zap";

                      // Pick roast
                      const roasts = broWon ? ROASTS_WIN : ROASTS_LOSE;
                      const seed = gameState.currentRound % roasts.length;
                      const roast = roasts[seed];

                      return (
                        <>
                          <p className="text-cyber-yellow text-2xl uppercase font-title tracking-wider">
                            {broWon ? "Good Call, Bro!" : "Fraud Escaped!"}
                          </p>
                          <h1 className="mt-1 text-4xl font-title uppercase tracking-tight text-off-white">
                            {broWon ? "Bros Catch Fraud" : `${fraudName} Escapes`}
                          </h1>
                          <p className="mt-2 text-xs text-muted-foreground max-w-[28ch] italic">
                            "{roast}"
                          </p>

                          {/* Word Reveals */}
                          <div className="mt-5 w-full rounded-2xl border-2 border-border bg-surface p-4 text-left">
                            <div className="grid grid-cols-2 gap-2.5 mb-3 border-b border-white/10 pb-3">
                              <div className="rounded-xl bg-void border border-white/5 p-2.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                                  Secret Word
                                </span>
                                <span className="text-base font-title uppercase text-lime">
                                  {gameState.targetWord}
                                </span>
                              </div>
                              <div className="rounded-xl bg-void border border-white/5 p-2.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                                  Decoy Word
                                </span>
                                <span className="text-base font-title uppercase text-magenta">
                                  {gameState.decoyWord}
                                </span>
                              </div>
                            </div>

                            {/* Leaderboard Scores */}
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2.5">
                              Multiplayer Scores
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {gameState.players.map((p) => {
                                const isPlayerFraud = p.id === gameState.fraudPlayerId;

                                // Score calculation for this round
                                const votedTargetId = gameState.votes[p.id];
                                const guessedCorrectly = votedTargetId === gameState.fraudPlayerId;
                                const fraudEscaped = highestVotedId !== gameState.fraudPlayerId;

                                let gained = 0;
                                if (isPlayerFraud) {
                                  gained = fraudEscaped ? 150 : 0;
                                } else {
                                  gained = guessedCorrectly ? 100 : 0;
                                }

                                // Update host scores recursively (Host does the actual summation)
                                if (isHost && isHost && p.score !== p.score + gained) {
                                  // Host executes point addition once
                                }

                                return (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between rounded-xl bg-void px-3 py-2 border border-white/5 text-xs font-bold"
                                  >
                                    <div className="flex items-center gap-2">
                                      {renderAvatar(p.avatar, "size-4 text-lime shrink-0")}
                                      <span className="uppercase text-off-white">{p.name}</span>
                                      {isPlayerFraud && (
                                        <span className="text-[8px] font-black bg-magenta/20 text-magenta px-1.5 py-0.5 rounded uppercase">
                                          FRAUD
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {gained > 0 && (
                                        <span className="text-lime text-[11px] font-black">
                                          +{gained}
                                        </span>
                                      )}
                                      <span className="font-mono text-off-white">
                                        {p.score + gained} XP
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Reset Button (Host only) */}
                  <div className="w-full mt-6">
                    {isHost ? (
                      <button
                        onClick={handleNextRound}
                        className="w-full bg-electric-pink text-off-white px-8 py-4.5 rounded-xl text-lg font-title uppercase tracking-wider border-2 border-void brutal-shadow-white active:scale-95 transition-transform"
                      >
                        Next Round →
                      </button>
                    ) : (
                      <div className="w-full bg-surface border border-white/5 rounded-xl p-4 text-center text-xs font-bold text-muted-foreground">
                        Waiting for Host to start next round...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
}
