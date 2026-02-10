'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Zap, DollarSign } from 'lucide-react'

export default function GeneratePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [qualityMode, setQualityMode] = useState<'fast' | 'hd'>('fast')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualityMode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/gallery')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
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
              <h1 className="text-xl font-bold text-gray-900">Generate Thumbnails</h1>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Quality Mode</h2>
          <p className="text-gray-700 mb-8">
            Select the quality mode for your thumbnails. This will generate thumbnails for all selected concepts.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Thumbnails generated successfully! Redirecting to gallery...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
              onClick={() => setQualityMode('fast')}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                qualityMode === 'fast'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Fast Mode</h3>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-700">✓ Quick generation (30-60 seconds)</p>
                <p className="text-gray-700">✓ Good quality (512x512px)</p>
                <p className="text-gray-700">✓ Perfect for testing ideas</p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">$0.05</span>
                <span className="text-gray-600">per thumbnail</span>
              </div>
            </div>

            <div
              onClick={() => setQualityMode('hd')}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                qualityMode === 'hd'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                  PREMIUM
                </div>
                <h3 className="text-xl font-bold text-gray-900">HD Mode</h3>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-700">✓ High resolution (1024x1024px)</p>
                <p className="text-gray-700">✓ Maximum detail</p>
                <p className="text-gray-700">✓ Production-ready quality</p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">$0.24</span>
                <span className="text-gray-600">per thumbnail</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-900">
              <span className="font-bold">Note:</span> This will generate thumbnails for all your selected concepts.
              Estimated cost: {qualityMode === 'fast' ? '$0.05-$0.50' : '$0.24-$2.40'} depending on number of concepts.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating Thumbnails...' : `Generate with ${qualityMode === 'fast' ? 'Fast' : 'HD'} Mode`}
          </button>
        </div>
      </main>
    </div>
  )
}
