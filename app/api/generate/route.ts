import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GEMINI_MODELS } from '@/lib/gemini/client'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { concepts } = await request.json()

    if (!Array.isArray(concepts) || concepts.length === 0) {
      return NextResponse.json({ error: 'No concepts provided' }, { status: 400 })
    }

    const generatedThumbnails = []

    for (const concept of concepts) {
      const startTime = Date.now()

      // Simulated — replace with real Imagen call when ready
      const simulatedImageUrl = `https://via.placeholder.com/1280x720/4F46E5/FFFFFF?text=${encodeURIComponent(concept.name_en)}`
      const generationTime = Date.now() - startTime

      generatedThumbnails.push({
        id: concept.id,
        concept_name_ar: concept.name_ar,
        concept_name_en: concept.name_en,
        emotion: concept.emotion,
        public_url: simulatedImageUrl,
        quality_mode: 'fast',
        generation_time_ms: generationTime,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      generated: generatedThumbnails.length,
      thumbnails: generatedThumbnails,
    })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}
