'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Thumbnail Tool</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user.email}</span>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome to Thumbnail Tool!</h2>
          <p className="text-gray-600 mb-6">
            Create emotion-based thumbnails for your YouTube videos using AI.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">1. Upload Images</h3>
              <p className="text-gray-600 text-sm mb-4">
                Upload 10-20 reference images of yourself
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Coming Soon
              </button>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">2. Generate Concepts</h3>
              <p className="text-gray-600 text-sm mb-4">
                AI creates 10 emotion-based thumbnail ideas
              </p>
              <button className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">3. Generate Thumbnails</h3>
              <p className="text-gray-600 text-sm mb-4">
                Create final thumbnails with your chosen concepts
              </p>
              <button className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold mb-2">Your Quota</h3>
            <p className="text-gray-700">
              <span className="font-bold text-2xl text-blue-600">5</span> free generations remaining
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
