"use client";

import Image from "next/image";

import { RoundResult } from "@/lib/battle";
import { Knight } from "@/types/knights";

import styles from "../styles/index.module.scss";

interface BattleArenaProps {
  player: Knight;
  playerHp: number;
  enemy: Knight;
  enemyHp: number;
  lastRound: RoundResult | null;
  onAttack: (attackIndex: number) => void;
}

function hpPercent(hp: number, base: number): number {
  const max = Math.max(hp, base);
  return Math.max(0, Math.min(100, (hp / max) * 100));
}

export default function BattleArena({
  player,
  playerHp,
  enemy,
  enemyHp,
  lastRound,
  onAttack,
}: BattleArenaProps) {
  return (
    <section className={styles.arena}>
      <div className={styles.arenaGrid}>
        <article className={styles.fighter}>
          <Image
            className={styles.fighterImage}
            src={player.image}
            alt={player.name}
            width={240}
            height={240}
          />
          <h2 className={styles.fighterName}>{player.name}</h2>
          <div className={styles.hpBarWrap}>
            <div
              className={styles.hpBarFill}
              style={{ width: `${hpPercent(playerHp, player.vida)}%` }}
            />
          </div>
          <span className={styles.hpValue}>{playerHp}</span>
          <div className={styles.playerAttacks}>
            {player.attacks.map((attack, index) => (
              <button
                key={attack}
                className={styles.attackButton}
                onClick={() => onAttack(index)}
              >
                {attack}
              </button>
            ))}
          </div>
        </article>

        <div className={styles.arenaTitle}>
          <h1>Batalla</h1>
          {lastRound && (
            <div className={styles.roundLog}>
              <p>
                {lastRound.playerAttack} <strong>{lastRound.playerRoll}</strong>
              </p>
              <p>
                {lastRound.enemyAttack} <strong>{lastRound.enemyRoll}</strong>
              </p>
              {lastRound.winner === "player" && (
                <p className={styles.roundLogWin}>
                  ¡Golpe tuyo! Enemigo −{lastRound.damage}, te recuperas +
                  {lastRound.heal}
                </p>
              )}
              {lastRound.winner === "enemy" && (
                <p className={styles.roundLogLose}>
                  Recibes −{lastRound.damage} de golpe
                </p>
              )}
              {lastRound.winner === "tie" && (
                <p className={styles.roundLogTie}>Empate, sin daño</p>
              )}
            </div>
          )}
        </div>

        <article className={styles.fighter}>
          <Image
            className={styles.fighterImage}
            src={enemy.image}
            alt={enemy.name}
            width={240}
            height={240}
          />
          <h2 className={styles.fighterName}>{enemy.name}</h2>
          <div className={styles.hpBarWrap}>
            <div
              className={`${styles.hpBarFill} ${styles.hpBarFillEnemy}`}
              style={{ width: `${hpPercent(enemyHp, enemy.vida)}%` }}
            />
          </div>
          <span className={styles.hpValue}>{enemyHp}</span>
          <div className={styles.enemyAttacks}>
            {enemy.attacks.map((attack) => (
              <button
                key={attack}
                className={`${styles.attackButton} ${styles.enemyAttackButton} ${
                  lastRound?.enemyAttack === attack ? styles.enemyAttackUsed : ""
                }`}
                disabled
              >
                {attack}
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}