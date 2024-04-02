"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useCharacterContext } from "../../context/CharacterContext";
import useCharacters from "../components/data/bronze.json";
import Link from "next/link";

const CanvasComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedCharacterId } = useCharacterContext();
  const [position, setPosition] = useState({ x: 0, y: 300 }); // Posición inicial del personaje en la parte inferior del canvas
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null); // Variable de estado para almacenar los datos del personaje seleccionado
  const canvasWidth = 600; // Ancho del canvas
  const canvasHeight = 400; // Alto del canvas

  // Definir el mapa
  const map: number[][] = useMemo<number[][]>(
    () => [
      [1, 1, 0, 0, 1, 1],
      [1, 1, 1, 0, 1, 0],
      [0, 0, 1, 1, 1, 0],
      [0, 1, 1, 0, 1, 1],
      [1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
    ],
    []
  );

  const tileSize = 85; // Tamaño de cada celda del mapa en píxeles

  useEffect(() => {
    if (selectedCharacterId) {
      // Encuentra el personaje seleccionado en el JSON
      const character = useCharacters.find(
        (char) => char.id === selectedCharacterId
      );
      setSelectedCharacter(character);
    }
  }, [selectedCharacterId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      // Calcula el tamaño de la celda para que el mapa ocupe el 100% del ancho y alto del canvas
      const cellWidth = canvas.width / map[0].length;
      const cellHeight = canvas.height / map.length;

      // Limpiar el canvas antes de dibujar el mapa
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Iterar sobre cada celda del mapa
      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++) {
          const tileX = col * cellWidth;
          const tileY = row * cellHeight;

          // Establecer el color según el valor de la celda
          context.fillStyle = map[row][col] === 1 ? "white" : "#1416";

          // Dibujar un rectángulo en la posición de la celda
          context.fillRect(tileX, tileY, cellWidth, cellHeight);

          // Dibujar un borde alrededor del rectángulo
          context.strokeStyle = "gray";
          context.strokeRect(tileX, tileY, cellWidth, cellHeight);
        }
      }

      if (selectedCharacter) {
        // Cargar la imagen del personaje
        const characterImage = new Image();
        characterImage.src = selectedCharacter.image;
  
        // Dibujar el personaje en el canvas cuando la imagen se haya cargado
        characterImage.onload = () => {
          // Calcular las coordenadas de posición del personaje en el canvas
          const newRow: number = Math.floor(position.y / tileSize);
          const newCol: number = Math.floor(position.x / tileSize);
          const characterX = newCol * cellWidth;
          const characterY = newRow * cellHeight;
  
          // Dibujar la imagen del personaje en las coordenadas calculadas
          context.drawImage(characterImage, characterX, characterY, cellWidth, cellHeight);
        };
      }
    }
  }, [selectedCharacter, position, map, canvasWidth, canvasHeight]);


  // Función para verificar si el movimiento es válido según el mapa
  const isValidMove = (row: number, col: number) => {
    // Verifica si la nueva posición está dentro de los límites del mapa
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
      return false;
    }

    // Verifica si la celda en la nueva posición es un camino válido
    return map[row][col] === 1;
  };

  // Funciones para manejar el movimiento del personaje
  const moveLeft = () => {
    const newX = position.x - tileSize;
    const newRow = Math.floor(position.y / tileSize);
    const newCol = Math.floor(newX / tileSize);

    if (isValidMove(newRow, newCol)) {
      setPosition({ x: newX, y: position.y });
    }
  };

  const moveRight = () => {
    const newX = position.x + tileSize;
    const newRow = Math.floor(position.y / tileSize);
    const newCol = Math.floor(newX / tileSize);

    if (isValidMove(newRow, newCol)) {
      setPosition({ x: newX, y: position.y });
    }
  };

  const moveUp = () => {
    const newY = position.y - tileSize;
    const newRow = Math.floor(newY / tileSize);
    const newCol = Math.floor(position.x / tileSize);

    if (isValidMove(newRow, newCol)) {
      setPosition({ x: position.x, y: newY });
    }
  };

  const moveDown = () => {
    const newY = position.y + tileSize;
    const newRow = Math.floor(newY / tileSize);
    const newCol = Math.floor(position.x / tileSize);

    if (isValidMove(newRow, newCol)) {
      setPosition({ x: position.x, y: newY });
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: "1px solid black", margin: "20px" }}
      ></canvas>
      <div>
        <button onClick={moveLeft}>Left</button>
        <button onClick={moveRight}>Right</button>
        <button onClick={moveUp}>Up</button>
        <button onClick={moveDown}>Down</button>
      </div>
      <Link href={"/"}>home</Link>
    </div>
  );
};

export default CanvasComponent;
