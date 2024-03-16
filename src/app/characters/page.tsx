'use client';

import { useEffect, useState } from 'react';
import { useCharacterContext } from '@/context/CharacterContext';
import characters from '../components/data/characters.json';
import Image from 'next/image';
import Link from 'next/link';
import styles from "../styles/index.module.scss";

// Definir la interfaz para los personajes
interface Character {
  id: number;
  name: string;
  image: string;
}

const Character = () => {
  const { selectedCharacterId } = useCharacterContext();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null);

  useEffect(() => {
    // Obtener el personaje seleccionado por el usuario
    if (selectedCharacterId) {
      const character = characters.find((char) => char.id === selectedCharacterId);
      if (character) {
        setSelectedCharacter(character);
      } else {
        setSelectedCharacter(null); // No se encontró ningún personaje, establece null
      }
    }

    // Seleccionar un personaje oponente aleatorio
    const randomIndex = Math.floor(Math.random() * characters.length);
    setOpponentCharacter(characters[randomIndex]);
  }, [selectedCharacterId]);

  return (
    <>
      <section className={styles.battelContainer}>
        {/* Mostrar el personaje seleccionado por el usuario */}
        {selectedCharacter ? (
          <article>
            <h2>{selectedCharacter.name}</h2>
            <Image src={selectedCharacter.image} alt={selectedCharacter.name} width={200} height={200} />
          </article>
        ) : (
          <p>No se ha seleccionado ningún personaje.</p>
        )}

        {/* Mostrar el personaje oponente */}
        {opponentCharacter && (
          <article>
            <h2>{opponentCharacter.name}</h2>
            <Image src={opponentCharacter.image} alt={opponentCharacter.name} width={200} height={200} />
          </article>
        )}
      </section>

      <nav className={styles.home}>
        <Link href={'/'}>Home</Link>
      </nav>
    </>
  );
};

export default Character;


