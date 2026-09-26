import { useNavigate } from "react-router-dom"
import { Package, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, AlertTriangle, PackageX } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { QK } from "@/lib/queryKeys"

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: stats = {
    productsCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    // Receipt card
    receiptsToReceive: 0,
    receiptsLate: 0,
    receiptsOperations: 0,
    // Delivery card
    deliveriesToDeliver: 0,
    deliveriesLate: 0,
    deliveriesWaiting: 0,
    deliveriesOperations: 0,
    // Internal
    internalScheduled: 0,
    lowStockProducts: [],
    recentMoves: [],
    trend: [],
    stockInOut: [],
  } } = useQuery({
    queryKey: QK.dashboard,
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    refetchInterval: 30000,
  })

  const COLORS: Record<string, string> = {
    RECEIPT: '#16A36A',
    DELIVERY: '#E5484D',
    INTERNAL: '#7C5CFC',
    ADJUSTMENT: '#F59E0B',
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>

      {/* ── KPI Row ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* Receipt card */}
        <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowDownToLine className="h-4 w-4 text-green-600" />
              Receipts
            </div>
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Incoming</Badge>
          </div>
          <div>
            <Button
              variant="default"
              className="text-lg font-bold px-4 py-2 h-auto"
              onClick={() => navigate("/receipts?status=READY")}
            >
              {stats.receiptsToReceive} to Receive
            </Button>
          </div>
          <div className="flex gap-4 text-sm">
            <button
              className="text-destructive hover:underline font-medium"
              onClick={() => navigate("/receipts?late=1")}
            >
              {stats.receiptsLate} Late
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              className="text-muted-foreground hover:underline"
              onClick={() => navigate("/receipts?status=DRAFT")}
            >
              {stats.receiptsOperations} Operations
            </button>
          </div>
        </div>

        {/* Delivery card */}
        <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowUpFromLine className="h-4 w-4 text-red-500" />
              Deliveries
            </div>
            <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">Outgoing</Badge>
          </div>
          <div>
            <Button
              variant="default"
              className="text-lg font-bold px-4 py-2 h-auto"
              onClick={() => navigate("/deliveries?status=READY")}
            >
              {stats.deliveriesToDeliver} to Deliver
            </Button>
          </div>
          <div className="flex gap-4 text-sm flex-wrap">
            <button
              className="text-destructive hover:underline font-medium"
              onClick={() => navigate("/deliveries?late=1")}
            >
              {stats.deliveriesLate} Late
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              className="text-amber-600 hover:underline font-medium"
              onClick={() => navigate("/deliveries?status=WAITING")}
            >
              {stats.deliveriesWaiting} Waiting
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              className="text-muted-foreground hover:underline"
              onClick={() => navigate("/deliveries?status=DRAFT")}
            >
              {stats.deliveriesOperations} Operations
            </button>
          </div>
        </div>

        {/* Internal Transfers */}
        <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowRightLeft className="h-4 w-4 text-violet-500" />
              Internal Transfers
            </div>
            <Badge variant="outline" className="text-violet-700 border-violet-200 bg-violet-50">Scheduled</Badge>
          </div>
          <div className="text-3xl font-bold text-violet-600">{stats.internalScheduled}</div>
          <button
            className="text-sm text-muted-foreground hover:underline text-left"
            onClick={() => navigate("/internal")}
          >
            View all transfers →
          </button>
        </div>

        {/* Products */}
        <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-2 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/products")}>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Package className="h-4 w-4 text-primary" /> Total Products
          </div>
          <div className="text-3xl font-bold">{stats.productsCount}</div>
          <div className="text-xs text-muted-foreground">in catalog</div>
        </div>

        {/* Low Stock */}
        <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-2 cursor-pointer hover:border-amber-400/40 transition-colors" onClick={() => navigate("/stock")}>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock
          </div>
          <div className="text-3xl font-bold text-amber-600">{stats.lowStockCount}</div>
          <div className="text-xs text-muted-foreground">products below reorder level</div>
        </div>

        {/* Out of Stock */}
        <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-2 cursor-pointer hover:border-red-400/40 transition-colors" onClick={() => navigate("/stock")}>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <PackageX className="h-4 w-4 text-red-500" /> Out of Stock
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.outOfStockCount}</div>
          <div className="text-xs text-muted-foreground">products with 0 on hand</div>
        </div>
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Operations breakdown */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-5 border-b">
            <h3 className="font-semibold text-sm">Operations — Last 30 Days</h3>
          </div>
          <div className="p-5 min-h-[220px]">
            {(stats.trend || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">No operations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.trend?.map((t: any) => ({ name: t.type, count: t._count.id })) || []}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(stats.trend?.map((t: any) => ({ name: t.type })) || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#7A0B7E'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-5 border-b">
            <h3 className="font-semibold text-sm">Recent Stock Moves</h3>
          </div>
          <div className="p-5 space-y-3 max-h-[260px] overflow-auto">
            {(stats.recentMoves || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent moves.</p>
            ) : (
              (stats.recentMoves || []).map((move: any) => (
                <div key={move.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium leading-none">{move.product?.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {move.operation?.reference} · {new Date(move.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      move.type === 'IN' ? 'text-green-700 border-green-200 bg-green-50' :
                      move.type === 'OUT' ? 'text-red-700 border-red-200 bg-red-50' :
                      'text-violet-700 border-violet-200 bg-violet-50'
                    }
                  >
                    {move.type === 'OUT' ? '-' : '+'}{move.quantity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Low Stock Alerts ─────────────────────────────────────────── */}
      {(stats.lowStockProducts || []).length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/receipts/new")}>
              Create Receipt
            </Button>
          </div>
          <div className="p-5 space-y-3">
            {(stats.lowStockProducts || []).map((item: any) => (
              <div key={item.product?.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                    {item.product?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-amber-600">
                  {item.quantity} in stock
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
