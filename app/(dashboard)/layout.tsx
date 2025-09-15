"use client"

// Force dynamic rendering for this client component
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpenCheck,
  LogOut,
  Workflow,
  PanelLeft
} from 'lucide-react';
import MainDashboardHeader from '@/components/navigation/MainDashboardHeader';
import { cn } from '@/lib/utils';
import DashboardNavbar from '@/components/navigation/DashboardNavbar';
import TopNavbar from '@/components/navigation/TopNavbar';

const MiniBar = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <span
      className="absolute inset-y-0 left-0 w-1 bg-blue-600 rounded-r-full"
      aria-hidden="true"
    />
  );
};

const EXPANDED_WIDTH = "w-60";
const COLLAPSED_WIDTH = "w-16";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  
  // Update sidebar state based on localStorage on initial load
  useEffect(() => {
    setMounted(true);
    
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setOpen(savedState === 'true');
    }
    
    // Handle redirect if no user after loading
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);
  
  // Listen for sidebar toggle events from TopNavbar
  useEffect(() => {
    const handleSidebarToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      setOpen(customEvent.detail.isOpen);
    };
    
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  console.log(`[DashboardLayout] Rendering - isLoading: ${isLoading}, user: ${!!user}, mounted: ${mounted}`);
  
  // Render same skeleton UI for both server and client initial render
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-muted/40 dark:bg-slate-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // Only after mounting and loading is complete, check for user
  if (!user) {
    return (
      <div className="flex min-h-screen w-full bg-muted/40 dark:bg-slate-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Session Expired</h2>
            <p className="mb-4">Please log in again to continue.</p>
            <Link href="/" className="text-primary underline">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard#practice', label: 'Case Practice', icon: Workflow },
    { href: '/dashboard#behavioral', label: 'Behavioral FIT', icon: BookOpenCheck },
    { href: '/chat', label: 'AI Chat Coach', icon: MessageSquare },
  ];

  console.log("[DashboardLayout] Rendering main layout content");

  const isInterviewPage = pathname.startsWith('/interview/');

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem
    >
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <TopNavbar />
        
        {!isInterviewPage && (
          <aside 
            className={cn(
              "fixed left-0 top-16 bottom-0 flex flex-col border-r bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-slate-200 dark:border-slate-800 transition-[width] duration-200 ease-in-out z-20",
              open ? EXPANDED_WIDTH : COLLAPSED_WIDTH
            )}
          >
          <nav className="flex-1 overflow-y-auto py-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className="group relative block mx-2 my-1">
                  <MiniBar active={active} />
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-blue-600/10 text-blue-600"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors",
                        active ? "text-blue-600" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-600"
                      )}
                    />
                    {open && (
                      <span
                        className={cn(
                          "truncate transition-opacity delay-75",
                          open ? "opacity-100" : "opacity-0"
                        )}
                      >
                        {label}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 dark:border-slate-800 p-4">
            <button
              onClick={() => signOut()}
              className="group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {open && (
                <span 
                  className={cn(
                    "truncate transition-opacity delay-75",
                    open ? "opacity-100" : "opacity-0"
                  )}>
                    Logout
                  </span>
              )}
            </button>
          </div>
          </aside>
        )}
        <div 
          className={cn(
            "flex flex-1 flex-col transition-all duration-200 pt-16 overflow-hidden",
            !isInterviewPage && (open ? "ml-60" : "ml-16")
          )}
        >
          {!pathname.startsWith('/interview/') && <DashboardNavbar />}
          
          <main className={cn(
            "flex-1 overflow-y-auto px-4 sm:px-6 py-6",
            !pathname.startsWith('/interview/') && "pt-4"
          )}>
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
