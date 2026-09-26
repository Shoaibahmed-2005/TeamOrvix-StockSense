import { useState } from "react"
import { Search, Edit2, Check, X, IndianRupee } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QK, invalidateInventory } from "@/lib/queryKeys"
import StockTabs from "@/components/layout/StockTabs"

export default function StockList() {
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState("ALL")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState<number>(0)
  const queryClient = useQueryClient()

  const { data: stock = [] } = useQuery({
    queryKey: QK.stock,
    queryFn: async () => {
      const res = await fetch("/api/stock")
      return res.json()
    }
  })

  const { data: locations = [] } = useQuery({
    queryKey: QK.locations,
    queryFn: async () => {
      const res = await fetch("/api/locations")
      return res.ok ? res.json() : []
    }
  })

  const startEdit = (s: any) => {
    setEditingId(s.id)
    setEditQty(Number(s.quantity))
  }

  const cancelEdit = () => { setEditingId(null) }

  const saveEdit = async (s: any) => {
    try {
      // Need warehouseId — get from location or fallback to first warehouse
      let warehouseId = s.location?.warehouseId
      if (!warehouseId) {
        const whs = await fetch("/api/warehouses").then(r => r.json())
        warehouseId = whs[0]?.id
      }
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADJUSTMENT",
          warehouseId,
          destLocationId: s.locationId,
          scheduleDate: new Date().toISOString(),
          operationTypeNote: "Inline stock adjustment",
          lines: [
            { productId: s.productId, quantity: Math.max(1, Math.abs(editQty - Number(s.quantity))), countedQuantity: editQty }
          ]
        })
      })
      if (!res.ok) throw new Error("Failed to adjust stock")
      invalidateInventory(queryClient)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert("Failed to adjust stock")
    }
  }

  const internalLocations = locations.filter((l: any) => l.type === 'INTERNAL')

  const filtered = stock.filter((s: any) => {
    const matchSearch =
      s.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.product?.sku?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.name?.toLowerCase().includes(search.toLowerCase())
    const matchLocation = locationFilter === "ALL" || s.locationId === locationFilter
    return matchSearch && matchLocation
  })

  // Aggregate total value
  const totalValue = filtered.reduce((acc: number, s: any) =>
    acc + Number(s.quantity) * Number(s.product?.unitCost || 0), 0)

  const fmtINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

  return (
    <div className="flex flex-col gap-6 h-full">
      <StockTabs />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product or location..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={locationFilter} onValueChange={(v: any) => setLocationFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Locations</SelectItem>
              {internalLocations.map((l: any) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IndianRupee className="h-4 w-4" />
          <span className="font-medium">Total Stock Value:</span>
          <span className="font-bold text-foreground">{fmtINR(totalValue)}</span>
        </div>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Per Unit Cost (₹)</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Free to Use</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No stock found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s: any) => {
                const onHand = Number(s.quantity)
                const reserved = Number(s.reservedQuantity)
                const freeToUse = onHand - reserved
                const isEditing = editingId === s.id

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{s.product?.name}</div>
                        <div className="text-xs text-muted-foreground">[{s.product?.sku}]</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.location?.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtINR(Number(s.product?.unitCost || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            className="w-20 h-8 text-right"
                            value={editQty}
                            onChange={(e) => setEditQty(Number(e.target.value))}
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => saveEdit(s)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group tabular-nums">
                          <span>{onHand}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(s)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${freeToUse === 0 ? 'text-destructive' : freeToUse < 5 ? 'text-amber-600' : 'text-green-700'}`}>
                      {freeToUse}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
