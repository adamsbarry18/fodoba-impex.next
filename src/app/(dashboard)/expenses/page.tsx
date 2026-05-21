
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Dépenses</h1>
          <p className="text-muted-foreground">Suivez les charges opérationnelles de <strong>{activeStore?.name}</strong>.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleExportCSV} className="flex-1 md:flex-none">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
                <Plus className="w-4 h-4 mr-2" /> Nouvelle Dépense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[24px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Enregistrer une dépense</DialogTitle>
                <DialogDescription>Cette action débitera immédiatement la caisse active.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700">Montant (FCFA)</Label>
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      placeholder="0" 
                      className="h-11 bg-gray-50 border-gray-100 rounded-xl font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700">Catégorie</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-11 bg-gray-50 border-gray-100 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-gray-700">Libellé / Motif</Label>
                  <Input 
                    value={label} 
                    onChange={e => setLabel(e.target.value)} 
                    placeholder="Ex: Facture EDM Mai 2026" 
                    className="h-11 bg-gray-50 border-gray-100 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700">Mode de règlement</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="h-11 bg-gray-50 border-gray-100 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700">Justificatif (Réf)</Label>
                    <Input 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="N° Facture..." 
                      className="h-11 bg-gray-50 border-gray-100 rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button variant="outline" className="h-12 px-6 rounded-xl font-bold" onClick={() => setOpen(false)}>Annuler</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting} 
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex-1"
                >
                  {submitting ? <Loader2 className="animate-spin mr-2" /> : <Wallet className="mr-2" />}
                  Valider la Sortie
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" /> Dépenses du mois
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-headline">{stats.totalThisMonth.toLocaleString()} FCFA</div>
            <p className="text-[10px] text-muted-foreground mt-1">Arrêté au {format(new Date(), "dd MMMM", { locale: fr })}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground flex items-center">
              <PieChart className="w-3 h-3 mr-1" /> Poste Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.topCategory}</div>
            <div className="flex justify-between items-center mt-1">
               <span className="text-[10px] text-muted-foreground">Consommé: {stats.topCategoryAmount.toLocaleString()} FCFA</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground flex items-center">
              <FileText className="w-3 h-3 mr-1" /> Volume d'écritures
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.count}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Opérations enregistrées au total</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrer par motif ou catégorie..." 
            className="pl-9 h-11 bg-white border-gray-100 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-11 rounded-xl border-gray-100">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Catégorie / Motif</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead className="text-right">Montant (FCFA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Aucune dépense trouvée.</TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-[10px] whitespace-nowrap">
                        {e.timestamp?.toDate ? format(e.timestamp.toDate(), "dd/MM/yyyy HH:mm", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold flex items-center gap-1 text-sm">
                            <Tag className="w-3 h-3 text-muted-foreground" /> {e.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{e.label}</span>
                          {e.notes && <span className="text-[9px] italic text-muted-foreground mt-0.5">Réf: {e.notes}</span>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px]">{e.method.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-[10px]">
                         <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" /> {e.performedByName}
                         </div>
                      </TableCell>
                      <TableCell className="text-right font-headline font-bold text-destructive">
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
