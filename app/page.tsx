import Hero from "@/components/home/Hero";
import EventList from "@/components/events/EventList";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="wrap">
        <h2 className="mb-5 font-head text-2xl font-bold">Prochainement</h2>
        <EventList />
      </div>
    </>
  );
}
