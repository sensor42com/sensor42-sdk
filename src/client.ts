import {
  Sensor42ApiError,
  Sensor42ConfigError,
  Sensor42NetworkError,
} from './errors.js'
import {
  assertPositiveInteger,
  buildResponseMeta,
  buildUrl,
  encodePathSegment,
  normalizeBaseUrl,
  parseJsonResponse,
} from './utils.js'
import type {
  Sensor42AppInfo,
  Sensor42AppKeywordsResponse,
  Sensor42AppMarketsSortBy,
  Sensor42AppMarketsResponse,
  Sensor42AppMetaResponse,
  Sensor42AppsSearchParams,
  Sensor42AppsSearchResponse,
  Sensor42AuthMode,
  Sensor42ClientOptions,
  Sensor42CsvResult,
  Sensor42RequestOptions,
  Sensor42Result,
  Sensor42SortDir,
  Sensor42TrendsAppsParams,
  Sensor42TrendsOverviewResponse,
  Sensor42TrendsTermAppsResponse,
  Sensor42TrendsTopicAppsResponse,
} from './types.js'

const DEFAULT_BASE_URL = 'https://api.sensor42.com'
const DEFAULT_ENV_API_KEY = 'SENSOR42_API_KEY'

type JsonRequestParams = {
  path: string
  query?: QueryParams | undefined
  options?: Sensor42RequestOptions | undefined
}

type TextRequestParams = JsonRequestParams

type QueryPrimitive = boolean | number | string
type QueryValue =
  | QueryPrimitive
  | Date
  | null
  | undefined
  | QueryPrimitive[]
  | Date[]
type QueryParams = Record<string, QueryValue>

export class Sensor42Client {
  readonly baseUrl: string
  readonly authMode: Sensor42AuthMode

  private readonly apiKey: string
  private readonly fetchImpl: typeof globalThis.fetch
  private readonly defaultHeaders: HeadersInit | undefined

  readonly apps = {
    getInfo: (appId: number, options?: Sensor42RequestOptions) => this.getAppInfo(appId, options),
    getKeywords: (appId: number, options?: Sensor42RequestOptions) => this.getAppKeywords(appId, options),
    getMarkets: (
      appId: number,
      params?: { sortBy?: Sensor42AppMarketsSortBy; sortDir?: Sensor42SortDir },
      options?: Sensor42RequestOptions,
    ) => this.getAppMarkets(appId, params, options),
    getMeta: (appId: number, options?: Sensor42RequestOptions) => this.getAppMeta(appId, options),
    search: (params?: Sensor42AppsSearchParams, options?: Sensor42RequestOptions) =>
      this.searchApps(params, options),
    searchCsv: (params?: Sensor42AppsSearchParams, options?: Sensor42RequestOptions) =>
      this.searchAppsCsv(params, options),
  }

  readonly trends = {
    getOverview: (options?: Sensor42RequestOptions) => this.getTrendsOverview(options),
    getTopicAppsById: (
      topicId: number,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendTopicAppsById(topicId, params, options),
    getTopicAppsByIdCsv: (
      topicId: number,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendTopicAppsByIdCsv(topicId, params, options),
    getTopicAppsBySlug: (
      slug: string,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendTopicAppsBySlug(slug, params, options),
    getTopicAppsBySlugCsv: (
      slug: string,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendTopicAppsBySlugCsv(slug, params, options),
    getGroupAppsById: (
      groupId: number,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendGroupAppsById(groupId, params, options),
    getGroupAppsByIdCsv: (
      groupId: number,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendGroupAppsByIdCsv(groupId, params, options),
    getGroupAppsBySlug: (
      slug: string,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendGroupAppsBySlug(slug, params, options),
    getGroupAppsBySlugCsv: (
      slug: string,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendGroupAppsBySlugCsv(slug, params, options),
    getTermApps: (
      termId: number,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendTermApps(termId, params, options),
    getTermAppsCsv: (
      termId: number,
      params?: Sensor42TrendsAppsParams,
      options?: Sensor42RequestOptions,
    ) => this.getTrendTermAppsCsv(termId, params, options),
  }

  constructor(options: Sensor42ClientOptions = {}) {
    const apiKey = (options.apiKey ?? process.env[DEFAULT_ENV_API_KEY] ?? '').trim()
    if (!apiKey) {
      throw new Sensor42ConfigError(
        `Sensor42 API key is required. Pass apiKey or set ${DEFAULT_ENV_API_KEY}.`,
      )
    }

    const fetchImpl = options.fetch ?? globalThis.fetch
    if (typeof fetchImpl !== 'function') {
      throw new Sensor42ConfigError('Fetch implementation is required in this runtime.')
    }

    this.apiKey = apiKey
    this.authMode = options.authMode ?? 'x-api-key'
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
    this.fetchImpl = fetchImpl.bind(globalThis) as typeof globalThis.fetch
    this.defaultHeaders = options.headers
  }

  async getAppInfo(appId: number, options?: Sensor42RequestOptions): Promise<Sensor42Result<Sensor42AppInfo>> {
    assertPositiveInteger('appId', appId)
    return this.requestJson<Sensor42AppInfo>({
      path: `/api/v7/apps/${encodePathSegment(appId)}/info`,
      options,
    })
  }

  async getAppKeywords(
    appId: number,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42AppKeywordsResponse>> {
    assertPositiveInteger('appId', appId)
    return this.requestJson<Sensor42AppKeywordsResponse>({
      path: `/api/v7/apps/${encodePathSegment(appId)}/keywords`,
      options,
    })
  }

  async getAppMarkets(
    appId: number,
    params?: { sortBy?: Sensor42AppMarketsSortBy; sortDir?: Sensor42SortDir },
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42AppMarketsResponse>> {
    assertPositiveInteger('appId', appId)
    return this.requestJson<Sensor42AppMarketsResponse>({
      path: `/api/v7/apps/${encodePathSegment(appId)}/markets`,
      query: {
        sort_by: params?.sortBy,
        sort_dir: params?.sortDir,
      },
      options,
    })
  }

  async getAppMeta(appId: number, options?: Sensor42RequestOptions): Promise<Sensor42Result<Sensor42AppMetaResponse>> {
    assertPositiveInteger('appId', appId)
    return this.requestJson<Sensor42AppMetaResponse>({
      path: `/api/v7/apps/${encodePathSegment(appId)}/meta`,
      options,
    })
  }

  async searchApps(
    params?: Sensor42AppsSearchParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42AppsSearchResponse>> {
    return this.requestJson<Sensor42AppsSearchResponse>({
      path: '/api/v7/apps/search',
      query: mapAppsSearchParams(params),
      options,
    })
  }

  async searchAppsCsv(
    params?: Sensor42AppsSearchParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42CsvResult> {
    return this.requestText({
      path: '/api/v7/apps/search',
      query: {
        ...(mapAppsSearchParams(params) ?? {}),
        format: 'csv',
      },
      options,
    })
  }

  async getTrendsOverview(
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42TrendsOverviewResponse>> {
    return this.requestJson<Sensor42TrendsOverviewResponse>({
      path: '/api/v7/trends/overview',
      options,
    })
  }

  async getTrendTopicAppsById(
    topicId: number,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42TrendsTopicAppsResponse>> {
    assertPositiveInteger('topicId', topicId)
    return this.requestJson<Sensor42TrendsTopicAppsResponse>({
      path: `/api/v7/trends/topics/${encodePathSegment(topicId)}/apps`,
      query: mapTrendsAppsParams(params),
      options,
    })
  }

  async getTrendTopicAppsByIdCsv(
    topicId: number,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42CsvResult> {
    assertPositiveInteger('topicId', topicId)
    return this.requestText({
      path: `/api/v7/trends/topics/${encodePathSegment(topicId)}/apps`,
      query: {
        ...(mapTrendsAppsParams(params) ?? {}),
        format: 'csv',
      },
      options,
    })
  }

  async getTrendTopicAppsBySlug(
    slug: string,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42TrendsTopicAppsResponse>> {
    return this.requestJson<Sensor42TrendsTopicAppsResponse>({
      path: `/api/v7/trends/topics/slug/${encodePathSegment(requireNonEmpty(slug, 'slug'))}/apps`,
      query: mapTrendsAppsParams(params),
      options,
    })
  }

  async getTrendTopicAppsBySlugCsv(
    slug: string,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42CsvResult> {
    return this.requestText({
      path: `/api/v7/trends/topics/slug/${encodePathSegment(requireNonEmpty(slug, 'slug'))}/apps`,
      query: {
        ...(mapTrendsAppsParams(params) ?? {}),
        format: 'csv',
      },
      options,
    })
  }

  async getTrendGroupAppsById(
    groupId: number,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42TrendsTopicAppsResponse>> {
    assertPositiveInteger('groupId', groupId)
    return this.requestJson<Sensor42TrendsTopicAppsResponse>({
      path: `/api/v7/trends/groups/${encodePathSegment(groupId)}/apps`,
      query: mapTrendsAppsParams(params),
      options,
    })
  }

  async getTrendGroupAppsByIdCsv(
    groupId: number,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42CsvResult> {
    assertPositiveInteger('groupId', groupId)
    return this.requestText({
      path: `/api/v7/trends/groups/${encodePathSegment(groupId)}/apps`,
      query: {
        ...(mapTrendsAppsParams(params) ?? {}),
        format: 'csv',
      },
      options,
    })
  }

  async getTrendGroupAppsBySlug(
    slug: string,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42TrendsTopicAppsResponse>> {
    return this.requestJson<Sensor42TrendsTopicAppsResponse>({
      path: `/api/v7/trends/groups/slug/${encodePathSegment(requireNonEmpty(slug, 'slug'))}/apps`,
      query: mapTrendsAppsParams(params),
      options,
    })
  }

  async getTrendGroupAppsBySlugCsv(
    slug: string,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42CsvResult> {
    return this.requestText({
      path: `/api/v7/trends/groups/slug/${encodePathSegment(requireNonEmpty(slug, 'slug'))}/apps`,
      query: {
        ...(mapTrendsAppsParams(params) ?? {}),
        format: 'csv',
      },
      options,
    })
  }

  async getTrendTermApps(
    termId: number,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42Result<Sensor42TrendsTermAppsResponse>> {
    assertPositiveInteger('termId', termId)
    return this.requestJson<Sensor42TrendsTermAppsResponse>({
      path: `/api/v7/trends/terms/${encodePathSegment(termId)}/apps`,
      query: mapTrendsAppsParams(params),
      options,
    })
  }

  async getTrendTermAppsCsv(
    termId: number,
    params?: Sensor42TrendsAppsParams,
    options?: Sensor42RequestOptions,
  ): Promise<Sensor42CsvResult> {
    assertPositiveInteger('termId', termId)
    return this.requestText({
      path: `/api/v7/trends/terms/${encodePathSegment(termId)}/apps`,
      query: {
        ...(mapTrendsAppsParams(params) ?? {}),
        format: 'csv',
      },
      options,
    })
  }

  private async requestJson<T>(params: JsonRequestParams): Promise<Sensor42Result<T>> {
    const response = await this.performRequest(params, 'application/json')
    return {
      data: await parseJsonResponse<T>(response.response),
      meta: response.meta,
    }
  }

  private async requestText(params: TextRequestParams): Promise<Sensor42CsvResult> {
    const response = await this.performRequest(params, 'text/csv')
    return {
      data: await response.response.text(),
      meta: response.meta,
    }
  }

  private async performRequest(
    params: JsonRequestParams,
    accept: string,
  ): Promise<{ response: Response; meta: ReturnType<typeof buildResponseMeta> }> {
    const headers = new Headers(this.defaultHeaders)
    headers.set('Accept', accept)

    if (params.options?.headers) {
      const perRequestHeaders = new Headers(params.options.headers)
      for (const [key, value] of perRequestHeaders.entries()) {
        headers.set(key, value)
      }
    }

    const query =
      this.authMode === 'query' ? { ...(params.query ?? {}), api_key: this.apiKey } : params.query
    const url = buildUrl(this.baseUrl, params.path, query)
    this.applyAuthHeaders(headers)

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: 'GET',
        headers,
        signal: params.options?.signal ?? null,
      })
    } catch (error) {
      throw new Sensor42NetworkError(`Sensor42 request failed before receiving a response: ${url}`, {
        cause: error,
      })
    }

    const meta = buildResponseMeta(response, url)
    if (!response.ok) {
      const body = await response.text()
      throw new Sensor42ApiError({
        status: response.status,
        url,
        body,
        meta,
      })
    }

    return { response, meta }
  }

  private applyAuthHeaders(headers: Headers): void {
    switch (this.authMode) {
      case 'x-api-key':
        headers.set('X-API-Key', this.apiKey)
        headers.delete('Authorization')
        break
      case 'bearer':
        headers.set('Authorization', `Bearer ${this.apiKey}`)
        headers.delete('X-API-Key')
        break
      case 'query':
        headers.delete('X-API-Key')
        headers.delete('Authorization')
        break
      default:
        throw new Sensor42ConfigError(`Unsupported Sensor42 auth mode: ${this.authMode}`)
    }
  }
}

function mapAppsSearchParams(params?: Sensor42AppsSearchParams): QueryParams | undefined {
  if (!params) {
    return undefined
  }

  return {
    q: params.q,
    reviews_min: params.reviewsMin,
    reviews_max: params.reviewsMax,
    avg_speed_min: params.avgSpeedMin,
    avg_speed_max: params.avgSpeedMax,
    category_id: params.categoryId,
    category_ids: params.categoryIds,
    first_release_from: params.firstReleaseFrom,
    first_release_to: params.firstReleaseTo,
    last_release_from: params.lastReleaseFrom,
    last_release_to: params.lastReleaseTo,
    sort_by: params.sortBy,
    sort_dir: params.sortDir,
    limit: params.limit,
    offset: params.offset,
    page: params.page,
    page_size: params.pageSize,
  }
}

function mapTrendsAppsParams(params?: Sensor42TrendsAppsParams): QueryParams | undefined {
  if (!params) {
    return undefined
  }

  return {
    market: params.market,
    sort_by: params.sortBy,
    sort_dir: params.sortDir,
    limit: params.limit,
    offset: params.offset,
    page: params.page,
    page_size: params.pageSize,
  }
}

function requireNonEmpty(value: string, name: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Sensor42ConfigError(`${name} must not be empty.`)
  }

  return trimmed
}
