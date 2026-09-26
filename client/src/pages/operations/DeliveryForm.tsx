import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Printer, Check, X, Plus, Trash2, AlertCircle } from "lucide-react"

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
import OperationPrintView from "@/components/operations/OperationPrintView"

export default function DeliveryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const isNew = id === "new"
  
  const [op, setOp] = useState<any>({
    type: "DELIVERY",
    status: "DRAFT",
    scheduleDate: new Date().toISOString().slice(0, 16),
    contactId: "",
    sourceLocationId: "",
    lines: []
  })
  
  const [contacts, setContacts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [errorToast, setErrorToast] = useState<string | null>(null)
  
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
      navigate("/deliveries")
    }
  }

  const handleSave = async () => {
    try {
      if (isNew) {
        const payload = {
          type: "DELIVERY",
          contactId: op.contactId || null,
          sourceLocationId: op.sourceLocationId || null,
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
        navigate(`/deliveries/${saved.id}`)
      } else {
        alert("Update not fully implemented. Use state transitions.")
      }
    } catch (e) {
      console.error(e)
      alert("Error saving")
    }
  }

  const handleAction = async (action: 'confirm' | 'validate' | 'cancel') => {
    try {
      setErrorToast(null)
      const res = await fetch(`/api/operations/${id}/${action}`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        if (err.error?.code === 'INSUFFICIENT_STOCK') {
          setErrorToast(err.error.message)
        } else {
          throw new Error(err.error?.message || `Failed to ${action}`)
        }
        return
      }
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
    <>
      <OperationPrintView op={op} />
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 relative print:hidden">
      {errorToast && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{errorToast}</span>
          <Button variant="ghost" size="icon" onClick={() => setErrorToast(null)} className="h-6 w-6 ml-4">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/deliveries")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">
          {isNew ? "New Delivery" : op.reference}
        </h1>
        <div className="flex items-center gap-2">
          {isNew && (
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          )}
          {!isNew && op.status === 'DRAFT' && (
            <Button onClick={() => handleAction('confirm')}>
              Check Availability
            </Button>
          )}
          {!isNew && op.status === 'WAITING' && (
            <Button onClick={() => handleAction('confirm')}>
              Recheck Availability
            </Button>
          )}
          {!isNew && op.status === 'READY' && (
            <Button onClick={() => handleAction('validate')} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="mr-2 h-4 w-4" /> Validate
            </Button>
          )}
          {!isNew && (op.status === 'DRAFT' || op.status === 'READY' || op.status === 'WAITING') && (
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
          <div className={`flex-1 text-center py-2 border-r ${op.status === 'WAITING' ? 'font-bold text-yellow-600' : 'text-muted-foreground'}`}>
            Waiting
          </div>
          <div className={`flex-1 text-center py-2 border-r ${op.status === 'READY' ? 'font-bold text-blue-600' : 'text-muted-foreground'}`}>
            Ready
          </div>
          <div className={`flex-1 text-center py-2 ${op.status === 'DONE' ? 'font-bold text-green-600' : 'text-muted-foreground'}`}>
            Done
          </div>
        </div>
      )}

      {errorToast && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-md">
          <h4 className="font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Insufficient Stock</h4>
          <p className="text-sm mt-1">{errorToast}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 bg-card border rounded-lg p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Customer (Delivery Address)</label>
            <Select 
              value={op.contactId || ""} 
              onValueChange={(v) => setOp({...op, contactId: v})}
              disabled={!isNew && op.status !== 'DRAFT'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {contacts.filter(c => c.type === 'CUSTOMER').map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Source Location</label>
            <Select 
              value={op.sourceLocationId || ""} 
              onValueChange={(v) => setOp({...op, sourceLocationId: v})}
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
        <div className={`border rounded-md bg-card ${errorToast ? 'border-red-500' : ''}`}>
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
                          <span>{line.countedQuantity ?? (op.status === 'DONE' ? line.quantity : 0)}</span>
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
    </>
  )
}
