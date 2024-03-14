"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "popmotion";
import characters from "./data/characters.json";
import styles from "../styles/index.module.scss";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

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
  const router = useRouter();
  const [[page, direction], setPage] = useState([0, 0]);
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);

  const imageIndex = wrap(0, characters.length, page);

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
  };

  const handleNextPage = () => {
    // Obtener el ID del personaje seleccionado
    const selectedCharacterId = selectedCharacters[selectedCharacters.length - 1];
  
    // Construir la URL con el ID del personaje como query parameter
    const nextPageUrl = `/selecCharacters?characterId=${selectedCharacterId}`;
  
    // Redireccionar a la siguiente página
    router.push(nextPageUrl);
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
      <button onClick={handleNextPage}>seleciona un personaje</button>
    </>
  );
};

export default CharacterCarousel;
