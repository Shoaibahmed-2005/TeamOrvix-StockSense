import { Outlet } from "react-router-dom"
import TopNav from "./TopNav"

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <TopNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="mx-auto max-w-7xl h-full p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
