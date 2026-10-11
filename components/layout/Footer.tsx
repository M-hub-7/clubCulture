import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Globe, Share2 } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080C2D] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* GRILLE PRINCIPALE (Padding réduit) */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* COLONNE 1 & 2 : LOGO, DESCRIPTION & RÉSEAUX SOCIAUX */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex">
              <Image
                src="/images/club-culture-logo.jpg"
                alt="Club Culture"
                width={140}
                height={50}
                className="h-10 w-auto rounded-lg object-contain"
              />
            </Link>

            <p className="mt-3 max-w-sm text-xs leading-5 text-white/50">
              La plateforme de référence pour découvrir et vivre la scène
              afro-caribéenne. Midnight Tropical Experience.
            </p>

            {/* ICÔNES RÉSEAUX SOCIAUX */}
            <div className="mt-4 flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[#F5A623] hover:text-[#080C2D]"
              >
                <FaFacebook size={15} />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[#F5A623] hover:text-[#080C2D]"
              >
                <FaInstagram size={15} />
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[#F5A623] hover:text-[#080C2D]"
              >
                <FaTwitter size={15} />
              </a>
            </div>
          </div>

          {/* COLONNE 3 : EXPLORER */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Explorer
            </h3>

            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/evenements"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Événements
                </Link>
              </li>
              <li>
                <Link
                  href="/organisateurs"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Organisateurs
                </Link>
              </li>
              <li>
                <Link
                  href="/villes"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Villes
                </Link>
              </li>
            </ul>
          </div>

          {/* COLONNE 4 : POUR LES PROS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Pour les pros
            </h3>

            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/inscription"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Devenir Organisateur
                </Link>
              </li>
              <li>
                <Link
                  href="/connexion"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Espace Pro
                </Link>
              </li>
              <li>
                <Link
                  href="/tarifs"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* COLONNE 5 : LÉGAL & AIDE */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Légal & Aide
            </h3>

            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/a-propos"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  href="/aide"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Aide & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/cgv"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  CGV
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-white/50 transition hover:text-[#F5A623]"
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BAS DE PAGE / COPYRIGHT (Taille & Marge réduites) */}
        <div className="mt-8 border-t border-white/10 pt-4">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
            <p>
              © {new Date().getFullYear()} Club Culture. Midnight Tropical
              Experience.
            </p>

            <div className="flex items-center gap-4 text-white/50">
              <button
                aria-label="Langue"
                className="transition hover:text-[#F5A623]"
              >
                <Globe size={15} />
              </button>
              <button
                aria-label="Partager"
                className="transition hover:text-[#F5A623]"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
