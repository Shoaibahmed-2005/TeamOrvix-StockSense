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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import SettingsTabs from "@/components/layout/SettingsTabs"

export default function Locations() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { name: "", shortCode: "", type: "INTERNAL", warehouseId: "" }
  })
  
  const selectedType = watch("type")

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await fetch("/api/locations")
      return res.json()
    }
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
      await fetch(`/api/locations/${id}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["locations"] })
    } catch (e) {
      console.error(e)
    }
  }

  const handleEdit = (loc: any) => {
    setEditingItem(loc)
    setValue("name", loc.name)
    setValue("shortCode", loc.shortCode || "")
    setValue("type", loc.type)
    setValue("warehouseId", loc.warehouseId || "")
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    reset({ name: "", shortCode: "", type: "INTERNAL", warehouseId: "" })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: any) => {
    if (!data.warehouseId) data.warehouseId = null;
    const url = editingItem ? `/api/locations/${editingItem.id}` : "/api/locations"
    const method = editingItem ? "PUT" : "POST"
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["locations"] })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <SettingsTabs />
      <div className="flex items-center justify-end">
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>
      
      <div className="rounded-md border bg-card overflow-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc: any) => (
              <TableRow key={loc.id}>
                <TableCell className="font-medium">{loc.name}</TableCell>
                <TableCell>{loc.type}</TableCell>
                <TableCell>{loc.warehouse?.name || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(loc)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No locations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Location" : "Add Location"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortCode">Short Code</Label>
              <Input id="shortCode" {...register("shortCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              {/* @ts-ignore */}
              <Select onValueChange={(v) => setValue("type", v)} value={selectedType || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              {/* @ts-ignore */}
              <Select onValueChange={(v) => setValue("warehouseId", v === "none" ? "" : v)} value={watch("warehouseId") || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {warehouses.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
