import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Thumbnail Tool</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Generate Emotion-Based Thumbnails with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create compelling YouTube thumbnails that make viewers feel something.
            Upload your images, get AI-powered concepts, and generate thumbnails in minutes.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700"
          >
            Start Free (5 Credits)
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-bold mb-3">1. Upload References</h3>
            <p className="text-gray-600">
              Upload 10-20 images of yourself. AI automatically selects the best 3-5 for generation.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-3">2. Generate Concepts</h3>
            <p className="text-gray-600">
              AI creates 10 emotion-based thumbnail concepts focused on viewer pain points.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3">3. Create Thumbnails</h3>
            <p className="text-gray-600">
              Select your favorite concepts and generate professional thumbnails with your face.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Why Emotion-Based Thumbnails?</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>People click on feelings, not logic - focus on viewer pain points</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Facial expressions carry 80% of the emotion - use realistic poses</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Simple scenes work best - face + background + text only</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Everyday language resonates better than formal descriptions</span>
            </li>
          </ul>
        </div>
      </main>

      <footer className="bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>© 2026 Thumbnail Tool. Powered by Gemini AI.</p>
        </div>
      </footer>
    </div>
  )
}
