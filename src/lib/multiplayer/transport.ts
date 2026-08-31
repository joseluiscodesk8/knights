import type { DataConnection } from "peerjs";

import { ROOM_PREFIX, type MpMessage } from "./types";

export interface TransportEvents {
  onOpen: (peerId: string) => void;
  onData: (peerId: string, message: MpMessage) => void;
  onPeerDisconnect: (peerId: string) => void;
  onClose: () => void;
  onError: (message: string) => void;
}

export interface ITransport {
  readonly isHost: boolean;
  readonly peerId: string;
  sendToEveryone(message: MpMessage): void;
  sendTo(peerId: string, message: MpMessage): void;
  destroy(): void;
}

async function loadPeer() {
  const mod = await import("peerjs");
  const Peer = mod.Peer ?? mod.default;
  return { Peer };
}

const CONNECT_TIMEOUT = 15000;

export async function createHostTransport(
  code: string,
  events: TransportEvents
): Promise<ITransport> {
  const { Peer } = await loadPeer();
  const peer = new Peer(ROOM_PREFIX + code);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Tiempo de espera agotado al crear la partida")),
      CONNECT_TIMEOUT
    );
    peer.once("open", () => {
      clearTimeout(timeout);
      resolve();
    });
    peer.once("error", (error) => {
      clearTimeout(timeout);
      reject(
        new Error(
          error.type === "unavailable-id"
            ? "El código ya está en uso, intenta de nuevo"
            : error.message || "Error al crear la partida"
        )
      );
    });
  });
  events.onOpen(peer.id);

  const connections = new Map<string, DataConnection>();

  peer.on("connection", (conn) => {
    connections.set(conn.peer, conn);
    conn.on("data", (data) => {
      events.onData(conn.peer, data as MpMessage);
    });
    conn.on("close", () => {
      connections.delete(conn.peer);
      events.onPeerDisconnect(conn.peer);
    });
    conn.on("error", () => {
      connections.delete(conn.peer);
      events.onPeerDisconnect(conn.peer);
    });
  });

  return {
    isHost: true,
    peerId: peer.id,
    sendToEveryone(message) {
      for (const conn of connections.values()) {
        try {
          conn.send(message);
        } catch {
          // conexión en proceso de cierre
        }
      }
    },
    sendTo(peerId, message) {
      const conn = connections.get(peerId);
      if (!conn) return;
      try {
        conn.send(message);
      } catch {
        // conexión en proceso de cierre
      }
    },
    destroy() {
      try {
        peer.destroy();
      } catch {
        // ya destruido
      }
    },
  };
}

export async function createGuestTransport(
  code: string,
  events: TransportEvents
): Promise<ITransport> {
  const { Peer } = await loadPeer();
  const peer = new Peer();

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Tiempo de espera agotado al conectar")),
      CONNECT_TIMEOUT
    );
    peer.once("open", () => {
      clearTimeout(timeout);
      resolve();
    });
    peer.once("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(error.message || "Error al conectar"));
    });
  });
  events.onOpen(peer.id);

  const conn = peer.connect(ROOM_PREFIX + code, { reliable: true });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () =>
        reject(
          new Error("No se pudo unir: código inválido o anfitrión no disponible")
        ),
      CONNECT_TIMEOUT
    );
    conn.once("open", () => {
      clearTimeout(timeout);
      resolve();
    });
    conn.once("error", () => {
      clearTimeout(timeout);
      reject(new Error("Conexión rechazada por el anfitrión"));
    });
  });

  conn.on("data", (data) => {
    events.onData(conn.peer, data as MpMessage);
  });
  conn.on("close", () => events.onClose());
  conn.on("error", () => {});

  return {
    isHost: false,
    peerId: peer.id,
    sendToEveryone(message) {
      try {
        conn.send(message);
      } catch {
        // conexión en proceso de cierre
      }
    },
    sendTo(_peerId, message) {
      try {
        conn.send(message);
      } catch {
        // conexión en proceso de cierre
      }
    },
    destroy() {
      try {
        conn.close();
      } catch {
        // ya cerrada
      }
      try {
        peer.destroy();
      } catch {
        // ya destruido
      }
    },
  };
}