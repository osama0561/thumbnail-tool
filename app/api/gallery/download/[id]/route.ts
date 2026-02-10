import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get thumbnail
    const { data: thumbnail, error } = await supabase
      .from('generated_thumbnails')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !thumbnail) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })
    }

    // Increment download count
    await supabase
      .from('generated_thumbnails')
      .update({ download_count: (thumbnail.download_count || 0) + 1 })
      .eq('id', id)

    // Fetch the image
    const imageResponse = await fetch(thumbnail.public_url)
    const imageBlob = await imageResponse.blob()

    // Return as downloadable file
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="thumbnail-${id}.jpg"`,
      },
    })
  } catch (error: any) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    )
  }
}
