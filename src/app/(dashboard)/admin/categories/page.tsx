"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { CategoryService } from "@/services/category.service"
import { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Plus,
  Edit,
  FolderTree,
  Loader2,
  ChevronRight,
  ChevronDown,
  Trash2,
  Tag,
  Search,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  buildCategoryTree,
  countActiveCategories,
  countRootCategories,
  countWithChildren,
  filterCategoriesForTree,
  getCategoryTone,
  type CategoryNode,
  type CategoryStatusFilter,
} from "@/lib/category-utils"
import { cn } from "@/lib/utils"
import { useClientPagination } from "@/hooks/use-client-pagination"
import { TablePagination } from "@/components/ui/table-pagination"

const PAGE_SIZE = 20

function CategoryItem({
  node,
  level,
  expanded,
  onToggle,
  onDelete,
}: {
  node: CategoryNode
  level: number
  expanded: Record<string, boolean>
  onToggle: (id: string) => void
  onDelete: (id: string, name: string) => void
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded[node.id] === true

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/30 group",
          !node.active && "opacity-70"
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-lg"
              onClick={() => onToggle(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-7 shrink-0" />
          )}
          <StatusBadge tone={getCategoryTone(node.name)} className="shrink-0 text-[10px]">
            <Tag className="mr-1 h-3 w-3" />
            {node.name}
          </StatusBadge>
          {!node.active && (
            <StatusBadge tone="slate" className="text-[10px]">
              Inactif
            </StatusBadge>
          )}
          {node.description && (
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              - {node.description}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
            <Link href={`/admin/categories/${node.id}/edit`}>
              <Edit className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
            onClick={() => onDelete(node.id, node.name)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <CategoryItem
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>("all")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await CategoryService.listCategories()
      setCategories(data)
    } catch {
      toast.error("Erreur lors du chargement des catégories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      try {
        const data = await CategoryService.listCategories()
        if (!cancelled) setCategories(data)
      } catch {
        if (!cancelled) toast.error("Erreur lors du chargement des catégories")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredCategories = useMemo(
    () => filterCategoriesForTree(categories, searchTerm, statusFilter),
    [categories, searchTerm, statusFilter]
  )

  const tree = useMemo(
    () => buildCategoryTree(filteredCategories),
    [filteredCategories]
  )

  const treeResetKey = `${searchTerm}|${statusFilter}|${filteredCategories.length}`
  const {
    paginatedItems: paginatedRoots,
    page,
    setPage,
    totalPages,
    totalItems: totalRoots,
    rangeStart,
    rangeEnd,
  } = useClientPagination(tree, { pageSize: PAGE_SIZE, resetKey: treeResetKey })

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: countActiveCategories(categories),
      roots: countRootCategories(categories),
      withChildren: countWithChildren(categories),
    }),
    [categories]
  )

  useEffect(() => {
    if (filteredCategories.length === 0) return
    setExpanded((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const roots: Record<string, boolean> = {}
      for (const cat of filteredCategories.filter((c) => !c.parentId)) {
        roots[cat.id] = true
      }
      return roots
    })
  }, [filteredCategories])

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: prev[id] !== true }))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await CategoryService.deleteCategory(deleteTarget.id)
      toast.success("Catégorie supprimée")
      setDeleteTarget(null)
      loadCategories()
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    for (const cat of filteredCategories) all[cat.id] = true
    setExpanded(all)
  }

  const collapseAll = () => {
    const all: Record<string, boolean> = {}
    for (const cat of filteredCategories) all[cat.id] = false
    setExpanded(all)
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FolderTree className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catégories produits</h1>
            <p className="text-sm text-muted-foreground">
              Hiérarchie du catalogue global FODOBA IMPEX.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={loadCategories}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button asChild className="rounded-xl font-semibold">
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle catégorie
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/50">
              <Tag className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Actives
              </p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Racines
              </p>
              <p className="text-2xl font-bold">{stats.roots}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 rounded-2xl border bg-card shadow-sm lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
              <FolderTree className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Avec sous-catégories
              </p>
              <p className="text-2xl font-bold">{stats.withChildren}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou description…"
              className="h-10 rounded-xl pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CategoryStatusFilter)}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actives uniquement</SelectItem>
              <SelectItem value="inactive">Inactives uniquement</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 p-4 sm:p-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4 text-primary" />
              Arborescence du catalogue
            </CardTitle>
            <CardDescription className="text-xs">
              Organisez vos produits par familles et sous-familles.
            </CardDescription>
          </div>
          {tree.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs"
                onClick={expandAll}
              >
                Tout déplier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs"
                onClick={collapseAll}
              >
                Tout replier
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-16 text-center">
              <Tag className="h-12 w-12 text-muted-foreground/30" />
              <div>
                <p className="font-semibold">Aucune catégorie configurée</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Créez la première famille de produits pour structurer le catalogue.
                </p>
              </div>
              <Button asChild className="rounded-xl font-semibold">
                <Link href="/admin/categories/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle catégorie
                </Link>
              </Button>
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted-foreground">
              <XCircle className="h-10 w-10 opacity-30" />
              <p>Aucune catégorie ne correspond aux filtres.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {paginatedRoots.map((node) => (
                  <CategoryItem
                    key={node.id}
                    node={node}
                    level={0}
                    expanded={expanded}
                    onToggle={toggleExpand}
                    onDelete={(id, name) => setDeleteTarget({ id, name })}
                  />
                ))}
              </div>
              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalRoots}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              La catégorie <strong>{deleteTarget?.name}</strong> sera définitivement supprimée.
              Vérifiez qu&apos;aucun produit ne lui est rattaché.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={deleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
