import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const { concepts } = await request.json()

    if (!Array.isArray(concepts) || concepts.length === 0) {
      return NextResponse.json({ error: 'No concepts provided' }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const thumbnails = []

    for (const concept of concepts) {
      try {
        const prompt = `Professional YouTube thumbnail photo:
A person showing strong ${concept.emotion} emotion.
Face expression: ${concept.expression}.
Style: high contrast, vibrant colors, dramatic lighting, close-up face shot, photorealistic, eye-catching YouTube thumbnail.
Background: ${concept.background}.
Do NOT add any text or overlays to the image.`

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: prompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        })

        // Find image part in response
        const parts = response.candidates?.[0]?.content?.parts ?? []
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))

        if (!imagePart?.inlineData) {
          console.error('No image returned for concept:', concept.id)
          continue
        }

        const base64Data = imagePart.inlineData.data
        const mimeType = imagePart.inlineData.mimeType
        const ext = mimeType === 'image/png' ? 'png' : 'jpg'
        const fileName = `generated/${concept.id}-${Date.now()}.${ext}`

        const buffer = Buffer.from(base64Data, 'base64')
        const { error: uploadError } = await supabase.storage
          .from('generated-thumbnails')
          .upload(fileName, buffer, { contentType: mimeType, upsert: true })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('generated-thumbnails')
          .getPublicUrl(fileName)

        thumbnails.push({
          id: concept.id,
          concept_name_ar: concept.name_ar,
          concept_name_en: concept.name_en,
          emotion: concept.emotion,
          public_url: publicUrl,
        })
      } catch (err) {
        console.error('Error generating for concept:', concept.id, err)
      }
    }

    if (thumbnails.length === 0) {
      return NextResponse.json({ error: 'Failed to generate any thumbnails' }, { status: 500 })
    }

    return NextResponse.json({ success: true, thumbnails })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}
