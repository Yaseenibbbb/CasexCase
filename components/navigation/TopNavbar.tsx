"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { PanelLeft, Bell, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Theme Toggle Component with circular design
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])
  
  if (!mounted) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="rounded-full h-9 w-9 flex items-center justify-center"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full h-9 w-9 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <Sun size={18} className="text-yellow-500" />
      ) : (
        <Moon size={18} className="text-slate-700" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

// Use localStorage for sidebar state persistence
const useSidebarState = () => {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen')
    if (savedState !== null) {
      setIsOpen(savedState === 'true')
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isOpen
    setIsOpen(newState)
    localStorage.setItem('sidebarOpen', newState.toString())
    // Dispatch a custom event so other components can react
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { isOpen: newState } }))
  }

  return { isOpen, toggleSidebar }
}

export default function TopNavbar() {
  const { user, profile } = useAuth()
  const { isOpen, toggleSidebar } = useSidebarState()
  
  return (
    <header className="fixed top-0 left-0 w-full h-16 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg shadow-sm">
      <div className="h-full max-w-[1920px] mx-auto flex items-center justify-between px-6">
        {/* Left Side: Logo and Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <PanelLeft className={cn("transition-transform", isOpen ? "rotate-180" : "")} size={20} />
          </button>
          
          <div className="flex items-center gap-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-sm">
              CC
            </div>
            <Link 
              href="/dashboard" 
              className="text-lg font-bold text-slate-800 dark:text-white"
            >
              CaseCoach
            </Link>
          </div>

          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 ml-8 px-4 text-sm font-medium"
          >
            Dashboard
          </Button>
        </div>
        
        {/* Right Side: User Profile & Theme Toggle */}
        <div className="flex items-center gap-3">
          <Button 
            size="sm"
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Resume
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 dark:text-slate-400 rounded-full h-9 w-9"
          >
            <Bell size={20} />
          </Button>

          <ThemeToggle />
          
          {user && (
            <Avatar className="h-9 w-9 border-2 border-transparent hover:border-blue-600">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                {profile?.full_name?.split(" ").map(name => name[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  )
} 