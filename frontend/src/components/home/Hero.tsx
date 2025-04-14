export default function Hero() {
  return (
    <section className="w-full max-w-6xl flex flex-col items-center text-center gap-6">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Maximize Your Travel <span className="text-primary">Rewards</span>
      </h1>
      <p className="text-xl md:text-2xl max-w-3xl">
        Find the best value for your credit card points across airlines, hotels, and transfer partners.
      </p>
      <div className="flex gap-4 mt-4">
        <button className="btn btn-primary btn-lg">Get Started</button>
        <button className="btn btn-outline btn-lg">How It Works</button>
      </div>
    </section>
  );
} 