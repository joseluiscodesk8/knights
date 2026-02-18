"use client";

import { useState } from "react";
import Bronze from "../components/Bronze";
import Battle from "../components/battle";
import saintsData from "../data/bronce.json";
import { Saint } from "../types/sanit";

export default function Page() {
  const [selectedSaint, setSelectedSaint] = useState<Saint | null>(null);

  return (
    <main className="p-10">
      {!selectedSaint && (
        <>
          <h1 className="text-3xl font-bold mb-6">Caballeros de Bronce</h1>

          <Bronze
            saints={
              saintsData.map((saint) => ({
                ...saint,
                life: saint.vida,
              })) as Saint[]
            }
            onSelect={setSelectedSaint}
          />
        </>
      )}

      {selectedSaint && (
        <Battle saint={selectedSaint} onBack={() => setSelectedSaint(null)} />
      )}
    </main>
  );
}
