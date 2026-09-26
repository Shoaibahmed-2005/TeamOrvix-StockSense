import { useState, useRef, useEffect } from "react"
import { Bell, AlertTriangle, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function NotificationsPopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
    refetchInterval: 10000,
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const lateOps = notifications?.lateOperations || []
  const lowStock = notifications?.lowStock || []
  const totalCount = lateOps.length + lowStock.length

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-muted"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-card p-0 shadow-lg z-50">
          <div className="flex items-center justify-between border-b p-3">
            <h4 className="font-semibold text-sm">Notifications</h4>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{totalCount} new</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
            {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>}
            
            {!isLoading && totalCount === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            )}

            {lowStock.map((item: any) => (
              <Link
                key={item.id}
                to={`/stock`}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-md p-2 hover:bg-muted transition-colors"
              >
                <div className="mt-0.5 rounded-full bg-amber-500/10 p-1.5 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.name} is low on stock</span>
                  <span className="text-xs text-muted-foreground">
                    Free: {item.freeToUse} / Min: {item.minQty}
                  </span>
                </div>
              </Link>
            ))}

            {lateOps.map((op: any) => {
              const link = op.type === "RECEIPT" ? `/receipts/${op.id}` : op.type === "DELIVERY" ? `/deliveries/${op.id}` : `/internal/${op.id}`
              return (
                <Link
                  key={op.id}
                  to={link}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-md p-2 hover:bg-muted transition-colors"
                >
                  <div className="mt-0.5 rounded-full bg-destructive/10 p-1.5 text-destructive">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Late {op.type.toLowerCase()}</span>
                    <span className="text-xs text-muted-foreground">
                      {op.reference} was scheduled for {new Date(op.scheduleDate).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
