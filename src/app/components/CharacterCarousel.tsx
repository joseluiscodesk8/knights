'use client'

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "popmotion";
import characters from "./data/characters.json"; // Importa el archivo characters.json
import styles from "../styles/index.module.scss";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.7,
    rotate: direction > 0 ? -50 : 50 // Rotación de 90 grados en función de la dirección
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0 // Sin rotación en el centro
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.7,
    rotate: direction < 0 ? -50 : 50 // Rotación de 90 grados en función de la dirección
  })
};

const CharacterCarousel = () => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);

  const imageIndex = wrap(0, characters.length, page); // Utiliza characters en lugar de images

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleCharacterSelect = (id: number) => {
    if (selectedCharacters.includes(id)) {
      setSelectedCharacters(selectedCharacters.filter((characterId) => characterId !== id));
    } else {
      setSelectedCharacters([...selectedCharacters, id]);
    }
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
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className={styles.carouselItem}
          drag
          dragConstraints={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }}
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
          <button
            className={`${styles.carouselButton} ${styles.prevButton}`}
            onClick={() => paginate(-1)}
          >
            <span className={styles.goldButton}>Anterior</span>
          </button>
          <button
            className={`${styles.carouselButton} ${styles.nextButton}`}
            onClick={() => paginate(1)}
          >
            <span className={styles.goldButton}>Siguiente</span>
          </button>
        </nav>
  </>
  );
};

export default CharacterCarousel;
