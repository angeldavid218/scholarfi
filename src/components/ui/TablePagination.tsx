type TablePaginationProps = {
  page: number
  perPage: number
  total: number
  onPageChange: (nextPage: number) => void
  onPerPageChange?: (nextPerPage: number) => void
  perPageOptions?: number[]
  className?: string
}

export function TablePagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50],
  className,
}: TablePaginationProps) {
  const safePerPage = perPage > 0 ? perPage : 10
  const totalPages = Math.max(1, Math.ceil(total / safePerPage))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const from = total === 0 ? 0 : (currentPage - 1) * safePerPage + 1
  const to = Math.min(currentPage * safePerPage, total)

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className ?? ''}`.trim()}>
      <p className="text-sm text-base-content/70">
        {total === 0 ? 'Sin resultados' : `Mostrando ${from}-${to} de ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPerPageChange ? (
          <select
            className="select select-bordered select-sm"
            value={safePerPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            aria-label="Filas por pagina"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} / página
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Anterior
        </button>
        <span className="text-sm font-medium tabular-nums text-base-content/80">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
