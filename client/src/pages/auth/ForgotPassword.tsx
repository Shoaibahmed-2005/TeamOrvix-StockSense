import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, ArrowLeft, CheckCircle2, Lock, Key } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const requestOtpSchema = z.object({
  email: z.string().email("Must be a valid email"),
})

const resetPasswordSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export default function ForgotPassword() {
  const [step, setStep] = useState<"request" | "reset" | "success">("request")
  const [email, setEmail] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const navigate = useNavigate()

  const { register: reqReg, handleSubmit: reqSubmit, formState: { errors: reqErr, isSubmitting: reqSub } } = useForm({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { email: "" }
  })

  const { register: resReg, handleSubmit: resSubmit, formState: { errors: resErr, isSubmitting: resSub } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", newPassword: "" }
  })

  const onRequestSubmit = async (data: any) => {
    setErrorMsg("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Failed to request OTP")
      setEmail(data.email)
      setStep("reset")
    } catch (e: any) {
      setErrorMsg(e.message)
    }
  }

  const onResetSubmit = async (data: any) => {
    setErrorMsg("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...data })
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error?.message || "Failed to reset password")
      }
      setStep("success")
    } catch (e: any) {
      setErrorMsg(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Link to="/login" className="flex w-fit items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Link>

      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          {step === "request" && "Enter your email address and we'll send you an OTP to reset your password."}
          {step === "reset" && "Enter the OTP sent to your email and your new password."}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-sm border border-destructive/50 text-destructive bg-destructive/10 rounded-md">
          {errorMsg}
        </div>
      )}

      {step === "success" ? (
        <div className="flex flex-col gap-4 p-6 border rounded-lg bg-green-50/50 dark:bg-green-950/20 text-center items-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
          <div className="space-y-1">
            <h3 className="font-semibold text-green-800 dark:text-green-400">Password Reset Successful</h3>
            <p className="text-sm text-green-700/80 dark:text-green-500/80">You can now login with your new password.</p>
          </div>
          <Button onClick={() => navigate("/login")} className="mt-4 w-full">Go to Login</Button>
        </div>
      ) : step === "request" ? (
        <form onSubmit={reqSubmit(onRequestSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="jane@company.com" 
              icon={<Mail className="h-4 w-4" />}
              {...reqReg("email")}
            />
            {reqErr.email && <span className="text-xs text-destructive">{reqErr.email.message as string}</span>}
          </div>

          <Button type="submit" disabled={reqSub} className="mt-2 w-full">
            {reqSub ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      ) : (
        <form onSubmit={resSubmit(onResetSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="otp">6-Digit OTP</Label>
            <Input 
              id="otp" 
              type="text" 
              placeholder="123456" 
              icon={<Key className="h-4 w-4" />}
              {...resReg("otp")}
            />
            {resErr.otp && <span className="text-xs text-destructive">{resErr.otp.message as string}</span>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword" 
              type="password" 
              placeholder="••••••••" 
              icon={<Lock className="h-4 w-4" />}
              {...resReg("newPassword")}
            />
            {resErr.newPassword && <span className="text-xs text-destructive">{resErr.newPassword.message as string}</span>}
          </div>

          <Button type="submit" disabled={resSub} className="mt-2 w-full">
            {resSub ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      )}
    </div>
  )
}
