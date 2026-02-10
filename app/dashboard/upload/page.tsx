'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'

interface UploadedImage {
  file: File
  preview: string
}

export default function UploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setImages((prev) => [...prev, ...newImages])
      setError('')
    },
    onDropRejected: (rejections) => {
      setError(rejections[0]?.errors[0]?.message || 'Invalid file')
    },
  })

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const handleUpload = async () => {
    if (images.length < 10) {
      setError('Please upload at least 10 images')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      images.forEach((img) => {
        formData.append('images', img.file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      router.push('/dashboard/concepts')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
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
              <h1 className="text-xl font-bold text-gray-900">Upload Images</h1>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Reference Images</h2>
          <p className="text-gray-700 mb-6">
            Upload 10-20 images of yourself. AI will analyze and select the best 3-5 for thumbnail generation.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg text-gray-700">Drop the images here...</p>
            ) : (
              <>
                <p className="text-lg text-gray-900 mb-2">Drag & drop images here, or click to select</p>
                <p className="text-sm text-gray-600">JPG, PNG, WEBP up to 10MB each</p>
              </>
            )}
          </div>

          {images.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900">
                  Selected Images ({images.length}/20)
                </h3>
                <button
                  onClick={() => setImages([])}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading || images.length < 10}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? 'Uploading...' : `Upload ${images.length} Images`}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
