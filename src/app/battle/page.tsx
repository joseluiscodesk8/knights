'use client';

import { useEffect, useState, useRef } from 'react';
import { useCharacterContext } from '@/context/CharacterContext';
import useCharacters from '../components/data/bronze.json';
import character from '../components/data/characters.json';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

   // useEffect para cargar el personaje seleccionado y al oponente
   useEffect(() => {
    // Obtén el personaje seleccionado por el usuario
    if (selectedCharacterId) {
      const character: Character | undefined = useCharacters.find((char) => char.id === selectedCharacterId);
      if (character) {
        setSelectedCharacter(character);
      } else {
        setSelectedCharacter(null);
      }
    }

    // Selecciona al oponente automáticamente desde la primera posición del JSON
    if (opponentCharacterId) {
      const opponent: Character | undefined = useCharacters.find((char) => char.id === opponentCharacterId);
      if (opponent) {
        setOpponentCharacter(opponent);
      } else {
        setOpponentCharacter(null);
      }
    } else {
      setOpponentCharacter(character[0]); // Esto seleccionará el primer personaje del JSON como oponente
    }

  }, [selectedCharacterId, opponentCharacterId]);

  const handleAttack = (attack: string, audioAttack: string) => {
  // Verificar si ambos personajes están vivos
  if (selectedCharacter && selectedCharacter.vida > 0 && opponentCharacter && opponentCharacter.vida > 0) {
    // Generar un número aleatorio entre 1 y 6 para el jugador
    const selectedAttack = Math.floor(Math.random() * 6) + 1;
    // Generar un número aleatorio entre 1 y 6 para el oponente
    const opponentAttack = Math.floor(Math.random() * 6) + 1;

    console.log(`Ataque del jugador (${selectedCharacter.name}): ${attack} - ${selectedAttack}`);
    console.log(`Ataque del oponente (${opponentCharacter.name}): ${opponentAttack}`);

    // Reproducir el sonido de ataque específico
    if (audioRef.current) {
      audioRef.current.src = audioAttack;
      audioRef.current.addEventListener('ended', () => {
        // Determinar el ganador del combate
        let winner: 'player' | 'opponent' | 'tie' = 'tie';
        if (selectedAttack > opponentAttack) {
          winner = 'player';
        } else if (selectedAttack < opponentAttack) {
          winner = 'opponent';
        }

        // Actualizar la vida de los personajes
        if (winner === 'player') {
          console.log(`${selectedCharacter.name} gana el combate.`);
          setOpponentCharacter(prevState => ({
            ...prevState!,
            vida: Math.max(0, prevState!.vida - 1)
          }));
        } else if (winner === 'opponent') {
          console.log(`${opponentCharacter.name} gana el combate.`);
          setSelectedCharacter(prevState => ({
            ...prevState!,
            vida: Math.max(0, prevState!.vida - 1)
          }));
        } else {
          console.log(`El combate termina en empate.`);
        }

        // Verificar si algún personaje llegó a cero vida
        if (selectedCharacter && selectedCharacter.vida <= 0) {
          console.log(`${selectedCharacter.name} ha perdido, ya no puede atacar.`);
        }
        if (opponentCharacter && opponentCharacter.vida <= 0) {
          console.log(`${opponentCharacter.name} ha perdido, ya no puede atacar.`);
        }
      });
      audioRef.current.play();
    }
  }
};


  return (
    <>
      <section className={styles.battelContainer}>
        {/* Mostrar el personaje seleccionado por el usuario */}
        {selectedCharacter ? (
          <article>
            <h2>{selectedCharacter.name}</h2>
            <Image src={selectedCharacter.image} alt={selectedCharacter.name} width={200} height={200} priority={true}/>

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

        {/* Mostrar el personaje oponente */}
        {opponentCharacter && (
          <article>
            <h2>{opponentCharacter.name}</h2>
            <Image src={opponentCharacter.image} alt={opponentCharacter.name} width={200} height={200} priority={true} />
            <p>Vida: {opponentCharacter.vida}</p>
          </article>
        )}
      </section>

      {/* Elemento de audio para reproducir el sonido de ataque */}
      <audio ref={audioRef} />

      <nav className={styles.home}>
        <Link href={'/'}>Home</Link>
      </nav>
    </>
  );
};

export default BattlePage;
