'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Sparkles, CheckCircle, Image } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UploadedImage {
  file: File
  preview: string
}

interface Concept {
  id: string
  name_ar: string
  name_en: string
  emotion: string
  expression: string
  why_it_works: string
}

type Step = 'upload' | 'concepts' | 'generating' | 'done'

export default function WorkflowPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('upload')

  // Upload state
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  // Concepts state
  const [videoTitle, setVideoTitle] = useState('')
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])
  const [generatingConcepts, setGeneratingConcepts] = useState(false)
  const [conceptError, setConceptError] = useState('')

  // Thumbnail generation state
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false)
  const [generateError, setGenerateError] = useState('')

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
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      if (images.length + acceptedFiles.length > 5) {
        setUploadError('Maximum 5 images allowed')
        return
      }
      const newImages = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setImages((prev) => [...prev, ...newImages])
      setUploadError('')
    },
    onDropRejected: (rejections) => {
      setUploadError(rejections[0]?.errors[0]?.message || 'Invalid file')
    },
  })

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].preview)
      next.splice(index, 1)
      return next
    })
  }

  const handleUpload = async () => {
    if (images.length < 3) {
      setUploadError('Please upload at least 3 images')
      return
    }
    if (!user) return

    setUploading(true)
    setUploadError('')
    setUploadProgress(0)

    try {
      const uploadedPaths: { storagePath: string; publicUrl: string; fileSize: number; mimeType: string }[] = []

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const fileName = `${user.id}/${Date.now()}-${img.file.name}`

        const { error: storageError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, img.file, {
            contentType: img.file.type,
            upsert: false,
          })

        if (storageError) throw new Error(`Failed to upload ${img.file.name}: ${storageError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName)

        uploadedPaths.push({
          storagePath: fileName,
          publicUrl,
          fileSize: img.file.size,
          mimeType: img.file.type,
        })

        setUploadProgress(Math.round(((i + 1) / images.length) * 100))
      }

      // Tell the API about the uploaded files (just metadata, no file bytes)
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploads: uploadedPaths }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save image records')

      setStep('concepts')
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateConcepts = async () => {
    if (!videoTitle.trim()) {
      setConceptError('Please enter a video title')
      return
    }

    setGeneratingConcepts(true)
    setConceptError('')

    try {
      const response = await fetch('/api/concepts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoTitle }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Concept generation failed')

      setConcepts(data.concepts)
      setSelectedConcepts(data.concepts.map((c: Concept) => c.id))
    } catch (err: any) {
      setConceptError(err.message)
    } finally {
      setGeneratingConcepts(false)
    }
  }

  const toggleConcept = (id: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    )
  }

  const handleGenerateThumbnails = async () => {
    if (selectedConcepts.length === 0) {
      setGenerateError('Please select at least one concept')
      return
    }

    setGeneratingThumbnails(true)
    setGenerateError('')
    setStep('generating')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptIds: selectedConcepts }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')

      setStep('done')
      setTimeout(() => router.push('/dashboard/gallery'), 1500)
    } catch (err: any) {
      setGenerateError(err.message)
      setStep('concepts')
    } finally {
      setGeneratingThumbnails(false)
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Thumbnail Generator</h1>
            </div>
            <div className="flex items-center">
              <button onClick={() => router.push('/dashboard')} className="text-gray-700 hover:text-gray-900">
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-3 text-sm">
          <span className={`flex items-center gap-1 font-medium ${step === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step === 'upload' ? 'bg-blue-600' : 'bg-green-600'}`}>
              {step === 'upload' ? '1' : '✓'}
            </span>
            Reference Images
          </span>
          <span className="text-gray-400">→</span>
          <span className={`flex items-center gap-1 font-medium ${step === 'concepts' ? 'text-blue-600' : step === 'generating' || step === 'done' ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step === 'concepts' ? 'bg-blue-600' : step === 'generating' || step === 'done' ? 'bg-green-600' : 'bg-gray-300'}`}>
              {step === 'generating' || step === 'done' ? '✓' : '2'}
            </span>
            Concepts
          </span>
          <span className="text-gray-400">→</span>
          <span className={`flex items-center gap-1 font-medium ${step === 'generating' || step === 'done' ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${step === 'generating' || step === 'done' ? 'bg-blue-600' : 'bg-gray-300'}`}>
              {step === 'done' ? '✓' : '3'}
            </span>
            Generate
          </span>
        </div>

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Upload Reference Images</h2>
            <p className="text-gray-600 text-sm mb-6">Upload 3-5 photos of yourself for the AI to use as reference.</p>

            {uploadError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {uploadError}
              </div>
            )}

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              {isDragActive ? (
                <p className="text-gray-700">Drop here...</p>
              ) : (
                <>
                  <p className="text-gray-900 font-medium mb-1">Drag & drop or click to select</p>
                  <p className="text-sm text-gray-500">3–5 images, JPG/PNG/WEBP up to 10MB each</p>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-gray-900">{images.length}/5 images selected</p>
                  <button onClick={() => setImages([])} className="text-red-600 hover:text-red-700 text-sm">
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Ref ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {uploading && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading || images.length < 3}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? 'Uploading...' : `Upload ${images.length} Images & Continue`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Concepts */}
        {step === 'concepts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Generate Concepts</h2>
              <p className="text-gray-600 text-sm mb-4">Enter your video title and AI will generate 10 emotion-based thumbnail concepts.</p>

              {conceptError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {conceptError}
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateConcepts()}
                  placeholder="e.g., كيف تربح من اليوتيوب في 2025"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <button
                  onClick={handleGenerateConcepts}
                  disabled={generatingConcepts || !videoTitle.trim()}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  {generatingConcepts ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            {concepts.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                {generateError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {generateError}
                  </div>
                )}

                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900">
                    Select Concepts <span className="text-gray-500 font-normal text-sm">({selectedConcepts.length} selected)</span>
                  </h3>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => setSelectedConcepts(concepts.map(c => c.id))} className="text-blue-600 hover:text-blue-700">Select all</button>
                    <button onClick={() => setSelectedConcepts([])} className="text-gray-500 hover:text-gray-700">Clear</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {concepts.map((concept) => {
                    const isSelected = selectedConcepts.includes(concept.id)
                    return (
                      <div
                        key={concept.id}
                        onClick={() => toggleConcept(concept.id)}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-blue-600" />
                        )}
                        <h4 className="font-bold text-gray-900 mb-0.5">{concept.name_ar}</h4>
                        <p className="text-xs text-gray-500 mb-2">{concept.name_en}</p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Emotion:</span> {concept.emotion}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 italic">{concept.why_it_works}</p>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={handleGenerateThumbnails}
                  disabled={selectedConcepts.length === 0 || generatingThumbnails}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image className="h-5 w-5" />
                  Generate {selectedConcepts.length} Thumbnail{selectedConcepts.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Generating */}
        {step === 'generating' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Generating Thumbnails...</h2>
            <p className="text-gray-600">AI is creating {selectedConcepts.length} thumbnail{selectedConcepts.length !== 1 ? 's' : ''} based on your concepts.</p>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Done! Redirecting to gallery...</h2>
          </div>
        )}
      </main>
    </div>
  )
}
