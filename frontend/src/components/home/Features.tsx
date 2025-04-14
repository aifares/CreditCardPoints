export default function Features() {
  return (
    <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Smart Search</h3>
          <p>Search award availability across loyalty programs and sort by value, cabin class, and alliance.</p>
        </div>
      </div>
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Best Value Engine</h3>
          <p>See highest-value redemptions for your points in real time with our powerful optimization tools.</p>
        </div>
      </div>
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Transfer Bonus Alerts</h3>
          <p>Get notified about ongoing and upcoming transfer bonuses to maximize your point value.</p>
        </div>
      </div>
    </section>
  );
} 