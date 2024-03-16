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
    console.log(`¡${selectedCharacter?.name} usa ${attack}!`);
    // Aquí puedes agregar lógica para el ataque
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
              <div key={index}>
                <button  onClick={() => handleAttack(attack)}>
                {attack}
              </button>
              </div>
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

              {/* Mantener los botones de ataques y la vida para el oponente */}
              {opponentCharacter.attacks.map((attack, index) => (
              <button key={index} onClick={() => handleAttack(attack)} style={{ visibility: 'hidden' }}>
                {attack}
              </button>
            ))}
            <p>Vida: {opponentCharacter.vida}</p>
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


