"use client";

import { useState } from "react";

import type { RoomPlayer } from "@/lib/multiplayer/types";

import styles from "../../styles/index.module.scss";

interface LobbyViewProps {
  mode: "choose" | "host" | "join";
  code: string;
  players: RoomPlayer[];
  isHost: boolean;
  connecting: boolean;
  error: string | null;
  onChooseHost: () => void;
  onChooseJoin: () => void;
  onJoin: (code: string) => void;
  onStart: () => void;
  onBack: () => void;
}

export default function LobbyView({
  mode,
  code,
  players,
  isHost,
  connecting,
  error,
  onChooseHost,
  onChooseJoin,
  onJoin,
  onStart,
  onBack,
}: LobbyViewProps) {
  return (
    <section className={styles.lobby}>
      <h1 className={styles.selectionTitle}>Multijugador</h1>

      {mode === "choose" && (
        <div className={styles.lobbyActions}>
          <button className={styles.selectionButton} onClick={onChooseHost}>
            Crear partida
          </button>
          <button
            className={`${styles.selectionButton} ${styles.lobbySecondaryButton}`}
            onClick={onChooseJoin}
          >
            Unirse con código
          </button>
          <p className={styles.lobbyTips}>
            Juego en equipo de hasta 5 bronces contra los 12 Gold Knights, del
            tipo P2P (WebRTC). El anfitrión comparte un código de 4 letras.
          </p>
        </div>
      )}

      {mode === "join" && !code && !connecting && (
        <JoinForm onJoin={onJoin} onBack={onBack} error={error} />
      )}

      {code && (
        <div className={styles.lobbyPanel}>
          <div className={styles.lobbyCodeBox}>
            <span className={styles.lobbyCodeLabel}>Código de sala</span>
            <span className={styles.lobbyCode}>{code}</span>
          </div>

          {connecting && <p className={styles.lobbyStatus}>Conectando…</p>}

          {!connecting && error && (
            <p className={styles.lobbyError}>{error}</p>
          )}

          {!connecting && !error && (
            <>
              <ul className={styles.lobbyList}>
                {players.map((player) => (
                  <li key={player.id} className={styles.lobbyPlayer}>
                    <span className={styles.lobbyPlayerDot} />
                    <strong>{player.knightName}</strong>
                  </li>
                ))}
              </ul>

              {isHost ? (
                <>
                  <button
                    className={styles.selectionButton}
                    disabled={players.length < 2}
                    onClick={onStart}
                  >
                    {players.length < 2
                      ? `Esperando jugadores (${players.length}/5)`
                      : `Empezar batalla (${players.length} jugadores)`}
                  </button>
                  <p className={styles.lobbyTips}>
                    Comparte el código con tus compañeros para que se unan.
                  </p>
                </>
              ) : (
                <p className={styles.lobbyStatus}>
                  Esperando a que el anfitrión inicie la partida…
                </p>
              )}
            </>
          )}

          <button className={styles.lobbyBackButton} onClick={onBack}>
            ← Volver
          </button>
        </div>
      )}
    </section>
  );
}

function JoinForm({
  onJoin,
  onBack,
  error,
}: {
  onJoin: (code: string) => void;
  onBack: () => void;
  error: string | null;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const clean = value.trim().toUpperCase();
    if (clean.length >= 3) onJoin(clean);
  }

  return (
    <div className={styles.lobbyPanel}>
      <label className={styles.lobbyField}>
        <span className={styles.lobbyFieldLabel}>
          Introduce el código del anfitrión
        </span>
        <input
          className={styles.lobbyInput}
          value={value}
          maxLength={6}
          autoCapitalize="characters"
          onChange={(event) =>
            setValue(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          placeholder="AB3XD"
        />
      </label>
      {error && <p className={styles.lobbyError}>{error}</p>}
      <button
        className={styles.selectionButton}
        disabled={value.trim().length < 3}
        onClick={submit}
      >
        Unirse
      </button>
      <button className={styles.lobbyBackButton} onClick={onBack}>
        ← Volver
      </button>
    </div>
  );
}