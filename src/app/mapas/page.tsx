"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation"; // Importa el hook useRouter de Next.js
import { useCharacterContext } from "../../context/CharacterContext";
import useCharacters from "../components/data/bronze.json";
import styles from "../styles/index.module.scss";
import Link from "next/link";

const CanvasComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedCharacterId } = useCharacterContext();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [isAtPosition3, setIsAtPosition3] = useState(false); // Variable de estado para controlar si el personaje está en la posición 3
  const widthCanvas = "300vw";
  const heightCanvas = "300vh";
  const router = useRouter(); // Obtiene el objeto router

  interface ImagePaths {
    [key: string]: string;
  }

  const generateMazeMap = () => {
    // Genera un laberinto utilizando el algoritmo de búsqueda de profundidad
    const mazeMap: number[][] = [];
    const width = 6;
    const height = 6;

    // Inicializa el mapa con todas las celdas como muros
    for (let i = 0; i < height; i++) {
      mazeMap.push(Array(width).fill(0));
    }

    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    const stack: number[][] = [];
    const visited: boolean[][] = [];

    // Inicializa el array visited
    for (let i = 0; i < height; i++) {
      visited.push(Array(width).fill(false));
    }

    const dfs = (x: number, y: number) => {
      visited[y][x] = true;
      mazeMap[y][x] = 1;

      // Selecciona una dirección aleatoria
      const directionsCopy = [...directions];
      directionsCopy.sort(() => Math.random() - 0.5);

      for (const [dx, dy] of directionsCopy) {
        const nx = x + dx * 2;
        const ny = y + dy * 2;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
          mazeMap[y + dy][x + dx] = 1;
          stack.push([nx, ny]);
          dfs(nx, ny);
        }
      }
    };

    const startX = 0;
    const startY = 0;

    // Comienza el DFS desde la esquina superior izquierda
    dfs(startX, startY);

    // Establece la posición de salida y la posición de llegada
    mazeMap[startY][startX] = 2;
    mazeMap[height - 1][width - 1] = 3;

    // Conecta la posición 2 con la posición 3 sin bloquear la posición 3
    if (mazeMap[height - 2][width - 1] === 0) {
      mazeMap[height - 2][width - 1] = 1;
    } else if (mazeMap[height - 1][width - 2] === 0) {
      mazeMap[height - 1][width - 2] = 1;
    }

    return mazeMap;
  };

  const map: number[][] = useMemo<number[][]>(() => {
    // Llama a la función generateMazeMap() para generar un nuevo mapa de laberinto cada vez que se renderice el componente
    return generateMazeMap();
  }, []);

  useEffect(() => {
    let charPosition = { x: 0, y: 0 };
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[0].length; col++) {
        if (map[row][col] === 2) {
          charPosition = { x: col * tileSize, y: row * tileSize };
          break;
        }
      }
    }
    setPosition(charPosition);

    if (selectedCharacterId) {
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
      const cellWidth = canvas.width / map[0].length;
      const cellHeight = canvas.height / map.length;
  
      context.clearRect(0, 0, canvas.width, canvas.height);
  
      const images: ImagePaths = {
        0:  "https://previews.123rf.com/images/jacekbieniek/jacekbieniek1202/jacekbieniek120200007/12433760-muro-griego-tradicional-hecha-de-piedras-amarillas-lados-de-rodas.jpg", // Ruta de la imagen para el valor 0
        1: "https://img3.stockfresh.com/files/s/spectral/m/63/4780593_stock-photo-plaster-floor.jpg", // Ruta de la imagen para el valor 1
        2: "blue",
        3: "green",
      };
  
      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++) {
          const tileX = col * cellWidth;
          const tileY = row * cellHeight;
  
          const cellValue = map[row][col];
          if (cellValue === 0 || cellValue === 1) {
            // Dibujar una imagen correspondiente al valor de la celda
            const image = new Image();
            image.src = images[cellValue];
            context.drawImage(image, tileX, tileY, cellWidth, cellHeight);
          } else {
            // Dibujar colores para otros valores
            context.fillStyle = images[cellValue];
            context.fillRect(tileX, tileY, cellWidth, cellHeight);
          }
        }
      }
  
      if (selectedCharacter) {
        const characterImage = new Image();
        characterImage.src = selectedCharacter.image;
  
        characterImage.onload = () => {
          const newRow: number = Math.floor(position.y / tileSize);
          const newCol: number = Math.floor(position.x / tileSize);
          const characterX = newCol * cellWidth;
          const characterY = newRow * cellHeight;
  
          context.drawImage(
            characterImage,
            characterX,
            characterY,
            cellWidth,
            cellHeight
          );
        };
      }
    }
  }, [selectedCharacter, position, map]);
  

  useEffect(() => {
    // Verifica si la posición actual del personaje coincide con la celda de valor 3 en el mapa
    const newRow = Math.floor(position.y / tileSize);
    const newCol = Math.floor(position.x / tileSize);
    if (map[newRow][newCol] === 3) {
      // El personaje está en la posición 3
      setIsAtPosition3(true);
    } else {
      setIsAtPosition3(false);
    }
  }, [position, map]);

  useEffect(() => {
    // Redirige al usuario a la página deseada cuando el personaje esté en la posición 3
    if (isAtPosition3) {
      router.push("/battle"); // Redirige a la página de inicio
    }
  }, [isAtPosition3, router]);

  const tileSize = 85;

  const isValidMove = (row: number, col: number) => {
    if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) {
      return false;
    }
    return map[row][col] !== 0;
  };

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
      <canvas ref={canvasRef} width={widthCanvas} height={heightCanvas}></canvas>
      <div>
        <button onClick={moveRight}>Right</button>
        <button onClick={moveUp}>Up</button>
        <button onClick={moveLeft}>Left</button>
        <button onClick={moveDown}>Down</button>
      </div>
      <Link href={"/"}>Home</Link>
    </section>
  );
};

export default CanvasComponent;




