import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uploads } = await request.json()

    if (!Array.isArray(uploads) || uploads.length < 3 || uploads.length > 5) {
      return NextResponse.json({ error: 'Please upload between 3-5 images' }, { status: 400 })
    }

    const insertedImages = []

    for (const upload of uploads) {
      const { storagePath, publicUrl, fileSize, mimeType } = upload

      const { data: dbData, error: dbError } = await supabase
        .from('uploaded_images')
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          public_url: publicUrl,
          file_size: fileSize,
          mime_type: mimeType,
          quality_score: 0.8,
          analysis_notes: { notes: 'Uploaded directly' },
          is_selected: true,
        })
        .select()
        .single()

      if (!dbError && dbData) {
        insertedImages.push(dbData)
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: insertedImages.length,
      images: insertedImages,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
