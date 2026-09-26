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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function ReceiptsList() {
  const [operations, setOperations] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchOperations()
  }, [])

  const fetchOperations = async () => {
    const res = await fetch("/api/operations?type=RECEIPT")
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
      alert("Error validating receipt")
    }
  }

  const filtered = operations.filter(op => 
    op.reference.toLowerCase().includes(search.toLowerCase()) || 
    op.contact?.name.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search receipts..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Receipt
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Contact (Vendor)</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No receipts found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">{op.reference}</TableCell>
                  <TableCell>{op.contact?.name || "—"}</TableCell>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Receipt</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Form implementation goes here...
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
