import { useEffect, useState, useRef } from "react";
import { useCharacterContext } from "@/app/context/CharacterContext";
import useCharacters from "./data/bronze.json";
import character from "./data/characters.json";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "../styles/index.module.scss";

interface Character {
  id: number;
  name: string;
  image: string;
  attacks: string[];
  vida: number;
  audioAttacks: string[];
}

const BattlePage: React.FC = () => {
  const { selectedCharacterId, opponentCharacterId } = useCharacterContext();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null);
  const [opponentIndex, setOpponentIndex] = useState(0); // Nuevo estado para el índice del oponente actual
  const [progress, setProgress] = useState<number>(0); // Estado para registrar el progreso del jugador
  const [delayPassed, setDelayPassed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  // Cargar el progreso del jugador desde localStorage al montar el componente
  useEffect(() => {
    const savedProgress = localStorage.getItem("battleProgress");
    if (savedProgress) {
      setProgress(parseInt(savedProgress));
    }
  }, []);

  // Guardar el progreso del jugador en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("battleProgress", progress.toString());
  }, [progress]);

  useEffect(() => {
    if (selectedCharacter && selectedCharacter.vida <= 0) {
      router.push("/");
    } else if (opponentCharacter && opponentCharacter.vida <= 0) {
      if (!delayPassed) { // Verificar si ya ha pasado el retraso
        // Esperar un segundo antes de avanzar al siguiente oponente
        setTimeout(() => {
          setDelayPassed(true); // Marcar que ha pasado el retraso
        }, 1000);
      } else {
        if (opponentIndex < character.length - 1) { // Si hay más oponentes en la lista
          console.log("Peleando contra oponente en posición:", opponentIndex);
          setOpponentIndex(prevIndex => prevIndex + 1); // Avanzar al siguiente oponente
          setDelayPassed(false); // Reiniciar el estado del retraso
        } else {
          setProgress(prevProgress => prevProgress + 1); // Incrementar el progreso del jugador
          router.push("/mapas"); // Si no hay más oponentes, redirigir
        }
      }
    }
  }, [opponentCharacter, router, selectedCharacter, opponentIndex, progress, delayPassed]);

  useEffect(() => {
    if (selectedCharacterId) {
      const character: Character | undefined = useCharacters.find(char => char.id === selectedCharacterId);
      setSelectedCharacter(character || null);
    }

    // Seleccionar el oponente actual basado en el índice
    setOpponentCharacter(character[opponentIndex]);

  }, [selectedCharacterId, opponentIndex]);

  const handleAttack = () => {
    if (selectedCharacter && selectedCharacter.vida > 0 && opponentCharacter && opponentCharacter.vida > 0) {
      const playerRoll = Math.floor(Math.random() * 6) + 1;
      const opponentRoll = Math.floor(Math.random() * 2) + 1;

      if (playerRoll > opponentRoll) {
        const difference = playerRoll - opponentRoll;
        setOpponentCharacter(prevCharacter => ({
          ...prevCharacter!,
          vida: Math.max(0, prevCharacter!.vida - difference)
        }));
      } else if (opponentRoll > playerRoll) {
        const difference = opponentRoll - playerRoll;
        setSelectedCharacter(prevCharacter => ({
          ...prevCharacter!,
          vida: Math.max(0, prevCharacter!.vida - difference)
        }));
      }
    }
  };

  return (
   <>
     <section className={styles.battelContainer}>
      {selectedCharacter ? (
        <motion.article
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1,  x: 0 }}
        exit={{ opacity: 0, x: -100  }}
        transition={{ duration: 0.2 }}
        >
          <h2>{selectedCharacter.name}</h2>
          <Image
            src={selectedCharacter.image}
            alt={selectedCharacter.name}
            width={200}
            height={200}
            priority={true}
          />
          {selectedCharacter &&
            selectedCharacter.vida > 0 &&
            selectedCharacter.attacks.map((attack, index) => (
              <button key={index} onClick={handleAttack}>
                {attack}
              </button>
            ))}
          <p>Vida: {selectedCharacter.vida}</p>
        </motion.article>
      ) : (
        <p>No se ha seleccionado ningún personaje.</p>
      )}

      {opponentCharacter && (
        <motion.article
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1,  x: 0 }}
        exit={{ opacity: 0, x: 100  }}
        transition={{ duration: 0.2 }}
        >
          <h2>{opponentCharacter.name}</h2>
          <Image
            src={opponentCharacter.image}
            alt={opponentCharacter.name}
            width={200}
            height={200}
            priority={true}
          />
          <p>Vida: {opponentCharacter.vida}</p>
        </motion.article>
      )}
    </section>
      <nav className={styles.home}>
      <Link href={"/"}>Home</Link>
    </nav>
   </>
  );
};

export default BattlePage;
