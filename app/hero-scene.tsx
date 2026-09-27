"use client";

import { usePathname } from "next/navigation";
import LaptopScene from "./scene";

export default function HeroScene() {
  const pathname = usePathname();

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
        <LaptopScene key={pathname} />
      </div>
    </div>
  );
}
