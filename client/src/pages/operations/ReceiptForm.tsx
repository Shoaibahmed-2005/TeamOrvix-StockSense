import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Printer, Check, X, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAuth } from "@/lib/auth"
import { socket } from "@/App"

export default function ReceiptForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const isNew = id === "new"
  
  const [op, setOp] = useState<any>({
    type: "RECEIPT",
    status: "DRAFT",
    scheduleDate: new Date().toISOString().slice(0, 16),
    contactId: "",
    destLocationId: "",
    lines: []
  })
  
  const [contacts, setContacts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  useEffect(() => {
    fetchDependencies()
    if (!isNew) {
      fetchOperation()
    }
  }, [id])

  useEffect(() => {
    const handleUpdate = () => {
      if (!isNew) fetchOperation()
    }
    socket.on("operation-update", handleUpdate)
    return () => {
      socket.off("operation-update", handleUpdate)
    }
  }, [isNew])

  const fetchDependencies = async () => {
    try {
      const [cRes, lRes, pRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/locations"),
        fetch("/api/products")
      ])
      
      // Fallback to empty arrays if endpoints don't exist yet
      if (cRes.ok) setContacts(await cRes.json())
      if (lRes.ok) setLocations(await lRes.json())
      if (pRes.ok) setProducts(await pRes.json())
    } catch (e) {
      console.error(e)
    }
  }

  const fetchOperation = async () => {
    try {
      const res = await fetch(`/api/operations/${id}`)
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      setOp({
        ...data,
        scheduleDate: data.scheduleDate ? new Date(data.scheduleDate).toISOString().slice(0, 16) : ""
      })
    } catch (e) {
      console.error(e)
      navigate("/receipts")
    }
  }

  const handleSave = async () => {
    try {
      if (isNew) {
        const payload = {
          type: "RECEIPT",
          contactId: op.contactId || null,
          destLocationId: op.destLocationId || null,
          scheduleDate: new Date(op.scheduleDate).toISOString(),
          responsibleId: user?.id,
          lines: op.lines
        }
        const res = await fetch("/api/operations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error("Failed to save")
        const saved = await res.json()
        navigate(`/receipts/${saved.id}`)
      } else {
        // Assume update operation endpoint exists or just handle state transitions
        alert("Update not fully implemented. Use state transitions.")
      }
    } catch (e) {
      console.error(e)
      alert("Error saving")
    }
  }

  const handleAction = async (action: 'confirm' | 'validate' | 'cancel') => {
    try {
      const res = await fetch(`/api/operations/${id}/${action}`, { method: "POST" })
      if (!res.ok) throw new Error(`Failed to ${action}`)
      fetchOperation()
    } catch (e) {
      console.error(e)
      alert(`Error performing ${action}`)
    }
  }

  const addLine = () => {
    setOp({
      ...op,
      lines: [...op.lines, { productId: "", quantity: 1, countedQuantity: 1 }]
    })
  }

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...op.lines]
    newLines[index][field] = value
    setOp({ ...op, lines: newLines })
  }

  const removeLine = (index: number) => {
    const newLines = [...op.lines]
    newLines.splice(index, 1)
    setOp({ ...op, lines: newLines })
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/receipts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">
          {isNew ? "New Receipt" : op.reference}
        </h1>
        <div className="flex items-center gap-2">
          {isNew && (
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          )}
          {!isNew && op.status === 'DRAFT' && (
            <Button onClick={() => handleAction('confirm')}>
              Mark as To Do
            </Button>
          )}
          {!isNew && op.status === 'READY' && (
            <Button onClick={() => handleAction('validate')} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="mr-2 h-4 w-4" /> Validate
            </Button>
          )}
          {!isNew && (op.status === 'DRAFT' || op.status === 'READY') && (
            <Button variant="destructive" onClick={() => handleAction('cancel')}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          {!isNew && op.status === 'DONE' && (
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          )}
        </div>
      </div>

      {!isNew && (
        <div className="flex items-center gap-2 bg-muted/50 p-4 rounded-lg border">
          <div className={`flex-1 text-center py-2 border-r ${op.status === 'DRAFT' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
            Draft
          </div>
          <div className={`flex-1 text-center py-2 border-r ${op.status === 'READY' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
            Ready
          </div>
          <div className={`flex-1 text-center py-2 ${op.status === 'DONE' ? 'font-bold text-green-600' : 'text-muted-foreground'}`}>
            Done
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 bg-card border rounded-lg p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Receive From (Vendor)</label>
            <Select 
              value={op.contactId || ""} 
              onValueChange={(v) => setOp({...op, contactId: v})}
              disabled={!isNew && op.status !== 'DRAFT'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Vendor" />
              </SelectTrigger>
              <SelectContent>
                {contacts.filter(c => c.type === 'VENDOR').map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Destination Location</label>
            <Select 
              value={op.destLocationId || ""} 
              onValueChange={(v) => setOp({...op, destLocationId: v})}
              disabled={!isNew && op.status !== 'DRAFT'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.filter(l => l.type === 'INTERNAL').map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Schedule Date</label>
            <Input 
              type="datetime-local" 
              value={op.scheduleDate}
              onChange={(e) => setOp({...op, scheduleDate: e.target.value})}
              disabled={!isNew && op.status !== 'DRAFT'}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Responsible</label>
            <Input 
              value={isNew ? user?.fullName || "" : (op.responsible?.fullName || "")} 
              disabled 
              className="bg-muted"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Products</h3>
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-[150px]">Demand</TableHead>
                {!isNew && <TableHead className="w-[150px]">Done</TableHead>}
                {(isNew || op.status === 'DRAFT') && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {op.lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isNew ? 3 : 4} className="h-24 text-center text-muted-foreground">
                    No products added.
                  </TableCell>
                </TableRow>
              ) : (
                op.lines.map((line: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {isNew || op.status === 'DRAFT' ? (
                        <Select 
                          value={line.productId} 
                          onValueChange={(v) => updateLine(idx, "productId", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span>{line.product?.name || products.find(p => p.id === line.productId)?.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isNew || op.status === 'DRAFT' ? (
                        <Input 
                          type="number" 
                          min="1" 
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                        />
                      ) : (
                        <span>{line.quantity}</span>
                      )}
                    </TableCell>
                    {!isNew && (
                      <TableCell>
                        {op.status === 'READY' ? (
                           <Input 
                             type="number" 
                             min="0" 
                             value={line.countedQuantity ?? line.quantity}
                             onChange={(e) => updateLine(idx, "countedQuantity", Number(e.target.value))}
                           />
                        ) : (
                          <span>{line.countedQuantity ?? line.quantity}</span>
                        )}
                      </TableCell>
                    )}
                    {(isNew || op.status === 'DRAFT') && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {(isNew || op.status === 'DRAFT') && (
          <div>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" /> Add a product
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
