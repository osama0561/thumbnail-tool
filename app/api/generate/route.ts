import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getGeminiClient, GEMINI_MODELS, callGeminiWithRetry } from '@/lib/gemini/client'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conceptIds } = await request.json()

    if (!Array.isArray(conceptIds) || conceptIds.length === 0) {
      return NextResponse.json({ error: 'No concepts selected' }, { status: 400 })
    }

    // Get selected images
    const { data: selectedImages } = await supabase
      .from('uploaded_images')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_selected', true)
      .order('quality_score', { ascending: false })
      .limit(5)

    if (!selectedImages || selectedImages.length === 0) {
      return NextResponse.json({ error: 'No reference images found. Please upload images first.' }, { status: 400 })
    }

    // Get the selected concepts
    const { data: concepts } = await supabase
      .from('thumbnail_concepts')
      .select('*')
      .in('id', conceptIds)
      .eq('user_id', user.id)

    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ error: 'No concepts found.' }, { status: 400 })
    }

    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({ model: GEMINI_MODELS.IMAGEN })

    const generatedThumbnails = []

    for (const concept of concepts) {
      const startTime = Date.now()

      try {
        const prompt = `Professional YouTube thumbnail image:

Subject: Person showing ${concept.emotion} emotion
Expression: ${concept.expression}
Pose: ${concept.pose}
Scene: ${concept.scene}
Background: ${concept.background}

Text overlay: "${concept.arabic_text}" in ${concept.text_style} style at ${concept.text_position}

Style: High contrast, vibrant colors, professional lighting, eye-catching, YouTube thumbnail aesthetic, 16:9 aspect ratio`

        // Simulated response — replace with real Imagen call when available
        const simulatedImageUrl = `https://via.placeholder.com/1280x720/4F46E5/FFFFFF?text=${encodeURIComponent(concept.name_en)}`

        const generationTime = Date.now() - startTime
        const fileName = `${user.id}/${Date.now()}-${concept.id}.jpg`

        const { data: thumbnail, error: dbError } = await supabase
          .from('generated_thumbnails')
          .insert({
            user_id: user.id,
            concept_id: concept.id,
            storage_path: fileName,
            public_url: simulatedImageUrl,
            file_size: 100000,
            quality_mode: 'fast',
            model_used: GEMINI_MODELS.IMAGEN,
            generation_time_ms: generationTime,
            cost: 0,
          })
          .select()
          .single()

        if (!dbError && thumbnail) {
          generatedThumbnails.push(thumbnail)
        }
      } catch (error) {
        console.error('Generation error for concept:', concept.id, error)
      }
    }

    if (generatedThumbnails.length === 0) {
      return NextResponse.json({ error: 'Failed to generate thumbnails' }, { status: 500 })
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
