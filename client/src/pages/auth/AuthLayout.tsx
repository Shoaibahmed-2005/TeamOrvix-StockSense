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
          backgroundImage: "linear-gradient(135deg, rgba(94,8,97,0.88), rgba(240,0,114,0.55)), url('/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >

        {/* Logo in a white rounded tile */}
        <div className="relative">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white p-4 shadow-lg">
            <img
              src="/logo.png"
              alt="Stocksense"
              className="h-14 object-contain"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                el.parentElement!.innerHTML =
                  '<span class="text-primary font-bold text-2xl px-2">Stocksense</span>';
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
