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

    const formData = await request.formData()
    const images = formData.getAll('images') as File[]

    if (images.length < 3 || images.length > 5) {
      return NextResponse.json(
        { error: 'Please upload between 3-5 images' },
        { status: 400 }
      )
    }

    const uploadedImages = []
    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({ model: GEMINI_MODELS.FLASH })

    // Upload and analyze each image
    for (const image of images) {
      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${image.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, image, {
          contentType: image.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(fileName)

      // Analyze image quality with Gemini
      const imageBytes = await image.arrayBuffer()
      const base64Image = Buffer.from(imageBytes).toString('base64')

      const prompt = `Analyze this image for use as a YouTube thumbnail reference. Rate the image quality from 0.0 to 1.0 based on:
- Clear, well-lit face (30%)
- Good expression/emotion visibility (30%)
- Image sharpness and resolution (20%)
- Appropriate framing (head and shoulders visible) (20%)

Respond with ONLY a JSON object in this exact format:
{
  "quality_score": 0.85,
  "notes": "Clear face, good lighting, expressive"
}`

      try {
        const result = await callGeminiWithRetry(async () => {
          return await model.generateContent([
            {
              inlineData: {
                mimeType: image.type,
                data: base64Image,
              },
            },
            { text: prompt },
          ])
        })

        const responseText = result.response.text()
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { quality_score: 0.5, notes: 'Analysis failed' }

        // Store in database
        const { data: dbData, error: dbError } = await supabase
          .from('uploaded_images')
          .insert({
            user_id: user.id,
            storage_path: fileName,
            public_url: publicUrl,
            file_size: image.size,
            mime_type: image.type,
            quality_score: analysis.quality_score,
            analysis_notes: { notes: analysis.notes },
          })
          .select()
          .single()

        if (!dbError && dbData) {
          uploadedImages.push(dbData)
        }
      } catch (error) {
        console.error('Gemini analysis error:', error)
        // Still save the image even if analysis fails
        const { data: dbData } = await supabase
          .from('uploaded_images')
          .insert({
            user_id: user.id,
            storage_path: fileName,
            public_url: publicUrl,
            file_size: image.size,
            mime_type: image.type,
            quality_score: 0.5,
            analysis_notes: { notes: 'Analysis failed' },
          })
          .select()
          .single()

        if (dbData) uploadedImages.push(dbData)
      }
    }

    // Select all uploaded images (since we only have 3-5)
    for (const img of uploadedImages) {
      await supabase
        .from('uploaded_images')
        .update({ is_selected: true })
        .eq('id', img.id)
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'image_upload',
      api_cost: 0.005 * images.length,
      metadata: { images_uploaded: images.length, images_selected: uploadedImages.length },
    })

    return NextResponse.json({
      success: true,
      uploaded: uploadedImages.length,
      selected: uploadedImages.length,
      images: uploadedImages,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
