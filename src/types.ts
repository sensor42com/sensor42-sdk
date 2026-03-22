export type Sensor42AuthMode = 'x-api-key' | 'bearer' | 'query'

export type Sensor42DateInput = Date | string

export type Sensor42SortDir = 'asc' | 'desc'

export type Sensor42AppMarketsSortBy =
  | 'ratings'
  | 'store'
  | 'speed'
  | 'speed_recent'
  | 'speed_avg'
  | 'rating'
  | 'share'
  | 'updated'

export type Sensor42AppsSearchSortBy =
  | 'all_markets_reviews'
  | 'reviews'
  | 'avg_speed'
  | 'avg_speed_per_day'
  | 'recent_speed'
  | 'recent_speed_per_day'
  | 'first_release'
  | 'first_release_date'
  | 'last_release'
  | 'last_release_date'

export type Sensor42TrendsSortBy =
  | 'avg_speed'
  | 'avg_speed_per_day'
  | 'all_reviews'
  | 'all_markets_reviews'
  | 'reviews'
  | 'market_reviews'
  | 'recent_speed'
  | 'recent_speed_per_day'

export interface Sensor42ClientOptions {
  apiKey?: string
  baseUrl?: string
  authMode?: Sensor42AuthMode
  fetch?: typeof globalThis.fetch
  headers?: HeadersInit
}

export interface Sensor42RequestOptions {
  headers?: HeadersInit
  signal?: AbortSignal
}

export interface Sensor42CreditsMeta {
  charged: number | null
  balance: number | null
}

export interface Sensor42RateLimitMeta {
  limit: number | null
  remaining: number | null
  reset: number | null
  retryAfter: number | null
}

export interface Sensor42ResponseMeta {
  status: number
  url: string
  headers: Record<string, string>
  contentType: string | null
  contentDisposition: string | null
  credits: Sensor42CreditsMeta
  rateLimit: Sensor42RateLimitMeta
}

export interface Sensor42Result<T> {
  data: T
  meta: Sensor42ResponseMeta
}

export interface Sensor42CsvResult {
  data: string
  meta: Sensor42ResponseMeta
}

export interface Sensor42AppInfo {
  app_id: number
  title: string | null
  subtitle: string | null
  bundle_id: string | null
  developer_name: string | null
  category_id: number | null
  category_name: string | null
  rating: number | null
  rating_count: number | null
  status: string
  last_seen: string | null
  first_release_date: string | null
  last_release_date: string | null
  speed_per_day: number | null
  downloads_estimate: number | null
  revenue_month_min: number | null
  revenue_month_max: number | null
  revenue_lifetime_min: number | null
  revenue_lifetime_max: number | null
  all_markets_reviews: number
  developer_tagline: string | null
}

export interface Sensor42KeywordItem {
  keyword: string
  frequency: number
}

export interface Sensor42AppKeywordsResponse {
  app_id: number
  total: number
  items: Sensor42KeywordItem[]
}

export interface Sensor42AppMarketItem {
  store: string
  volume: number
  rating: number
  updated_at: string
  share_percent: number | null
  speed_per_day_recent?: number | null
  speed_per_day_avg?: number | null
}

export interface Sensor42AppMarketsResponse {
  app_id: number
  run_id: string
  run_created_at: string
  page: number
  page_size: number
  total: number
  total_pages: number
  total_volume: number
  items: Sensor42AppMarketItem[]
}

export interface Sensor42AppVersionInfo {
  version: string | null
  updated_at: string | null
  release_notes: string | null
}

export interface Sensor42AppAgeRatingInfo {
  rating: string | null
  details: string[]
}

export interface Sensor42AppInAppPurchase {
  name: string
  price: string
}

export interface Sensor42AppReviewSnippet {
  title: string
  body: string
  rating: number | null
  date_text: string
  reviewer_name: string
}

export interface Sensor42AppMetaResponse {
  app_id: number
  title: string | null
  subtitle: string | null
  description: string | null
  developer_tagline: string | null
  aso_keywords: string[]
  version: Sensor42AppVersionInfo | null
  age_rating: Sensor42AppAgeRatingInfo | null
  languages_raw: string | null
  in_app_purchases: Sensor42AppInAppPurchase[]
  compatibility: Record<string, string>
  canonical_url: string | null
  seo_page_title: string | null
  reviews: Sensor42AppReviewSnippet[]
}

export interface Sensor42AppsSearchParams {
  q?: string
  reviewsMin?: number
  reviewsMax?: number
  avgSpeedMin?: number
  avgSpeedMax?: number
  categoryId?: number
  categoryIds?: number[]
  firstReleaseFrom?: Sensor42DateInput
  firstReleaseTo?: Sensor42DateInput
  lastReleaseFrom?: Sensor42DateInput
  lastReleaseTo?: Sensor42DateInput
  sortBy?: Sensor42AppsSearchSortBy
  sortDir?: Sensor42SortDir
  limit?: number
  offset?: number
  page?: number
  pageSize?: number
}

export interface Sensor42AppsSearchItem {
  app_id: number
  status: string
  title: string | null
  bundle_id: string | null
  category_id: number | null
  category_name: string | null
  developer_name: string | null
  developer_id: number | null
  developer_apps_count: number | null
  icon_url: string | null
  icon_local_url: string | null
  rating: number | null
  rating_count: number | null
  all_markets_reviews: number
  avg_speed_per_day: number | null
  recent_speed_per_day?: number | null
  first_release_date: string | null
  last_release_date: string | null
  last_seen: string | null
}

export interface Sensor42AppsSearchResponse {
  limit: number
  offset: number
  total: number
  total_pages: number
  items: Sensor42AppsSearchItem[]
}

export interface Sensor42TrendsOverviewTopic {
  topic_id: number
  slug: string
  name: string
  apps_count: number
  acceleration_per_day_30d: number
  first_last_speed_per_day: number
}

export interface Sensor42TrendsOverviewTerm {
  term_id: number
  topic_id: number
  topic_slug: string
  topic_name: string
  term: string
  apps_count: number
  acceleration_per_day_30d: number
  first_last_speed_per_day: number
}

export interface Sensor42TrendsOverviewResponse {
  generated_at: string | null
  topics: Sensor42TrendsOverviewTopic[]
  terms: Sensor42TrendsOverviewTerm[]
}

export interface Sensor42TrendsAppsParams {
  market?: string
  sortBy?: Sensor42TrendsSortBy
  sortDir?: Sensor42SortDir
  limit?: number
  offset?: number
  page?: number
  pageSize?: number
}

export interface Sensor42TrendsAppItem {
  app_id: number
  title: string
  developer_name: string
  icon_url?: string
  all_markets_reviews: number
  market_reviews: number
  recent_speed_per_day: number
  first_last_speed_per_day: number
}

export interface Sensor42TrendsTopicAppsResponse {
  topic_id: number
  topic_slug: string
  topic_name: string
  market: string
  available_markets: string[]
  page: number
  page_size: number
  limit: number
  offset: number
  total: number
  total_pages: number
  items: Sensor42TrendsAppItem[]
}

export interface Sensor42TrendsTermAppsResponse {
  term_id: number
  topic_id: number
  topic_slug: string
  topic_name: string
  term: string
  market: string
  available_markets: string[]
  page: number
  page_size: number
  limit: number
  offset: number
  total: number
  total_pages: number
  items: Sensor42TrendsAppItem[]
}

