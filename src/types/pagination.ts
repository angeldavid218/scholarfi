/**
 * Lucid/Adonis-style pagination meta returned by list endpoints.
 */
export type PaginatedMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string | null
  lastPageUrl: string | null
  nextPageUrl: string | null
  previousPageUrl: string | null
}

export type PaginatedPayload<T> = {
  items: T[]
  meta: PaginatedMeta
}
