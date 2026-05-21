
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ProductService } from "@/services/product.service"
import { CategoryService } from "@/services/category.service"
import { Product, Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Edit, 
  Package, 
  Loader2, 
  Filter, 
  ArrowDownToLine,
  ArrowUpToLine,
  QrCode,
  ScanLine,
  MoreVertical,
  AlertTriangle,
  ChevronDown,
  Eye
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/contexts/StoreContext"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentSnapshot } from "firebase/firestore"

export default function InventoryPage() {
  const { activeStore } = useStore()
  const { can } = usePermissions()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stocks, setStocks] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | undefined>()
  const [hasMore, setHasMore] = useState(true)

  const loadData = useCallback(async (isMore = false) => {
    if (isMore) setLoadingMore(true); else setLoading(true);
    
    try {
      const [prodData, catData] = await Promise.all([
        ProductService.listProducts(
          { 
            categoryId: filterCategory === "all" ? undefined : filterCategory 
          }, 
          25, 
          isMore ? lastVisible : undefined
        ),
        isMore ? Promise.resolve(null) : CategoryService.listCategories()
      ])

      if (catData) setCategories(catData);
      
      const newProducts = isMore ? [...products, ...prodData.products] : prodData.products;
      setProducts(newProducts);
      setLastVisible(prodData.lastVisible);
      setHasMore(prodData.products.length === 25);

      if (activeStore) {
        const productIds = prodData.products.map(p => p.id);
        const newStocks = await ProductService.getStockLevelsForProducts(productIds, activeStore.id);
        setStocks(prev => ({ ...prev, ...newStocks }));
      }
    } catch (error) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterCategory, lastVisible, products, activeStore])

  useEffect(() => {
    loadData()
  }, [filterCategory, activeStore?.id])

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [products, searchTerm])

  const canManage = can('manage:catalog')

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catalogue & Stocks</h1>
          <p className="text-muted-foreground text-[14px]">
            Consultez les articles et les niveaux de stock pour <strong>{activeStore?.name}</strong>.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="hidden sm:flex rounded-xl font-medium h-10 border-border">
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Export
          </Button>
          {canManage && (
            <Button asChild className="rounded-xl font-medium bg-primary hover:bg-primary/90 h-10">
              <Link href="/inventory/new">
                <Plus className="w-4 h-4 mr-2" /> Ajouter
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom, SKU ou code-barres..." 
            className="pl-9 h-10 bg-background border-border rounded-xl focus:ring-2 focus:ring-primary/5 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-10 rounded-xl bg-background border-border text-sm text-muted-foreground focus:ring-2 focus:ring-primary/5">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border shadow-md">
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="secondary" className="w-full h-10 rounded-xl font-medium border border-border">
          <ScanLine className="w-4 h-4 mr-2" /> Scanner
        </Button>
      </div>

      <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="py-4 pl-6 text-xs uppercase tracking-wider text-muted-foreground">Produit</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">SKU / Barcode</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Catégorie</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Prix (FCFA)</TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground">Stock Local</TableHead>
                    <TableHead className="text-right pr-6 text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                        Aucun produit trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((p) => {
                      const stock = stocks[p.id] ?? 0
                      const isLow = stock <= p.lowStockThreshold
                      const category = categories.find(c => c.id === p.categoryId)?.name

                      return (
                        <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="py-4 pl-6">
                            <div className="font-semibold text-foreground text-sm">{p.name}</div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-0.5">{p.unit}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium bg-background text-muted-foreground border-border">
                              {category || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-headline font-bold text-foreground">
                            {p.sellingPriceFCFA.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-base font-bold font-headline ${isLow ? "text-destructive" : "text-foreground"}`}>
                                {stock}
                              </span>
                              {isLow && <Badge variant="destructive" className="text-[8px] h-3 px-1 rounded-sm mt-0.5">ALERTE</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:bg-muted text-muted-foreground">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-border shadow-md w-40 p-2 bg-popover text-popover-foreground">
                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                  <Link href={`/inventory/${p.id}`} className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Détails
                                  </Link>
                                </DropdownMenuItem>
                                {canManage && (
                                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-primary">
                                    <Link href={`/inventory/${p.id}/edit`} className="flex items-center gap-2">
                                      <Edit className="w-4 h-4" /> Modifier
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              
              {hasMore && (
                <div className="p-6 border-t flex justify-center">
                  <Button variant="ghost" onClick={() => loadData(true)} disabled={loadingMore} className="text-muted-foreground font-semibold hover:text-primary transition-colors h-10">
                    {loadingMore ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    Charger plus de produits
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
