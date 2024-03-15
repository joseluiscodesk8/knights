'use client'

import { createContext, useState, useContext, ReactNode } from "react";

// Define el tipo para el contexto
interface CharacterContextType {
  selectedCharacterId: number | null;
  setSelectedCharacterId: React.Dispatch<React.SetStateAction<number | null>>;
}

// Crea el contexto
const CharacterContext = createContext<CharacterContextType>({
  selectedCharacterId: null,
  setSelectedCharacterId: () => {},
});

// Define el tipo para el children en el proveedor del contexto
type CharacterProviderProps = {
  children: ReactNode; // ReactNode es un tipo que puede representar cualquier cosa que se pueda renderizar en React
};

// Define el proveedor del contexto
export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);

  return (
    <CharacterContext.Provider value={{ selectedCharacterId, setSelectedCharacterId }}>
      {children}
    </CharacterContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useCharacterContext = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacterContext must be used within a CharacterProvider");
  }
  return context;
};
