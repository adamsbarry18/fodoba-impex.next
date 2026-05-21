"use client"

import { useState, useEffect } from "react"
import { CategoryService } from "@/services/category.service"
import { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Plus, 
  Edit, 
  FolderTree, 
  Loader2,
  ChevronRight,
  ChevronDown,
  Trash2,
  Tag
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface CategoryNode extends Category {
  children: CategoryNode[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await CategoryService.listCategories()
      setCategories(data)
    } catch (error) {
      toast.error("Erreur lors du chargement des catégories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const buildTree = (items: Category[], parentId: string | null = null): CategoryNode[] => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }))
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return
    
    try {
      await CategoryService.deleteCategory(id)
      toast.success("Catégorie supprimée")
      loadCategories()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const tree = buildTree(categories)

  const CategoryItem = ({ node, level = 0 }: { node: CategoryNode, level: number }) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expanded[node.id]

    return (
      <div className="space-y-1">
        <div 
          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 p-0" 
                onClick={() => toggleExpand(node.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            <Tag className={`h-4 w-4 ${node.active ? "text-accent" : "text-muted-foreground"}`} />
            <span className={`font-medium ${!node.active && "text-muted-foreground line-through"}`}>
              {node.name}
            </span>
            {!node.active && <Badge variant="outline" className="text-[10px] h-4">Inactif</Badge>}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <Link href={`/admin/categories/${node.id}/edit`}>
                <Edit className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => handleDelete(node.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map(child => (
              <CategoryItem key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catégories Produits</h1>
          <p className="text-muted-foreground">Gérez la hiérarchie du catalogue FODOBA IMPEX.</p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="w-4 h-4 mr-2" /> Nouvelle Catégorie
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-accent" />
            Arborescence du Catalogue
          </CardTitle>
          <CardDescription>
            Organisez vos produits par familles et sous-familles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Tag className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune catégorie configurée.</p>
              <Button variant="link" asChild className="mt-2">
                <Link href="/admin/categories/new">Créer la première catégorie</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map(node => (
                <CategoryItem key={node.id} node={node} level={0} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
