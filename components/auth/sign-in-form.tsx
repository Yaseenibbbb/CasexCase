"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { FcGoogle } from "react-icons/fc"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { LinkedInIcon } from "@/components/icons/LinkedInIcon"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Define the form schema using Zod
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

export function SignInForm() {
  const { signIn, signInWithGoogle, signInWithLinkedIn } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form with react-hook-form and Zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    const { error } = await signIn(values.email, values.password)
    setIsSubmitting(false)

    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Signed In Successfully",
        description: "Redirecting to your dashboard...",
      })
      router.push("/dashboard")
    }
  }

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    // Redirect/toast logic might be handled within signInWithGoogle or via onAuthStateChange
  };

  // Handle LinkedIn Sign-In
  const handleLinkedInSignIn = async () => {
    await signInWithLinkedIn();
    // Redirect/toast logic might be handled within signInWithLinkedIn or via onAuthStateChange
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
              Or continue with
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-1 gap-4">
          <Button variant="outline" onClick={handleGoogleSignIn} type="button">
             <GoogleIcon className="mr-2 h-4 w-4" /> 
             Google
          </Button>
          <Button 
             variant="outline" 
             onClick={handleLinkedInSignIn} 
             type="button"
             className="border-[#0A66C2] hover:bg-[#0A66C2]/5 dark:border-[#0A66C2]"
          >
             <LinkedInIcon className="mr-2" />
             LinkedIn
          </Button>
        </div>

      </form>
    </Form>
  )
}
