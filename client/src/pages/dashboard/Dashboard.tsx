import { useState, useEffect } from "react"
import { Package, ListOrdered, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    productsCount: 0,
    categoriesCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    totalInventoryValue: 0,
    lowStockProducts: [],
    recentMoves: [],
    trend: []
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats")
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error(e)
    }
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.productsCount,
      icon: Package,
      color: "text-blue-500",
    },
    {
      title: "Pending Receipts",
      value: stats.pendingReceipts,
      icon: ArrowDownToLine,
      color: "text-green-500",
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries,
      icon: ArrowUpFromLine,
      color: "text-purple-500",
    },
    {
      title: "Total Inventory Value",
      value: `$${(stats.totalInventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ListOrdered,
      color: "text-yellow-500",
    }
  ]

  const chartData = stats.trend?.map((t: any) => ({
    name: t.type,
    count: t._count.id
  })) || []

  const COLORS = {
    RECEIPT: '#22c55e', // green-500
    DELIVERY: '#a855f7', // purple-500
    INTERNAL: '#3b82f6', // blue-500
    ADJUSTMENT: '#f59e0b' // amber-500
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">{card.title}</h3>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{card.value}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-4 flex flex-col">
          <div className="flex flex-col space-y-1.5 p-6 border-b">
            <h3 className="font-semibold leading-none tracking-tight">Recent Activity (Moves)</h3>
          </div>
          <div className="p-6 flex-1 overflow-auto">
            <div className="space-y-4">
              {stats.recentMoves?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent moves.</p>
              ) : (
                stats.recentMoves?.map((move: any) => (
                  <div key={move.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium leading-none">{move.product?.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Op: {move.operation?.reference} • Date: {new Date(move.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={move.type === 'IN' ? 'text-green-600' : move.type === 'OUT' ? 'text-red-600' : ''}>
                      {move.type} {move.quantity}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-3 flex flex-col">
          <div className="flex flex-col space-y-1.5 p-6 border-b">
            <h3 className="font-semibold leading-none tracking-tight">Operations (Last 7 Days)</h3>
          </div>
          <div className="p-6 flex-1 min-h-[250px]">
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">No operations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-3 flex flex-col">
          <div className="flex flex-col space-y-1.5 p-6 border-b">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" /> 
              Low Stock Alerts
            </h3>
          </div>
          <div className="p-6 flex-1 overflow-auto">
            <div className="space-y-4">
              {stats.lowStockProducts?.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are adequately stocked.</p>
              ) : (
                stats.lowStockProducts?.map((item: any) => (
                  <div key={item.product?.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                        {item.product?.name?.charAt(0)}
                      </div>
                      <p className="text-sm font-medium leading-none">{item.product?.name}</p>
                    </div>
                    <div className="font-bold text-orange-600">
                      {item.quantity} in stock
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
