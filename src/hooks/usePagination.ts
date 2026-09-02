import { useState } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  initialPerPage?: number
}

interface UsePaginationResult {
  page: number
  perPage: number
  setPage: (next: number) => void
  setPerPage: (next: number) => void
  onPageChange: (nextPage: number) => void
  onPerPageChange: (nextPerPage: number) => void
}

export const usePagination = ({
  initialPage = 1,
  initialPerPage = 10,
}: UsePaginationOptions = {}): UsePaginationResult => {
  const [page, setPage] = useState(initialPage)
  const [perPage, setPerPage] = useState(initialPerPage)

  const onPageChange = (nextPage: number) => {
    setPage(nextPage)
  }

  const onPerPageChange = (nextPerPage: number) => {
    setPerPage(nextPerPage)
    setPage(1)
  }

  return { page, perPage, setPage, setPerPage, onPageChange, onPerPageChange }
}
