"use client"

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpenCheck,
  LogOut,
  Workflow,
} from 'lucide-react';
import DashboardNavbar from '@/components/navigation/DashboardNavbar';
import { AuthProvider } from '@/context/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log(`[DashboardLayout] Rendering - isLoading: ${isLoading}, user: ${!!user}`);

  if (isLoading) {
    console.log("[DashboardLayout] Showing loading spinner");
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user) {
    console.warn("[DashboardLayout] Rendering with !isLoading but !user. This shouldn't happen if middleware is correct. Check AuthProvider state.");
  }

  // --- Remove TEMPORARY SIMPLIFICATION ---
  /*
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <div>
          <h1>Dashboard Layout (Simplified)</h1>
          {isLoading && <p>Auth Loading...</p>}
          {user && <p>User: {user.email}</p>}
          {!isLoading && !user && <p>No user found after load.</p>}
          <hr />
          { {children} } 
        </div>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  )
  */
  // --- END TEMPORARY SIMPLIFICATION ---

  // --- Restore ORIGINAL LAYOUT --- 
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard#practice', label: 'Case Practice', icon: Workflow },
    { href: '/dashboard#behavioral', label: 'Behavioral FIT', icon: BookOpenCheck },
    { href: '/chat', label: 'AI Chat Coach', icon: MessageSquare },
  ];

  console.log("[DashboardLayout] Rendering main layout content");

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-muted/40 dark:bg-slate-950">
          <Sidebar>
            <SidebarHeader>
                 <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
                    <Image
                      src="/logo.png"
                      alt="CaseByCase Logo"
                      width={100}
                      height={24}
                      priority
                      className="group-data-[collapsible=icon]:hidden"
                    />
                    <Image
                      src="/logo-icon.png"
                      alt="CaseByCase Icon"
                      width={24}
                      height={24}
                      className="hidden group-data-[collapsible=icon]:block"
                    />
                 </Link>
                 <SidebarTrigger />
            </SidebarHeader>
            <SidebarContent>
                 <SidebarMenu>
                   {navItems.map((item) => (
                     <SidebarMenuItem key={item.href}>
                       <Link href={item.href} passHref legacyBehavior>
                          <SidebarMenuButton 
                             asChild 
                             variant="default" 
                             tooltip={item.label} 
                             isActive={pathname === item.href || (item.href.includes('#') && pathname === '/dashboard')}
                          >
                            <a>
                               <item.icon />
                               <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </a>
                          </SidebarMenuButton>
                       </Link>
                     </SidebarMenuItem>
                   ))}
                 </SidebarMenu>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                       <SidebarMenuButton 
                          variant="default" 
                          tooltip="Logout" 
                          onClick={() => signOut()} 
                       >
                          <LogOut />
                         <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                       </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <div className="flex flex-1 flex-col sm:pl-16">
            <DashboardNavbar />
            <main className="flex-1 overflow-y-auto pt-16 px-4 sm:px-6 py-6">
              {/* Restore original children rendering */} 
              {user ? children : <p>Loading user data...</p>} 
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </ThemeProvider>
  )
  // --- END ORIGINAL LAYOUT ---
}
