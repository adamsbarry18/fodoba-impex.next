
"use client"

import { useState, useEffect, useMemo } from "react"
import { ExpenseService } from "@/services/expense.service"
import { Expense } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Wallet, 
  Loader2, 
  Calendar, 
  User, 
  Tag, 
  Download, 
  Search, 
  Filter, 
  FileText,
  TrendingDown,
  PieChart
} from "lucide-react"
import { useStore } from "@/lib/contexts/StoreContext"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/contexts/AuthContext"
import Papa from "papaparse"

const CATEGORIES = ["Loyer", "Électricité", "Eau", "Transport", "Personnel", "Fournitures", "Maintenance", "Marketing", "Divers"];
const METHODS = ["CASH", "ORANGE_MONEY", "MOBILE_MONEY", "CARD", "TRANSFER"];

export default function ExpensesPage() {
  const { activeStore } = useStore()
  const { userProfile } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Form
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [label, setLabel] = useState("")
  const [method, setMethod] = useState(METHODS[0])
  const [notes, setNotes] = useState("")

  const loadExpenses = async () => {
    if (!activeStore) return
    setLoading(true)
    try {
      const data = await ExpenseService.listExpenses(activeStore.id)
      setExpenses(data)
    } catch (error) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [activeStore])

  const handleSubmit = async () => {
    if (!amount || !label || !activeStore || !userProfile) return
    setSubmitting(true)
    try {
      await ExpenseService.createExpense({
        storeId: activeStore.id,
        category,
        label,
        amount: Number(amount),
        method,
        user: userProfile,
        notes
      })
      toast.success("Dépense enregistrée et caisse débitée")
      setOpen(false)
      loadExpenses()
      setAmount(""); setLabel(""); setNotes(""); setCategory(CATEGORIES[0]); setMethod(METHODS[0]);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [expenses, searchTerm, categoryFilter])

  const stats = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    const thisMonth = expenses.filter(e => {
      const date = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp)
      return isWithinInterval(date, { start, end })
    })

    const totalThisMonth = thisMonth.reduce((acc, e) => acc + e.amount, 0)
    const catTotals: Record<string, number> = {}
    expenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount
    })
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]

    return {
      totalThisMonth,
      topCategory: topCat ? topCat[0] : "N/A",
      topCategoryAmount: topCat ? topCat[1] : 0,
      count: expenses.length
    }
  }, [expenses])

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return
    const data = filteredExpenses.map(e => ({
      Date: e.timestamp?.toDate ? format(e.timestamp.toDate(), "dd/MM/yyyy HH:mm") : "-",
      Categorie: e.category,
      Libelle: e.label,
      Montant: e.amount,
      Mode: e.method,
      Auteur: e.performedByName,
      Notes: e.notes || ""
    }))
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `depenses_${activeStore?.code}_${format(new Date(), "yyyyMMdd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Gestion des Dépenses</h1>
          <p className="text-xs text-muted-foreground mt-1">Suivez les charges opérationnelles de <span className="font-semibold text-foreground">{activeStore?.name}</span>.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleExportCSV} 
            className="h-10 px-4 border border-border bg-background hover:bg-muted text-foreground font-semibold rounded-xl text-xs flex-1 md:flex-none transition-all"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm transition-all text-xs flex-1 md:flex-none">
                <Plus className="w-4 h-4 mr-2" /> Nouvelle Dépense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border bg-background shadow-lg p-0 overflow-hidden">
              <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                <DialogTitle className="text-xl font-bold text-foreground">Enregistrer une dépense</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">Cette action débitera immédiatement la caisse active.</DialogDescription>
              </DialogHeader>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Montant (FCFA)</Label>
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      placeholder="0" 
                      className="h-10 bg-background border-border rounded-lg font-bold text-[15px] focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Catégorie</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-10 bg-background border-border rounded-lg text-sm focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-md">
                        {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Libellé / Motif</Label>
                  <Input 
                    value={label} 
                    onChange={e => setLabel(e.target.value)} 
                    placeholder="Ex: Facture EDM Mai 2026" 
                    className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Mode de règlement</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="h-10 bg-background border-border rounded-lg text-sm focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-md">
                        {METHODS.map(m => <SelectItem key={m} value={m} className="text-xs">{m.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Justificatif (Réf)</Label>
                    <Input 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="N° Facture..." 
                      className="h-10 bg-background border-border rounded-lg text-sm focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="p-6 bg-muted/20 border-t border-border flex flex-row items-center justify-end gap-3">
                <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-semibold" onClick={() => setOpen(false)}>Annuler</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting} 
                  className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-sm flex-1 md:flex-none"
                >
                  {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Wallet className="mr-2 h-4 w-4" />}
                  Valider la Sortie
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Dépenses du mois</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-foreground">{stats.totalThisMonth.toLocaleString()} FCFA</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Arrêté au {format(new Date(), "dd MMMM", { locale: fr })}</p>
          </CardContent>
        </Card>

        <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Poste Principal</CardTitle>
            <PieChart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.topCategory}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Consommé: {stats.topCategoryAmount.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>

        <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Volume d'écritures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.count}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Opérations enregistrées au total</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrer par motif ou catégorie..." 
            className="pl-9 h-10 bg-background border-border rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[220px] h-10 bg-background border-border rounded-xl text-[13px] font-medium text-muted-foreground focus:ring-2 focus:ring-primary/5 transition-all">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <SelectValue placeholder="Catégorie" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border shadow-md">
            <SelectItem value="all" className="text-xs">Toutes les catégories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="py-4 pl-6 text-xs uppercase tracking-wider text-muted-foreground">Date & Heure</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Catégorie / Motif</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Mode</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Auteur</TableHead>
                  <TableHead className="text-right pr-6 text-xs uppercase tracking-wider text-muted-foreground">Montant (FCFA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">Aucune dépense trouvée.</TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map(e => (
                    <TableRow key={e.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="py-4 pl-6 font-mono text-xs text-muted-foreground">
                        {e.timestamp?.toDate ? format(e.timestamp.toDate(), "dd/MM/yyyy HH:mm", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-primary" /> {e.category}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">{e.label}</span>
                          {e.notes && <span className="text-[10px] italic text-muted-foreground mt-1 bg-muted/40 px-2 py-0.5 rounded border border-border/50 w-max">Réf: {e.notes}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-[10px] bg-background text-muted-foreground border-border">
                          {e.method.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground/70" /> {e.performedByName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-headline font-bold text-destructive text-base">
                        -{e.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
