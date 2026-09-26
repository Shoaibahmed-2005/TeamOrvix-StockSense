
import { Bell, AlertCircle, Box, Truck } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function NotificationsPopover() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ["dashboard", "notifications"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    refetchInterval: 10000 // Poll every 10 seconds
  })

  const lowStock = stats?.lowStockProducts || []
  const pendingReceipts = stats?.pendingReceipts || 0
  const pendingDeliveries = stats?.pendingDeliveries || 0
  
  const totalNotifications = lowStock.length + (pendingReceipts > 0 ? 1 : 0) + (pendingDeliveries > 0 ? 1 : 0)

  return (
    <DropdownMenu>
      {/* @ts-ignore */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {totalNotifications > 0 && (
            <Badge variant="secondary">{totalNotifications} new</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {totalNotifications === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          <div className="max-h-[300px] overflow-auto">
            {pendingReceipts > 0 && (
              <DropdownMenuItem className="cursor-pointer py-3" onClick={() => navigate("/receipts")}>
                <div className="flex gap-3 items-start">
                  <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Pending Receipts</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      You have {pendingReceipts} receipts waiting to be processed.
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            )}

            {pendingDeliveries > 0 && (
              <DropdownMenuItem className="cursor-pointer py-3" onClick={() => navigate("/deliveries")}>
                <div className="flex gap-3 items-start">
                  <div className="bg-purple-100 p-2 rounded-full text-purple-600 shrink-0">
                    <Box className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Pending Deliveries</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      You have {pendingDeliveries} deliveries waiting to be processed.
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            )}

            {lowStock.map((item: any) => (
              <DropdownMenuItem key={item.product?.id} className="cursor-pointer py-3" onClick={() => navigate("/products")}>
                <div className="flex gap-3 items-start">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Low Stock Alert</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {item.product?.name} is running low ({item.quantity} remaining).
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
