"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useCharacterContext } from "../../context/CharacterContext";
import useCharacters from "../components/data/bronze.json";
import Link from "next/link";
import styles from "../styles/index.module.scss";

const CanvasComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedCharacterId } = useCharacterContext();
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Posición inicial del personaje en la parte inferior del canvas
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null); // Variable de estado para almacenar los datos del personaje seleccionado

  // Definir el mapa
  const map: number[][] = useMemo<number[][]>(
    () => [
      [1, 1, 0, 0, 1, 3],
      [1, 1, 1, 0, 1, 0],
      [0, 0, 1, 1, 1, 0],
      [0, 1, 1, 0, 1, 1],
      [1, 1, 0, 0, 0, 0],
      [2, 1, 1, 1, 1, 1],
    ],
    []
  );

  const tileSize = 85; // Tamaño de cada celda del mapa en píxeles

  useEffect(() => {

    // Encuentra la posición del personaje en el mapa
  let charPosition = { x: 0, y: 0 };
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[0].length; col++) {
      if (map[row][col] === 2) {
        charPosition = { x: col * tileSize, y: row * tileSize };
        break;
      }
    }
  }

  // Actualiza la posición del personaje en el canvas
  setPosition(charPosition);

    if (selectedCharacterId) {
      // Encuentra el personaje seleccionado en el JSON
      const character = useCharacters.find(
        (char) => char.id === selectedCharacterId
      );
      setSelectedCharacter(character);
    }
  }, [map, selectedCharacterId]);

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
            // Establecer el color según el valor de la celda
            if (map[row][col] === 1) {
              context.fillStyle = "white";
            } else if (map[row][col] === 0) {
              context.fillStyle = "#1416";
            } else if (map[row][col] === 2) {
              context.fillStyle = "blue"; // Cambia el color para la celda con valor 2
            } else if (map[row][col] === 3) {
              context.fillStyle = "green"; // Cambia el color para la celda con valor 3
            }

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
  }, [selectedCharacter, position, map]);

  useEffect(() => {
    // Verifica si la posición actual del personaje coincide con la celda de valor 3 en el mapa
    if (map[Math.floor(position.y / tileSize)][Math.floor(position.x / tileSize)] === 3) {
      // Aquí puedes realizar cualquier evento que desees cuando el personaje esté en la celda con valor 3
      alert("thnx for your help caroline muak");
    }
  }, [position, map]);
  

  // Función para verificar si el movimiento es válido según el mapa
  const isValidMove = (row: number, col: number) => {
    // Verifica si la nueva posición está dentro de los límites del mapa
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
      return false;
    }

    // Verifica si la celda en la nueva posición es un camino válido
    return map[row][col] !== 0;
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
    <section className={styles.Canvas}>
      <canvas
        ref={canvasRef}
      ></canvas>
      <div>
      <button onClick={moveRight}>Right</button>
        <button onClick={moveUp}>Up</button>
        <button onClick={moveLeft}>Left</button>
        <button onClick={moveDown}>Down</button>
      </div>
      <Link href={"/"}>home</Link>
    </section>
  );
};

export default CanvasComponent;
