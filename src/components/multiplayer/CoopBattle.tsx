"use client";

import Image from "next/image";
import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { HpRing, RAY_STYLES } from "@/components/BattleArena";
import { randomInt } from "@/lib/battle";
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
  onDodgeHit: () => void;
  onDodgeEnd: () => void;
}

interface Beam {
  id: number;
  kind: "real" | "fake";
  columnX: number;
  launchAt: number;
  speed: number;
  damage: number;
  triggered: boolean;
  aimed: boolean;
}

interface Impact {
  id: number;
  x: number;
  y: number;
}

const HIT_RANGE = 46;
const BRONZE_MIN = 6;
const BRONZE_MAX = 78;
const RAY_SPEED = 190;
const FAKE_RAY_SPEED = 105;
const CADENCE = 55;
const BARRAGE_START = 350;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function backZ(index: number): number {
  return index + 2;
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
  onDodgeHit,
  onDodgeEnd,
}: CoopBattleProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const goldRef = useRef<HTMLDivElement>(null);
  const myRef = useRef<HTMLDivElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const beamElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const myXRef = useRef(BRONZE_MIN);
  const dragRef = useRef<{ startX: number; startPct: number } | null>(null);
  const flashIdRef = useRef(0);
  const rowsRef = useRef({ topStart: 0, floor: 0, height: 0, hitT: 1 });

  const [myX, setMyX] = useState(BRONZE_MIN);
  const [phase, setPhase] = useState<"idle" | "dodge">("idle");
  const [beams, setBeams] = useState<Beam[]>([]);
  const [beamRows, setBeamRows] = useState({
    topStart: 0,
    floor: 0,
    height: 0,
    hitT: 1,
  });
  const [flashes, setFlashes] = useState<Impact[]>([]);

  const mine = players[myIndex];
  const backs = players.filter((_, index) => index !== myIndex);
  const dodging = !!(mine && mine.dodgeCount != null);
  const rayStyle = RAY_STYLES[goldKnight.rayStyle ?? ""] ?? RAY_STYLES.stardust;

  useEffect(() => {
    myXRef.current = myX;
  }, [myX]);

  useEffect(() => {
    beamsRef.current = beams;
  }, [beams]);

  const dodgeCount = mine?.dodgeCount ?? null;

  useEffect(() => {
    if (dodgeCount == null) return;
    const stage = stageRef.current;
    const gold = goldRef.current;
    const me = myRef.current;
    if (!stage || !gold || !me) return;

    const stageRect = stage.getBoundingClientRect();
    const goldRect = gold.getBoundingClientRect();
    const meRect = me.getBoundingClientRect();

    const rows = {
      topStart: goldRect.top - stageRect.top - 6,
      floor: meRect.top + meRect.height / 2 - stageRect.top,
      height: stageRect.height - (goldRect.top - stageRect.top - 6) + 80,
      hitT: 1,
    };
    rows.hitT = (rows.floor - rows.topStart) / rows.height;
    rowsRef.current = rows;
    setBeamRows(rows);

    const barrage: Beam[] = [];
    let id = 0;

    const duration = Math.min(9000, 2200 + dodgeCount * 380);
    const end = BARRAGE_START + duration;
    let launchAt = BARRAGE_START;
    while (launchAt <= end) {
      barrage.push({
        id: id++,
        kind: "fake",
        columnX: randomInt(stageRect.width),
        launchAt,
        speed: FAKE_RAY_SPEED + randomInt(41),
        damage: 0,
        triggered: false,
        aimed: true,
      });
      const step = CADENCE + randomInt(41);
      launchAt += Math.round(step / Math.max(1, dodgeCount / 8));
    }

    const total = barrage.length;
    const slots = new Set<number>();
    while (slots.size < Math.min(dodgeCount, total)) {
      slots.add(randomInt(total));
    }
    for (const slot of slots) {
      const beam = barrage[slot];
      beam.kind = "real";
      beam.columnX = 0;
      beam.speed = RAY_SPEED + randomInt(31);
      beam.damage = 1;
      beam.aimed = false;
    }

    setBeams([...barrage]);
    setPhase("dodge");
  }, [dodgeCount]);

  useEffect(() => {
    if (phase !== "dodge") return;

    const rows = rowsRef.current;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const controlsList: Array<ReturnType<typeof animate>> = [];
    const counted = new Set<number>();
    let remaining = beamsRef.current.length;
    let finished = false;

    function myCenterX(): number {
      const stage = stageRef.current;
      if (!stage) return 0;
      const stageRect = stage.getBoundingClientRect();
      return (myXRef.current / 100) * stageRect.width;
    }

    function addImpact(x: number, y: number) {
      const impactId = flashIdRef.current++;
      setFlashes((current) => [
        ...current,
        { id: impactId, x, y: y + randomInt(21) - 10 },
      ]);
      setTimeout(() => {
        setFlashes((current) => current.filter((hit) => hit.id !== impactId));
      }, 320);
    }

    function finish() {
      if (finished) return;
      finished = true;
      setBeams([]);
      setPhase("idle");
      onDodgeEnd();
    }

    function settle(beamId: number) {
      if (counted.has(beamId)) return;
      counted.add(beamId);
      remaining -= 1;
      if (remaining <= 0) finish();
    }

    for (const beam of beamsRef.current) {
      const el = beamElsRef.current.get(beam.id);
      if (!el) {
        settle(beam.id);
        continue;
      }

      timers.push(
        setTimeout(() => {
          el.style.opacity = "1";
          let controls: ReturnType<typeof animate> | null = null;
          controls = animate(0, 1, {
            duration: beam.speed / 1000,
            ease: "easeIn",
            onUpdate: (t) => {
              if (beam.kind === "real" && !beam.aimed) {
                beam.columnX = myCenterX();
                el.style.left = `${beam.columnX}px`;
              }
              if (!beam.triggered && t >= rows.hitT) {
                beam.triggered = true;
                addImpact(beam.columnX, rows.floor);
                if (
                  beam.kind === "real" &&
                  Math.abs(beam.columnX - myCenterX()) <= HIT_RANGE
                ) {
                  controls?.stop();
                  el.style.transform = `scaleY(${rows.hitT})`;
                  onDodgeHit();
                  setTimeout(() => {
                    el.style.transition = "opacity 300ms";
                    el.style.opacity = "0";
                  }, 120);
                  beamElsRef.current.delete(beam.id);
                  settle(beam.id);
                  return;
                }
              }
              el.style.transform = `scaleY(${t})`;
            },
            onComplete: () => {
              if (beamElsRef.current.has(beam.id)) {
                el.style.opacity = "0";
                beamElsRef.current.delete(beam.id);
              }
              settle(beam.id);
            },
          });
          controlsList.push(controls);
        }, beam.launchAt)
      );
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      controlsList.forEach((controls) => controls.stop());
      beamElsRef.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { startX: event.clientX, startPct: myXRef.current };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const stageWidth = stageRef.current?.getBoundingClientRect().width ?? 1;
    const delta = ((event.clientX - dragRef.current.startX) / stageWidth) * 100;
    setMyX(clamp(dragRef.current.startPct + delta, BRONZE_MIN, BRONZE_MAX));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

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
                  {dodging ? "¡Esquiva los rayos!" : "Recibe el golpe"}
                </p>
              )}
              {lastRound.winner === "tie" && (
                <p className={styles.roundLogTie}>Empate, sin daño</p>
              )}
            </>
          ) : (
            <p className={styles.lobbyStatus}>
              El primer ataque de {players[turn]?.knightName ?? "…"}…
            </p>
          )}
        </div>
      </div>

      <span className={styles.multiGoldCount}>
        Gold {goldIndex + 1} de 12
      </span>
      {status && <p className={styles.multiTurnInfo}>{status}</p>}

      <div className={styles.arenaStage} ref={stageRef}>
        <article
          ref={goldRef}
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
                left: "50%",
                zIndex: backZ(backIndex),
                transform: `translateX(-50%) translateY(${12 + backIndex * 10}px)`,
              }}
            >
              <h2 className={styles.fighterName}>
                {member.knightName}
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
            ref={myRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`${styles.fighter} ${styles.fighterBronze} ${
              styles.multiMine
            } ${!mine.alive ? styles.multiDead : ""} ${
              myIndex === turn ? styles.multiTurnGlow : ""
            }`}
            style={{ left: `${myX}%`, zIndex: 10 }}
          >
            <h2 className={styles.fighterName}>
              {mine.knightName} ✱
            </h2>
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

        {beams.map((beam) => (
          <div
            key={beam.id}
            ref={(el) => {
              if (el) beamElsRef.current.set(beam.id, el);
              else beamElsRef.current.delete(beam.id);
            }}
            className={[
              styles.beam,
              rayStyle.patternClass ? styles[rayStyle.patternClass] : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              left: beam.columnX,
              top: beamRows.topStart,
              height: beamRows.height,
              transform: "scaleY(0)",
              opacity: 0,
              width: rayStyle.width,
              ["--beamColor" as string]: rayStyle.color,
              ["--beamGlow" as string]: rayStyle.glow,
              ["--beamGlowSoft" as string]: rayStyle.glowSoft,
            }}
          />
        ))}

        {flashes.map((impact) => (
          <div
            key={impact.id}
            className={[
              styles.beamImpact,
              rayStyle.impactClass ? styles[rayStyle.impactClass] : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: impact.x, top: impact.y }}
          />
        ))}
      </div>

      {mine?.alive && (
        <div className={styles.playerAttacks}>
          {mine.attacks.map((attack, attackIndex) => (
            <button
              key={attack}
              className={styles.attackButton}
              disabled={myIndex !== turn || dodging}
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