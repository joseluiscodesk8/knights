import dynamic from "next/dynamic";
import Logo from "./components/Logo";
import styles from "./styles/index.module.scss";


const DynamicSlider = dynamic(() => import('./components/CharacterCarousel'));

export default function Home() {
  return (
    <main className={styles.logo}>
      <Logo />
      <DynamicSlider />
    </main>
  );
}
