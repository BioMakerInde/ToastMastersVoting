export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Toastmasters Voting System
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Streamline your club voting process with our modern, secure platform
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🗳️</div>
              <h3 className="text-xl font-semibold mb-2">Easy Voting</h3>
              <p className="text-gray-600">
                Vote for Best Speaker, Best Table Topic, and more with just a few clicks
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
              <p className="text-gray-600">
                View results instantly after voting closes with detailed analytics
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure & Fair</h3>
              <p className="text-gray-600">
                One vote per member per category ensures fair and transparent voting
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Login
            </a>
            <a
              href="/register"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              Register
            </a>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-left bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Key Features</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Member registration and club management</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Dynamic voting categories (customizable per club)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Time-bound voting sessions with admin controls</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>QR code integration for quick member check-in</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Role-based access (Admin, Officer, Member, Guest)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Historical voting data and analytics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
