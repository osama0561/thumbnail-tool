'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Download, Heart } from 'lucide-react'

interface Thumbnail {
  id: string
  public_url: string
  quality_mode: string
  created_at: string
  is_favorited: boolean
  thumbnail_concepts: {
    name_ar: string
    name_en: string
  }
}

export default function GalleryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [loadingGallery, setLoadingGallery] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      loadThumbnails()
    }
  }, [user, loading, router])

  const loadThumbnails = async () => {
    try {
      const response = await fetch('/api/gallery')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load gallery')
      }

      setThumbnails(data.thumbnails)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingGallery(false)
    }
  }

  const handleDownload = async (thumbnailId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/gallery/download/${thumbnailId}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'thumbnail.jpg'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (loading || loadingGallery) {
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
              <h1 className="text-xl font-bold text-gray-900">Thumbnail Gallery</h1>
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
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {thumbnails.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Thumbnails Yet</h3>
            <p className="text-gray-700 mb-6">
              Generate your first thumbnail to see it here!
            </p>
            <button
              onClick={() => router.push('/dashboard/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Get Started
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Thumbnails</h2>
                  <p className="text-gray-700">{thumbnails.length} thumbnails generated</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {thumbnails.map((thumbnail) => (
                <div key={thumbnail.id} className="bg-white rounded-lg shadow overflow-hidden group">
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={thumbnail.public_url}
                      alt={thumbnail.thumbnail_concepts?.name_en || 'Thumbnail'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                      <button
                        onClick={() => handleDownload(thumbnail.id, `${thumbnail.thumbnail_concepts?.name_en || 'thumbnail'}.jpg`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {thumbnail.thumbnail_concepts?.name_ar || 'Unnamed'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {thumbnail.thumbnail_concepts?.name_en || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {thumbnail.quality_mode.toUpperCase()}
                      </span>
                      <span>
                        {new Date(thumbnail.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
