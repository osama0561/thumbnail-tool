'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle } from 'lucide-react'

interface Concept {
  id: string
  name_ar: string
  name_en: string
  emotion: string
  expression: string
  why_it_works: string
}

export default function ConceptsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [videoTitle, setVideoTitle] = useState('')
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleGenerate = async () => {
    if (!videoTitle.trim()) {
      setError('Please enter a video title')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/concepts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoTitle }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setConcepts(data.concepts)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const toggleConcept = (id: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    )
  }

  const handleContinue = () => {
    if (selectedConcepts.length === 0) {
      setError('Please select at least one concept')
      return
    }
    router.push('/dashboard/generate')
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Generate Concepts</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Thumbnail Concepts</h2>
          <p className="text-gray-700 mb-6">
            Enter your video title and AI will generate 10 emotion-based thumbnail concepts.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-900 mb-2">
                Video Title
              </label>
              <input
                id="videoTitle"
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g., كيف تربح من اليوتيوب في 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !videoTitle.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Sparkles className="h-5 w-5" />
              {generating ? 'Generating Concepts...' : 'Generate 10 Concepts'}
            </button>
          </div>
        </div>

        {concepts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Select Concepts to Generate ({selectedConcepts.length} selected)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {concepts.map((concept) => {
                const isSelected = selectedConcepts.includes(concept.id)
                return (
                  <div
                    key={concept.id}
                    onClick={() => toggleConcept(concept.id)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle className="absolute top-3 right-3 h-6 w-6 text-blue-600" />
                    )}

                    <h4 className="font-bold text-lg text-gray-900 mb-1">{concept.name_ar}</h4>
                    <p className="text-sm text-gray-600 mb-3">{concept.name_en}</p>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-900">
                        <span className="font-medium">Emotion:</span> {concept.emotion}
                      </p>
                      <p className="text-gray-900">
                        <span className="font-medium">Expression:</span> {concept.expression}
                      </p>
                    </div>

                    <p className="mt-3 text-xs text-gray-700 italic">{concept.why_it_works}</p>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                disabled={selectedConcepts.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Continue to Generation ({selectedConcepts.length} concepts)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
