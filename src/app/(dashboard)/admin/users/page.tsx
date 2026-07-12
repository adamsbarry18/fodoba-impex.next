
"use client"

import { useState, useEffect, useMemo } from "react"
import { DocumentSnapshot } from "firebase/firestore"
import { UserService } from "@/services/user.service"
import { StoreService } from "@/services/store.service"
import { UserProfile, Role, Store } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { StatusBadge } from "@/components/ui/status-badge"
import {
  UserPlus,
  Edit,
  UserX,
  UserCheck,
  Loader2,
  Mail,
  Shield,
  Search,
  RefreshCw,
  Users,
  UserRound,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/contexts/AuthContext"
import {
  getRoleMeta,
  getUserDisplayName,
  getUserInitials,
  ROLE_ORDER,
} from "@/lib/user-utils"
import { cn } from "@/lib/utils"
import { useTableColumns } from "@/hooks/use-table-columns"
import { TableColumnToggle } from "@/components/ui/table-column-toggle"
import { VisibleTableColumn } from "@/components/ui/visible-table-column"
import { USER_TABLE_COLUMNS } from "@/lib/table-column-presets"

const PAGE_SIZE = 50

type ToggleTarget = {
  uid: string
  name: string
  actif: boolean
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [toggleTarget, setToggleTarget] = useState<ToggleTarget | null>(null)
  const { userProfile: currentUser } = useAuth()

  const storeMap = useMemo(
    () => new Map(stores.map((s) => [s.id, s])),
    [stores]
  )

  const loadData = async (options?: { loadMore?: boolean; reset?: boolean }) => {
    const loadMore = options?.loadMore ?? false
    if (loadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const [usersResult, storesResult] = await Promise.all([
        UserService.listUsers(
          PAGE_SIZE,
          loadMore && !options?.reset ? lastDoc : undefined
        ),
        loadMore ? Promise.resolve({ stores }) : StoreService.listStores(100),
      ])

      if (loadMore) {
        setUsers((prev) => [...prev, ...usersResult.users])
      } else {
        setUsers(usersResult.users)
        setStores(storesResult.stores)
      }

      setLastDoc(usersResult.lastVisible)
      setHasMore(usersResult.users.length === PAGE_SIZE)
    } catch {
      toast.error("Erreur lors du chargement des collaborateurs")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchInitial = async () => {
      setLoading(true)
      try {
        const [usersResult, storesResult] = await Promise.all([
          UserService.listUsers(PAGE_SIZE),
          StoreService.listStores(100),
        ])
        if (cancelled) return
        setUsers(usersResult.users)
        setStores(storesResult.stores)
        setLastDoc(usersResult.lastVisible)
        setHasMore(usersResult.users.length === PAGE_SIZE)
      } catch {
        if (!cancelled) toast.error("Erreur lors du chargement des collaborateurs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        getUserDisplayName(user).toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.actif : !user.actif)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.actif).length,
      suspended: users.filter((u) => !u.actif).length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users]
  )

  const { isVisible, toggleColumn, resetColumns, columns: tableColumns } =
    useTableColumns("users", USER_TABLE_COLUMNS)

  const handleRefresh = async () => {
    setLastDoc(undefined)
    setHasMore(true)
    await loadData({ reset: true })
  }

  const confirmToggleStatus = async () => {
    if (!toggleTarget) return
    if (toggleTarget.uid === currentUser?.uid) {
      toast.error("Vous ne pouvez pas suspendre votre propre compte.")
      setToggleTarget(null)
      return
    }

    setToggling(true)
    try {
      await UserService.toggleUserStatus(toggleTarget.uid, !toggleTarget.actif)
      toast.success(
        toggleTarget.actif
          ? `${toggleTarget.name} a été suspendu`
          : `${toggleTarget.name} a été réactivé`
      )
      setToggleTarget(null)
      await loadData({ reset: true })
    } catch {
      toast.error("Erreur lors du changement de statut")
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contrôle d&apos;accès</h1>
            <p className="text-sm text-muted-foreground">
              Comptes collaborateurs, rôles et accès aux boutiques du réseau.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button asChild className="rounded-xl font-semibold">
            <Link href="/admin/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Nouveau collaborateur
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/50">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Collaborateurs
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Actifs
              </p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <UserX className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Suspendus
              </p>
              <p className="text-2xl font-bold">{stats.suspended}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
              <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Administrateurs
              </p>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="rounded-2xl border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou rôle…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-xl border-border pl-9"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as Role | "all")}
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les rôles</SelectItem>
              {ROLE_ORDER.map((role) => (
                <SelectItem key={role} value={role}>
                  {getRoleMeta(role).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "active" | "inactive")
            }
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Suspendus</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base">Liste des collaborateurs</CardTitle>
            <CardDescription className="text-xs">
              {filteredUsers.length} collaborateur{filteredUsers.length !== 1 ? "s" : ""}
              {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                ? " (filtrés)"
                : ""}{" "}
              sur {users.length} chargé{users.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <TableColumnToggle
            columns={tableColumns}
            isVisible={isVisible}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center text-muted-foreground">
              <UserRound className="h-10 w-10 opacity-30" />
              <p className="font-medium">Aucun collaborateur trouvé</p>
              <p className="text-xs">
                {users.length === 0
                  ? "Créez le premier compte pour votre équipe."
                  : "Modifiez vos filtres de recherche."}
              </p>
              {users.length === 0 && (
                <Button asChild className="mt-2 rounded-xl">
                  <Link href="/admin/users/new">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nouveau collaborateur
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <VisibleTableColumn id="user" isVisible={isVisible}>
                      <TableHead className="pl-4 sm:pl-6">Collaborateur</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="role" isVisible={isVisible}>
                      <TableHead>Rôle</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="stores" isVisible={isVisible}>
                      <TableHead>Boutiques</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="status" isVisible={isVisible}>
                      <TableHead>Statut</TableHead>
                    </VisibleTableColumn>
                    <VisibleTableColumn id="actions" isVisible={isVisible}>
                      <TableHead className="pr-4 text-right sm:pr-6">Actions</TableHead>
                    </VisibleTableColumn>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.uid === currentUser?.uid
                    const assignedStores = (user.boutiqueIds ?? [])
                      .map((id) => storeMap.get(id))
                      .filter(Boolean) as Store[]

                    return (
                      <TableRow
                        key={user.uid}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <VisibleTableColumn id="user" isVisible={isVisible}>
                          <TableCell className="pl-4 sm:pl-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {getUserInitials(user)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {getUserDisplayName(user)}
                                  {isSelf && (
                                    <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                                      (vous)
                                    </span>
                                  )}
                                </p>
                                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="role" isVisible={isVisible}>
                          <TableCell>
                            <StatusBadge
                              preset="userRole"
                              value={user.role}
                              icon={(() => {
                                const Icon = getRoleMeta(user.role).icon
                                return <Icon className="h-3 w-3" />
                              })()}
                              className="text-[10px]"
                            />
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="stores" isVisible={isVisible}>
                          <TableCell>
                            {user.role === "admin" ? (
                              <StatusBadge tone="slate" className="text-[10px]">
                                Toutes les boutiques
                              </StatusBadge>
                            ) : assignedStores.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {assignedStores.slice(0, 2).map((store) => (
                                  <StatusBadge
                                    key={store.id}
                                    hashFromLabel
                                    className="text-[9px]"
                                  >
                                    {store.code}
                                  </StatusBadge>
                                ))}
                                {assignedStores.length > 2 && (
                                  <StatusBadge tone="slate" className="text-[9px]">
                                    +{assignedStores.length - 2}
                                  </StatusBadge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">
                                Aucune boutique
                              </span>
                            )}
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="status" isVisible={isVisible}>
                          <TableCell>
                            <StatusBadge
                              preset="activeState"
                              value={user.actif ? "active" : "inactive"}
                              className="text-[10px]"
                            >
                              {user.actif ? "Actif" : "Suspendu"}
                            </StatusBadge>
                          </TableCell>
                        </VisibleTableColumn>
                        <VisibleTableColumn id="actions" isVisible={isVisible}>
                          <TableCell className="pr-4 text-right sm:pr-6">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 rounded-lg"
                                title="Modifier"
                              >
                                <Link href={`/admin/users/${user.uid}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 rounded-lg",
                                  user.actif
                                    ? "text-destructive hover:text-destructive"
                                    : "text-primary hover:text-primary"
                                )}
                                onClick={() =>
                                  setToggleTarget({
                                    uid: user.uid,
                                    name: getUserDisplayName(user),
                                    actif: user.actif,
                                  })
                                }
                                title={user.actif ? "Suspendre" : "Réactiver"}
                                disabled={isSelf}
                              >
                                {user.actif ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </VisibleTableColumn>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {hasMore && !loading && filteredUsers.length > 0 && (
            <div className="flex justify-center border-t p-4">
              <Button
                variant="ghost"
                onClick={() => loadData({ loadMore: true })}
                disabled={loadingMore}
                className="rounded-xl font-semibold"
              >
                {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Charger plus de collaborateurs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => !open && setToggleTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.actif ? "Suspendre le compte" : "Réactiver le compte"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.actif
                ? `Le collaborateur ${toggleTarget?.name} ne pourra plus se connecter. Vous pourrez le réactiver à tout moment.`
                : `Le collaborateur ${toggleTarget?.name} retrouvera l'accès à l'application.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={toggling}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "rounded-xl",
                toggleTarget?.actif && "bg-destructive hover:bg-destructive/90"
              )}
              onClick={(e) => {
                e.preventDefault()
                confirmToggleStatus()
              }}
              disabled={toggling}
            >
              {toggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
