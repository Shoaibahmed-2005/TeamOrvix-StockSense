import { useState } from "react"
import { Search, Download, LayoutList, LayoutGrid } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

import { useQuery } from "@tanstack/react-query"

export default function MoveHistory() {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [directionFilter, setDirectionFilter] = useState("ALL")

  const { data: moves = [] } = useQuery({
    queryKey: ["moves"],
    queryFn: async () => {
      const res = await fetch("/api/moves")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    }
  })

  const filtered = moves.filter((m: any) => {
    const matchSearch = m.reference.toLowerCase().includes(search.toLowerCase()) || 
      m.product?.name.toLowerCase().includes(search.toLowerCase())
    const matchDir = directionFilter === "ALL" || m.direction === directionFilter
    return matchSearch && matchDir
  })

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'IN': return <Badge className="bg-green-500">IN</Badge>
      case 'OUT': return <Badge className="bg-blue-500">OUT</Badge>
      case 'INTERNAL': return <Badge variant="secondary">INTERNAL</Badge>
      case 'ADJUSTMENT': return <Badge variant="outline">ADJUSTMENT</Badge>
      default: return <Badge>{direction}</Badge>
    }
  }

  const exportCSV = () => {
    if (filtered.length === 0) return
    const headers = ["Date", "Reference", "Product", "From", "To", "Direction", "Quantity"]
    const rows = filtered.map((m: any) => [
      new Date(m.date).toLocaleString(),
      m.reference,
      m.product?.name || "",
      m.fromLocation?.name || "",
      m.toLocation?.name || "",
      m.direction,
      m.direction === 'OUT' || (m.direction === 'ADJUSTMENT' && Number(m.quantity) < 0) ? `-${Math.abs(m.quantity)}` : `+${Math.abs(m.quantity)}`
    ])
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map((e: any[]) => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "move_history.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search moves..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={directionFilter} onValueChange={(val: any) => setDirectionFilter(val)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Directions</SelectItem>
              <SelectItem value="IN">IN</SelectItem>
              <SelectItem value="OUT">OUT</SelectItem>
              <SelectItem value="INTERNAL">INTERNAL</SelectItem>
              <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center border rounded-md">
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon"
              className="rounded-none rounded-l-md h-9 w-9"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "kanban" ? "secondary" : "ghost"} 
              size="icon"
              className="rounded-none rounded-r-md h-9 w-9"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button onClick={exportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        {viewMode === "list" ? (
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
                filtered.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.date).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{m.reference}</TableCell>
                    <TableCell>{m.product?.name || "—"}</TableCell>
                    <TableCell>{m.fromLocation?.name || "—"}</TableCell>
                    <TableCell>{m.toLocation?.name || "—"}</TableCell>
                    <TableCell>{getDirectionBadge(m.direction)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {m.direction === 'OUT' || (m.direction === 'ADJUSTMENT' && Number(m.quantity) < 0) ? '-' : '+'}
                      {Math.abs(Number(m.quantity))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filtered.length === 0 ? (
              <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground">
                No moves found.
              </div>
            ) : (
              filtered.map((m: any) => (
                <div 
                  key={m.id} 
                  className="border rounded-lg p-4 flex flex-col gap-3 bg-background shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-medium truncate pr-2">{m.product?.name || "—"}</span>
                    {getDirectionBadge(m.direction)}
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-col gap-1">
                    <div><span className="font-medium">Ref:</span> {m.reference}</div>
                    <div><span className="font-medium">Qty:</span> {m.direction === 'OUT' || (m.direction === 'ADJUSTMENT' && Number(m.quantity) < 0) ? '-' : '+'}{Math.abs(Number(m.quantity))}</div>
                    <div><span className="font-medium">From:</span> {m.fromLocation?.name || "—"}</div>
                    <div><span className="font-medium">To:</span> {m.toLocation?.name || "—"}</div>
                    <div className="text-xs mt-1 text-muted-foreground/70">{new Date(m.date).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
