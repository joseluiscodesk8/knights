import dynamic from "next/dynamic";

const DynamicSlider = dynamic(() => import('./components/CharacterCarousel'));

export default function Home() {
  return (
    <main>
      <DynamicSlider />
    </main>
  );
}
