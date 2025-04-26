'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from 'lucide-react';
import { CATEGORIZED_BEHAVIORAL_QUESTIONS } from '@/lib/data'; // To get category/question titles

// Helper function to capitalize words
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Helper function to generate breadcrumb items
const generateBreadcrumbs = (pathname: string, params: any) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  let currentPath = '';
  const breadcrumbs = [
    { href: '/dashboard', title: 'Dashboard' }
  ];

  // Start from the segment after 'dashboard' if it exists
  const startIndex = pathSegments[0] === 'dashboard' ? 1 : 0; 

  for (let i = startIndex; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    currentPath += `/${segment}`;
    let title = capitalize(segment.replace(/-/g, ' ')); // Default title

    // Specific logic for behavioral questions
    if (pathSegments[startIndex] === 'behavioral' && i === startIndex + 1) {
        // This segment is the category slug
        title = CATEGORIZED_BEHAVIORAL_QUESTIONS[segment]?.title || title;
    } else if (pathSegments[startIndex] === 'behavioral' && i === startIndex + 2) {
        // This segment is the question slug
        const category = CATEGORIZED_BEHAVIORAL_QUESTIONS[pathSegments[i-1]];
        title = category?.questions.find(q => q.slug === segment)?.title || title;
    }
    // Add more specific title lookups for other sections (e.g., interview/:id) if needed
    
    breadcrumbs.push({ href: currentPath, title });
  }

  return breadcrumbs;
};

export default function DashboardNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // Don't render on the main dashboard page itself (or adjust logic as needed)
  if (pathname === '/dashboard') {
      return null;
  }

  const breadcrumbItems = generateBreadcrumbs(pathname, params);

  return (
    <nav className="fixed top-0 left-0 sm:left-14 right-0 z-40 h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center gap-4">
        {/* Back Button */}
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
            aria-label="Go back"
        >
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Breadcrumbs */}
        <Breadcrumb className="flex-grow overflow-hidden whitespace-nowrap">
            <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={item.href}>
                        <BreadcrumbItem>
                            {index === breadcrumbItems.length - 1 ? (
                                <BreadcrumbPage className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                    {item.title}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link href={item.href} className="hover:text-purple-600 transition-colors">
                                        {item.title}
                                    </Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />} 
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
        
        {/* Placeholder for potential future actions/user menu */}
        <div className="w-8"></div> 
    </nav>
  );
} 