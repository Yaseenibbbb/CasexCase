'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/auth-context'; // Assuming auth context provides user info and signout

export default function MainDashboardHeader() {
  const { user, profile, signOut } = useAuth(); // Get user info and signout function

  // Fallback initials logic (adjust as needed)
  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U'; // Default fallback
  };

  // Determine alt text safely
  const avatarAltText = profile?.full_name ?? user?.email ?? undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 dark:bg-slate-950/80 backdrop-blur-md px-4 md:px-6">
      {/* Optional: Logo/Title - Can be removed if sidebar provides enough branding */}
      {/* <Link href="/dashboard" className="font-semibold text-lg mr-4 hidden md:block">CaseByCase</Link> */}

      {/* Global Search */}
      <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search cases or topics..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px] focus-visible:ring-purple-500 border-border/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        
        {/* Notifications (Placeholder) */}
        <Button variant="ghost" size="icon" className="rounded-full relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {/* Optional: Notification indicator */}
          {/* <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span> */}
          <span className="sr-only">Toggle notifications</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt={avatarAltText} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-medium">
                   {getInitials(profile?.full_name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 