"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Brand() {
  const [logoMissing, setLogoMissing] = useState(false);

  return (
    <Link
      href="/"
      aria-label="Club Culture - Accueil"
      className="flex shrink-0 items-center gap-2"
    >
      {logoMissing ? (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-amber font-head text-sm font-black text-[#452b00]">
          CC
        </span>
      ) : (
        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/15">
          <Image
            src="/images/club-culture-logo.jpg"
            alt="Club Culture"
            fill
            priority
            sizes="40px"
            className="object-cover"
            onError={() => setLogoMissing(true)}
          />
        </div>
      )}

      <span className="font-head text-lg font-black tracking-tight text-white sm:text-xl">
        CLUB <span className="text-accent-amber">CULTURE</span>
      </span>
    </Link>
  );
}