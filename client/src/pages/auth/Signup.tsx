import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Lock, AtSign } from "lucide-react"

export default function Signup() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Start managing your inventory efficiently today.
        </p>
      </div>

      <form className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input 
            id="fullName" 
            placeholder="Jane Doe" 
            icon={<User className="h-4 w-4" />}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="loginId">Login ID</Label>
          <Input 
            id="loginId" 
            placeholder="jane.doe" 
            icon={<AtSign className="h-4 w-4" />}
          />
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, dots, underscores and hyphens only.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="jane@company.com" 
            icon={<Mail className="h-4 w-4" />}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="Min. 8 characters"
            icon={<Lock className="h-4 w-4" />}
          />
        </div>

        <Button type="button" className="mt-2 w-full">Create account</Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
