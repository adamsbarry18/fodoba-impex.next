import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TablePaginationProps {
  page: number
  totalPages: number
  totalItems: number
  rangeStart: number
  rangeEnd: number
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (totalItems === 0) return null

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t bg-muted/10 px-4 py-3 sm:flex-row sm:px-6",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">
        Affichage de{" "}
        <span className="font-medium text-foreground">{rangeStart}</span> à{" "}
        <span className="font-medium text-foreground">{rangeEnd}</span> sur{" "}
        <span className="font-medium text-foreground">{totalItems}</span>
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Précédent
          </Button>
          <span className="min-w-[5.5rem] text-center text-xs font-medium text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Suivant
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
