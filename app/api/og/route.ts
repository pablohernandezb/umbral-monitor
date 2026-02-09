import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Try to get language from query parameter first, then referer as fallback
  const searchParams = request.nextUrl.searchParams
  const langParam = searchParams.get('lang')

  let lang = 'es' // default

  if (langParam === 'en' || langParam === 'es') {
    lang = langParam
  } else {
    // Fallback to checking referer if no query param
    const referer = request.headers.get('referer') || ''
    const isEnglish = referer.includes('lang=en') || referer.includes('lang%3Den')
    lang = isEnglish ? 'en' : 'es'
  }

  const imagePath = join(process.cwd(), 'public', 'images', `og_${lang}.png`)

  try {
    const imageBuffer = await readFile(imagePath)

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    // Fallback to Spanish image if there's an error
    const fallbackPath = join(process.cwd(), 'public', 'images', 'og_es.png')
    const fallbackBuffer = await readFile(fallbackPath)

    return new Response(fallbackBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
}
