import type { ReactNode } from 'react'

interface TableShellProps {
  children: ReactNode
  compact?: boolean
  className?: string
}

export const TableShell = ({ children, compact = false, className }: TableShellProps) => {
  return (
    <div className={`overflow-x-auto ${className ?? ''}`.trim()}>
      <table className={`table table-zebra ${compact ? 'table-sm' : ''}`.trim()}>{children}</table>
    </div>
  )
}
