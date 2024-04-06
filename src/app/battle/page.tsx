"use client";

import { useEffect, useState, useRef } from "react";
import { useCharacterContext } from "@/context/CharacterContext";
import useCharacters from "../components/data/bronze.json";
import character from "../components/data/characters.json";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../styles/index.module.scss";

// Definir la interfaz para los personajes
interface Character {
  id: number;
  name: string;
  image: string;
  attacks: string[];
  vida: number;
  audioAttacks: string[];
}

const BattlePage = () => {
  const { selectedCharacterId, opponentCharacterId } = useCharacterContext();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

// useEffect para observar el cambio en la vida del jugador y redirigir al home
useEffect(() => {
  if (selectedCharacter && selectedCharacter.vida <= 0) {
    router.push('/');
  }   // Verificar si la vida del oponente llegó a cero
   else if (opponentCharacter && opponentCharacter.vida <= 0) {
    // Redireccionar al jugador a la página de mapas
    router.push('/mapas');
  }
}, [opponentCharacter, router, selectedCharacter]);

// Función para simular la batalla
const handleAttack = () => {
  // Verificar si el jugador tiene vida para atacar
  if (
    selectedCharacter &&
    selectedCharacter.vida > 0 &&
    opponentCharacter &&
    opponentCharacter.vida > 0
  ) {
    // Generar números aleatorios para el jugador y el oponente
    const playerRoll = Math.floor(Math.random() * 6) + 1;
    const opponentRoll = Math.floor(Math.random() * 6) + 1;

    console.log(playerRoll);
    console.log(opponentRoll);

    // Comparar los resultados y aplicar las reglas
    if (playerRoll > opponentRoll) {
      // El jugador gana, restar vida al oponente
      const difference = playerRoll - opponentRoll;
      setOpponentCharacter(prevCharacter => {
        if (prevCharacter) {
          console.log("El jugador ganó");
          return {
            ...prevCharacter,
            vida: Math.max(0, prevCharacter.vida - difference),
          };
        }
        return null;
      });
    } else if (opponentRoll > playerRoll) {
      // El oponente gana, restar vida al jugador
      const difference = opponentRoll - playerRoll;
      setSelectedCharacter(prevCharacter => {
        if (prevCharacter) {
          console.log("El oponente gano");
          return {
            ...prevCharacter,
            vida: Math.max(0, prevCharacter.vida - difference),
          };
        }
        return null;
      });
      
    } else {
      console.log("Empate. Ningún personaje pierde vida.");
    }
    // Si hay un empate, no pasa nada
    
  }
  
};

  // useEffect para cargar el personaje seleccionado y al oponente
  useEffect(() => {
    // Obtén el personaje seleccionado por el usuario
    if (selectedCharacterId) {
      const character: Character | undefined = useCharacters.find(
        (char) => char.id === selectedCharacterId
      );
      if (character) {
        setSelectedCharacter(character);
      } else {
        setSelectedCharacter(null);
      }
    }

    // Selecciona al oponente automáticamente desde la primera posición del JSON
    if (opponentCharacterId) {
      const opponent: Character | undefined = useCharacters.find(
        (char) => char.id === opponentCharacterId
      );
      if (opponent) {
        setOpponentCharacter(opponent);
      } else {
        setOpponentCharacter(null);
      }
    } else {
      setOpponentCharacter(character[0]); // Esto seleccionará el primer personaje del JSON como oponente
    }
  }, [selectedCharacterId, opponentCharacterId]);

  return (
    <>
      <section className={styles.battelContainer}>
        {/* Mostrar el personaje seleccionado por el usuario */}
        {selectedCharacter ? (
          <article>
            <h2>{selectedCharacter.name}</h2>
            <Image
              src={selectedCharacter.image}
              alt={selectedCharacter.name}
              width={200}
              height={200}
            />

            {/* Renderizar botones de ataques solo para el personaje seleccionado */}
            {selectedCharacter &&
              selectedCharacter.vida > 0 &&
              selectedCharacter.attacks.map((attack, index) => (
                <button
                  key={index}
                  onClick={handleAttack} // Llamar a la función handleAttack al hacer clic en el botón de ataque
                >
                  {attack}
                </button>
              ))}

            <p>Vida: {selectedCharacter.vida}</p>
          </article>
        ) : (
          <p>No se ha seleccionado ningún personaje.</p>
        )}

        {/* Mostrar el personaje oponente */}
        {opponentCharacter && (
          <article>
            <h2>{opponentCharacter.name}</h2>
            <Image
              src={opponentCharacter.image}
              alt={opponentCharacter.name}
              width={200}
              height={200}
            />
            <p>Vida: {opponentCharacter.vida}</p>
          </article>
        )}
      </section>

      {/* Elemento de audio para reproducir el sonido de ataque */}
      <audio ref={audioRef} />

      <nav className={styles.home}>
        <Link href={"/"}>Home</Link>
      </nav>
    </>
  );
};

export default BattlePage;
