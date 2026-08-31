"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CoopBattle from "@/components/multiplayer/CoopBattle";
import CoopMap from "@/components/multiplayer/CoopMap";
import LobbyView from "@/components/multiplayer/LobbyView";
import MultiplayerEnd from "@/components/multiplayer/MultiplayerEnd";
import { resolveRound, rollAttack } from "@/lib/battle";
import { getBronzeKnightById, getGoldKnights } from "@/lib/knights";
import { createMaze, isWalkable, reachGoal } from "@/lib/maze";
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
    };
  }

  useEffect(() => {
    return () => {
      transportRef.current?.destroy();
      transportRef.current = null;
    };
  }, []);

  const startBattle = useCallback(
    (from: RoomState) => {
      const gold = goldKnights[from.goldIndex] ?? goldKnights[0];
      const next: RoomState = {
        ...from,
        phase: "battle",
        maze: from.maze,
        goldIndex: from.goldIndex,
        goldHp: gold.vida,
        goldMaxHp: gold.vida,
        turn: from.players.findIndex((player) => player.alive),
        lastRound: null,
        result: undefined,
        message: `¡Todo el equipo llegó! El Gold ${gold.name} os espera.`,
      };
      applyRoom(next);
      broadcastRoom();
    },
    [applyRoom, broadcastRoom]
  );

  const resolveAttack = useCallback(
    (actorIndex: number, attackIndex: number) => {
      const current = roomRef.current;
      const transport = transportRef.current;
      if (!current || current.phase !== "battle" || !transport) return;
      const next: RoomState = {
        ...current,
        players: current.players.map((player) => ({ ...player })),
      };
      const player = next.players[actorIndex];
      if (!player.alive || next.turn !== actorIndex) return;
      const bronze = getBronzeKnightById(player.knightId);
      if (!bronze) return;
      const gold = goldKnights[next.goldIndex] ?? goldKnights[0];
      const playerAttack = bronze.attacks[attackIndex] ?? bronze.attacks[0];
      const enemyAttack =
        gold.attacks[Math.floor(Math.random() * gold.attacks.length)];
      const result = resolveRound(
        rollAttack(),
        rollAttack(),
        playerAttack,
        enemyAttack
      );

      let goldHp = next.goldHp;
      if (result.winner === "player") {
        goldHp -= result.damage;
        player.hp = Math.min(player.maxHp, player.hp + result.heal);
      } else if (result.winner === "enemy") {
        player.hp = Math.max(0, player.hp - result.damage);
      }
      player.alive = player.hp > 0;
      next.goldHp = goldHp;
      next.lastRound = { ...result, actorName: player.name };

      if (goldHp <= 0) {
        if (next.goldIndex >= goldKnights.length - 1) {
          next.phase = "end";
          next.result = "victory";
          next.turn = -1;
          applyRoom(next);
          broadcastRoom();
          return;
        }
        const nextGold = goldKnights[next.goldIndex + 1];
        const maze = createMaze();
        next.phase = "map";
        next.maze = maze;
        next.goldIndex += 1;
        next.goldHp = 0;
        next.goldMaxHp = 0;
        next.turn = 0;
        next.lastRound = null;
        next.players = next.players.map((player) => ({
          ...player,
          pos: player.alive ? { ...maze.start } : { ...maze.goal },
        }));
        next.message = `El Gold ${gold.name} ha caído. ¡Todos a la X para el Gold ${nextGold.name}!`;
        applyRoom(next);
        broadcastRoom();
        return;
      }

      if (next.players.every((p) => !p.alive)) {
        next.phase = "end";
        next.result = "gameover";
        next.turn = -1;
        applyRoom(next);
        broadcastRoom();
        return;
      }

      let turn = (next.turn + 1) % next.players.length;
      for (let i = 0; i < next.players.length; i++) {
        if (next.players[turn].alive) break;
        turn = (turn + 1) % next.players.length;
      }
      next.turn = turn;
      applyRoom(next);
      broadcastRoom();
    },
    [applyRoom, broadcastRoom]
  );

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
            },
          ],
        };
        applyRoom(next);
        broadcastRoom();
        return;
      }

      if (message.type === "move") {
        if (!current || current.phase !== "map" || !current.maze) return;
        const index = current.players.findIndex(
          (player) => player.id === peerId
        );
        if (index === -1 || !current.players[index].alive) return;
        const me = current.players[index];
        const intent = message.payload;
        if (
          Math.abs(intent.row - me.pos.row) +
            Math.abs(intent.col - me.pos.col) !==
          1
        ) {
          return;
        }
        if (!isWalkable(current.maze, intent)) return;
        const next: RoomState = {
          ...current,
          players: current.players.map((player) =>
            player.id === peerId ? { ...player, pos: intent } : player
          ),
        };
        applyRoom(next);
        broadcastRoom();
        if (next.players.every((player) => reachGoal(next.maze!, player.pos))) {
          startBattle(next);
        }
        return;
      }

      if (message.type === "attack") {
        if (!current || current.phase !== "battle") return;
        const index = current.players.findIndex(
          (player) => player.id === peerId
        );
        if (index === -1) return;
        resolveAttack(index, message.payload.attackIndex);
      }
    },
    [applyRoom, broadcastRoom, startBattle, resolveAttack, knight]
  );

  const handleGuestDisconnect = useCallback(
    (peerId: string) => {
      const current = roomRef.current;
      const transport = transportRef.current;
      if (!current || !transport) return;
      const index = current.players.findIndex((player) => player.id === peerId);
      if (index === -1) return;

      if (current.phase === "lobby") {
        applyRoom({
          ...current,
          players: current.players.filter((player) => player.id !== peerId),
        });
        broadcastRoom();
        return;
      }

      const next: RoomState = {
        ...current,
        players: current.players.map((player) => ({ ...player })),
      };
      const guest = next.players[index];
      guest.alive = false;
      guest.name = `${guest.name} (desconectado)`;
      next.message = `${guest.name} se desconectó`;

      if (next.phase === "map" && next.maze) {
        guest.pos = next.maze.goal;
        applyRoom(next);
        broadcastRoom();
        if (
          next.players.every(
            (player) => !player.alive || reachGoal(next.maze!, player.pos)
          )
        ) {
          startBattle(next);
        }
        return;
      }

      if (next.phase === "battle") {
        if (next.players.every((player) => !player.alive)) {
          next.phase = "end";
          next.result = "gameover";
          next.turn = -1;
          applyRoom(next);
          broadcastRoom();
          return;
        }
        if (next.turn === index) {
          let turn = (index + 1) % next.players.length;
          for (let i = 0; i < next.players.length; i++) {
            if (next.players[turn].alive) break;
            turn = (turn + 1) % next.players.length;
          }
          next.turn = turn;
        }
      }

      applyRoom(next);
      broadcastRoom();
    },
    [applyRoom, broadcastRoom, startBattle]
  );

  const handleGuestDataIn = useCallback(
    (message: MpMessage) => {
      if (message.type === "room") applyRoom(message.payload);
      if (message.type === "error") setError(message.payload.message);
    },
    [applyRoom]
  );

  async function startHost() {
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
        maze: null,
        goldIndex: 0,
        goldHp: 0,
        goldMaxHp: 0,
        turn: 0,
        lastRound: null,
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
    const maze = createMaze();
    const next: RoomState = {
      ...current,
      phase: "map",
      maze,
      players: current.players.map((player) => ({
        ...player,
        pos: { ...maze.start },
      })),
      goldIndex: 0,
      goldHp: 0,
      goldMaxHp: 0,
      turn: 0,
      lastRound: null,
      result: undefined,
      message: "Salid de la O y llegad juntos a la X para la batalla!",
    };
    applyRoom(next);
    broadcastRoom();
  }

  function handleLocalMove(dr: number, dc: number) {
    const current = roomRef.current;
    const transport = transportRef.current;
    if (!current || !current.maze || current.phase !== "map" || !transport) {
      return;
    }
    const index = current.players.findIndex((player) => player.id === myId);
    if (index === -1 || !current.players[index].alive) return;
    const me = current.players[index];
    const intent = { row: me.pos.row + dr, col: me.pos.col + dc };
    if (!isWalkable(current.maze, intent)) return;

    if (transport.isHost) {
      const next: RoomState = {
        ...current,
        players: current.players.map((player) =>
          player.id === myId ? { ...player, pos: intent } : player
        ),
      };
      applyRoom(next);
      broadcastRoom();
      if (next.players.every((player) => reachGoal(next.maze!, player.pos))) {
        startBattle(next);
      }
    } else {
      transport.sendToEveryone({ type: "move", payload: intent });
    }
  }

  function handleLocalAttack(attackIndex: number) {
    const current = roomRef.current;
    const transport = transportRef.current;
    if (!current || current.phase !== "battle" || !transport) return;
    const index = current.players.findIndex((player) => player.id === myId);
    if (index === -1 || index !== current.turn || !current.players[index].alive) {
      return;
    }
    if (transport.isHost) {
      resolveAttack(index, attackIndex);
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

  if (room?.phase === "map" && room.maze) {
    return (
      <CoopMap
        maze={room.maze}
        players={room.players.map((player, index) => ({
          ...player,
          color: PLAYER_COLORS[index % PLAYER_COLORS.length],
        }))}
        myId={myId}
        label={room.message}
        status={undefined}
        onMove={handleLocalMove}
      />
    );
  }

  if (room?.phase === "battle") {
    const gold = goldKnights[room.goldIndex] ?? goldKnights[0];
    return (
      <CoopBattle
        goldKnight={gold}
        goldIndex={room.goldIndex}
        goldHp={room.goldHp}
        players={room.players}
        myIndex={room.players.findIndex((player) => player.id === myId)}
        turn={room.turn}
        lastRound={room.lastRound}
        status={room.message}
        onAttack={handleLocalAttack}
      />
    );
  }

  if (room?.phase === "end") {
    return (
      <MultiplayerEnd
        result={room.result ?? "gameover"}
        goldIndex={room.goldIndex}
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
      isHost={transportRef.current?.isHost ?? screen === "host"}
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