"use client";

import Image from "next/image";
import { useState } from "react";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-coverflow";

import { Knight } from "@/types/knights";

import styles from "../styles/index.module.scss";

interface KnightCarouselProps {
  knights: Knight[];
  onStart: (knight: Knight) => void;
  onBack?: () => void;
}

export default function KnightCarousel({
  knights,
  onStart,
  onBack,
}: KnightCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = knights[activeIndex];

  return (
    <section className={styles.homeWrap}>
      <h1 className={styles.selectionTitle}>Bronce Knight</h1>

      <Swiper
        className={styles.homeSwiper}
        modules={[EffectCoverflow]}
        effect="coverflow"
        grabCursor
        centeredSlides
        loop
        slidesPerView={1.7}
        coverflowEffect={{
          rotate: 45,
          stretch: 0,
          depth: 140,
          scale: 0.76,
          modifier: 1,
          slideShadows: false,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      >
        {knights.map((knight) => (
          <SwiperSlide key={knight.id} className={styles.homeSlide}>
            <div className={styles.slideInner}>
              <Image
                className={styles.slideImage}
                src={knight.image}
                alt={knight.name}
                width={300}
                height={450}
              />
              <span className={styles.slideName}>{knight.name}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        className={styles.selectionButton}
        onClick={() => active && onStart(active)}
      >
        Empezar
      </button>
      {onBack && (
        <button className={styles.lobbyBackButton} onClick={onBack}>
          ← Atrás
        </button>
      )}
    </section>
  );
}