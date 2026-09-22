"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CoopBattle from "@/components/multiplayer/CoopBattle";
import CoopMap from "@/components/multiplayer/CoopMap";
import LobbyView from "@/components/multiplayer/LobbyView";
import MultiplayerEnd from "@/components/multiplayer/MultiplayerEnd";
import {
  cloneState,
  disconnectPlayer,
  goldCount,
  movePlayer,
  resolveAttack,
  startPlayState,
} from "@/lib/multiplayer/gameplay";
import { getBronzeKnightById, getGoldKnights } from "@/lib/knights";
import {
  MAX_PLAYERS,
  PLAYER_COLORS,
  generateRoomCode,
  type MpMessage,
  type RoomPlayer,
  type RoomState,
} from "@/lib/multiplayer/types";
import {
  createGuestTransport,
  createHostTransport,
  type ITransport,
} from "@/lib/multiplayer/transport";
import type { Knight } from "@/types/knights";

import styles from "../../styles/index.module.scss";

const goldKnights = getGoldKnights();

type Screen = "choose" | "host" | "join";

interface MultiplayerGameProps {
  knight: Knight;
  userName?: string;
  onExit: () => void;
}

export default function MultiplayerGame({
  knight,
  userName,
  onExit,
}: MultiplayerGameProps) {
  const [screen, setScreen] = useState<Screen>("choose");
  const [code, setCode] = useState("");
  const [myId, setMyId] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transportRef = useRef<ITransport | null>(null);
  const roomRef = useRef<RoomState | null>(null);

  const displayName = userName?.trim() ? userName.trim() : "Jugador";

  const applyRoom = useCallback((next: RoomState | null) => {
    roomRef.current = next;
    setRoom(next);
  }, []);

  const broadcastRoom = useCallback(() => {
    const current = roomRef.current;
    const transport = transportRef.current;
    if (current && transport) {
      transport.sendToEveryone({ type: "room", payload: current });
    }
  }, []);

  function buildLocalPlayer(peerId: string): RoomPlayer {
    return {
      id: peerId,
      name: displayName,
      knightId: knight.id,
      knightName: knight.name,
      knightImage: knight.image,
      attacks: knight.attacks,
      hp: knight.vida,
      maxHp: knight.vida,
      pos: { row: 0, col: 0 },
      alive: true,
      goldIndex: 0,
      inDuel: false,
    };
  }

  useEffect(() => {
    return () => {
      transportRef.current?.destroy();
      transportRef.current = null;
    };
  }, []);

  const handleGuestData = useCallback(
    (peerId: string, message: MpMessage) => {
      const current = roomRef.current;
      const transport = transportRef.current;
      if (!transport) return;

      if (message.type === "hello") {
        if (!current || current.phase !== "lobby") {
          transport.sendTo(peerId, {
            type: "error",
            payload: { message: "La partida ya empezó" },
          });
          return;
        }
        if (current.players.find((player) => player.id === peerId)) return;
        if (current.players.length >= MAX_PLAYERS) {
          transport.sendTo(peerId, {
            type: "error",
            payload: { message: "La sala está llena" },
          });
          return;
        }
        const guestKnight = getBronzeKnightById(message.payload.knightId);
        const next: RoomState = {
          ...current,
          players: [
            ...current.players,
            {
              id: peerId,
              name: message.payload.name || "Jugador",
              knightId: message.payload.knightId,
              knightName: guestKnight?.name ?? knight.name,
              knightImage: guestKnight?.image ?? knight.image,
              attacks: guestKnight?.attacks ?? knight.attacks,
              hp: guestKnight?.vida ?? knight.vida,
              maxHp: guestKnight?.vida ?? knight.vida,
              pos: { row: 0, col: 0 },
              alive: true,
              goldIndex: 0,
              inDuel: false,
            },
          ],
        };
        applyRoom(next);
        broadcastRoom();
        return;
      }

      if (message.type === "move") {
        if (!current || current.phase !== "play") return;
        applyRoom(movePlayer(cloneState(current), peerId, message.payload));
        broadcastRoom();
        return;
      }

      if (message.type === "attack") {
        if (!current || current.phase !== "play") return;
        const index = current.players.findIndex(
          (player) => player.id === peerId
        );
        if (index === -1) return;
        applyRoom(resolveAttack(cloneState(current), index, message.payload.attackIndex));
        broadcastRoom();
      }
    },
    [applyRoom, broadcastRoom, knight]
  );

  const handleGuestDisconnect = useCallback(
    (peerId: string) => {
      const current = roomRef.current;
      const transport = transportRef.current;
      if (!current || !transport) return;
      const index = current.players.findIndex(
        (player) => player.id === peerId
      );
      if (index === -1) return;

      if (current.phase === "lobby") {
        applyRoom({
          ...current,
          players: current.players.filter((player) => player.id !== peerId),
        });
        broadcastRoom();
        return;
      }

      applyRoom(disconnectPlayer(cloneState(current), peerId));
      broadcastRoom();
    },
    [applyRoom, broadcastRoom]
  );

  const handleGuestDataIn = useCallback(
    (message: MpMessage) => {
      if (message.type === "room") applyRoom(message.payload);
      if (message.type === "error") setError(message.payload.message);
    },
    [applyRoom]
  );

  async function startHost() {
    setScreen("host");
    setConnecting(true);
    setError(null);
    const generated = generateRoomCode();
    setCode(generated);
    try {
      const transport = await createHostTransport(generated, {
        onOpen: (peerId) => setMyId(peerId),
        onData: (peerId, message) => handleGuestData(peerId, message),
        onPeerDisconnect: (peerId) => handleGuestDisconnect(peerId),
        onClose: () => {},
        onError: (message) => setError(message),
      });
      transportRef.current = transport;
      setMyId(transport.peerId);
      applyRoom({
        phase: "lobby",
        players: [buildLocalPlayer(transport.peerId)],
        mazes: {},
        duels: {},
        message: "Comparte el código con tu equipo",
      });
    } catch (cause) {
      setCode("");
      setError(
        cause instanceof Error ? cause.message : "No se pudo crear la partida"
      );
    } finally {
      setConnecting(false);
    }
  }

  async function startJoin(codeInput: string) {
    const clean = codeInput.trim().toUpperCase();
    setScreen("join");
    setConnecting(true);
    setError(null);
    setCode(clean);
    try {
      const transport = await createGuestTransport(clean, {
        onOpen: (peerId) => setMyId(peerId),
        onData: (_peerId, message) => handleGuestDataIn(message),
        onPeerDisconnect: () => {},
        onClose: () => setError("La conexión con el anfitrión se perdió"),
        onError: (message) => setError(message),
      });
      transportRef.current = transport;
      setMyId(transport.peerId);
      transport.sendToEveryone({
        type: "hello",
        payload: { name: displayName, knightId: knight.id },
      });
    } catch (cause) {
      setCode("");
      setError(
        cause instanceof Error ? cause.message : "No se pudo unir a la partida"
      );
    } finally {
      setConnecting(false);
    }
  }

  function handleHostStart() {
    const current = roomRef.current;
    if (!current || current.phase !== "lobby" || current.players.length < 2) {
      return;
    }
    applyRoom(startPlayState(cloneState(current)));
    broadcastRoom();
  }

  function handleLocalMove(dr: number, dc: number) {
    const current = roomRef.current;
    const transport = transportRef.current;
    if (!current || current.phase !== "play" || !transport) return;
    const me = current.players.find((player) => player.id === myId);
    if (!me || !me.alive || me.inDuel) return;
    const intent = { row: me.pos.row + dr, col: me.pos.col + dc };
    if (transport.isHost) {
      applyRoom(movePlayer(cloneState(current), myId, intent));
      broadcastRoom();
    } else {
      transport.sendToEveryone({ type: "move", payload: intent });
    }
  }

  function handleLocalAttack(attackIndex: number) {
    const current = roomRef.current;
    const transport = transportRef.current;
    if (!current || current.phase !== "play" || !transport) return;
    const index = current.players.findIndex((player) => player.id === myId);
    if (index === -1 || !current.players[index].alive) return;
    if (transport.isHost) {
      applyRoom(resolveAttack(cloneState(current), index, attackIndex));
      broadcastRoom();
    } else {
      transport.sendToEveryone({ type: "attack", payload: { attackIndex } });
    }
  }

  function handleBack() {
    transportRef.current?.destroy();
    transportRef.current = null;
    roomRef.current = null;
    setRoom(null);
    setCode("");
    setError(null);
    setMyId("");
    setScreen("choose");
    onExit();
  }

  if (error) {
    return (
      <section className={styles.lobby}>
        <p className={styles.lobbyError}>{error}</p>
        <button className={styles.lobbyBackButton} onClick={handleBack}>
          ← Volver
        </button>
      </section>
    );
  }

  if (room?.phase === "play") {
    const my = room.players.find((player) => player.id === myId);
    const viewers = room.players.filter((player) => player.alive);
    const view =
      my && my.alive
        ? my
        : [...viewers].sort(
            (a, b) =>
              b.goldIndex - a.goldIndex ||
              Number(b.inDuel) - Number(a.inDuel)
          )[0];

    if (view) {
      const gold = goldKnights[view.goldIndex] ?? goldKnights[0];
      const duel = room.duels[view.goldIndex];
      if (view.inDuel && duel) {
        const members = duel.memberIds
          .map((id) => room.players.find((player) => player.id === id))
          .filter(
            (player): player is RoomPlayer => Boolean(player)
          );
        return (
          <CoopBattle
            goldKnight={gold}
            goldIndex={view.goldIndex}
            goldHp={duel.goldHp}
            players={members}
            myIndex={members.findIndex((player) => player.id === myId)}
            turn={duel.turn}
            lastRound={duel.lastRound}
            status={room.message}
            onAttack={handleLocalAttack}
          />
        );
      }
      const maze = room.mazes[view.goldIndex];
      if (maze) {
        const walkers = room.players.filter(
          (player) => player.goldIndex === view.goldIndex && !player.inDuel
        );
        return (
          <CoopMap
            maze={maze}
            players={walkers.map((player, index) => ({
              id: player.id,
              name: player.name,
              knightName: player.knightName,
              pos: player.pos,
              color: PLAYER_COLORS[index % PLAYER_COLORS.length],
            }))}
            myId={myId}
            label={room.message}
            onMove={handleLocalMove}
          />
        );
      }
    }
  }

  if (room?.phase === "end") {
    const progress = Math.max(
      ...room.players.map((player) =>
        player.alive ? player.goldIndex : Math.min(player.goldIndex, goldCount() - 1)
      )
    );
    return (
      <MultiplayerEnd
        result={room.result ?? "gameover"}
        goldIndex={progress}
        playerName={displayName}
        onExit={handleBack}
      />
    );
  }

  return (
    <LobbyView
      mode={screen}
      code={code}
      players={room?.players ?? []}
      isHost={screen === "host"}
      connecting={connecting}
      error={error}
      onChooseHost={startHost}
      onChooseJoin={() => setScreen("join")}
      onJoin={startJoin}
      onStart={handleHostStart}
      onBack={handleBack}
    />
  );
}