import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@stocksense/shared"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPassword() {
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    // TODO: wire up real API call for OTP reset
    await new Promise(res => setTimeout(res, 1000));
    console.log("Forgot password for:", data);
    setSuccess(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <Link to="/login" className="flex w-fit items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you an OTP to reset your password.
        </p>
      </div>

      {success ? (
        <div className="flex flex-col gap-4 p-6 border rounded-lg bg-green-50/50 dark:bg-green-950/20 text-center items-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
          <div className="space-y-1">
            <h3 className="font-semibold text-green-800 dark:text-green-400">Check your email</h3>
            <p className="text-sm text-green-700/80 dark:text-green-500/80">We sent an OTP to your email.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </div>
  )
}
