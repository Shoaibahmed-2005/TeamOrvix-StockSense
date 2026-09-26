import { useState, useEffect } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function MoveHistory() {
  const [moves, setMoves] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchMoves()
  }, [])

  const fetchMoves = async () => {
    const res = await fetch("/api/moves")
    const data = await res.json()
    setMoves(data)
  }

  const filtered = moves.filter(m => 
    m.reference.toLowerCase().includes(search.toLowerCase()) || 
    m.product?.name.toLowerCase().includes(search.toLowerCase())
  )

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'IN': return <Badge className="bg-green-500">IN</Badge>
      case 'OUT': return <Badge className="bg-blue-500">OUT</Badge>
      case 'INTERNAL': return <Badge variant="secondary">INTERNAL</Badge>
      case 'ADJUSTMENT': return <Badge variant="outline">ADJUSTMENT</Badge>
      default: return <Badge>{direction}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search moves..." 
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
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No moves found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.date).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{m.reference}</TableCell>
                  <TableCell>{m.product?.name || "—"}</TableCell>
                  <TableCell>{m.fromLocation?.name || "—"}</TableCell>
                  <TableCell>{m.toLocation?.name || "—"}</TableCell>
                  <TableCell>{getDirectionBadge(m.direction)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {m.direction === 'OUT' || m.direction === 'ADJUSTMENT' && Number(m.quantity) < 0 ? '-' : '+'}
                    {Number(m.quantity)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
