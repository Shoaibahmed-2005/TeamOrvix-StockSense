import { useState } from "react"
import { Search, ChevronDown, ChevronRight, Edit2, Check, X, IndianRupee } from "lucide-react"

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null) // "productId::locationId"
  const [editQty, setEditQty] = useState<number>(0)
  const queryClient = useQueryClient()

  // Use summary endpoint (aggregated by product)
  const { data: summary = [] } = useQuery({
    queryKey: [...QK.stock, 'summary'],
    queryFn: async () => {
      const res = await fetch("/api/stock/summary")
      return res.ok ? res.json() : []
    }
  })

  // Raw quants for inline edit (same query key as QK.stock so invalidation hits both)
  const { data: rawStock = [] } = useQuery({
    queryKey: QK.stock,
    queryFn: async () => {
      const res = await fetch("/api/stock")
      return res.ok ? res.json() : []
    }
  })

  const { data: locations = [] } = useQuery({
    queryKey: QK.locations,
    queryFn: async () => {
      const res = await fetch("/api/locations")
      return res.ok ? res.json() : []
    }
  })

  const toggleExpand = (productId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const startEdit = (productId: string, locationId: string, qty: number) => {
    setEditingId(`${productId}::${locationId}`)
    setEditQty(qty)
  }
  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (productId: string, locationId: string, currentQty: number) => {
    try {
      // Find the raw quant to get warehouseId
      const rawQ = rawStock.find((q: any) => q.productId === productId && q.locationId === locationId)
      let warehouseId = rawQ?.location?.warehouseId
      if (!warehouseId) {
        const whs = await fetch("/api/warehouses").then(r => r.json())
        warehouseId = whs[0]?.id
      }
      const diff = editQty - currentQty
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADJUSTMENT",
          warehouseId,
          destLocationId: locationId,
          scheduleDate: new Date().toISOString(),
          operationTypeNote: "Inline stock adjustment",
          lines: [{ productId, quantity: Math.max(1, Math.abs(diff)), countedQuantity: editQty }]
        })
      })
      if (!res.ok) throw new Error("Failed to adjust stock")
      invalidateInventory(queryClient)
      queryClient.invalidateQueries({ queryKey: [...QK.stock, 'summary'] })
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert("Failed to adjust stock")
    }
  }

  const internalLocations = locations.filter((l: any) => l.type === 'INTERNAL')

  const fmtINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

  // Apply filters to summary
  const filtered = summary.filter((s: any) => {
    const matchSearch =
      s.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.product?.sku?.toLowerCase().includes(search.toLowerCase())
    const matchLocation =
      locationFilter === "ALL" ||
      s.locations?.some((l: any) => l.locationId === locationFilter)
    return matchSearch && matchLocation
  })

  const totalValue = filtered.reduce((acc: number, s: any) => {
    // If filtering by location, sum only that location
    if (locationFilter !== "ALL") {
      const locRow = s.locations?.find((l: any) => l.locationId === locationFilter)
      return acc + (locRow?.quantity || 0) * Number(s.product?.unitCost || 0)
    }
    return acc + s.totalOnHand * Number(s.product?.unitCost || 0)
  }, 0)

  return (
    <div className="flex flex-col gap-6 h-full">
      <StockTabs />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product..."
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
              <TableHead className="w-8"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Unit Cost (₹)</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Free to Use</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No stock found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s: any) => {
                // Determine displayed values based on location filter
                const locRows = locationFilter === "ALL"
                  ? s.locations
                  : s.locations?.filter((l: any) => l.locationId === locationFilter)

                const displayOnHand = locRows?.reduce((a: number, l: any) => a + l.quantity, 0) ?? 0
                const displayReserved = locRows?.reduce((a: number, l: any) => a + l.reservedQuantity, 0) ?? 0
                const displayFree = displayOnHand - displayReserved
                const isExpanded = expanded.has(s.productId)
                const multipleLocations = s.locations?.length > 1

                return (
                  <>
                    {/* Product aggregate row */}
                    <TableRow key={s.productId} className="hover:bg-muted/40 cursor-pointer" onClick={() => multipleLocations && toggleExpand(s.productId)}>
                      <TableCell className="text-center">
                        {multipleLocations ? (
                          isExpanded
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground mx-auto" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground mx-auto" />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{s.product?.name}</div>
                        <div className="text-xs text-muted-foreground">[{s.product?.sku}]</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {locRows?.length === 1
                          ? locRows[0].location?.name
                          : <span className="italic">{locRows?.length ?? 0} location(s)</span>
                        }
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtINR(Number(s.product?.unitCost || 0))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {displayOnHand}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${displayFree === 0 ? 'text-destructive' : displayFree < 5 ? 'text-amber-600' : 'text-green-700 dark:text-green-400'}`}>
                        {displayFree}
                      </TableCell>
                    </TableRow>

                    {/* Expandable per-location breakdown */}
                    {isExpanded && s.locations?.map((loc: any) => {
                      const locFree = loc.quantity - loc.reservedQuantity
                      const editKey = `${s.productId}::${loc.locationId}`
                      const isEditing = editingId === editKey
                      return (
                        <TableRow key={editKey} className="bg-muted/20 text-sm">
                          <TableCell />
                          <TableCell className="pl-8 text-muted-foreground">
                            {s.product?.name}
                          </TableCell>
                          <TableCell className="text-primary text-xs font-medium">
                            {loc.location?.name}
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-right tabular-nums">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  className="w-20 h-7 text-right text-sm"
                                  value={editQty}
                                  onChange={(e) => setEditQty(Number(e.target.value))}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={(e) => { e.stopPropagation(); saveEdit(s.productId, loc.locationId, loc.quantity) }}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); cancelEdit() }}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2 group">
                                <span>{loc.quantity}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); startEdit(s.productId, loc.locationId, loc.quantity) }}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${locFree === 0 ? 'text-destructive' : locFree < 5 ? 'text-amber-600' : 'text-green-700 dark:text-green-400'}`}>
                            {locFree}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Single-location inline edit (not expanded) */}
                    {!multipleLocations && s.locations?.map((loc: any) => {
                      const editKey = `${s.productId}::${loc.locationId}`
                      const isEditing = editingId === editKey
                      if (!isEditing) return null
                      return (
                        <TableRow key={`edit-${editKey}`} className="bg-muted/20">
                          <TableCell />
                          <TableCell colSpan={2} className="text-sm text-muted-foreground pl-8">Editing quantity at {loc.location?.name}</TableCell>
                          <TableCell />
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Input type="number" className="w-20 h-7 text-right text-sm" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} autoFocus />
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => saveEdit(s.productId, loc.locationId, loc.quantity)}><Check className="h-3 w-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      )
                    })}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
