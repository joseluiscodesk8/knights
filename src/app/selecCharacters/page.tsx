'use client'

import { useState, useEffect } from "react";
import {  useRouter } from "next/navigation";
import characters from "../components/data/characters.json"
import Link from "next/link";

const CharacterPage = () => {
    const router = useRouter();
    const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

//   useEffect(() => {
//     // Verificar si router.query está definido y si tiene la propiedad characterId
//     if (router.query && 'characterId' in router.query) {
//       const characterId = parseInt(router.query.characterId as string, 10);
//       // Encontrar el personaje correspondiente
//       const character = characters.find(char => char.id === characterId);
//       if (character) {
//         setSelectedCharacter(character);
//       }
//     }
//   }, [router.query]);
  
    if (!selectedCharacter) {
      return (
        <>
            <div>Error: Personaje no encontrado</div>;
            <Link href="/">volver el home</Link>
        </>
      )
    }
  
    return (
      <div>
        <h1>{selectedCharacter.name}</h1>
        <img src={selectedCharacter.image} alt={selectedCharacter.name} />
        
      </div>
    );
  };

export default CharacterPage;
