import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Mail, Lock, AtSign, AlertCircle, Check, X } from "lucide-react"
import { signupSchema, type SignupInput } from "@stocksense/shared"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth"

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      loginId: "",
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const onSubmit = async (data: SignupInput) => {
    setError(null);
    try {
      await signup(data);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    }
  };

  const pwdRules = [
    { label: "At least 9 characters", passed: password.length > 8 },
    { label: "One lowercase letter", passed: /[a-z]/.test(password) },
    { label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "One special character", passed: /[^a-zA-Z0-9]/.test(password) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Start managing your inventory efficiently today.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input 
            id="fullName" 
            placeholder="Jane Doe" 
            icon={<User className="h-4 w-4" />}
            {...register("fullName")}
          />
          {errors.fullName && <span className="text-xs text-destructive">{errors.fullName.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="loginId">Login ID</Label>
          <Input 
            id="loginId" 
            placeholder="jane.doe" 
            icon={<AtSign className="h-4 w-4" />}
            {...register("loginId")}
          />
          <p className="text-xs text-muted-foreground">6-12 chars, letters, numbers, dots, underscores, hyphens.</p>
          {errors.loginId && <span className="text-xs text-destructive">{errors.loginId.message}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="jane@company.com" 
            icon={<Mail className="h-4 w-4" />}
            {...register("email")}
          />
          {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="Min. 9 characters"
            icon={<Lock className="h-4 w-4" />}
            {...register("password")}
          />
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {pwdRules.map((rule, i) => (
              <div key={i} className={`flex items-center gap-1.5 ${rule.passed ? "text-green-600" : "text-muted-foreground"}`}>
                {rule.passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {rule.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="Min. 9 characters"
            icon={<Lock className="h-4 w-4" />}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <span className="text-xs text-destructive">{errors.confirmPassword.message}</span>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
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
