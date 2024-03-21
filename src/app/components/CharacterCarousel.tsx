/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { wrap } from 'popmotion';
import charactersData from './data/bronze.json';
import styles from '../styles/index.module.scss';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { useCharacterContext } from '@/context/CharacterContext'; // Importa el hook para acceder al contexto

// Define la interfaz para los personajes
interface Character {
  id: number;
  name: string;
  image: string;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.7,
    rotate: direction > 0 ? -50 : 50,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.7,
    rotate: direction < 0 ? -50 : 50,
  }),
};

const CharacterCarousel = () => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
  const [isCharacterSelected, setIsCharacterSelected] = useState(false); // Variable de estado adicional
  const { selectedCharacterId, setSelectedCharacterId } = useCharacterContext(); // Accede al contexto
  const [opponentCharacterId, setOpponentCharacterId] = useState<number | null>(null); // ID del personaje oponente seleccionado aleatoriamente

  const characters: Character[] = charactersData; // Convertir el JSON de personajes en un array de tipo Character

  const imageIndex = wrap(0, characters.length, page);

  // Función para seleccionar un personaje aleatorio como oponente
  const selectRandomOpponent = () => {
    const randomIndex = Math.floor(Math.random() * characters.length);
    setOpponentCharacterId(characters[randomIndex].id);
  };

  useEffect(() => {
    selectRandomOpponent(); // Seleccionar un oponente aleatorio cuando el componente se monta por primera vez
  }, [selectRandomOpponent]);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleCharacterSelect = (id: number) => {
    if (selectedCharacters.includes(id)) {
      setSelectedCharacters(
        selectedCharacters.filter((characterId) => characterId !== id)
      );
    } else {
      setSelectedCharacters([...selectedCharacters, id]);
    }
    setSelectedCharacterId(id); // Establece el personaje seleccionado en el contexto
    setIsCharacterSelected(!selectedCharacters.includes(id)); // Actualiza la variable de estado
  };

  return (
    <>
      <section className={styles.characterCarousel}>
        <AnimatePresence initial={false} mode="wait">
          <motion.figure
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className={styles.carouselItem}
            drag
            dragConstraints={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
            dragElastic={1}
          >
            <Image
              src={characters[imageIndex].image}
              alt={characters[imageIndex].name}
              width={500}
              height={500}
              priority={true}
            />
            <figcaption>{characters[imageIndex].name}</figcaption>
          </motion.figure>
        </AnimatePresence>
        <input
          type="checkbox"
          checked={selectedCharacters.includes(characters[imageIndex].id)}
          onChange={() => handleCharacterSelect(characters[imageIndex].id)}
        />
      </section>

      <nav className={styles.carouselControls}>
        <motion.button
          className={`${styles.carouselButton} ${styles.prevButton}`}
          whileTap={{ scale: 0.9 }} // Efecto de escala al hacer clic
          onClick={() => paginate(-1)}
        >
          <IoIosArrowBack className={styles.goldButton} />
        </motion.button>
        <motion.button
          className={`${styles.carouselButton} ${styles.nextButton}`}
          whileTap={{ scale: 0.9 }} // Efecto de escala al hacer clic
          onClick={() => paginate(1)}
        >
          <IoIosArrowForward className={styles.goldButton} />
        </motion.button>
      </nav>

      {isCharacterSelected ? ( // Cambia la condición aquí
        <Link href={`/mapas`}>
          siguiente
        </Link>
      ) : (
        <p>Seleccionar personaje.</p>
      )}
    </>
  );
};

export default CharacterCarousel;



