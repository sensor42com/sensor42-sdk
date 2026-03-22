import { describe, expect, it, vi } from 'vitest'

import { Sensor42ApiError, Sensor42Client } from '../src/index.js'

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers)
  headers.set('content-type', 'application/json')

  return new Response(JSON.stringify(body), {
    ...init,
    status: init?.status ?? 200,
    headers,
  })
}

describe('Sensor42Client', () => {
  it('uses X-API-Key auth by default and parses response metadata', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://api.sensor42.com/api/v7/apps/1545593132/info')

      const headers = new Headers(init?.headers)
      expect(headers.get('X-API-Key')).toBe('test-key')
      expect(headers.get('Accept')).toBe('application/json')

      return jsonResponse(
        {
          app_id: 1545593132,
          title: 'Weather App',
          all_markets_reviews: 1280,
        },
        {
          headers: {
            'X-Credits-Charged': '5',
            'X-Credits-Balance': '95',
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '59',
            'X-RateLimit-Reset': '22',
          },
        },
      )
    })

    const client = new Sensor42Client({ apiKey: 'test-key', fetch: fetchMock })
    const result = await client.apps.getInfo(1545593132)

    expect(result.data.app_id).toBe(1545593132)
    expect(result.meta.credits.charged).toBe(5)
    expect(result.meta.credits.balance).toBe(95)
    expect(result.meta.rateLimit.limit).toBe(60)
    expect(result.meta.rateLimit.remaining).toBe(59)
    expect(result.meta.rateLimit.reset).toBe(22)
  })

  it('serializes apps search params into Sensor42 query aliases', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))

      expect(url.pathname).toBe('/api/v7/apps/search')
      expect(url.searchParams.get('q')).toBe('weather tracker')
      expect(url.searchParams.get('category_ids')).toBe('6001,6002')
      expect(url.searchParams.get('first_release_from')).toBe('2024-01-05')
      expect(url.searchParams.get('page')).toBe('2')
      expect(url.searchParams.get('page_size')).toBe('20')
      expect(url.searchParams.get('sort_by')).toBe('avg_speed_per_day')
      expect(url.searchParams.get('sort_dir')).toBe('asc')

      return jsonResponse({
        limit: 20,
        offset: 20,
        total: 1,
        total_pages: 1,
        items: [],
      })
    })

    const client = new Sensor42Client({ apiKey: 'test-key', fetch: fetchMock })
    await client.apps.search({
      q: 'weather tracker',
      categoryIds: [6001, 6002],
      firstReleaseFrom: new Date('2024-01-05T15:20:00.000Z'),
      page: 2,
      pageSize: 20,
      sortBy: 'avg_speed_per_day',
      sortDir: 'asc',
    })
  })

  it('supports bearer auth mode', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('Authorization')).toBe('Bearer bearer-key')
      expect(headers.has('X-API-Key')).toBe(false)

      return jsonResponse({
        generated_at: null,
        topics: [],
        terms: [],
      })
    })

    const client = new Sensor42Client({
      apiKey: 'bearer-key',
      authMode: 'bearer',
      fetch: fetchMock,
    })

    await client.trends.getOverview()
  })

  it('supports query-string auth mode', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input))
      const headers = new Headers(init?.headers)

      expect(url.searchParams.get('api_key')).toBe('query-key')
      expect(headers.has('X-API-Key')).toBe(false)
      expect(headers.has('Authorization')).toBe(false)

      return jsonResponse({
        app_id: 42,
        total: 0,
        items: [],
      })
    })

    const client = new Sensor42Client({
      apiKey: 'query-key',
      authMode: 'query',
      fetch: fetchMock,
    })

    await client.apps.getKeywords(42)
  })

  it('returns CSV responses as text and forces format=csv', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input))
      const headers = new Headers(init?.headers)

      expect(url.searchParams.get('format')).toBe('csv')
      expect(url.searchParams.get('q')).toBe('weather')
      expect(headers.get('Accept')).toBe('text/csv')

      return new Response('app_id,title\n1,Weather\n', {
        status: 200,
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="apps_search_0_20.csv"',
        },
      })
    })

    const client = new Sensor42Client({ apiKey: 'test-key', fetch: fetchMock })
    const result = await client.apps.searchCsv({ q: 'weather' })

    expect(result.data).toContain('app_id,title')
    expect(result.meta.contentDisposition).toContain('apps_search_0_20.csv')
  })

  it('uses the group slug alias for trends routes', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input))

      expect(url.pathname).toBe('/api/v7/trends/groups/slug/weather_apps/apps')
      expect(url.searchParams.get('market')).toBe('ua')
      expect(url.searchParams.get('sort_by')).toBe('recent_speed')

      return jsonResponse({
        topic_id: 7,
        topic_slug: 'weather_apps',
        topic_name: 'Weather Apps',
        market: 'ua',
        available_markets: ['ua', 'us'],
        page: 1,
        page_size: 20,
        limit: 20,
        offset: 0,
        total: 1,
        total_pages: 1,
        items: [],
      })
    })

    const client = new Sensor42Client({ apiKey: 'test-key', fetch: fetchMock })
    await client.trends.getGroupAppsBySlug('weather_apps', {
      market: 'ua',
      sortBy: 'recent_speed',
    })
  })

  it('throws Sensor42ApiError with headers and response body on non-2xx responses', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('rate limit exceeded', {
        status: 429,
        headers: {
          'retry-after': '30',
          'X-RateLimit-Remaining': '0',
        },
      })
    })

    const client = new Sensor42Client({ apiKey: 'test-key', fetch: fetchMock })

    await expect(client.apps.getMeta(99)).rejects.toBeInstanceOf(Sensor42ApiError)

    try {
      await client.apps.getMeta(99)
    } catch (error) {
      const apiError = error as Sensor42ApiError
      expect(apiError.status).toBe(429)
      expect(apiError.body).toBe('rate limit exceeded')
      expect(apiError.meta.rateLimit.retryAfter).toBe(30)
      expect(apiError.meta.rateLimit.remaining).toBe(0)
    }
  })
})
