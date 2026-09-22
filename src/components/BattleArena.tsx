"use client";

import Image from "next/image";
import { animate, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DodgeChallenge, randomInt, RoundResult } from "@/lib/battle";
import { Knight } from "@/types/knights";

import styles from "../styles/index.module.scss";

interface BattleArenaProps {
  player: Knight;
  playerImage?: string;
  playerHp: number;
  enemy: Knight;
  enemyHp: number;
  lastRound: RoundResult | null;
  dodge: DodgeChallenge | null;
  onAttack: (attackIndex: number) => void;
  onDodgeHit: (damage: number) => void;
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
const FAKE_RAY_SPEED = 95;
const CADENCE = 50;
const BARRAGE_START = 350;
const BARRAGE_DURATION = 10000;
const BARRAGE_END = BARRAGE_START + BARRAGE_DURATION;

export interface RayStyle {
  color: string;
  glow: string;
  glowSoft: string;
  width: number;
  impactClass?: string;
  patternClass?: string;
  speedFactor?: number;
}

export const RAY_STYLES: Record<string, RayStyle> = {
  stardust: {
    color: "#ffd98a",
    glow: "rgba(255, 215, 120, 0.9)",
    glowSoft: "rgba(255, 200, 90, 0.35)",
    width: 6,
    impactClass: "impactStar",
    speedFactor: 1,
  },
  horn: {
    color: "#ffe08a",
    glow: "rgba(255, 190, 80, 0.95)",
    glowSoft: "rgba(255, 160, 60, 0.4)",
    width: 12,
    patternClass: "beamHorn",
    speedFactor: 0.9,
  },
  shadow: {
    color: "#c86bff",
    glow: "rgba(150, 80, 255, 0.85)",
    glowSoft: "rgba(120, 60, 255, 0.3)",
    width: 8,
    patternClass: "beamShadow",
    speedFactor: 1.05,
  },
  ghost: {
    color: "#a8ffcf",
    glow: "rgba(140, 255, 190, 0.7)",
    glowSoft: "rgba(100, 255, 160, 0.3)",
    width: 8,
    patternClass: "beamSpectral",
    speedFactor: 1.1,
  },
  lightning: {
    color: "#eaf4ff",
    glow: "rgba(160, 210, 255, 1)",
    glowSoft: "rgba(140, 180, 255, 0.6)",
    width: 7,
    patternClass: "beamPlasma",
    speedFactor: 0.85,
  },
  thunder: {
    color: "#ffffff",
    glow: "rgba(255, 255, 255, 0.95)",
    glowSoft: "rgba(200, 220, 255, 0.5)",
    width: 14,
    patternClass: "beamAtomic",
    speedFactor: 1,
  },
  dragon: {
    color: "#9dffae",
    glow: "rgba(110, 235, 140, 0.9)",
    glowSoft: "rgba(80, 220, 120, 0.35)",
    width: 9,
    patternClass: "beamFlame",
    speedFactor: 0.95,
  },
  needle: {
    color: "#ff5f74",
    glow: "rgba(255, 80, 110, 0.9)",
    glowSoft: "rgba(220, 60, 90, 0.4)",
    width: 3,
    patternClass: "beamNeedle",
    speedFactor: 0.9,
  },
  arrow: {
    color: "#ffe08a",
    glow: "rgba(255, 220, 140, 0.95)",
    glowSoft: "rgba(255, 200, 100, 0.4)",
    width: 5,
    patternClass: "beamArrow",
    speedFactor: 0.8,
  },
  blade: {
    color: "#ffe9b0",
    glow: "rgba(255, 230, 160, 0.95)",
    glowSoft: "rgba(255, 205, 110, 0.4)",
    width: 16,
    patternClass: "beamBlade",
    speedFactor: 1,
  },
  ice: {
    color: "#bceaff",
    glow: "rgba(150, 220, 255, 0.8)",
    glowSoft: "rgba(120, 200, 255, 0.3)",
    width: 9,
    patternClass: "beamSheet",
    speedFactor: 1.05,
  },
  rose: {
    color: "#ff9ad5",
    glow: "rgba(255, 150, 210, 0.8)",
    glowSoft: "rgba(255, 120, 190, 0.3)",
    width: 8,
    patternClass: "beamPetal",
    speedFactor: 1.5,
  },
};

const DEFAULT_RAY_STYLE: RayStyle = {
  color: "#cfe9ff",
  glow: "rgba(190, 230, 255, 0.55)",
  glowSoft: "rgba(190, 230, 255, 0.3)",
  width: 7,
};

function hpPercent(hp: number, base: number): number {
  const max = Math.max(hp, base);
  return Math.max(0, Math.min(100, (hp / max) * 100));
}

function ringColor(pct: number): string {
  if (pct > 50) return "#ffd700";
  if (pct > 25) return "#ffa726";
  return "#e34c4c";
}

export function HpRing({ hp, base }: { hp: number; base: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const fill = useSpring(hpPercent(hp, base), {
    stiffness: 90,
    damping: 20,
  });

  useEffect(() => {
    fill.set(hpPercent(hp, base));
  }, [hp, base, fill]);

  useEffect(() => {
    const apply = (value: number) => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--fill", `${value}%`);
      el.style.setProperty("--ringColor", ringColor(value));
    };
    apply(fill.get());
    return fill.on("change", apply);
  }, [fill]);

  return <div ref={ref} className={styles.hpRing} />;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function BattleArena({
  player,
  playerImage,
  playerHp,
  enemy,
  enemyHp,
  lastRound,
  dodge,
  onAttack,
  onDodgeHit,
  onDodgeEnd,
}: BattleArenaProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const goldRef = useRef<HTMLDivElement>(null);
  const bronzeRef = useRef<HTMLDivElement>(null);
  const bronzeImgRef = useRef<HTMLImageElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const beamElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const bronzeXRef = useRef(8);
  const dragRef = useRef<{ startX: number; startPct: number } | null>(null);
  const processedRef = useRef<string | null>(null);
  const flashIdRef = useRef(0);
  const beamRowsRef = useRef({ topStart: 0, floor: 0, height: 0, hitT: 1 });

  const [phase, setPhase] = useState<"idle" | "dodge">("idle");
  const [floats, setFloats] = useState<{ player: number; enemy: number } | null>(
    null
  );
  const [bronzeX, setBronzeX] = useState(8);
  const [beams, setBeams] = useState<Beam[]>([]);
  const [beamRows, setBeamRows] = useState({
    topStart: 0,
    floor: 0,
    height: 0,
    hitT: 1,
  });
  const [flashes, setFlashes] = useState<Impact[]>([]);
  const [bronzeHit, setBronzeHit] = useState(false);
  const [teleportOn, setTeleportOn] = useState(false);

  useEffect(() => {
    if (phase !== "dodge") return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        setTeleportOn(true);
        timer = setTimeout(() => {
          if (!alive) return;
          setTeleportOn(false);
          cycle();
        }, 150 + randomInt(160));
      }, 500 + randomInt(1200));
    };
    cycle();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [phase]);

  useEffect(() => {
    bronzeXRef.current = bronzeX;
  }, [bronzeX]);

  useEffect(() => {
    beamsRef.current = beams;
  }, [beams]);

  const goldHit =
    !!lastRound && lastRound.winner === "player";

  const roundKey = lastRound
    ? `${lastRound.playerRoll}|${lastRound.enemyRoll}|${lastRound.winner}|${lastRound.damage}|${lastRound.heal}`
    : "inicial";

  const spawnBeams = useCallback(
    (challenge: DodgeChallenge) => {
    const stage = stageRef.current;
    const gold = goldRef.current;
    const bronze = bronzeRef.current;
    const bronzeImg = bronzeImgRef.current;
    if (!stage || !gold || !bronze || !bronzeImg) return;

    const style = RAY_STYLES[enemy.rayStyle ?? ""] ?? DEFAULT_RAY_STYLE;
    const speedFactor = style.speedFactor ?? 1;

    const stageRect = stage.getBoundingClientRect();
    const goldRect = gold.getBoundingClientRect();
    const bronzeImgRect = bronzeImg.getBoundingClientRect();

    const rows = {
      topStart: goldRect.top - stageRect.top - 6,
      floor: bronzeImgRect.top + bronzeImgRect.height / 2 - stageRect.top,
      height: stageRect.height - (goldRect.top - stageRect.top - 6) + 80,
      hitT: 1,
    };
    rows.hitT = (rows.floor - rows.topStart) / rows.height;
    beamRowsRef.current = rows;
    setBeamRows(rows);

    const beams: Beam[] = [];
    let id = 0;

    let launchAt = BARRAGE_START;
    while (launchAt <= BARRAGE_END) {
      beams.push({
        id: id++,
        kind: "fake",
        columnX: randomInt(stageRect.width),
        launchAt,
        speed: Math.round(
          (FAKE_RAY_SPEED + randomInt(41)) * speedFactor
        ),
        damage: 0,
        triggered: false,
        aimed: true,
      });
      launchAt += CADENCE + randomInt(41);
    }

    const total = beams.length;
    const realSlots = [0];
    const remaining = challenge.count - 1;
    for (let k = 0; k < remaining; k++) {
      realSlots.push(
        Math.floor(((total - 1) * (k + 1)) / (remaining + 1)) + 1
      );
    }
    realSlots.sort((a, b) => a - b);

    for (const slot of realSlots) {
      const beam = beams[slot];
      if (!beam) continue;
      beam.kind = "real";
      beam.columnX = 0;
      beam.speed = RAY_SPEED + randomInt(31);
      beam.damage = 1;
      beam.aimed = false;
    }

    setBeams(beams);
    setPhase("dodge");
  },
    [enemy]
  );

  useEffect(() => {
    if (!lastRound) return;
    const key = `${lastRound.playerRoll}|${lastRound.enemyRoll}|${lastRound.winner}|${lastRound.damage}`;
    if (processedRef.current === key) return;
    processedRef.current = key;

    setFloats({ player: lastRound.playerRoll, enemy: lastRound.enemyRoll });
    setBronzeHit(false);

    const isEnemyWin = lastRound.winner === "enemy" && !!dodge;
    let spawnTimer: ReturnType<typeof setTimeout> | null = null;
    const flashTimer = setTimeout(() => setFloats(null), 900);
    if (isEnemyWin) {
      spawnTimer = setTimeout(() => {
        if (dodge) spawnBeams(dodge);
      }, 900);
    }
    return () => {
      clearTimeout(flashTimer);
      if (spawnTimer) clearTimeout(spawnTimer);
    };
  }, [lastRound, dodge, spawnBeams]);

  useEffect(() => {
    if (phase !== "dodge") return;

    const rows = beamRowsRef.current;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const controlsList: Array<ReturnType<typeof animate>> = [];
    const counted = new Set<number>();
    let remaining = beamsRef.current.length;
    let finished = false;

    function bronzeCenterX(): number {
      const stage = stageRef.current;
      const bronze = bronzeRef.current;
      if (!stage || !bronze) return 0;
      const stageRect = stage.getBoundingClientRect();
      const bronzeRect = bronze.getBoundingClientRect();
      return bronzeRect.left + bronzeRect.width / 2 - stageRect.left;
    }

    function addFakeImpact(x: number, y: number) {
      const id = flashIdRef.current++;
      setFlashes((current) => [
        ...current,
        { id, x, y: y + randomInt(21) - 10 },
      ]);
      setTimeout(() => {
        setFlashes((current) => current.filter((impact) => impact.id !== id));
      }, 320);
    }

    function finish() {
      if (finished) return;
      finished = true;
      setBeams([]);
      setPhase("idle");
      onDodgeEnd();
    }

    function settle(id: number) {
      if (counted.has(id)) return;
      counted.add(id);
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
          if (beam.kind === "real" && !beam.aimed) {
            beam.aimed = true;
            beam.columnX = bronzeCenterX();
            el.style.left = `${beam.columnX}px`;
          }
          el.style.opacity = "1";

          let controls: ReturnType<typeof animate> | null = null;
          controls = animate(0, 1, {
            duration: beam.speed / 1000,
            ease: "easeIn",
            onUpdate: (t) => {
              if (beam.kind === "real" && !beam.triggered) {
                const target = bronzeCenterX();
                beam.columnX += (target - beam.columnX) * 0.09;
                el.style.left = `${beam.columnX}px`;
              }
              if (!beam.triggered && t >= rows.hitT) {
                beam.triggered = true;
                addFakeImpact(beam.columnX, rows.floor);
                if (
                  beam.kind === "real" &&
                  Math.abs(beam.columnX - bronzeCenterX()) <= HIT_RANGE
                ) {
                  controls?.stop();
                  el.style.transform = `scaleY(${rows.hitT})`;
                  setBronzeHit(true);
                  setTimeout(() => setBronzeHit(false), 700);
                  setTimeout(() => onDodgeHit(beam.damage), 200);
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
    dragRef.current = { startX: event.clientX, startPct: bronzeXRef.current };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const stageWidth = stageRef.current?.getBoundingClientRect().width ?? 1;
    const delta = ((event.clientX - dragRef.current.startX) / stageWidth) * 100;
    setBronzeX(
      clamp(dragRef.current.startPct + delta, BRONZE_MIN, BRONZE_MAX)
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  const busy = !!dodge || phase === "dodge" || !!floats;
  const rayStyle = RAY_STYLES[enemy.rayStyle ?? ""] ?? DEFAULT_RAY_STYLE;

  return (
    <section className={styles.arena}>
      <div className={styles.arenaStage} ref={stageRef}>
        <article
          ref={goldRef}
          key={goldHit ? `e-${roundKey}` : undefined}
          className={`${styles.fighter} ${styles.fighterGold} ${
            goldHit ? styles.hit : ""
          } ${phase === "dodge" && teleportOn ? styles.goldTeleport : ""}`}
        >
          <div
            className={`${styles.fighterFigure} ${
              phase === "dodge" ? styles.goldSwing : ""
            }`}
          >
            <Image
              className={styles.fighterImage}
              src={enemy.image}
              alt={enemy.name}
              width={240}
              height={240}
              priority
            />
            <HpRing hp={enemyHp} base={enemy.vida} />
          </div>
          <h2 className={styles.fighterName}>{enemy.name}</h2>
        </article>

        <article
          ref={bronzeRef}
          key={bronzeHit ? `p-${roundKey}` : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`${styles.fighter} ${styles.fighterBronze} ${
            bronzeHit ? styles.hit : ""
          }`}
          style={{ left: `${bronzeX}%` }}
        >
          <h2 className={styles.fighterName}>{player.name}</h2>
          <div className={styles.fighterFigure}>
            <Image
              ref={bronzeImgRef}
              className={styles.fighterImage}
              src={playerImage ?? player.image}
              alt={player.name}
              width={240}
              height={240}
              priority
            />
            <HpRing hp={playerHp} base={player.vida} />
          </div>
        </article>

        {floats && (
          <>
            <div className={styles.rollFloat} key={`p-${floats.player}`}>
              {floats.player}
            </div>
            <div
              className={`${styles.rollFloat} ${styles.rollFloatEnemy}`}
              key={`e-${floats.enemy}`}
            >
              {floats.enemy}
            </div>
          </>
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

      <div className={styles.playerAttacks}>
        {player.attacks.map((attack, index) => (
          <button
            key={attack}
            className={styles.attackButton}
            disabled={busy}
            onClick={() => onAttack(index)}
          >
            {attack}
          </button>
        ))}
      </div>
    </section>
  );
}