export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-black tracking-tighter text-blue-600">Business Dev App.</div>
        <div className="space-x-4">
          <a href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">Login</a>
          <a href="/signup" className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700">Get Started</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Put your entire business development on <span className="text-blue-600">Autopilot.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          Business Dev App deploys a 100+ AI bot swarm to handle your leads, estimating, scheduling, and outreach. Hook up your business in 5 minutes and let the AI do the heavy lifting.
        </p>
        <button className="px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105">
          Connect Your Business Today
        </button>
      </main>

      {/* How It Works Steps */}
      <section className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How it works (in 3 simple steps)</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold mb-3">Hook up your tools</h3>
              <p className="text-slate-500">
                Simply connect your business email, calendar, and payment processor. Our system securely integrates with your existing workflow without you needing to change a thing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold mb-3">The AI Swarm deploys</h3>
              <p className="text-slate-500">
                The OS immediately spawns a dedicated Sales Agent, Estimating Bot, and Marketing Agent. They begin triaging your inbox, deleting spam, and drafting estimates based on your parameters.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold mb-3">Watch your revenue grow</h3>
              <p className="text-slate-500">
                Sit back and log into your central dashboard. Watch live as the web scraper pulls in leads, the bots send out quotes, and the system automatically routes jobs to your subcontractors.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to scale without the stress?</h2>
        <p className="text-slate-400 mb-10 max-w-xl mx-auto">
          Whether you are a solo contractor or managing a 50-person agency, Business Dev App adapts to your size and automates the rest.
        </p>
        <button className="px-8 py-4 text-lg font-bold text-slate-900 bg-white rounded-full shadow-lg hover:bg-slate-100 transition">
          Start Your Free Trial
        </button>
      </section>
    </div>
  );
}
