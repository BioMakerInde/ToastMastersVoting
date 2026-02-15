import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/30">
              T
            </div>
            <span className="text-xl font-bold tracking-tight">
              Toast<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Vote</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Trusted by 500+ Toastmasters clubs
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 max-w-4xl mx-auto">
          Your Club Voting,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            Reinvented
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Secure, real-time voting for Toastmasters meetings. From Best Speaker to custom categories — run your elections beautifully in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-2xl shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free — 30 Day Pro Trial
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            Sign In →
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: '500+', label: 'Clubs' },
            { value: '10k+', label: 'Votes Cast' },
            { value: '99.9%', label: 'Uptime' },
            { value: '< 1s', label: 'Results' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Run Elections
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Built specifically for Toastmasters clubs. No compromises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '🗳️',
              title: 'One-Tap Voting',
              description: 'Members vote from their phone in seconds. One vote per person per category — guaranteed fair.',
              gradient: 'from-purple-500/10 to-indigo-500/10',
              border: 'border-purple-500/20',
            },
            {
              icon: '📊',
              title: 'Instant Results',
              description: 'Results calculated in real-time the moment voting closes. Winners displayed beautifully.',
              gradient: 'from-cyan-500/10 to-blue-500/10',
              border: 'border-cyan-500/20',
            },
            {
              icon: '🔒',
              title: 'Secure & Anonymous',
              description: 'Optional anonymous voting mode. One vote per member enforced with fingerprint verification.',
              gradient: 'from-green-500/10 to-emerald-500/10',
              border: 'border-green-500/20',
            },
            {
              icon: '📱',
              title: 'QR Code Check-in',
              description: 'Generate unique QR codes for members. Quick scan to check-in at meetings.',
              gradient: 'from-orange-500/10 to-amber-500/10',
              border: 'border-orange-500/20',
            },
            {
              icon: '🏆',
              title: 'Custom Categories',
              description: 'Best Speaker, Best Evaluator, or create your own. Fully customizable per club.',
              gradient: 'from-pink-500/10 to-rose-500/10',
              border: 'border-pink-500/20',
            },
            {
              icon: '📈',
              title: 'Analytics Dashboard',
              description: 'Track winners across meetings. Export stats to CSV. Historical data at your fingertips.',
              gradient: 'from-violet-500/10 to-purple-500/10',
              border: 'border-violet-500/20',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.border} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Up and Running in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
              3 Minutes
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Create Your Club',
              description: 'Sign up, name your club, and invite members. 30-day Pro trial starts automatically.',
              color: 'from-purple-500 to-indigo-500',
            },
            {
              step: '02',
              title: 'Start a Meeting',
              description: 'Create a meeting, pick voting categories, and open voting with one click.',
              color: 'from-cyan-500 to-blue-500',
            },
            {
              step: '03',
              title: 'Vote & Celebrate',
              description: 'Members vote from their phones. Close voting and see instant winners!',
              color: 'from-green-500 to-emerald-500',
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg`}>
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Simple,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Transparent
            </span>{' '}
            Pricing
          </h2>
          <p className="text-gray-500 text-lg">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-300 mb-1">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">₹0</span>
                <span className="text-gray-500">/ forever</span>
              </div>
            </div>

            <p className="text-gray-400 mb-8">Perfect for small clubs getting started.</p>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Up to 25 members',
                '4 meetings per month',
                '5 default voting categories',
                'Real-time results',
                'Secure one-vote-per-member',
                'Guest voting support',
                '30-day Pro trial included',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="block text-center py-3 px-6 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-3xl border-2 border-purple-500/50 bg-gradient-to-b from-purple-900/20 to-indigo-900/20 backdrop-blur-sm p-8 flex flex-col">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-sm font-bold shadow-lg shadow-purple-500/30">
              ⭐ MOST POPULAR
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-xl font-bold text-purple-300 mb-1">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">₹499</span>
                <span className="text-gray-400">/ month</span>
              </div>
              <p className="text-sm text-purple-300 mt-1">or ₹4,999/year (save 17%)</p>
            </div>

            <p className="text-gray-400 mb-8">For active clubs that need the full experience.</p>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited members',
                'Unlimited meetings',
                'Unlimited custom categories',
                'Statistics & analytics dashboard',
                'Excel / CSV import & export',
                'QR code check-in',
                'Anonymous voting mode',
                'Audit logs & history',
                'Multi-admin support',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-200">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="block text-center py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-500/25"
            >
              Start 30-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-10 md:p-16 text-center">
          <div className="text-5xl mb-6">💬</div>
          <blockquote className="text-2xl md:text-3xl font-semibold text-gray-200 mb-6 leading-snug max-w-3xl mx-auto">
            &ldquo;ToastVote completely transformed how we run elections. What used to take 20 minutes with paper ballots now takes 30 seconds.&rdquo;
          </blockquote>
          <div className="text-gray-400">
            <span className="font-semibold text-gray-300">Rajesh Kumar</span>
            {' '}· Club President, Hyderabad Toastmasters
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Modernize
          </span>{' '}
          Your Club?
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Join hundreds of Toastmasters clubs already using ToastVote. Your 30-day Pro trial starts immediately.
        </p>
        <Link
          href="/register"
          className="inline-block px-10 py-4 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-2xl shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
        >
          Get Started for Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/20">
                T
              </div>
              <span className="text-sm font-semibold text-gray-400">
                ToastVote — Modern Voting for Toastmasters
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-gray-300 transition">Sign In</Link>
              <Link href="/register" className="hover:text-gray-300 transition">Register</Link>
              <a href="#pricing" className="hover:text-gray-300 transition">Pricing</a>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-600">
            © {new Date().getFullYear()} ToastVote. Made with ❤️ for Toastmasters.
          </div>
        </div>
      </footer>
    </div>
  );
}
