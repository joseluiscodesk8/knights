'use client';

// BattlePage.tsx

import { useEffect, useState, useRef } from 'react';
import { useCharacterContext } from '@/context/CharacterContext';
import userCharacters from '../components/data/bronze.json'; // Importa los personajes del usuario
import characters from '../components/data/characters.json'; // Importa todos los personajes del oponente
import Image from 'next/image';
import Link from 'next/link';
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
  const { selectedCharacterId } = useCharacterContext();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Obtener el personaje seleccionado por el usuario
    if (selectedCharacterId) {
      const character: Character | undefined = userCharacters.find((char) => char.id === selectedCharacterId);
      if (character) {
        setSelectedCharacter(character);
      } else {
        setSelectedCharacter(null);
      }
    }

    // Obtener el próximo personaje del oponente en orden según los IDs
    const nextOpponentCharacterId = selectedCharacterId ? selectedCharacterId % characters.length + 1 : 1;
    const nextOpponentCharacter: Character | undefined = characters.find((char) => char.id === nextOpponentCharacterId);
    if (nextOpponentCharacter) {
      setOpponentCharacter(nextOpponentCharacter);
    } else {
      setOpponentCharacter(characters[0]); // Volver al primer personaje si no se encuentra el próximo
    }
  }, [selectedCharacterId]);

  // Función para manejar el ataque del personaje seleccionado
  const handleAttack = (attack: string, audioAttack: string) => {
    // Implementa la lógica de ataque aquí
  };

  return (
    <>
      <section className={styles.battleContainer}>
        {/* Mostrar el personaje seleccionado por el usuario */}
        {selectedCharacter ? (
          <article>
            <h2>{selectedCharacter.name}</h2>
            <Image src={selectedCharacter.image} alt={selectedCharacter.name} width={200} height={200} />

            {/* Renderizar botones de ataques solo para el personaje seleccionado */}
            {selectedCharacter.attacks.map((attack, index) => (
              <button
                key={index}
                onClick={() => handleAttack(attack, selectedCharacter.audioAttacks[index])}
              >
                {attack}
              </button>
            ))}

            <p>Vida: {selectedCharacter.vida}</p>
          </article>
        ) : (
          <p>No se ha seleccionado ningún personaje.</p>
        )}

        {/* Mostrar el próximo personaje del oponente */}
        {opponentCharacter && (
          <article>
            <h2>{opponentCharacter.name}</h2>
            <Image src={opponentCharacter.image} alt={opponentCharacter.name} width={200} height={200} />
            <p>Vida: {opponentCharacter.vida}</p>
          </article>
        )}
      </section>

      {/* Elemento de audio para reproducir el sonido de ataque */}
      <audio ref={audioRef} />

      <nav className={styles.home}>
        <Link href={'/'}>Inicio</Link>
      </nav>
    </>
  );
};

export default BattlePage;
