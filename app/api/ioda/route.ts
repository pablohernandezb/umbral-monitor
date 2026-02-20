import { NextRequest, NextResponse } from 'next/server'

// Never expose this to the client — all IODA calls are proxied here
const IODA_BASE = 'https://api.ioda.inetintel.cc.gatech.edu/v2'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json(
      { error: 'Missing required "path" query parameter' },
      { status: 400 }
    )
  }

  // Forward all params except 'path' to the upstream IODA API
  const upstreamParams = new URLSearchParams()
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'path') {
      upstreamParams.set(key, value)
    }
  }

  const upstreamUrl = upstreamParams.toString()
    ? `${IODA_BASE}/${path}?${upstreamParams}`
    : `${IODA_BASE}/${path}`

  try {
    const response = await fetch(upstreamUrl, {
      // 5-minute server-side cache; IODA data is updated every few minutes
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `IODA upstream error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data: unknown = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to reach IODA API: ${message}` },
      { status: 502 }
    )
  }
}
