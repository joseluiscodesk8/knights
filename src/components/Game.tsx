"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import BattleArena from "@/components/BattleArena";
import GameMap from "@/components/GameMap";
import KnightSelection from "@/components/KnightSelection";
import ModeChoice from "@/components/multiplayer/ModeChoice";
import { useHeaderVisibility } from "@/components/HeaderVisibility";
import { endRun, recordBattle, startRun } from "@/lib/actions/game";
import { resolveRound, rollAttack, RoundResult } from "@/lib/battle";
import { useSession } from "@/hooks/useSession";
import { getBronzeKnights, getGoldKnights } from "@/lib/knights";
import { createMaze, Maze } from "@/lib/maze";
import { Knight } from "@/types/knights";

import styles from "../styles/index.module.scss";

const MultiplayerGame = dynamic(
  () => import("@/components/multiplayer/MultiplayerGame"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.endScreen}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Preparando multijugador…</p>
      </div>
    ),
  }
);

type Phase =
  | "selection"
  | "mode"
  | "map"
  | "battle"
  | "victory"
  | "gameover"
  | "multiplayer";

interface EndProfile {
  wins: number;
  losses: number;
  level: number;
}

const bronzeKnights = getBronzeKnights();
const goldKnights = getGoldKnights();

export default function Game() {
  const { user } = useSession();
  const { setHidden } = useHeaderVisibility();
  const [phase, setPhase] = useState<Phase>("selection");
  const [player, setPlayer] = useState<Knight | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [goldIndex, setGoldIndex] = useState(0);
  const [maze, setMaze] = useState<Maze | null>(null);
  const [lastRound, setLastRound] = useState<RoundResult | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [endProfile, setEndProfile] = useState<EndProfile | null>(null);

  useEffect(() => {
    setHidden(phase !== "selection");
    return () => setHidden(false);
  }, [phase, setHidden]);

  async function selectKnight(knight: Knight) {
    setPlayer(knight);
    setPlayerHp(knight.vida);
    setGoldIndex(0);
    setLastRound(null);
    setEndProfile(null);
    setMaze(null);
    setPhase("mode");
  }

  async function handleSolo() {
    if (!player) return;
    let startedRunId: string | null = null;
    if (user) {
      const run = await startRun(player.id);
      startedRunId = run?.runId ?? null;
    }
    setRunId(startedRunId);
    setPlayerHp(player.vida);
    setGoldIndex(0);
    setLastRound(null);
    setEndProfile(null);
    setMaze(createMaze());
    setPhase("map");
  }

  function handleMultiplayer() {
    setPhase("multiplayer");
  }

  function handleBackToSelection() {
    setPlayer(null);
    setPhase("selection");
  }

  function handleCompleteMap() {
    if (!player) return;
    setEnemyHp(goldKnights[goldIndex].vida);
    setLastRound(null);
    setPhase("battle");
  }

  async function handleAttack(attackIndex: number) {
    if (!player) return;
    const enemy = goldKnights[goldIndex];
    const enemyAttack = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
    const result = resolveRound(
      rollAttack(),
      rollAttack(),
      player.attacks[attackIndex],
      enemyAttack
    );
    setLastRound(result);

    let p = playerHp;
    let e = enemyHp;
    if (result.winner === "player") {
      e -= result.damage;
      p += result.heal;
    } else if (result.winner === "enemy") {
      p -= result.damage;
    }
    setPlayerHp(p);
    setEnemyHp(e);

    if (e <= 0) {
      if (user && runId) {
        await recordBattle({
          runId,
          goldId: enemy.id,
          outcome: "win",
          playerRoll: result.playerRoll,
          goldRoll: result.enemyRoll,
          damage: result.damage,
        });
      }
      if (goldIndex >= goldKnights.length - 1) {
        if (user && runId) {
          const res = await endRun(runId, "won");
          setEndProfile(res?.profile ?? null);
        }
        setPhase("victory");
      } else {
        setGoldIndex(goldIndex + 1);
        setMaze(createMaze());
        setPhase("map");
      }
    } else if (p <= 0) {
      if (user && runId) {
        await recordBattle({
          runId,
          goldId: enemy.id,
          outcome: "loss",
          playerRoll: result.playerRoll,
          goldRoll: result.enemyRoll,
          damage: result.damage,
        });
        const res = await endRun(runId, "lost");
        setEndProfile(res?.profile ?? null);
      }
      setPhase("gameover");
    }
  }

  function handleRestart() {
    setPlayer(null);
    setPlayerHp(0);
    setEnemyHp(0);
    setGoldIndex(0);
    setMaze(null);
    setLastRound(null);
    setRunId(null);
    setEndProfile(null);
    setPhase("selection");
  }

  if (phase === "selection") {
    return <KnightSelection knights={bronzeKnights} onStart={selectKnight} />;
  }

  if (phase === "mode" && player) {
    return (
      <ModeChoice
        knightName={player.name}
        onSolo={handleSolo}
        onMultiplayer={handleMultiplayer}
        onBack={handleBackToSelection}
      />
    );
  }

  if (phase === "multiplayer" && player) {
    return (
      <MultiplayerGame
        knight={player}
        userName={user?.email?.split("@")[0] ?? undefined}
        onExit={handleBackToSelection}
      />
    );
  }

  if (phase === "map" && maze && player) {
    return (
<GameMap
        key={goldIndex}
        maze={maze}
        avatar={player.background}
        label={`Ronda ${goldIndex + 1} de 12 · llega de la O a la X`}
        onComplete={handleCompleteMap}
      />
    );
  }

  if (phase === "battle" && player) {
    const enemy = goldKnights[goldIndex];
    return (
      <BattleArena
        player={player}
        playerHp={playerHp}
        enemy={enemy}
        enemyHp={enemyHp}
        lastRound={lastRound}
        onAttack={handleAttack}
      />
    );
  }

  if (phase === "victory") {
    return (
      <section className={styles.endScreen}>
        <h1 className={styles.endTitle}>¡Has derrotado a los 12 Gold Knights!</h1>
        <p className={styles.endText}>Tu caballero {player?.name} es invencible.</p>
        {endProfile && (
          <p className={styles.endStats}>
            Nivel {endProfile.level} · {endProfile.wins} V / {endProfile.losses} D
          </p>
        )}
        {!user && (
          <p className={styles.endHint}>
            Regístrate para guardar tu progreso y subir de nivel.
          </p>
        )}
        <button className={styles.selectionButton} onClick={handleRestart}>
          Jugar de nuevo
        </button>
      </section>
    );
  }

  return (
    <section className={styles.endScreen}>
      <h1 className={styles.endTitle}>Tu caballero ha caído...</h1>
      <p className={styles.endText}>
        El Gold Knight {goldKnights[goldIndex].name} fue demasiado fuerte.
      </p>
      {endProfile && (
        <p className={styles.endStats}>
          Nivel {endProfile.level} · {endProfile.wins} V / {endProfile.losses} D
        </p>
      )}
      {!user && (
        <p className={styles.endHint}>
          Regístrate para guardar tu progreso y subir de nivel.
        </p>
      )}
      <button className={styles.selectionButton} onClick={handleRestart}>
        Jugar de nuevo
      </button>
    </section>
  );
}