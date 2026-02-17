'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sparkles, Images } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Thumbnail Tool</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <button onClick={signOut} className="text-sm text-gray-700 hover:text-gray-900">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What do you want to do?</h2>
          <p className="text-gray-500">Upload your photos, generate concepts, and create thumbnails — all in one place.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/concepts')}
            className="flex flex-col items-center gap-4 p-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Sparkles className="h-12 w-12" />
            <div>
              <p className="text-xl font-bold">Create Thumbnails</p>
              <p className="text-blue-200 text-sm mt-1">Upload → Concepts → Generate</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/gallery')}
            className="flex flex-col items-center gap-4 p-10 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
          >
            <Images className="h-12 w-12 text-gray-600" />
            <div>
              <p className="text-xl font-bold">My Gallery</p>
              <p className="text-gray-500 text-sm mt-1">View & download thumbnails</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}
