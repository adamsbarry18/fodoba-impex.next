export const RETURN_TO_QUERY = "returnTo"
export const SELECTED_PARAM_QUERY = "selectedParam"

/** Valide un chemin interne de retour (évite les redirections ouvertes). */
export function sanitizeReturnTo(value: string | null): string | null {
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value)
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null
    return decoded
  } catch {
    return null
  }
}

export function buildCreateEntityUrl(
  createPath: string,
  returnTo: string,
  selectedParam: string
): string {
  const params = new URLSearchParams()
  params.set(RETURN_TO_QUERY, returnTo)
  params.set(SELECTED_PARAM_QUERY, selectedParam)
  return `${createPath}?${params.toString()}`
}

export function buildUrlAfterCreate(
  returnTo: string,
  selectedParam: string,
  createdId: string
): string {
  const [pathname, search = ""] = returnTo.split("?")
  const params = new URLSearchParams(search)
  params.set(selectedParam, createdId)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

/** Lit returnTo / selectedParam depuis l'URL courante (fiable hors Suspense). */
export function readReturnContext(defaultSelectedParam: string) {
  if (typeof window === "undefined") {
    return { returnTo: null as string | null, selectedParam: defaultSelectedParam }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    returnTo: sanitizeReturnTo(params.get(RETURN_TO_QUERY)),
    selectedParam: params.get(SELECTED_PARAM_QUERY) || defaultSelectedParam,
  }
}

/** Consomme un paramètre de retour (?clientId=…) et nettoie l'URL. */
export function consumeReturnParam(paramName: string): string | null {
  if (typeof window === "undefined") return null
  const url = new URL(window.location.href)
  const id = url.searchParams.get(paramName)
  if (!id) return null
  url.searchParams.delete(paramName)
  const next = url.pathname + (url.search ? url.search : "")
  window.history.replaceState({}, "", next)
  return id
}

export const ENTITY_ROUTES = {
  client: {
    create: "/clients/new",
    param: "clientId",
    labelKey: "entity.client.new",
    createdMessageKey: "entity.client.created",
  },
  supplier: {
    create: "/suppliers/new",
    param: "supplierId",
    labelKey: "entity.supplier.new",
    createdMessageKey: "entity.supplier.created",
  },
  category: {
    create: "/admin/categories/new",
    param: "categoryId",
    labelKey: "entity.category.new",
    createdMessageKey: "entity.category.created",
  },
  product: {
    create: "/inventory/new",
    param: "productId",
    labelKey: "entity.product.new",
    createdMessageKey: "entity.product.created",
  },
} as const

export type EntityType = keyof typeof ENTITY_ROUTES
