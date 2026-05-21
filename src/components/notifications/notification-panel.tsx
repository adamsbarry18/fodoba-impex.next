
"use client"

import { useState } from "react"
import { useNotifications } from "@/lib/contexts/NotificationContext"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Bell, 
  Trash2, 
  Package, 
  ShoppingCart, 
  Truck, 
  Info,
  Clock,
  CheckCheck,
  Wrench
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_ICONS = {
  STOCK_ALERT: <Package className="h-4 w-4 text-destructive" />,
  SALE: <ShoppingCart className="h-4 w-4 text-primary" />,
  PURCHASE: <Truck className="h-4 w-4 text-accent" />,
  INFO: <Info className="h-4 w-4 text-blue-500" />
};

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll } = useNotifications();
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => !n.read);

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, "'il y a' d 'jours'", { locale: fr });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[450px] p-0 flex flex-col gap-0 border-l-0 shadow-2xl">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold tracking-tight">Historique</SheetTitle>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Tout effacer
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="all" className="w-full flex-1 flex flex-col" onValueChange={setActiveTab}>
            <div className="px-6 py-4">
              <TabsList className="bg-gray-100/50 p-1 h-11 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                  Toutes <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                </TabsTrigger>
                <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                  Non lues
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-2 pb-10">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4 opacity-10" />
                    <p className="text-sm font-medium">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filtered.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "group relative flex items-start gap-4 p-4 rounded-2xl transition-all hover:bg-gray-50",
                          !n.read && "bg-blue-50/30"
                        )}
                        onClick={() => !n.read && markAsRead(n.id)}
                      >
                        <div className="mt-1 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                          <Wrench className="h-4 w-4 text-emerald-500" />
                        </div>
                        
                        <div className="flex-1 space-y-1 pr-6">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">RÉPARATION</p>
                          <h4 className="text-[15px] font-bold text-gray-900">{n.title}</h4>
                          <p className="text-[14px] text-gray-500 leading-relaxed">{n.message}</p>
                          <p className="text-[12px] text-gray-400 font-medium">{formatTime(n.timestamp)}</p>
                        </div>

                        {!n.read && <div className="absolute right-12 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full" />}
                        
                        <button 
                          className="opacity-0 group-hover:opacity-100 absolute right-4 top-4 p-1.5 text-gray-300 hover:text-destructive transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
