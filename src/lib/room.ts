// Lightweight optimistic room store.
// Rooms are generated client-side instantly; a mock server "confirmation"
// runs in the background so the UI can flip from optimistic → confirmed
// without ever blocking the Start Game flow.

export type RoomStatus = "optimistic" | "confirmed" | "failed";

export type Room = {
  code: string;
  host: string;
  createdAt: number;
  status: RoomStatus;
  mode: "online" | "local";
};

const KEY = "bof:last-room";

function randomCode(): string {
  // 4-digit room code, avoids leading zeros looking weird by allowing them
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function readLastRoom(): Room | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Room) : null;
  } catch {
    return null;
  }
}

function writeRoom(room: Room) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(room));
  } catch {
    /* noop */
  }
}

/**
 * Instantly returns an optimistic room. A background "server call"
 * simulates confirmation and resolves once it lands.
 */
export function createRoomOptimistic(mode: "online" | "local" = "online"): {
  room: Room;
  confirmed: Promise<Room>;
} {
  const room: Room = {
    code: randomCode(),
    host: "you",
    createdAt: Date.now(),
    status: "optimistic",
    mode,
  };
  writeRoom(room);

  const confirmed = new Promise<Room>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.08) {
        const failed: Room = { ...room, status: "failed" };
        writeRoom(failed);
        reject(Object.assign(new Error("Server unreachable"), { room: failed }));
        return;
      }
      const done: Room = { ...room, status: "confirmed" };
      writeRoom(done);
      resolve(done);
    }, 600 + Math.random() * 400);
  });

  return { room, confirmed };
}

export function joinRoomOptimistic(code: string): {
  room: Room;
  confirmed: Promise<Room>;
} {
  const room: Room = {
    code,
    host: "them",
    createdAt: Date.now(),
    status: "optimistic",
    mode: "online",
  };
  writeRoom(room);
  const confirmed = new Promise<Room>((resolve, reject) => {
    setTimeout(() => {
      const bogus = code === "0000" || /^(\d)\1{3}$/.test(code);
      if (bogus || Math.random() < 0.12) {
        const failed: Room = { ...room, status: "failed" };
        writeRoom(failed);
        reject(
          Object.assign(new Error(bogus ? "Room not found" : "Couldn't reach host"), {
            room: failed,
          }),
        );
        return;
      }
      const done: Room = { ...room, status: "confirmed" };
      writeRoom(done);
      resolve(done);
    }, 500 + Math.random() * 400);
  });
  return { room, confirmed };
}
