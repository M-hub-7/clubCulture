import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[520px] overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[url('/images/club-culture-hero.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[#090d2d]/75" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090d2d] via-[#090d2d]/70 to-transparent" />
      <div className="wrap relative flex min-h-[520px] items-center py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.3em] text-accent-amber">Midnight Tropical Experience</p>
          <h1 className="h1 max-w-3xl text-4xl md:text-6xl">La scène afro-caribéenne, au même endroit.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">
            Découvrez les meilleurs événements, soirées et concerts Afrobeats, Dancehall et Amapiano près de chez vous.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/evenements" className="btn">Voir les événements</Link>
            <Link href="/inscription" className="btn-ghost">Organiser un événement</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
