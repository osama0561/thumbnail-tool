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

    const { videoTitle } = await request.json()

    if (!videoTitle || typeof videoTitle !== 'string') {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 })
    }

    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({ model: GEMINI_MODELS.FLASH })

    const prompt = `Generate 10 emotion-based YouTube thumbnail concepts for this video: "${videoTitle}"

Focus on pain points and emotions that make viewers click. For each concept, provide:
1. Arabic name (2-4 words, attention-grabbing)
2. English translation
3. Emotion to convey
4. Facial expression description
5. Why it works psychologically

Respond with ONLY a JSON array in this exact format:
[
  {
    "name_ar": "الصدمة الكبرى",
    "name_en": "The Big Shock",
    "emotion": "shock",
    "expression": "wide eyes, open mouth, hand on cheek",
    "pose": "facing camera, slight head tilt",
    "scene": "close-up face shot",
    "background": "bright gradient blur",
    "arabic_text": "الصدمة",
    "text_position": "top-right",
    "text_style": "bold white with black outline",
    "why_it_works": "Shock triggers curiosity and fear of missing out"
  }
]

Generate all 10 concepts with variety in emotions: shock, curiosity, frustration, excitement, confusion, anger, hope, fear, surprise, satisfaction.`

    const result = await callGeminiWithRetry(async () => {
      return await model.generateContent(prompt)
    })

    const responseText = result.response.text()
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini response')
    }

    const concepts = JSON.parse(jsonMatch[0])

    if (!Array.isArray(concepts) || concepts.length === 0) {
      throw new Error('Invalid concepts format')
    }

    // Create a session ID for this batch of concepts
    const sessionId = crypto.randomUUID()

    // Save concepts to database
    const conceptsToInsert = concepts.slice(0, 10).map((concept, index) => ({
      user_id: user.id,
      video_title: videoTitle,
      concept_number: index + 1,
      name_ar: concept.name_ar,
      name_en: concept.name_en,
      emotion: concept.emotion,
      expression: concept.expression,
      pose: concept.pose || 'facing camera',
      scene: concept.scene || 'close-up',
      background: concept.background || 'gradient blur',
      arabic_text: concept.arabic_text || concept.name_ar,
      text_position: concept.text_position || 'top',
      text_style: concept.text_style || 'bold',
      why_it_works: concept.why_it_works || 'Emotion-driven design',
      session_id: sessionId,
    }))

    const { data: savedConcepts, error: dbError } = await supabase
      .from('thumbnail_concepts')
      .insert(conceptsToInsert)
      .select()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save concepts')
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'concept_generation',
      api_cost: 0.01,
      metadata: { video_title: videoTitle, concepts_generated: savedConcepts.length },
    })

    return NextResponse.json({
      success: true,
      concepts: savedConcepts,
      session_id: sessionId,
    })
  } catch (error: any) {
    console.error('Concept generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Concept generation failed' },
      { status: 500 }
    )
  }
}
