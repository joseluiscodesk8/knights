import { useEffect, useRef, useState, useMemo } from "react";

import { useCharacterContext } from "../context/CharacterContext";
import useCharacters from "./data/bronze.json";
import styles from "../styles/index.module.scss";

interface CanvasComponentProps {
  onBattleStart: () => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({ onBattleStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedCharacterId } = useCharacterContext();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [isAtPosition3, setIsAtPosition3] = useState(false); // Controlar si el personaje está en la posición 3
  const widthCanvas = "350vw";
  const heightCanvas = "400vh";
  const tileSize = 85;

  interface ImagePaths {
    [key: string]: string;
  }

  // Generación del mapa de laberinto
  const generateMazeMap = () => {
    const mazeMap: number[][] = [];
    const width = 6;
    const height = 6;

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

    for (let i = 0; i < height; i++) {
      visited.push(Array(width).fill(false));
    }

    const dfs = (x: number, y: number) => {
      visited[y][x] = true;
      mazeMap[y][x] = 1;

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

    dfs(startX, startY);

    mazeMap[startY][startX] = 2;
    mazeMap[height - 1][width - 1] = 3;

    if (mazeMap[height - 2][width - 1] === 0) {
      mazeMap[height - 2][width - 1] = 1;
    } else if (mazeMap[height - 1][width - 2] === 0) {
      mazeMap[height - 1][width - 2] = 1;
    }

    return mazeMap;
  };

  const map: number[][] = useMemo(() => generateMazeMap(), []);

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
        0: "https://previews.123rf.com/images/jacekbieniek/jacekbieniek1202/jacekbieniek120200007/12433760-muro-griego-tradicional-hecha-de-piedras-amarillas-lados-de-rodas.jpg",
        1: "https://img3.stockfresh.com/files/s/spectral/m/63/4780593_stock-photo-plaster-floor.jpg",
        2: "#000",
        3: "#000",
      };

      for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++) {
          const tileX = col * cellWidth;
          const tileY = row * cellHeight;

          const cellValue = map[row][col];
          if (cellValue === 0 || cellValue === 1) {
            const image = new Image();
            image.src = images[cellValue];
            context.drawImage(image, tileX, tileY, cellWidth, cellHeight);
          } else {
            context.fillStyle = images[cellValue];
            context.fillRect(tileX, tileY, cellWidth, cellHeight);
          }
        }
      }

      if (selectedCharacter) {
        const characterImage = new Image();
        characterImage.src = selectedCharacter.image;

        characterImage.onload = () => {
          const newRow = Math.floor(position.y / tileSize);
          const newCol = Math.floor(position.x / tileSize);
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
    const newRow = Math.floor(position.y / tileSize);
    const newCol = Math.floor(position.x / tileSize);
    if (map[newRow][newCol] === 3) {
      if (!isAtPosition3) {
        setIsAtPosition3(true);
        onBattleStart(); // Llamar a la función solo una vez al alcanzar la posición 3
      }
    } else {
      setIsAtPosition3(false);
    }
  }, [position, map, isAtPosition3, onBattleStart]);

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
        <button onClick={moveLeft}>Left</button>
        <button onClick={moveUp}>Up</button>
        <button onClick={moveDown}>Down</button>
      </div>
    </section>
  );
};

export default CanvasComponent;