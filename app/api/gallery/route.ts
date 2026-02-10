import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's thumbnails with concept details
    const { data: thumbnails, error } = await supabase
      .from('generated_thumbnails')
      .select(`
        *,
        thumbnail_concepts (
          name_ar,
          name_en,
          emotion,
          expression
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Gallery fetch error:', error)
      throw new Error('Failed to load thumbnails')
    }

    return NextResponse.json({
      success: true,
      thumbnails: thumbnails || [],
    })
  } catch (error: any) {
    console.error('Gallery error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load gallery' },
      { status: 500 }
    )
  }
}
