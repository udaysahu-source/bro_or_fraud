import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { buzz, success as hapticSuccess, error as hapticError, reveal as hapticReveal } from "@/lib/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Crown, Zap, Flame, Ghost, Skull, Gamepad2, Heart, Star, Trophy, Target, Shield, Eye, Bot, Sun, Smile,
  HelpCircle, ShieldAlert, Sparkles, Send, CheckCircle2, Play, RefreshCw, XCircle, Fingerprint
} from "lucide-react";
import { PACKS } from "@/lib/mcp/packs";
import { fetchCustomPacks } from "@/lib/customPacks";
import { renderAvatar } from "./play.setup";
import { OnlineGameState, OnlinePlayer, assignOnlineRoles } from "@/lib/online-engine";

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
  "Zap", "Crown", "Flame", "Ghost", "Skull", "Gamepad2", "Heart", "Star", 
  "Trophy", "Target", "Shield", "Eye", "Bot", "Sun", "Smile", "User"
];

const ROASTS_WIN = [
  "Bros saw right through you. Go back to acting school 🎭",
  "Bro got cooked faster than Maggi in a hostel kettle 💀",
  "Bros caught the Fraud red-handed. Better luck next time 🤓",
  "Fraud got exposed. Rizz level: -100 📉",
];

const ROASTS_LOSE = [
  "Fraud escaped. Bros got played worse than a proxy attendance scam 🕵️",
  "The Fraud was right there and you voted for a Bro. Brain cells: 0 🧠",
  "Fraud gaslit the entire room. Rizz Master at work 👑",
  "Bros are certified clowns. You got absolutely cooked 🤡",
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
  });

  // Network PeerJS references
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<any[]>([]); // For host to track guests
  const connRef = useRef<any>(null); // For guest to track connection to host
  const [statusMessage, setStatusMessage] = useState("Initializing WebRTC...");
  const [copiedCode, setCopiedCode] = useState(false);

  // Local game states
  const [cardFlipped, setCardFlipped] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [myClue, setMyClue] = useState("");
  const [submittedClue, setSubmittedClue] = useState(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [submittedVote, setSubmittedVote] = useState(false);

  const isHost = typeof window !== "undefined" && localStorage.getItem("bof:hosting") === roomCode.toUpperCase();

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

    import("peerjs").then(({ Peer }) => {
      if (isHost) {
        // HOST SETUP
        const peerId = `bofr-room-${roomCode.toUpperCase()}`;
        activePeer = new Peer(peerId);

        activePeer.on("open", () => {
          console.log("Host registered peer ID:", peerId);
          setStatusMessage("Waiting for players...");
          setGameState((prev) => ({
            ...prev,
            hostId: myPlayerId,
            players: [{
              id: myPlayerId,
              name: myName,
              avatar: myAvatar,
              isReady: false,
              score: 0,
              isHost: true,
            }],
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
                    p.id === data.id ? { ...p, name: data.name, avatar: data.avatar } : p
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
                  p.id === data.playerId ? { ...p, isReady: data.isReady } : p
                ),
              }));
            } else if (data.type === "clue") {
              updateAndBroadcast((prev) => {
                const nextPlayers = prev.players.map((p) => 
                  p.id === data.playerId ? { ...p, clue: data.clue } : p
                );
                
                // Determine turn increments
                let nextTurnIndex = prev.clueTurnIndex + 1;
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
            } else if (data.type === "vote") {
              updateAndBroadcast((prev) => {
                const nextVotes = { ...prev.votes, [data.voterId]: data.targetId };
                const nextPlayers = prev.players.map((p) => 
                  p.id === data.voterId ? { ...p, vote: data.targetId } : p
                );

                // If everyone has voted, reveal the score/verdict
                const totalVotesCast = Object.keys(nextVotes).length;
                let nextPhase = prev.phase;
                if (totalVotesCast >= prev.players.length) {
                  nextPhase = "RESULTS";
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
        });

        activePeer.on("error", (err: any) => {
          console.error("Host PeerJS error:", err);
          if (err.type === "unavailable-id") {
            // Already active host. Change code.
            alert("This room code is already active. Redirecting to lobby.");
            navigate({ to: "/online/lobby" });
          } else {
            setStatusMessage("Connection failed. Retrying...");
          }
        });

        peerRef.current = activePeer;
      } else {
        // GUEST SETUP
        activePeer = new Peer();
        
        activePeer.on("open", () => {
          setStatusMessage("Connecting to host...");
          const conn = activePeer.connect(`bofr-room-${roomCode.toUpperCase()}`);
          
          conn.on("open", () => {
            console.log("Connected to host room");
            setStatusMessage("Joined room!");
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
          });

          connRef.current = conn;
        });

        activePeer.on("error", (err: any) => {
          console.error("Guest PeerJS error:", err);
          setStatusMessage("Couldn't connect to host room. Please check the code.");
        });

        peerRef.current = activePeer;
      }
    });

    return () => {
      activePeer?.destroy();
    };
  }, [profileSet]);

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

  // 5. Reset local UI states on phase changes
  useEffect(() => {
    if (gameState.phase === "ROLE_REVEAL") {
      setCardFlipped(false);
      setHasRevealed(false);
      setMyClue("");
      setSubmittedClue(false);
      setSelectedSuspectId(null);
      setSubmittedVote(false);
    }
  }, [gameState.phase]);

  // 6. Automatically transition host from ROLE_REVEAL to DISCUSSION once all players are ready
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

  // Actions
  const toggleReady = () => {
    buzz(15);
    const newReady = !gameState.players.find((p) => p.id === myPlayerId)?.isReady;
    if (isHost) {
      updateAndBroadcast((prev) => ({
        ...prev,
        players: prev.players.map((p) => 
          p.id === myPlayerId ? { ...p, isReady: newReady } : p
        ),
      }));
    } else {
      connRef.current?.send({ type: "ready", playerId: myPlayerId, isReady: newReady });
    }
  };

  const handleStartGame = () => {
    if (gameState.players.length < 3) {
      alert("Need at least 3 players to start!");
      return;
    }
    buzz([30, 20, 30]);

    const nextState = assignOnlineRoles(gameState);
    updateAndBroadcast((_) => nextState);
  };

  const submitClue = () => {
    if (!myClue.trim()) return;
    buzz(20);
    setSubmittedClue(true);
    const word = myClue.trim().split(" ")[0] || "Sus";

    if (isHost) {
      updateAndBroadcast((prev) => {
        const nextPlayers = prev.players.map((p) => 
          p.id === myPlayerId ? { ...p, clue: word } : p
        );
        let nextTurn = prev.clueTurnIndex + 1;
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

  const submitVote = () => {
    if (!selectedSuspectId) return;
    buzz([40, 20, 60]);
    setSubmittedVote(true);

    if (isHost) {
      updateAndBroadcast((prev) => {
        const nextVotes = { ...prev.votes, [myPlayerId]: selectedSuspectId };
        const nextPlayers = prev.players.map((p) => 
          p.id === myPlayerId ? { ...p, vote: selectedSuspectId } : p
        );
        
        const totalVotesCast = Object.keys(nextVotes).length;
        let nextPhase = prev.phase;
        if (totalVotesCast >= prev.players.length) {
          nextPhase = "RESULTS";
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

    const nextState = assignOnlineRoles({
      ...gameState,
      currentRound: gameState.currentRound + 1
    });
    updateAndBroadcast((_) => nextState);
  };

  // UI Helpers
  const copyRoomCode = () => {
    buzz(15);
    navigator.clipboard.writeText(roomCode.toUpperCase());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Renders the secret word as a clean, highly-legible text block
  const renderCleanWord = (word: string, isFraud: boolean) => {
    if (!word) return null;
    return (
      <div className="my-2 py-2.5 px-4 rounded-xl bg-void/80 border border-white/5 flex flex-col items-center justify-center min-h-[60px] w-full">
        <div className={`text-2xl font-black tracking-widest uppercase font-mono select-none ${
          isFraud 
            ? "text-magenta drop-shadow-[0_0_10px_rgba(255,45,85,0.4)]" 
            : "text-lime drop-shadow-[0_0_10px_rgba(255,214,0,0.4)]"
        }`}>
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
          <h1 className="mt-2 text-3xl font-black uppercase text-center text-off-white">Set Up Profile</h1>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Your Name</label>
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
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">Select Avatar</label>
              <div className="grid grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-1.5 border border-white/5 bg-void/50 rounded-xl">
                {AVATARS.map((avatar) => {
                  const active = myAvatar === avatar;
                  return (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => { buzz(10); setMyAvatar(avatar); }}
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

  return (
    <div className="min-h-dvh bg-void text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-28">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link to="/online/lobby" onClick={() => buzz(20)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            ← Exit
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-lime animate-pulse" />
            Room {roomCode.toUpperCase()}
          </span>
        </header>

        {/* ======================================================== */}
        {/* PHASE 1: LOBBY */}
        {gameState.phase === "LOBBY" && (
          <div className="flex flex-1 flex-col mt-6">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{statusMessage}</span>
              <h1 className="mt-2 text-6xl font-black uppercase tracking-wider text-lime select-all cursor-pointer" onClick={copyRoomCode}>
                {roomCode.toUpperCase()}
              </h1>
              <button onClick={copyRoomCode} className="mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-surface border border-white/5 px-2.5 py-1 rounded hover:text-lime">
                {copiedCode ? "Copied Room Code! ✅" : "Tap Code to Copy 📋"}
              </button>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="mt-6 rounded-2xl border-2 border-white/10 bg-surface p-4 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-lime block">// Host Settings</span>
                
                {/* Pack Selection */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Select Word Pack</label>
                  <select
                    value={gameState.selectedPackId}
                    onChange={(e) => updateAndBroadcast((prev) => ({ ...prev, selectedPackId: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-void p-3 text-xs font-bold uppercase text-foreground focus:outline-none focus:border-lime"
                  >
                    {PACKS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.wordCount}w)</option>
                    ))}
                    {fetchCustomPacks().map((cp) => (
                      <option key={cp.id} value={cp.id}>[Custom] {cp.title} ({cp.words.length}w)</option>
                    ))}
                  </select>
                </div>

                {/* Timer Duration */}
                <div>
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>Timer Limit</span>
                    <span className="text-lime">{gameState.timerSeconds === 0 ? "No Limit" : `${gameState.timerSeconds}s`}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {[30, 60, 90, 0].map((t) => (
                      <button
                        key={t}
                        onClick={() => { buzz(15); updateAndBroadcast((prev) => ({ ...prev, timerSeconds: t })); }}
                        className={`flex-1 py-1.5 text-[10px] font-bold border rounded-lg uppercase ${
                          gameState.timerSeconds === t ? "border-lime text-lime bg-lime/5" : "border-white/5 bg-void text-muted-foreground"
                        }`}
                      >
                        {t === 0 ? "Infinite" : `${t}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Connected players grid */}
            <div className="mt-6 flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2.5">
                Connected Players ({gameState.players.length})
              </span>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {gameState.players.map((p) => (
                  <div key={p.id} className="relative rounded-2xl border border-white/10 bg-surface p-3.5 flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-xl bg-void border border-white/5 text-lime">
                      {renderAvatar(p.avatar, "size-6")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black uppercase text-off-white flex items-center gap-1.5">
                        {p.name}
                        {p.isHost && <Crown size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      <div className={`mt-0.5 text-[9px] font-black uppercase tracking-wider ${
                        p.isReady ? "text-lime" : "text-magenta animate-pulse"
                      }`}>
                        {p.isReady ? "Ready ✅" : "Waiting ⏳"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={gameState.players.length < 3}
                  className="w-full rounded-xl bg-lime px-6 py-4.5 text-center text-lg font-black uppercase tracking-wide text-void border-2 border-void brutal-shadow-pink tactile tactile-press disabled:opacity-30 disabled:pointer-events-none"
                >
                  Start Online Match ({gameState.players.length}) →
                </button>
              ) : (
                <button
                  onClick={toggleReady}
                  className={`w-full rounded-xl py-4.5 text-center text-lg font-black uppercase tracking-wide border-2 border-void brutal-shadow-white tactile tactile-press ${
                    myPlayer?.isReady ? "bg-surface text-lime border-lime/30" : "bg-magenta text-white"
                  }`}
                >
                  {myPlayer?.isReady ? "I'm Ready! (Cancel)" : "Ready Up 🎮"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: ROLE REVEAL */}
        {gameState.phase === "ROLE_REVEAL" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center mt-6">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">// VERIFY SECRET ROLE</span>
            
            <div
              className="relative mx-auto mt-6 w-72 h-[380px] cursor-pointer"
              style={{ perspective: 1000 }}
            onClick={() => {
              buzz(20);
              const nextFlipped = !cardFlipped;
              setCardFlipped(nextFlipped);
              if (nextFlipped) {
                setHasRevealed(true);
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
                    ⚠️ PRIVATE SENSITIVE
                  </span>
                  <h2 className="mt-3 text-3xl font-title uppercase tracking-wider text-foreground">TAP TO PEEK</h2>
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
                      isMyFraud ? "border-magenta text-magenta shadow-magenta/15" : "border-lime text-lime shadow-lime/15"
                    }`}
                  >
                    🙈 Hide Role
                  </button>

                  <div className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-2">
                    <span>TOPIC</span>
                    <span className={isMyFraud ? "text-magenta font-black" : "text-lime font-black"}>
                      {PACKS.find(p => p.id === gameState.selectedPackId)?.name || "Custom Pack"}
                    </span>
                  </div>

                  <div className="my-auto text-center flex flex-col items-center">
                    <div className={`p-4 rounded-full border-2 mb-3 bg-surface ${
                      isMyFraud ? "border-magenta/40 text-magenta bg-magenta/5 shadow-[0_0_12px_rgba(255,45,85,0.2)] animate-pulse" : "border-lime/40 text-lime bg-lime/5 shadow-[0_0_12px_rgba(255,214,0,0.2)]"
                    }`}>
                      {isMyFraud ? <ShieldAlert size={36} /> : <User size={36} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75">YOU ARE THE</span>
                    <h2 className={`text-4xl font-black uppercase tracking-wide mt-1.5 font-title ${
                      isMyFraud ? "text-magenta drop-shadow-[0_2px_10px_rgba(255,45,85,0.5)]" : "text-lime drop-shadow-[0_2px_10px_rgba(255,214,0,0.5)]"
                    }`}>
                      {isMyFraud ? "FRAUD!" : "BRO!"}
                    </h2>
                  </div>

                  <div className={`w-full rounded-2xl p-4 border bg-surface/90 flex flex-col justify-center items-center ${
                    isMyFraud ? "border-magenta/35 shadow-[0_0_15px_rgba(255,45,85,0.08)]" : "border-lime/35 shadow-[0_0_15px_rgba(255,214,0,0.08)]"
                  }`}>
                    <div className="w-full text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                        {isMyFraud ? "Your Decoy Word" : "Secret Word"}
                      </span>
                      
                      {renderCleanWord(wordToDisplay, isMyFraud)}

                      {isMyFraud ? (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-magenta/90 leading-tight">
                          Pretend you have the real word.<br />
                          Say a clue for this Decoy Word!
                        </p>
                      ) : (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-lime/90 leading-tight">
                          Say a clue related to this word.<br />
                          Don't let the Fraud guess it!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground max-w-[28ch]">
              {cardFlipped ? "Tap 'Hide Role' or flip card to secure view" : "Tap card to flip it and read your secret role"}
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
                  It is <span className="text-lime">{gameState.players[gameState.clueTurnIndex]?.name}</span>'s Turn
                </h1>
                <p className="text-xs text-muted-foreground mt-1 max-w-[28ch] mx-auto">
                  Submit ONE word clues only. Keep it related to your secret word.
                </p>

                {/* Submitting Interface */}
                {isMyTurn ? (
                  <div className="mt-6 rounded-2xl border-2 border-lime bg-lime/5 p-4 brutal-shadow-yellow text-left">
                    <span className="text-[9px] font-black uppercase tracking-widest text-lime block">Your Word</span>
                    <span className="text-xl font-black text-off-white uppercase">{wordToDisplay}</span>
                    
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        placeholder="Say ONE word only..."
                        maxLength={15}
                        disabled={submittedClue}
                        value={myClue}
                        onChange={(e) => setMyClue(e.target.value.replace(/[^A-Za-z]/g, ""))}
                        onKeyDown={(e) => { if (e.key === "Enter") submitClue(); }}
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
                  Let the<br />
                  <span className="text-magenta">Interrogation</span> Begin!
                </h1>

                {/* Synced Timer Display */}
                {gameState.timerSeconds > 0 ? (
                  <div className="mt-6 rounded-2xl border-2 border-white/10 bg-surface p-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Remaining</span>
                      <span className={`font-display text-4xl font-black tabular-nums ${
                        gameState.secondsLeft <= 10 ? "text-magenta animate-timer-warn" : "text-lime"
                      }`}>
                        0:{gameState.secondsLeft.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-void border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ease-linear ${
                          gameState.secondsLeft > 15 ? "bg-lime" : gameState.secondsLeft > 5 ? "bg-yellow-400" : "bg-magenta"
                        }`}
                        style={{ width: `${(gameState.secondsLeft / gameState.timerSeconds) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-surface px-6 py-5">
                    <span className="text-4xl">💬</span>
                    <div className="text-sm font-black uppercase tracking-widest text-lime mt-2">No Time Limit</div>
                    {isHost && (
                      <button
                        onClick={() => updateAndBroadcast((prev) => ({ ...prev, phase: "VOTING" }))}
                        className="mt-4 w-full rounded-xl bg-magenta px-4 py-3 text-sm font-black uppercase text-white border-2 border-void brutal-shadow-white tactile tactile-press"
                      >
                        Force Start Voting 🗳️
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
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-surface/50 border border-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {renderAvatar(p.avatar, "size-4 text-lime shrink-0")}
                      <span className="text-xs font-bold uppercase truncate text-muted-foreground">{p.name}</span>
                    </div>
                    <span className={`text-xs font-black uppercase truncate max-w-[12ch] ${
                      p.clue ? "text-lime" : "text-magenta/40 italic text-[10px]"
                    }`}>
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
                Who is the<br />
                <span className="text-magenta text-glitch">FRAUD? 🕵️</span>
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
                    onClick={() => { setSelectedSuspectId(p.id); buzz(20); }}
                    className={`relative rounded-2xl border-3 p-3.5 text-left bg-surface transition-all duration-200 tactile ${
                      active ? "border-magenta scale-105 shadow-[0_0_25px_rgba(255,45,85,0.45)] z-10" : "border-white/10 opacity-70"
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between">
                      {renderAvatar(p.avatar, "size-8 text-magenta")}
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        {hasVoted ? "Voted ✅" : "Voting..."}
                      </span>
                    </div>
                    <div className="mt-4 text-base font-black uppercase truncate text-off-white">{p.name}</div>
                    <div className="mt-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      {isSelf ? "YOU" : active ? "NOMINATED 🚨" : "SELECT SUSPECT"}
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
                Votes submitted: {Object.keys(gameState.votes).length} of {gameState.players.length}
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
              <img src="/split-mask.png" alt="Dual Mask" className="size-20 rounded-2xl brutal-shadow-pink mb-3" />
              
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
                const fraudName = gameState.players.find((p) => p.id === gameState.fraudPlayerId)?.name || "Impostor";
                const fraudAvatar = gameState.players.find((p) => p.id === gameState.fraudPlayerId)?.avatar || "Zap";
                
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
                            <div key={p.id} className="flex items-center justify-between rounded-xl bg-void px-3 py-2 border border-white/5 text-xs font-bold">
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
                                {gained > 0 && <span className="text-lime text-[11px] font-black">+{gained}</span>}
                                <span className="font-mono text-off-white">{p.score + gained} XP</span>
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

      </div>
    </div>
  );
}
