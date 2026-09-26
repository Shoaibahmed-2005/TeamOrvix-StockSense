import { useNavigate } from "react-router-dom"
import { Package, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, AlertTriangle, PackageX } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend, CartesianGrid } from "recharts"
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
              {stats.receiptsOperations} Operation{stats.receiptsOperations === 1 ? '' : 's'}
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
              {stats.deliveriesOperations} Operation{stats.deliveriesOperations === 1 ? '' : 's'}
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

      {/* ── Charts Row 1 ────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Stock In vs Out */}
        <div className="rounded-xl border bg-card shadow-sm flex flex-col">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-sm">Stock Flow (Last 14 Days)</h3>
          </div>
          <div className="p-5 min-h-[260px] flex-1">
            {(stats.stockInVsOut || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">No stock flow yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.stockInVsOut || []}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))', borderRadius: '8px' }} 
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="in" name="Stock In" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="out" name="Stock Out" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock Value by Category */}
        <div className="rounded-xl border bg-card shadow-sm flex flex-col">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-sm">Stock Value by Category</h3>
          </div>
          <div className="p-5 min-h-[260px] flex-1">
            {(stats.stockByCategory || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">No stock value yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.stockByCategory || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {(stats.stockByCategory || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length] as string} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl border bg-card shadow-sm flex flex-col">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-sm">Top Products by Value</h3>
          </div>
          <div className="p-5 min-h-[260px] flex-1">
            {(stats.topProducts || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">No products found.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.topProducts || []} layout="vertical" margin={{ left: 40, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={100} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }} 
                  />
                  <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" barSize={20} />
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
                      {move.operation?.reference || 'Adjustment'} · {move.date ? new Date(move.date).toLocaleDateString('en-IN') : move.createdAt ? new Date(move.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      move.direction === 'IN' ? 'text-green-700 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 dark:text-green-300' :
                      move.direction === 'OUT' ? 'text-red-700 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 dark:text-red-300' :
                      move.direction === 'ADJUSTMENT' ? 'text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300' :
                      'text-slate-700 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                    }
                  >
                    {move.direction === 'IN' ? '+' : move.direction === 'OUT' ? '−' : move.direction === 'ADJUSTMENT' ? (Number(move.quantity) > 0 ? '+' : '') : ''}{Math.abs(Number(move.quantity))}
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
