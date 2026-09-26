import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Settings, 
  LogOut, 
  Moon,
  Sun,
  Menu,
  Box,
  Truck,
  FileBox,
  MapPin,
  Users
} from "lucide-react"

import { Sidebar, SidebarHeader, SidebarNav, SidebarSection, SidebarItem, SidebarNested } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()
  // Add theme toggle logic later, for now just UI
  const [theme, setTheme] = useState<"light" | "dark">("light")

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar 
        variant="collapsible" 
        collapsed={collapsed} 
        onCollapsedChange={setCollapsed}
        className="border-r"
      >
        <SidebarHeader className="h-14 border-b px-4 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 font-bold text-primary">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                S
              </div>
              <span className="text-lg tracking-tight">Stocksense</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className={collapsed ? "mx-auto" : ""}>
            <Menu className="h-4 w-4" />
          </Button>
        </SidebarHeader>

        <SidebarNav>
          <SidebarSection>
            <SidebarItem href="/" active={location.pathname === "/"} icon={<LayoutDashboard />}>
              Dashboard
            </SidebarItem>
          </SidebarSection>

          <SidebarSection label="Operations">
            <SidebarNested label="Transfers" icon={<ArrowRightLeft />} defaultOpen={true}>
              <SidebarItem href="/receipts" active={location.pathname === "/receipts"} icon={<Truck />}>
                Receipts
              </SidebarItem>
              <SidebarItem href="/deliveries" active={location.pathname === "/deliveries"} icon={<Box />}>
                Deliveries
              </SidebarItem>
              <SidebarItem href="/internal" active={location.pathname === "/internal"} icon={<ArrowRightLeft />}>
                Internal Transfers
              </SidebarItem>
              <SidebarItem href="/adjustments" active={location.pathname === "/adjustments"} icon={<FileBox />}>
                Adjustments
              </SidebarItem>
            </SidebarNested>
            <SidebarItem href="/history" active={location.pathname === "/history"} icon={<Box />}>
              Move History
            </SidebarItem>
          </SidebarSection>

          <SidebarSection label="Catalog">
            <SidebarNested label="Products" icon={<Package />} defaultOpen={true}>
              <SidebarItem href="/products" active={location.pathname === "/products"} icon={<Package />}>
                Products
              </SidebarItem>
              <SidebarItem href="/stock" active={location.pathname === "/stock"} icon={<Box />}>
                Stock Levels
              </SidebarItem>
              <SidebarItem href="/categories" active={location.pathname === "/categories"} icon={<FileBox />}>
                Categories
              </SidebarItem>
            </SidebarNested>
          </SidebarSection>

          <SidebarSection label="System">
            <SidebarNested label="Settings" icon={<Settings />}>
              <SidebarItem href="/settings/warehouses" active={location.pathname === "/settings/warehouses"} icon={<MapPin />}>
                Warehouses
              </SidebarItem>
              <SidebarItem href="/settings/locations" active={location.pathname === "/settings/locations"} icon={<MapPin />}>
                Locations
              </SidebarItem>
              <SidebarItem href="/settings/contacts" active={location.pathname === "/settings/contacts"} icon={<Users />}>
                Contacts
              </SidebarItem>
            </SidebarNested>
          </SidebarSection>
        </SidebarNav>

        <div className="border-t p-2">
          {!collapsed ? (
            <div className="flex flex-col gap-2 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate text-sm font-medium">
                    {user?.fullName}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="w-full justify-start text-muted-foreground mt-2">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Sidebar>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 border-b flex items-center px-6 bg-background shrink-0">
          <h2 className="font-semibold capitalize">
            {location.pathname === "/" ? "Dashboard" : location.pathname.split("/").filter(Boolean).join(" / ")}
          </h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
