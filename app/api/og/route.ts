import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Get the referer to check for lang parameter
  const referer = request.headers.get('referer') || ''

  // Check if the referer contains lang=en
  const isEnglish = referer.includes('lang=en') || referer.includes('lang%3Den')

  // Determine which image to serve
  const lang = isEnglish ? 'en' : 'es'
  const imagePath = join(process.cwd(), 'public', 'images', `og_${lang}.png`)

  try {
    const imageBuffer = await readFile(imagePath)

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    // Fallback to Spanish image if there's an error
    const fallbackPath = join(process.cwd(), 'public', 'images', 'og_es.png')
    const fallbackBuffer = await readFile(fallbackPath)

    return new Response(fallbackBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}
