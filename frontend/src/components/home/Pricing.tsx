export default function Pricing() {
  return (
    <section className="w-full max-w-6xl mt-12">
      <h2 className="text-3xl font-bold text-center mb-2">Simple, Transparent Pricing</h2>
      <p className="text-center text-xl mb-8">Choose the plan that fits your travel goals</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-2xl justify-center">Basic</h3>
            <div className="text-center my-4">
              <span className="text-4xl font-bold">Free</span>
              <span className="text-base-content/70 block">Forever</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Basic point value calculator
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                5 searches per month
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Limited airline coverage
              </li>
            </ul>
            <button className="btn btn-outline w-full mt-auto">Sign Up Free</button>
          </div>
        </div>
        
        {/* Premium Plan */}
        <div className="card bg-base-100 shadow-xl border-2 border-primary relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-content px-4 py-1 rounded-full text-sm font-bold">
            MOST POPULAR
          </div>
          <div className="card-body">
            <h3 className="card-title text-2xl justify-center">Premium</h3>
            <div className="text-center my-4">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-base-content/70 block">per month</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Advanced point optimization
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Unlimited searches
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Full airline and hotel coverage
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                5 saved alerts
              </li>
            </ul>
            <button className="btn btn-primary w-full mt-auto">Start 7-Day Trial</button>
          </div>
        </div>
      </div>
      
      <p className="text-center mt-6 text-base-content/70">
        All plans include our satisfaction guarantee. Cancel anytime.
      </p>
    </section>
  );
} 