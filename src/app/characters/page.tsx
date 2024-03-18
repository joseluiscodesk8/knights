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
  attacks: string[]; // Agregar ataques al tipo Character
  vida: number; // Agregar vida al tipo Character
}

const Character = () => {
  const { selectedCharacterId } = useCharacterContext();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null);
  const [showDrawAlert, setShowDrawAlert] = useState(false); // Estado para controlar la visualización del alerta de empate

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

  // Función para manejar el ataque del personaje seleccionado
  const handleAttack = (attack: string) => {
    // Verificar si la vida del personaje seleccionado es mayor que cero
    if (selectedCharacter && selectedCharacter.vida > 0) {
      // Generar un número aleatorio entre 1 y 6 para el personaje seleccionado
      const selectedAttack = Math.floor(Math.random() * 6) + 1;
      // Generar un número aleatorio entre 1 y 6 para el oponente
      const opponentAttack = Math.floor(Math.random() * 6) + 1;

      console.log(`Ataque del jugador (${selectedCharacter.name}): ${attack} - ${selectedAttack}`);
      console.log(`Ataque del oponente (${opponentCharacter?.name}): ${opponentAttack}`);

      // Determinar el ganador del combate
      if (selectedAttack > opponentAttack) {
        console.log(`${selectedCharacter.name} gana el combate.`);
        // Restar vida al oponente
        setOpponentCharacter(prevState => {
          if (prevState && prevState.vida > 0) {
            return {
              ...prevState,
              vida: prevState.vida - 1
            };
          }
          return prevState;
        });
      } else if (selectedAttack < opponentAttack) {
        console.log(`${opponentCharacter?.name} gana el combate.`);
        // Restar vida al personaje seleccionado
        setSelectedCharacter(prevState => {
          if (prevState && prevState.vida > 0) {
            return {
              ...prevState,
              vida: prevState.vida - 1
            };
          }
          return prevState;
        });
      } else {
        console.log(`El combate termina en empate.`);
        // Mostrar el alerta de empate durante un segundo
        setShowDrawAlert(true);
        setTimeout(() => {
          setShowDrawAlert(false);
        }, 1000);
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
            <Image src={selectedCharacter.image} alt={selectedCharacter.name} width={200} height={200} />

            {/* Renderizar botones de ataques solo para el personaje seleccionado */}
            {selectedCharacter.attacks.map((attack, index) => (
              <button key={index} onClick={() => handleAttack(attack)}>
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
            <Image src={opponentCharacter.image} alt={opponentCharacter.name} width={200} height={200} />
            <p>Vida: {opponentCharacter.vida}</p>
          </article>
        )}
      </section>

      {/* Mostrar el alerta de empate */}
      {showDrawAlert && (
        <div className={styles.drawAlert}>
          <p>¡Empate!</p>
        </div>
      )}

      <nav className={styles.home}>
        <Link href={'/'}>Home</Link>
      </nav>
    </>
  );
};

export default Character;




