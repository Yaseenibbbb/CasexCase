'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Breadcrumbs,
  BreadcrumbItem
} from "@heroui/react";
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
    <Navbar
        isBordered
        isBlurred={false} // Set to false if you prefer the layout below to handle blur/opacity
        maxWidth="full"
        height="4rem" // Default is 4rem (h-16)
        className="fixed top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg"
        classNames={{
            wrapper: "px-4 sm:px-6", // Adjust padding
        }}
    >
        <NavbarContent justify="start">
            {/* Back Button */}
            <NavbarItem>
                 <Button 
                    isIconOnly 
                    variant="light" 
                    onPress={() => router.back()}
                    aria-label="Go back"
                    className="rounded-full"
                >
                    <ArrowLeft size={18} />
                </Button>
            </NavbarItem>
           
            {/* Breadcrumbs */}
             <NavbarItem className="flex-grow overflow-hidden whitespace-nowrap">
                <Breadcrumbs>
                    {breadcrumbItems.map((item, index) => (
                        <BreadcrumbItem 
                            key={item.href}
                            href={index === breadcrumbItems.length - 1 ? undefined : item.href}
                            isCurrent={index === breadcrumbItems.length - 1}
                            classNames={{
                                item: "hover:text-primary transition-colors truncate",
                                separator: "mx-1"
                            }}
                        >
                            {item.title}
                        </BreadcrumbItem>
                    ))}
                </Breadcrumbs>
            </NavbarItem>
        </NavbarContent>

        {/* Placeholder for right-side content if needed */}
        <NavbarContent justify="end">
            {/* Add User Profile/Actions here later */}
        </NavbarContent>
    </Navbar>
  );
} 