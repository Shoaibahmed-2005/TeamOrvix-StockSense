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
import { QK } from "@/lib/queryKeys"

export default function MoveHistory() {
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [directionFilter, setDirectionFilter] = useState("ALL")

  const { data: moves = [] } = useQuery({
    queryKey: QK.moves,
    queryFn: async () => {
      const res = await fetch("/api/moves")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    }
  })

  const filtered = moves.filter((m: any) => {
    const matchSearch =
      m.reference?.toLowerCase().includes(search.toLowerCase()) ||
      m.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.contact?.name?.toLowerCase().includes(search.toLowerCase())
    const matchDir = directionFilter === "ALL" || m.direction === directionFilter
    return matchSearch && matchDir
  })

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'IN':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">IN</Badge>
      case 'OUT':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">OUT</Badge>
      case 'INTERNAL':
        return <Badge className="bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-100">INTERNAL</Badge>
      case 'ADJUSTMENT':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">ADJUSTMENT</Badge>
      default:
        return <Badge>{direction}</Badge>
    }
  }

  const getRowClass = (direction: string) => {
    switch (direction) {
      case 'IN': return 'bg-green-50/50 hover:bg-green-50 dark:bg-green-950/20 dark:hover:bg-green-900/30'
      case 'OUT': return 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-900/30'
      case 'INTERNAL': return 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/20 dark:hover:bg-slate-800/30'
      case 'ADJUSTMENT': return 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-900/30'
      default: return ''
    }
  }

  const formatQty = (m: any) => {
    const qty = Math.abs(Number(m.quantity))
    if (m.direction === 'OUT') return `−${qty}`
    if (m.direction === 'INTERNAL') return `${qty}`
    if (m.direction === 'ADJUSTMENT') return Number(m.quantity) > 0 ? `+${qty}` : (Number(m.quantity) < 0 ? `−${qty}` : `${qty}`)
    return `+${qty}`
  }

  const exportCSV = () => {
    if (filtered.length === 0) return
    const headers = ["Reference", "Date", "Contact", "From", "To", "Product", "Quantity", "Direction"]
    const rows = filtered.map((m: any) => [
      m.reference,
      new Date(m.date).toLocaleDateString('en-IN'),
      m.contact?.name || "",
      m.fromLocation?.name || "",
      m.toLocation?.name || "",
      m.product?.name || "",
      formatQty(m),
      m.direction,
    ])
    const csv = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map((e: any[]) => e.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(",")).join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csv))
    link.setAttribute("download", "move_history.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reference, product, contact..."
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
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Direction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No moves found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m: any) => (
                  <TableRow key={m.id} className={getRowClass(m.direction)}>
                    <TableCell className="font-medium font-mono text-xs">{m.reference}</TableCell>
                    <TableCell className="text-sm">{new Date(m.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-sm">{m.contact?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.fromLocation?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.toLocation?.name || "—"}</TableCell>
                    <TableCell className="text-sm">{m.product?.name || "—"}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${m.direction === 'IN' ? 'text-green-700 dark:text-green-400' : m.direction === 'OUT' ? 'text-red-700 dark:text-red-400' : m.direction === 'ADJUSTMENT' ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                      {formatQty(m)}
                    </TableCell>
                    <TableCell>{getDirectionBadge(m.direction)}</TableCell>
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
                  className="border rounded-lg p-4 flex flex-col gap-2 bg-background shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-medium">{m.reference}</span>
                    {getDirectionBadge(m.direction)}
                  </div>
                  <div className="text-sm font-medium">{m.product?.name || "—"}</div>
                  <div className="text-sm text-muted-foreground flex flex-col gap-0.5">
                    {m.contact?.name && <div><span className="font-medium">Contact:</span> {m.contact.name}</div>}
                    <div><span className="font-medium">From:</span> {m.fromLocation?.name || "—"}</div>
                    <div><span className="font-medium">To:</span> {m.toLocation?.name || "—"}</div>
                    <div className={`font-semibold ${m.direction === 'IN' ? 'text-green-700 dark:text-green-400' : m.direction === 'OUT' ? 'text-red-700 dark:text-red-400' : m.direction === 'ADJUSTMENT' ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                      Qty: {formatQty(m)}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      {new Date(m.date).toLocaleDateString('en-IN')}
                    </div>
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
