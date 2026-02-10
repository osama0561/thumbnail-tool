import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getGeminiClient, GEMINI_MODELS, callGeminiWithRetry } from '@/lib/gemini/client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { qualityMode } = await request.json()

    if (!qualityMode || !['fast', 'hd'].includes(qualityMode)) {
      return NextResponse.json({ error: 'Invalid quality mode' }, { status: 400 })
    }

    // Check quota
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('quota_remaining')
      .eq('id', user.id)
      .single()

    if (!profile || profile.quota_remaining <= 0) {
      return NextResponse.json({ error: 'No quota remaining' }, { status: 403 })
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
      return NextResponse.json({ error: 'No selected images found. Please upload images first.' }, { status: 400 })
    }

    // Get latest concepts for this user
    const { data: concepts } = await supabase
      .from('thumbnail_concepts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ error: 'No concepts found. Please generate concepts first.' }, { status: 400 })
    }

    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({ model: GEMINI_MODELS.IMAGEN })

    const generatedThumbnails = []
    const costPerImage = qualityMode === 'fast' ? 0.05 : 0.24

    // Generate thumbnails for each concept
    for (const concept of concepts.slice(0, Math.min(concepts.length, profile.quota_remaining))) {
      const startTime = Date.now()

      try {
        // Build prompt for Imagen
        const prompt = `Professional YouTube thumbnail image:

Subject: Person showing ${concept.emotion} emotion
Expression: ${concept.expression}
Pose: ${concept.pose}
Scene: ${concept.scene}
Background: ${concept.background}

Text overlay: "${concept.arabic_text}" in ${concept.text_style} style at ${concept.text_position}

Style: High contrast, vibrant colors, professional lighting, eye-catching, YouTube thumbnail aesthetic, 16:9 aspect ratio`

        // Note: Actual Imagen API call would go here
        // For now, we'll simulate the generation
        // const result = await callGeminiWithRetry(async () => {
        //   return await model.generateImages({
        //     prompt,
        //     numberOfImages: 1,
        //     aspectRatio: '16:9',
        //   })
        // })

        // Simulated response - in production, this would be the actual Imagen response
        const simulatedImageUrl = `https://via.placeholder.com/1280x720/4F46E5/FFFFFF?text=${encodeURIComponent(concept.name_en)}`

        const generationTime = Date.now() - startTime

        // In production, you would:
        // 1. Download the generated image from Imagen
        // 2. Upload it to Supabase Storage
        // 3. Get the public URL

        // For now, we'll store the simulated URL
        const fileName = `${user.id}/${Date.now()}-${concept.id}.jpg`

        // Simulate storage upload
        const publicUrl = simulatedImageUrl

        // Store in database
        const { data: thumbnail, error: dbError } = await supabase
          .from('generated_thumbnails')
          .insert({
            user_id: user.id,
            concept_id: concept.id,
            storage_path: fileName,
            public_url: publicUrl,
            file_size: 100000, // Simulated
            quality_mode: qualityMode,
            model_used: GEMINI_MODELS.IMAGEN,
            generation_time_ms: generationTime,
            cost: costPerImage,
          })
          .select()
          .single()

        if (!dbError && thumbnail) {
          generatedThumbnails.push(thumbnail)
        }

        // Deduct quota
        await supabase
          .from('user_profiles')
          .update({
            quota_remaining: profile.quota_remaining - 1,
            total_used: (profile.quota_remaining || 0) + 1,
            api_cost_total: (profile.api_cost_total || 0) + costPerImage,
          })
          .eq('id', user.id)

        // Update quota for next iteration
        profile.quota_remaining -= 1

        if (profile.quota_remaining <= 0) {
          break
        }
      } catch (error) {
        console.error('Generation error for concept:', concept.id, error)
        // Continue with next concept
      }
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'thumbnail_generation',
      api_cost: costPerImage * generatedThumbnails.length,
      metadata: {
        quality_mode: qualityMode,
        thumbnails_generated: generatedThumbnails.length,
      },
    })

    if (generatedThumbnails.length === 0) {
      return NextResponse.json({ error: 'Failed to generate thumbnails' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      generated: generatedThumbnails.length,
      thumbnails: generatedThumbnails,
      quota_remaining: profile.quota_remaining,
    })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
