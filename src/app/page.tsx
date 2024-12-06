"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Logo from "./components/Logo";
import styles from "./styles/index.module.scss";
import { NextPage } from "next";

const DynamicKnights = dynamic(() => import("./components/Knights"));
const DynamicMaps = dynamic(() => import("./components/Maps"));
const DynamicBattle = dynamic(() => import("./components/Battle"));

const Home: NextPage = () => {
  const [currentComponent, setCurrentComponent] = useState<
    "knights" | "maps" | "battle"
  >("knights");
  const [isCharacterSelected, setIsCharacterSelected] = useState(false);

  const handleNext = () => {
    if (isCharacterSelected) {
      setCurrentComponent("maps");
    } else {
      alert("Debes seleccionar un personaje antes de continuar.");
    }
  };

  const startBattle = () => {
    setCurrentComponent("battle");
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.main
        className={styles.logo}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        <Logo />
        {currentComponent === "knights" && (
          <DynamicKnights
            onCharacterSelect={() => setIsCharacterSelected(true)}
          />
        )}
        {currentComponent === "maps" && (
          <DynamicMaps onBattleStart={() => setCurrentComponent("battle")} />
        )}
        {currentComponent === "battle" && <DynamicBattle />}
        {currentComponent === "knights" && (
          <button
            className={styles.nextButton}
            onClick={handleNext}
            disabled={!isCharacterSelected}
          >
            Siguiente
          </button>
        )}
      </motion.main>
    </AnimatePresence>
  );
};

export default Home;
//   const [currentComponent, setCurrentComponent] = useState<"knights" | "maps">("knights");
//   const [isCharacterSelected, setIsCharacterSelected] = useState(false);

//   const handleNext = () => {
//     if (isCharacterSelected) {
//       setCurrentComponent("maps");
//     } else {
//       alert("Debes seleccionar un personaje antes de continuar.");
//     }
//   };

//   return (
//     <AnimatePresence initial={false} mode="wait">
//       <motion.main
//         className={styles.logo}
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 1 }}
//       >
//         <Logo />
//         {currentComponent === "knights" && (
//           <DynamicKnights onCharacterSelect={() => setIsCharacterSelected(true)} />
//         )}
//         {currentComponent === "maps" && <DynamicMaps />}
//         {currentComponent === "knights" && (
//           <button
//             className={styles.nextButton}
//             onClick={handleNext}
//             disabled={!isCharacterSelected}
//           >
//             Siguiente
//           </button>
//         )}
//       </motion.main>
//     </AnimatePresence>
//   );
// };

// export default Home;
