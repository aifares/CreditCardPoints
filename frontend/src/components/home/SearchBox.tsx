export default function SearchBox() {
  return (
    <section className="w-full max-w-4xl bg-base-200 rounded-box p-6 shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Where would you like to go?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">From</label>
          <input type="text" placeholder="City or Airport" className="input input-bordered w-full" />
        </div>
        <div>
          <label className="label">To</label>
          <input type="text" placeholder="City or Airport" className="input input-bordered w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="label">Departure</label>
          <input type="date" className="input input-bordered w-full" />
        </div>
        <div>
          <label className="label">Return</label>
          <input type="date" className="input input-bordered w-full" />
        </div>
        <div>
          <label className="label">Cabin</label>
          <select className="select select-bordered w-full">
            <option>Economy</option>
            <option>Premium Economy</option>
            <option>Business</option>
            <option>First</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary w-full">Search with Points</button>
    </section>
  );
} 