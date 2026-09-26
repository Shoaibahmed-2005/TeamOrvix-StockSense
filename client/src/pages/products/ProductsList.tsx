import { useState } from "react"
import { Plus, Search, Edit } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, type ProductInput } from "@stocksense/shared"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useQuery, useQueryClient } from "@tanstack/react-query"

export default function ProductsList() {
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: null,
      uom: "Units",
      unitCost: 0,
    }
  })

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    }
  })

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await fetch("/api/locations")
      return res.ok ? res.json() : []
    }
  })

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setValue("name", product.name)
    setValue("sku", product.sku)
    setValue("categoryId", product.categoryId)
    setValue("uom", product.uom)
    setValue("unitCost", Number(product.unitCost))
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    reset({ name: "", sku: "", categoryId: null, uom: "Units", unitCost: 0, initialQty: 0, initialLocationId: null })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: ProductInput) => {
    const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products"
    const method = editingProduct ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save product")
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      setIsDialogOpen(false)
    } catch (error) {
      console.error(error)
      alert("Error saving product")
    }
  }

  const filtered = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category?.name || "—"}</TableCell>
                  <TableCell>${Number(product.unitCost).toFixed(2)}</TableCell>
                  <TableCell>{product.uom}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...register("sku")} />
                {errors.sku && <span className="text-xs text-destructive">{errors.sku.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select onValueChange={(val: string) => setValue("categoryId", val || null)} defaultValue={editingProduct?.categoryId || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Select onValueChange={(val: any) => setValue("uom", val)} defaultValue={editingProduct?.uom || "Units"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select UoM..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Units">Units</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input id="unitCost" type="number" step="0.01" {...register("unitCost", { valueAsNumber: true })} />
              {errors.unitCost && <span className="text-xs text-destructive">{errors.unitCost.message}</span>}
            </div>

            {!editingProduct && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="initialQty">Initial Stock (Optional)</Label>
                  <Input id="initialQty" type="number" min="0" {...register("initialQty", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialLocationId">Initial Location</Label>
                  {/* @ts-ignore */}
                  <Select onValueChange={(val: any) => setValue("initialLocationId", val || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter((l: any) => l.type === 'INTERNAL').map((l: any) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {editingProduct && editingProduct.stockQuants && editingProduct.stockQuants.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <Label className="text-base">Stock Details</Label>
                <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                  {editingProduct.stockQuants.map((sq: any) => (
                    <div key={sq.id} className="flex justify-between items-center text-sm">
                      <span>{sq.location?.name || "Unknown Location"}</span>
                      <div className="flex gap-4">
                        <span className="font-medium">{Number(sq.quantity)} Available</span>
                        {Number(sq.reserved_quantity) > 0 && (
                          <span className="text-muted-foreground">{Number(sq.reserved_quantity)} Reserved</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t text-sm font-bold">
                    <span>Total</span>
                    <span>{editingProduct.stockQuants.reduce((acc: number, sq: any) => acc + Number(sq.quantity), 0)} Available</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
