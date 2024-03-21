'use client'

import { useEffect, useRef } from 'react';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  let isVisible = true;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const image = imageRef.current;

    if (canvas && context && image) {
      const draw = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (isVisible) {
          context.drawImage(image, 0, 0, 200, 200); // Modifica el tamaño de la imagen aquí
        }

        setTimeout(() => {
          isVisible = !isVisible;
          requestAnimationFrame(draw);
        }, 500); // Parpadea cada medio segundo
      };

      draw();
    }
  }, []);

  return (
    <canvas ref={canvasRef} width={200} height={200}>
      <img ref={imageRef} src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjAVk9TApDwgKBn6JLIfbphdiC7Y6Iynogi-4y9FLaZrYLGE7vAXmf2_BMLab3PXoMRq1LTVGF_G_UmqMX5d2IcumEizOe87cV2HngkAqZK5VhZFW18ZLaSA08yOoSILA7IL6YuTWZlnnA/s1600/89010873_3253878291306460_5657323384623595520_o.jpg" style={{ display: 'none' }} />
    </canvas>
  );
};

export default GameCanvas;


