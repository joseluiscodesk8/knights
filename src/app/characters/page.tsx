'use client'

import { useEffect, useState } from "react";
import { useCharacterContext } from "@/context/CharacterContext";
import characters from "../components/data/characters.json";
import Image from "next/image";
import Link from "next/link";

// Definir la interfaz para los personajes
interface Character {
  id: number;
  name: string;
  image: string;
  // Otras propiedades de los personajes si las hubiera
}

const Character = () => {
  const { selectedCharacterId } = useCharacterContext();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (selectedCharacterId) {
      const character = characters.find((char) => char.id === selectedCharacterId);
      if (character) {
        setSelectedCharacter(character);
      } else {
        setSelectedCharacter(null); // No se encontró ningún personaje, establece null
      }
    }
  }, [selectedCharacterId]);

  return (
    <>
      {selectedCharacter ? (
        <div>
          <h2>{selectedCharacter.name}</h2>
          <Image src={selectedCharacter.image} alt={selectedCharacter.name} width={200} height={200} />
        </div>
      ) : (
        <p>No se ha seleccionado ningún personaje.</p>
      )}
      <Link href={"/"}>Home</Link>
    </>
  );
};


export default Character;

