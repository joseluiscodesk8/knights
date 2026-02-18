"use client"

import { useState } from "react"
import Image from "next/image"
import { Saint } from "../types/sanit"

interface Props {
  saint: Saint
  onBack: () => void
}

export default function Battle({ saint, onBack }: Props) {
  const [lastRoll, setLastRoll] = useState<number | null>(null)

  function attack() {
    const roll = Math.floor(Math.random() * 6) + 1
    setLastRoll(roll)
  }

  return (
    <div className="space-y-6">

      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-200 rounded"
      >
        ← Volver
      </button>

      <h2 className="text-2xl font-bold">{saint.name}</h2>

      <Image 
        src={saint.image} 
        alt={saint.name} 
        width={250} 
        height={250}
      />

      {/* Vida fija del caballero */}
      <div className="text-xl font-bold">
        Vida: {saint.life} HP
      </div>

      {/* Número del dado */}
      <div className="text-7xl font-bold">
        {lastRoll ?? "-"}
      </div>

      {/* Ataques */}
      <div className="space-y-2">
        {saint.attacks.map((atk, i) => (
          <button
            key={i}
            onClick={attack}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {atk}
          </button>
        ))}
      </div>

    </div>
  )
}
