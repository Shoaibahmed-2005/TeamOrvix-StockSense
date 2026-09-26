import { useState, useEffect } from "react"
import { Plus, Search, Eye, LayoutList, LayoutGrid } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

export default function ReceiptsList() {
  const [operations, setOperations] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const navigate = useNavigate()

  useEffect(() => {
    fetchOperations()
  }, [])

  const fetchOperations = async () => {
    try {
      const res = await fetch("/api/operations?type=RECEIPT")
      const data = await res.json()
      setOperations(data)
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = operations.filter(op => {
    const matchesSearch = op.reference.toLowerCase().includes(search.toLowerCase()) || 
      (op.contact?.name || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || op.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="outline">Draft</Badge>
      case 'READY': return <Badge className="bg-blue-500 hover:bg-blue-600">Ready</Badge>
      case 'DONE': return <Badge className="bg-green-500 hover:bg-green-600">Done</Badge>
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ref or vendor..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "ALL")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
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

        <Button onClick={() => navigate("/receipts/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Receipt
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        {viewMode === "list" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Contact (Vendor)</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No receipts found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((op) => (
                  <TableRow key={op.id} className="cursor-pointer" onClick={() => navigate(`/receipts/${op.id}`)}>
                    <TableCell className="font-medium">{op.reference}</TableCell>
                    <TableCell>Partners/Vendors</TableCell>
                    <TableCell>{op.destLocation?.name || "WH/Stock"}</TableCell>
                    <TableCell>{op.contact?.name || "—"}</TableCell>
                    <TableCell>{new Date(op.scheduleDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(op.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/receipts/${op.id}`); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
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
                No receipts found.
              </div>
            ) : (
              filtered.map((op) => (
                <div 
                  key={op.id} 
                  className="border rounded-lg p-4 flex flex-col gap-3 cursor-pointer hover:border-primary transition-colors bg-background shadow-sm"
                  onClick={() => navigate(`/receipts/${op.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-medium">{op.reference}</span>
                    {getStatusBadge(op.status)}
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-col gap-1">
                    <div><span className="font-medium">Vendor:</span> {op.contact?.name || "—"}</div>
                    <div><span className="font-medium">To:</span> {op.destLocation?.name || "WH/Stock"}</div>
                    <div><span className="font-medium">Date:</span> {new Date(op.scheduleDate).toLocaleDateString()}</div>
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
