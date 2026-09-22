"use client";

import Image from "next/image";

import type { RoomPlayer, RollEvent } from "@/lib/multiplayer/types";
import { Knight } from "@/types/knights";

import styles from "../../styles/index.module.scss";

interface CoopBattleProps {
  goldKnight: Knight;
  goldIndex: number;
  goldHp: number;
  players: RoomPlayer[];
  myIndex: number;
  turn: number;
  lastRound: RollEvent | null;
  status?: string;
  onAttack: (attackIndex: number) => void;
}

function hpPercent(hp: number, base: number): number {
  const max = Math.max(hp, base);
  return Math.max(0, Math.min(100, (hp / max) * 100));
}

export default function CoopBattle({
  goldKnight,
  goldIndex,
  goldHp,
  players,
  myIndex,
  turn,
  lastRound,
  status,
  onAttack,
}: CoopBattleProps) {
  const back = players.filter((_, index) => index !== myIndex);
  const nBack = back.length;

  return (
    <section className={styles.multiBattleWrap}>
      <div className={styles.multiBattleHeader}>
        <div className={styles.multiBattleGold}>
          <Image
            className={styles.fighterImage}
            src={goldKnight.image}
            alt={goldKnight.name}
            width={160}
            height={160}
          />
          <h2 className={styles.fighterName}>{goldKnight.name}</h2>
          <span className={styles.multiGoldCount}>
            Gold {goldIndex + 1} de 12
          </span>
          <div className={styles.hpBarWrap}>
            <div
              className={`${styles.hpBarFill} ${styles.hpBarFillEnemy}`}
              style={{ width: `${hpPercent(goldHp, goldKnight.vida)}%` }}
            />
          </div>
          <span className={styles.hpValue}>{goldHp}</span>
        </div>

        <div className={styles.roundLog}>
          {lastRound ? (
            <>
              <p className={styles.roundLogActor}>{lastRound.actorName}</p>
              <p>
                {lastRound.playerAttack} <strong>{lastRound.playerRoll}</strong>{" "}
                vs {lastRound.enemyAttack}{" "}
                <strong>{lastRound.enemyRoll}</strong>
              </p>
              {lastRound.winner === "player" && (
                <p className={styles.roundLogWin}>
                  ¡Golpe al Gold! −{lastRound.damage} · cura +{lastRound.heal}
                </p>
              )}
              {lastRound.winner === "enemy" && (
                <p className={styles.roundLogLose}>
                  Recibe −{lastRound.damage} de golpe
                </p>
              )}
              {lastRound.winner === "tie" && (
                <p className={styles.roundLogTie}>Empate, sin daño</p>
              )}
            </>
          ) : (
            <p className={styles.lobbyStatus}>
              El primer ataque de {players[turn]?.name ?? "…"}…
            </p>
          )}
        </div>
      </div>

      {status && <p className={styles.multiTurnInfo}>{status}</p>}

      <div className={styles.multiStage}>
        {back.map((player, backIndex) => {
          const originalIndex = backIndex < myIndex ? backIndex : backIndex + 1;
          const spread = nBack > 1 ? 16 + (backIndex / (nBack - 1)) * 68 : 50;
          const fanTilt = nBack > 1 ? (backIndex - (nBack - 1) / 2) * 5 : 0;
          return (
            <article
              key={player.id}
              className={`${styles.multiFighter} ${styles.multiFighterBack} ${
                !player.alive ? styles.multiDead : ""
              } ${originalIndex === turn ? styles.multiTurn : ""}`}
              style={{
                left: `${spread}%`,
                transform: `translateX(-50%) rotate(${fanTilt}deg)`,
                zIndex: backIndex + 1,
              }}
            >
              <Image
                className={styles.fighterImage}
                src={player.knightImage}
                alt={player.knightName}
                width={90}
                height={90}
              />
              <h3 className={styles.multiFighterName}>
                {player.name}
                {originalIndex === myIndex ? " ✱" : ""}
              </h3>
              <div className={styles.hpBarWrap}>
                <div
                  className={styles.hpBarFill}
                  style={{
                    width: `${hpPercent(player.hp, player.maxHp)}%`,
                  }}
                />
              </div>
              <span className={styles.hpValue}>{player.hp}</span>
            </article>
          );
        })}

        {players[myIndex] && (
          <article
            key={players[myIndex].id}
            className={`${styles.multiFighter} ${styles.multiFighterFront} ${
              !players[myIndex].alive ? styles.multiDead : ""
            } ${myIndex === turn ? styles.multiTurn : ""}`}
          >
            <Image
              className={styles.fighterImage}
              src={players[myIndex].knightImage}
              alt={players[myIndex].knightName}
              width={120}
              height={120}
            />
            <h3 className={styles.multiFighterName}>
              {players[myIndex].name} ✱
            </h3>
            <div className={styles.hpBarWrap}>
              <div
                className={styles.hpBarFill}
                style={{
                  width: `${hpPercent(
                    players[myIndex].hp,
                    players[myIndex].maxHp
                  )}%`,
                }}
              />
            </div>
            <span className={styles.hpValue}>{players[myIndex].hp}</span>

            <span className={styles.multiBadge}>
              {!players[myIndex].alive
                ? "Caído"
                : myIndex === turn
                  ? "👉 Es tu turno"
                  : "En guardia"}
            </span>

            {players[myIndex].alive && (
              <div className={styles.playerAttacks}>
                {players[myIndex].attacks.map((attack, attackIndex) => (
                  <button
                    key={attack}
                    className={styles.attackButton}
                    disabled={myIndex !== turn}
                    onClick={() => onAttack(attackIndex)}
                  >
                    {attack}
                  </button>
                ))}
              </div>
            )}
          </article>
        )}
      </div>
    </section>
  );
}