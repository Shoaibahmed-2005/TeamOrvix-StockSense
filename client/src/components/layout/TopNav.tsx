import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, LogOut, Sun, Moon, Laptop, User as UserIcon } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import { NotificationsPopover } from "./NotificationsPopover"
import { cn } from "@/lib/utils"

function NavItem({ to, label, isActive }: { to: string; label: string; isActive: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "relative px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted",
        isActive ? "text-primary" : "text-foreground"
      )}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full" />
      )}
    </Link>
  )
}

function NavDropdown({ label, items, isActive }: { label: string; items: { label: string; to: string }[]; isActive: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted flex items-center gap-1",
          isActive || open ? "text-primary" : "text-foreground"
        )}
      >
        {label} ▾
        {(isActive || open) && (
          <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full" />
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-md border bg-popover text-popover-foreground shadow-md z-50 py-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [, setTheme] = useState<"light" | "dark" | "system">("light")

  const toggleTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.classList.toggle("dark", isDark)
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark")
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const isOpsActive = ["/receipts", "/deliveries", "/adjustments"].some(p => location.pathname.startsWith(p))
  const isSettingsActive = location.pathname.startsWith("/settings") && location.pathname !== "/settings/profile"

  const navLinks = (
    <nav className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
      <NavItem to="/" label="Dashboard" isActive={location.pathname === "/"} />
      
      <NavDropdown 
        label="Operations" 
        isActive={isOpsActive}
        items={[
          { label: "Receipts", to: "/receipts" },
          { label: "Deliveries", to: "/deliveries" },
          { label: "Adjustments", to: "/adjustments" },
        ]}
      />
      
      <NavItem to="/stock" label="Stock" isActive={location.pathname === "/stock" || location.pathname === "/products" || location.pathname === "/categories"} />
      
      <NavItem to="/history" label="Move History" isActive={location.pathname.startsWith("/history")} />
      
      <NavDropdown 
        label="Settings" 
        isActive={isSettingsActive}
        items={[
          { label: "Warehouses", to: "/settings/warehouses" },
          { label: "Locations", to: "/settings/locations" },
          { label: "Contacts", to: "/settings/contacts" },
        ]}
      />
    </nav>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm print:hidden">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Logo & Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Stocksense" className="h-8 object-contain" />
          </Link>
          
          <div className="hidden md:block">
            {navLinks}
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-4">
          <NotificationsPopover />
          
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 p-0" />}>
              <span className="text-sm font-semibold text-primary">
                {user?.fullName?.charAt(0).toUpperCase()}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.loginId}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => toggleTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" /> Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" /> Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleTheme("system")}>
                      <Laptop className="mr-2 h-4 w-4" /> System
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" />}>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex flex-col gap-6 py-6">
                  <Link to="/" className="flex items-center gap-2">
                    <img src="/logo.png" alt="Stocksense" className="h-8 object-contain" />
                  </Link>
                  {navLinks}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
