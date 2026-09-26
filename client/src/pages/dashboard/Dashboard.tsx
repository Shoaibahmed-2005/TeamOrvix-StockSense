import { useState, useEffect } from "react"
import { Package, ListOrdered, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

export default function Dashboard() {
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    totalInventoryValue: 0,
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
      value: `$${stats.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ListOrdered,
      color: "text-yellow-500",
    }
  ]

  return (
    <div className="flex flex-col gap-6">
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
        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-4">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">This feature is coming soon.</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-3">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Low Stock Alerts</h3>
            <p className="text-sm text-muted-foreground">This feature is coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
