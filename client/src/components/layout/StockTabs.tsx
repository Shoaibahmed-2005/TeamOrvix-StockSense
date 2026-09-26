import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function StockTabs() {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { label: "Stock", path: "/stock" },
    { label: "Products", path: "/products" },
    { label: "Categories", path: "/categories" },
  ]

  return (
    <div className="flex items-center justify-between border-b pb-4 mb-6">
      <nav className="flex space-x-6">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "pb-2 text-sm font-medium transition-colors hover:text-primary relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute -bottom-[17px] left-0 h-0.5 w-full bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
      <Button onClick={() => navigate("/internal/new")} className="gap-2">
        <ArrowRightLeft className="h-4 w-4" /> Transfer Stock
      </Button>
    </div>
  )
}
