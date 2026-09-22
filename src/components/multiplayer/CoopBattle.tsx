"use client";

import Image from "next/image";

import { HpRing } from "@/components/BattleArena";
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

function backLeft(index: number, total: number): number {
  if (total <= 1) return 50;
  return 8 + (index * 84) / (total - 1);
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
  const backs = players.filter((_, index) => index !== myIndex);
  const mine = players[myIndex];

  return (
    <section className={styles.arena}>
      <div className={styles.multiBattleHeader}>
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

      <span className={styles.multiGoldCount}>
        Gold {goldIndex + 1} de 12
      </span>
      {status && <p className={styles.multiTurnInfo}>{status}</p>}

      <div className={styles.arenaStage}>
        <article
          className={`${styles.fighter} ${styles.fighterGold} ${
            turn === -1 ? styles.multiGoldWait : ""
          }`}
        >
          <div className={styles.fighterFigure}>
            <Image
              className={styles.fighterImage}
              src={goldKnight.image}
              alt={goldKnight.name}
              width={200}
              height={200}
              priority
            />
            <HpRing hp={goldHp} base={goldKnight.vida} />
          </div>
          <h2 className={styles.fighterName}>{goldKnight.name}</h2>
        </article>

        {backs.map((member, backIndex) => {
          const originalIndex =
            backIndex < myIndex ? backIndex : backIndex + 1;
          const isTurn = originalIndex === turn;
          return (
            <article
              key={member.id}
              className={`${styles.fighter} ${styles.fighterBronze} ${
                styles.multiBack
              } ${!member.alive ? styles.multiDead : ""} ${
                isTurn ? styles.multiTurnGlow : ""
              }`}
              style={{
                left: `${backLeft(backIndex, backs.length)}%`,
                zIndex: isTurn ? 3 : 2,
              }}
            >
              <h2 className={styles.fighterName}>
                {member.name}
                {isTurn ? " 👉" : ""}
              </h2>
              <div className={styles.fighterFigure}>
                <Image
                  className={styles.fighterImage}
                  src={member.knightImage}
                  alt={member.knightName}
                  width={120}
                  height={120}
                />
                <HpRing hp={member.hp} base={member.maxHp} />
              </div>
            </article>
          );
        })}

        {mine && (
          <article
            className={`${styles.fighter} ${styles.fighterBronze} ${
              styles.multiMine
            } ${!mine.alive ? styles.multiDead : ""} ${
              myIndex === turn ? styles.multiTurnGlow : ""
            }`}
            style={{ left: "50%", zIndex: 10 }}
          >
            <h2 className={styles.fighterName}>{mine.name} ✱</h2>
            <div className={styles.fighterFigure}>
              <Image
                className={styles.fighterImage}
                src={mine.knightImage}
                alt={mine.knightName}
                width={120}
                height={120}
              />
              <HpRing hp={mine.hp} base={mine.maxHp} />
            </div>
          </article>
        )}
      </div>

      {mine?.alive && (
        <div className={styles.playerAttacks}>
          {mine.attacks.map((attack, attackIndex) => (
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
    </section>
  );
}