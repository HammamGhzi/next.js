"use client";

import LaptopScene from "./scene";

export default function HeroScene() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
        <LaptopScene />
      </div>
    </div>
  );
}
