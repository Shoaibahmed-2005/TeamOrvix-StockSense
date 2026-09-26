import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function SettingsTabs() {
  const location = useLocation()

  const tabs = [
    { label: "Warehouses", path: "/settings/warehouses" },
    { label: "Locations", path: "/settings/locations" },
    { label: "Contacts", path: "/settings/contacts" },
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
    </div>
  )
}
