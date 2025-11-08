import CanadaMap from "@/components/canada-map";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">
          2025 Poll-by-Poll Results Map
        </h1>
      </header>
      <main className="min-h-[calc(100vh-180px)]">
        <CanadaMap />
      </main>
    </div>
  );
}
