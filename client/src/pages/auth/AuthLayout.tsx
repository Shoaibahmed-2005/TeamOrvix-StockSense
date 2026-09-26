import { Outlet } from "react-router-dom"

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Brand Panel */}
      <div className="from-primary to-primary/80 relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-b p-10 lg:flex text-primary-foreground">
        <div className="bg-primary-foreground/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl" />
        
        <div className="relative flex items-center gap-3">
          {/* Logo container matching rules: "On colored or gradient backgrounds, place it in a white rounded tile or use a white version so it stays visible; minimum height 32px." */}
          <div className="bg-white p-2 rounded-xl flex items-center justify-center">
            <img src="/logo.png" alt="Stocksense Logo" className="h-8 object-contain" />
          </div>
        </div>

        <div className="relative mt-auto">
          <h2 className="text-[32px] leading-[1.15] font-semibold tracking-tight text-balance">
            Inventory management that feels like magic.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Track stock, manage warehouses, and fulfill orders with unprecedented speed.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 bg-background">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
