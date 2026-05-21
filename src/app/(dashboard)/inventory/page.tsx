
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
          <p className="text-muted-foreground">
            Consultez les articles et les niveaux de stock pour <strong>{activeStore?.name}</strong>.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="hidden sm:flex rounded-xl font-bold">
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Export
          </Button>
          {canManage && (
            <Button asChild className="rounded-xl font-bold bg-primary hover:bg-primary/90">
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
            className="pl-9 h-11 bg-white border-gray-100 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-11 rounded-xl bg-white border-gray-100">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="secondary" className="w-full h-11 rounded-xl font-bold">
          <ScanLine className="w-4 h-4 mr-2" /> Scanner
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-[24px] overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="py-4 pl-6">Produit</TableHead>
                    <TableHead>SKU / Barcode</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix (FCFA)</TableHead>
                    <TableHead className="text-center">Stock Local</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
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
                        <TableRow key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                          <TableCell className="py-4 pl-6">
                            <div className="font-bold text-gray-900">{p.name}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{p.unit}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs text-gray-500">{p.sku}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium bg-white text-gray-500 border-gray-200">
                              {category || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-headline font-bold text-gray-900">
                            {p.sellingPriceFCFA.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-lg font-bold font-headline ${isLow ? "text-destructive" : "text-gray-900"}`}>
                                {stock}
                              </span>
                              {isLow && <Badge variant="destructive" className="text-[8px] h-3 px-1 rounded-sm">ALERTE</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:bg-gray-100">
                                  <MoreVertical className="h-4 w-4 text-gray-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl w-40 p-2">
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
                  <Button variant="ghost" onClick={() => loadData(true)} disabled={loadingMore} className="text-gray-400 font-bold hover:text-primary transition-colors">
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
