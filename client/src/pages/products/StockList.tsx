import { useState, useEffect } from "react"
import { Search, Edit2, Check, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StockList() {
  const [stock, setStock] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState<number>(0)

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    const res = await fetch("/api/stock")
    const data = await res.json()
    setStock(data)
  }

  const startEdit = (s: any) => {
    setEditingId(s.id)
    setEditQty(s.quantity)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (s: any) => {
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADJUSTMENT",
          warehouseId: s.location.warehouseId,
          destLocationId: s.locationId,
          scheduleDate: new Date().toISOString(),
          operationTypeNote: "Inline stock adjustment",
          lines: [
            { productId: s.productId, quantity: Math.abs(editQty - s.quantity), countedQuantity: editQty }
          ]
        })
      })
      if (!res.ok) throw new Error("Failed to adjust stock")
      await fetchStock()
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert("Failed to adjust stock")
    }
  }

  const filtered = stock.filter(s => 
    s.product.name.toLowerCase().includes(search.toLowerCase()) || 
    s.product.sku.toLowerCase().includes(search.toLowerCase()) ||
    s.location.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search stock..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
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
              filtered.map((s) => {
                const available = s.quantity - s.reservedQuantity
                const isEditing = editingId === s.id

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.location.name}</TableCell>
                    <TableCell>{s.product.name}</TableCell>
                    <TableCell>{s.product.sku}</TableCell>
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
                        <div className="flex items-center justify-end gap-2 group">
                          <span>{s.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(s)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{s.reservedQuantity}</TableCell>
                    <TableCell className="text-right font-medium text-primary">{available}</TableCell>
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
