import { useState, useEffect } from "react"
import { Plus, Search, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
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

export default function AdjustmentsList() {
  const [operations, setOperations] = useState<any[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchOperations()
  }, [])

  const fetchOperations = async () => {
    const res = await fetch("/api/operations?type=ADJUSTMENT")
    const data = await res.json()
    setOperations(data)
  }

  const handleValidate = async (id: string) => {
    try {
      const res = await fetch(`/api/operations/${id}/validate`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to validate")
      await fetchOperations()
    } catch (error) {
      console.error(error)
      alert("Error validating adjustment")
    }
  }

  const filtered = operations.filter(op => 
    op.reference.toLowerCase().includes(search.toLowerCase()) || 
    op.operationTypeNote?.toLowerCase().includes(search.toLowerCase())
  )

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
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search adjustments..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Adjustment
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No adjustments found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">{op.reference}</TableCell>
                  <TableCell>{op.destLocation?.name || "—"}</TableCell>
                  <TableCell>{op.operationTypeNote || "—"}</TableCell>
                  <TableCell>{new Date(op.scheduleDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(op.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {op.status === 'DRAFT' && (
                        <Button variant="outline" size="sm" onClick={() => handleValidate(op.id)}>
                          Validate
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
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
