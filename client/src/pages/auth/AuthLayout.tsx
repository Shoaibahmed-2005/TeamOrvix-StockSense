import { Outlet } from "react-router-dom"

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left Brand Panel ─────────────────────────────────── */}
      <div
        className="relative hidden w-1/2 flex-col justify-end overflow-hidden p-10 lg:flex"
        style={{
          backgroundImage: [
            "linear-gradient(to top, rgba(30,5,35,0.75), transparent 55%)",
            "linear-gradient(135deg, rgba(94,8,97,0.55) 0%, rgba(240,0,114,0.30) 100%)",
            "url('/login-bg.png')",
          ].join(", "),
          backgroundSize: "cover, cover, cover",
          backgroundPosition: "center, center, center",
        }}
      >
        {/* Headline + tagline at the bottom — text readable over dark gradient */}
        <div className="relative">
          <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-white text-balance">
            Inventory management<br />that feels like magic.
          </h2>
          <p className="mt-4 text-white/80 text-base leading-relaxed">
            Track stock, manage warehouses, and fulfill orders with unprecedented speed.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          {/* Logo centered above the form */}
          <div className="mb-8 flex flex-col items-center">
            <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-white">
              <img
                src="/logo-full.png"
                alt="Stocksense"
                className="h-[80px] w-auto object-contain"
                style={{ minWidth: "220px", maxWidth: "260px" }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = "none";
                  el.parentElement!.innerHTML =
                    '<span style="font-size:28px;font-weight:700;color:#7A0B7E;padding:0 8px">Stocksense</span>';
                }}
              />
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
