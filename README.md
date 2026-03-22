# Sensor42 SDK for Node.js

Typed Node.js client for the [Sensor42 platform](https://sensor42.com), the public API docs at [sensor42.com/api](https://sensor42.com/api), and the authenticated API base at [api.sensor42.com](https://api.sensor42.com).

This project wraps the documented Sensor42 v7 endpoints into a small, practical SDK for backend services, scripts, ETL jobs, dashboards, AI agents, and internal tooling. Instead of hand-writing `fetch()` calls, auth headers, CSV handling, rate-limit parsing, and repetitive query-string logic for every integration, you get one consistent client.

## Why this project exists

Sensor42 already exposes a clean HTTP API for App Store intelligence, ASO research, app discovery, and trend tracking. The missing piece for many teams is a focused Node.js client that makes the API pleasant to use in real codebases.

This SDK is useful when you want to:

- query App Store app intelligence from Node.js without repeatedly hand-building URLs
- read credit usage and rate-limit headers on every request
- export CSV from search and trends endpoints without custom plumbing
- integrate Sensor42 app search and trends data into your own SaaS, CRM, ETL pipeline, or reporting jobs
- keep a codebase strongly typed instead of passing raw JSON around
- use both the public app endpoints and the live trends endpoints from one client

## What it covers

The client mirrors the current documented v7 surface from Sensor42:

| Area | Endpoint | Sensor42 link |
| --- | --- | --- |
| App info | `GET /api/v7/apps/{app_id}/info` | [Live example](https://api.sensor42.com/api/v7/apps/1545593132/info) |
| App keywords | `GET /api/v7/apps/{app_id}/keywords` | [Live example](https://api.sensor42.com/api/v7/apps/1545593132/keywords) |
| App markets | `GET /api/v7/apps/{app_id}/markets` | [Live example](https://api.sensor42.com/api/v7/apps/1545593132/markets?sort_by=share&sort_dir=desc) |
| App metadata | `GET /api/v7/apps/{app_id}/meta` | [Live example](https://api.sensor42.com/api/v7/apps/1545593132/meta) |
| App search | `GET /api/v7/apps/search` | [Live example](https://api.sensor42.com/api/v7/apps/search?q=weather&limit=20&offset=0) |
| Trends overview | `GET /api/v7/trends` or `GET /api/v7/trends/overview` | [Live example](https://api.sensor42.com/api/v7/trends/overview) |
| Trends topic/group apps | `GET /api/v7/trends/groups/.../apps` and `GET /api/v7/trends/topics/.../apps` | [Group slug example](https://api.sensor42.com/api/v7/trends/groups/slug/weather_apps/apps?market=ua&sort_by=recent_speed&sort_dir=desc&limit=20&offset=0) |
| Trends term apps | `GET /api/v7/trends/terms/{term_id}/apps` | [Live example](https://api.sensor42.com/api/v7/trends/terms/15/apps?market=ua&sort_by=avg_speed&sort_dir=desc&limit=20&offset=0) |

The trends endpoints are especially useful because they are live and authenticated, but not front-and-center in the main `/api` page. This SDK includes them as first-class methods.

## Feature summary

- TypeScript types for every supported v7 response
- Node 18+ compatible via the built-in `fetch`
- `X-API-Key`, `Authorization: Bearer`, and query-string auth modes
- unified `{ data, meta }` response shape
- parsed billing headers: `X-Credits-Charged`, `X-Credits-Balance`
- parsed rate-limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
- JSON helpers and CSV helpers
- route aliases for trends groups, topics, and slugs
- typed error classes for API, config, and network failures
- unit tests with mocked HTTP requests

## Install

```bash
npm install sensor42-sdk
```

If you are using this repository directly before publishing:

```bash
npm install
npm run build
npm test
```

## Quick start

```ts
import { Sensor42Client } from 'sensor42-sdk'

const client = new Sensor42Client({
  apiKey: process.env.SENSOR42_API_KEY,
})

const { data, meta } = await client.apps.getInfo(1545593132)

console.log(data.title)
console.log(data.all_markets_reviews)
console.log(meta.credits.charged)
console.log(meta.rateLimit.remaining)
```

The SDK also reads `SENSOR42_API_KEY` automatically if you omit `apiKey` in the constructor.

## Authentication modes

Sensor42 accepts multiple auth styles. The SDK supports all of them.

### Default `X-API-Key`

```ts
const client = new Sensor42Client({
  apiKey: process.env.SENSOR42_API_KEY,
})
```

### Bearer token mode

```ts
const client = new Sensor42Client({
  apiKey: process.env.SENSOR42_API_KEY,
  authMode: 'bearer',
})
```

### Query-string mode

Useful for some server-to-server flows when headers are awkward:

```ts
const client = new Sensor42Client({
  apiKey: process.env.SENSOR42_API_KEY,
  authMode: 'query',
})
```

## Response shape

Every SDK method returns:

```ts
type Sensor42Result<T> = {
  data: T
  meta: {
    status: number
    url: string
    credits: {
      charged: number | null
      balance: number | null
    }
    rateLimit: {
      limit: number | null
      remaining: number | null
      reset: number | null
      retryAfter: number | null
    }
  }
}
```

That means you do not lose the operational context that matters for Sensor42 billing and throttling.

## Examples

### 1. App profile and commercial estimate snapshot

```ts
const { data } = await client.apps.getInfo(1545593132)

console.log({
  title: data.title,
  developer: data.developer_name,
  rating: data.rating,
  reviews: data.all_markets_reviews,
  downloadsEstimate: data.downloads_estimate,
  revenueMonthMin: data.revenue_month_min,
  revenueMonthMax: data.revenue_month_max,
})
```

Related Sensor42 endpoint:

- [App Info endpoint](https://api.sensor42.com/api/v7/apps/1545593132/info)

### 2. Pull ASO keywords for an app

```ts
const { data } = await client.apps.getKeywords(1545593132)

for (const keyword of data.items.slice(0, 10)) {
  console.log(keyword.keyword, keyword.frequency)
}
```

Related Sensor42 endpoint:

- [App Keywords endpoint](https://api.sensor42.com/api/v7/apps/1545593132/keywords)

### 3. Compare market footprint for one app

```ts
const { data } = await client.apps.getMarkets(1545593132, {
  sortBy: 'share',
  sortDir: 'desc',
})

console.table(
  data.items.map((market) => ({
    store: market.store,
    volume: market.volume,
    share: market.share_percent,
    recentSpeed: market.speed_per_day_recent,
  })),
)
```

Related Sensor42 endpoint:

- [App Markets endpoint](https://api.sensor42.com/api/v7/apps/1545593132/markets?sort_by=share&sort_dir=desc)

### 4. Read rich app metadata

```ts
const { data } = await client.apps.getMeta(1545593132)

console.log(data.description)
console.log(data.aso_keywords)
console.log(data.version?.version)
console.log(data.in_app_purchases)
```

Related Sensor42 endpoint:

- [App Meta endpoint](https://api.sensor42.com/api/v7/apps/1545593132/meta)

### 5. Search the Sensor42 app corpus

```ts
const { data, meta } = await client.apps.search({
  q: 'weather',
  reviewsMin: 100,
  avgSpeedMin: 1.5,
  categoryId: 6001,
  sortBy: 'all_markets_reviews',
  sortDir: 'desc',
  limit: 20,
  offset: 0,
})

console.log(`Rows: ${data.total}`)
console.log(`Credits charged: ${meta.credits.charged}`)
console.table(
  data.items.map((app) => ({
    appId: app.app_id,
    title: app.title,
    developer: app.developer_name,
    reviews: app.all_markets_reviews,
    avgSpeed: app.avg_speed_per_day,
  })),
)
```

Related Sensor42 endpoint:

- [App Search endpoint](https://api.sensor42.com/api/v7/apps/search)
- [Main Sensor42 API docs](https://sensor42.com/api)

### 6. Export app search results as CSV

```ts
import { writeFile } from 'node:fs/promises'

const csv = await client.apps.searchCsv({
  q: 'weather',
  reviewsMin: 100,
  sortBy: 'all_markets_reviews',
  sortDir: 'desc',
  limit: 20,
})

await writeFile('sensor42-weather-apps.csv', csv.data, 'utf8')
console.log(csv.meta.contentDisposition)
```

This is useful for:

- growth research exports
- spreadsheet imports
- quick analyst handoff
- content and SEO research pipelines

### 7. Load the Sensor42 trends overview

```ts
const { data } = await client.trends.getOverview()

console.log(data.generated_at)
console.table(
  data.topics.slice(0, 10).map((topic) => ({
    topicId: topic.topic_id,
    slug: topic.slug,
    name: topic.name,
    apps: topic.apps_count,
    acceleration30d: topic.acceleration_per_day_30d,
  })),
)
```

Related Sensor42 endpoint:

- [Trends Overview endpoint](https://api.sensor42.com/api/v7/trends/overview)

### 8. Query group/topic apps by slug

```ts
const { data } = await client.trends.getGroupAppsBySlug('weather_apps', {
  market: 'ua',
  sortBy: 'recent_speed',
  sortDir: 'desc',
  limit: 20,
})

console.log(data.topic_name)
console.table(data.items)
```

Related Sensor42 endpoint:

- [Trends group slug endpoint](https://api.sensor42.com/api/v7/trends/groups/slug/weather_apps/apps?market=ua&sort_by=recent_speed&sort_dir=desc&limit=20&offset=0)

### 9. Query trend term apps

```ts
const { data } = await client.trends.getTermApps(15, {
  market: 'ua',
  sortBy: 'avg_speed',
  sortDir: 'desc',
  limit: 20,
})

console.log(data.term)
console.table(data.items)
```

Related Sensor42 endpoint:

- [Trends term endpoint](https://api.sensor42.com/api/v7/trends/terms/15/apps?market=ua&sort_by=avg_speed&sort_dir=desc&limit=20&offset=0)

### 10. Export trends apps as CSV

```ts
const csv = await client.trends.getGroupAppsBySlugCsv('weather_apps', {
  market: 'us',
  sortBy: 'market_reviews',
  sortDir: 'desc',
  limit: 20,
})

console.log(csv.data)
```

## Error handling

Non-2xx responses throw `Sensor42ApiError`.

```ts
import { Sensor42ApiError } from 'sensor42-sdk'

try {
  await client.apps.getMeta(999999999)
} catch (error) {
  if (error instanceof Sensor42ApiError) {
    console.error(error.status)
    console.error(error.body)
    console.error(error.meta.rateLimit.retryAfter)
  }
}
```

This is especially useful for Sensor42-specific failure cases such as:

- `401 Unauthorized` for invalid or missing API keys
- `402 Payment Required` when credits are exhausted
- `404 Not Found` for unknown app, topic, or term identifiers
- `429 Too Many Requests` when the 60 RPM limit is exceeded
- `503 Service Unavailable` when the analytics backend is unavailable

## Practical integration patterns

### Express route

```ts
import express from 'express'
import { Sensor42Client } from 'sensor42-sdk'

const app = express()
const sensor42 = new Sensor42Client({
  apiKey: process.env.SENSOR42_API_KEY,
})

app.get('/internal/app-search', async (req, res, next) => {
  try {
    const result = await sensor42.apps.search({
      q: String(req.query.q ?? ''),
      limit: 20,
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})
```

### Nightly ETL / cron job

```ts
import { writeFile } from 'node:fs/promises'
import { Sensor42Client } from 'sensor42-sdk'

const sensor42 = new Sensor42Client({
  apiKey: process.env.SENSOR42_API_KEY,
})

const csv = await sensor42.apps.searchCsv({
  q: 'vpn',
  reviewsMin: 1000,
  sortBy: 'all_markets_reviews',
  sortDir: 'desc',
  limit: 20,
})

await writeFile('./exports/vpn-apps.csv', csv.data, 'utf8')
```

### Internal trend monitor

```ts
const sensor42 = new Sensor42Client({
  apiKey: process.env.SENSOR42_API_KEY,
})

const result = await sensor42.trends.getGroupAppsBySlug('weather_apps', {
  market: 'us',
  sortBy: 'recent_speed',
  sortDir: 'desc',
})

const topMover = result.data.items[0]
console.log(topMover?.title, topMover?.recent_speed_per_day)
```

## Query parameter mapping

The SDK uses JavaScript-friendly option names and maps them to the exact Sensor42 query names.

| SDK option | Sensor42 query parameter |
| --- | --- |
| `reviewsMin` | `reviews_min` |
| `reviewsMax` | `reviews_max` |
| `avgSpeedMin` | `avg_speed_min` |
| `avgSpeedMax` | `avg_speed_max` |
| `categoryId` | `category_id` |
| `categoryIds` | `category_ids` |
| `firstReleaseFrom` | `first_release_from` |
| `firstReleaseTo` | `first_release_to` |
| `lastReleaseFrom` | `last_release_from` |
| `lastReleaseTo` | `last_release_to` |
| `pageSize` | `page_size` |

Dates passed as `Date` objects are serialized to `YYYY-MM-DD`, which matches the Sensor42 API expectations.

## Billing and rate limits

The current Sensor42 v7 rules exposed in the generated docs are:

- every documented v7 request costs 5 credits
- responses include `X-Credits-Charged` and `X-Credits-Balance`
- rate limit is 60 requests per minute per API key
- rate-limit headers include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`
- `429` responses include `Retry-After`

The SDK does not hide any of that. It surfaces those values in `meta`, which is important if you want to build:

- adaptive crawlers
- safe retry logic
- usage dashboards
- cost-aware AI or analytics workflows

## Why this SDK is useful for Sensor42 clients

If you are evaluating [Sensor42](https://sensor42.com) as an App Store intelligence and ASO data source, the biggest day-to-day integration pain is rarely the raw API itself. It is the repetition around the API:

- setting auth correctly in every request
- remembering which endpoints return JSON only and which support CSV
- mapping search and trends filters into the correct query-string names
- handling groups, topics, and slug aliases
- parsing rate-limit and credit headers
- keeping your app code clean while still exposing operational metadata

This repository solves those integration details so you can focus on actual product work.

## Sensor42 links

Useful links related to this SDK and the upstream product:

- [Sensor42 website](https://sensor42.com)
- [Sensor42 API docs](https://sensor42.com/api)
- [Sensor42 API base URL](https://api.sensor42.com)
- [Sensor42 app search endpoint](https://api.sensor42.com/api/v7/apps/search)
- [Sensor42 trends overview endpoint](https://api.sensor42.com/api/v7/trends/overview)
- [Sensor42 app info example](https://api.sensor42.com/api/v7/apps/1545593132/info)
- [Sensor42 app keywords example](https://api.sensor42.com/api/v7/apps/1545593132/keywords)
- [Sensor42 app markets example](https://api.sensor42.com/api/v7/apps/1545593132/markets?sort_by=share&sort_dir=desc)
- [Sensor42 app meta example](https://api.sensor42.com/api/v7/apps/1545593132/meta)
- [Sensor42 trends group example](https://api.sensor42.com/api/v7/trends/groups/slug/weather_apps/apps?market=ua&sort_by=recent_speed&sort_dir=desc&limit=20&offset=0)
- [Sensor42 trends term example](https://api.sensor42.com/api/v7/trends/terms/15/apps?market=ua&sort_by=avg_speed&sort_dir=desc&limit=20&offset=0)

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

## Tests

Unit tests are written with `vitest` and mock the network layer. They cover:

- default `X-API-Key` auth
- bearer auth mode
- query-string auth mode
- query serialization for app search
- CSV handling
- trends route aliasing
- API error propagation with parsed headers

## License

MIT. See [LICENSE](./LICENSE).
