import { Outlet } from "react-router-dom"

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left Brand Panel ─────────────────────────────────── */}
      {/*
        SPEC: "left brand panel (gradient, logo, one headline, one line of text)"
        Gradient: purple→magenta (primary→accent) as per "purple→magenta gradient
        is used only on the logo area and at most one hero KPI"
        Logo: "sits in a white rounded tile (or a white version) so it stays
        visible; minimum height 32px"
      */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{
          background: "linear-gradient(135deg, #7A0B7E 0%, #5E0861 50%, #C026D3 100%)",
        }}
      >
        {/* Subtle orb for depth */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #F00072, transparent)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
        />

        {/* Logo in a white rounded tile */}
        <div className="relative">
          <div className="inline-flex items-center justify-center rounded-xl bg-white p-2 shadow-lg">
            <img
              src="/logo.png"
              alt="Stocksense"
              className="h-8 object-contain"
              onError={(e) => {
                // Fallback if logo not found
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                el.parentElement!.innerHTML =
                  '<span class="text-primary font-bold text-lg px-1">Stocksense</span>';
              }}
            />
          </div>
        </div>

        {/* Headline + tagline at the bottom */}
        <div className="relative">
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-white text-balance">
            Inventory management<br />that feels like magic.
          </h2>
          <p className="mt-4 text-white/75 text-base leading-relaxed">
            Track stock, manage warehouses, and fulfill orders with unprecedented speed.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
