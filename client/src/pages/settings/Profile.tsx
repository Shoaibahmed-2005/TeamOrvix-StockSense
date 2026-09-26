import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-4xl shrink-0">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-semibold">{user?.fullName}</h3>
            <p className="text-muted-foreground">{user?.email || user?.loginId}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 items-center gap-4 border-b pb-4">
            <span className="font-medium text-muted-foreground">Login ID</span>
            <span className="col-span-2 font-medium">{user?.loginId}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4 border-b pb-4">
            <span className="font-medium text-muted-foreground">Full Name</span>
            <span className="col-span-2 font-medium">{user?.fullName}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4 border-b pb-4">
            <span className="font-medium text-muted-foreground">Role</span>
            <span className="col-span-2 font-medium capitalize">{user?.role?.toLowerCase()}</span>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={() => alert('Edit Profile Modal Coming Soon')}>Edit Profile</Button>
        </div>
      </div>
    </div>
  )
}
