import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useForm } from "react-hook-form"

export default function Warehouses() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { name: "", shortCode: "", address: "" }
  })

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses")
      return res.json()
    }
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await fetch(`/api/warehouses/${id}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
    } catch (e) {
      console.error(e)
    }
  }

  const handleEdit = (wh: any) => {
    setEditingItem(wh)
    setValue("name", wh.name)
    setValue("shortCode", wh.shortCode)
    setValue("address", wh.address || "")
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    reset({ name: "", shortCode: "", address: "" })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: any) => {
    const url = editingItem ? `/api/warehouses/${editingItem.id}` : "/api/warehouses"
    const method = editingItem ? "PUT" : "POST"
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["warehouses"] })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Warehouse
        </Button>
      </div>
      
      <div className="rounded-md border bg-card overflow-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((wh: any) => (
              <TableRow key={wh.id}>
                <TableCell className="font-medium">{wh.name}</TableCell>
                <TableCell>{wh.shortCode}</TableCell>
                <TableCell>{wh.address}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(wh)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {warehouses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No warehouses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortCode">Short Code</Label>
              <Input id="shortCode" {...register("shortCode", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
