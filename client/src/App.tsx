import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <img src="/logo.png" alt="Stocksense Logo" className="w-24 h-24 mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Stocksense</h1>
        <p className="text-lg text-muted-foreground">Inventory Management System</p>
      </div>
      <div className="flex gap-4">
        <Button>Login</Button>
        <Button variant="outline">Sign Up</Button>
      </div>
    </div>
  )
}

export default App
