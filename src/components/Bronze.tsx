"use client";

import Image from "next/image";
import { Saint } from "../types/sanit";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination } from "swiper/modules";

import styles from "../styles/index.module.scss";

import "swiper/css";
import "swiper/css/effect-coverflow";

interface Props {
  saints: Saint[];
  onSelect: (saint: Saint) => void;
}

export default function Bronze({ saints, onSelect }: Props) {
  return (
    <section className={styles.container} aria-label="Selector de Caballeros de Bronce">
      
      <Swiper
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        loop
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Pagination]}
        coverflowEffect={{
          rotate: 30,
          stretch: 0,
          depth: 150,
          modifier: 1,
          slideShadows: false,
        }}
        className={styles.slider}
      >
        {saints.map((saint) => (
          <SwiperSlide
            key={saint.id}
            className={styles.slide}
          >
            <button
              type="button"
              onClick={() => onSelect(saint)}
              className={styles.card}
              aria-label={`Seleccionar a ${saint.name}`}
            >
              <figure className={styles.figure}>
                <Image
                  src={saint.image}
                  alt={saint.name}
                  width={500}
                  height={500}
                  className={styles.image}
                />
                <br />
                <br />
                <figcaption className={styles.caption}>
                  {saint.name}
                </figcaption>
              </figure>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

    </section>
  );
}
