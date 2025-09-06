"use client"

import { CustomPrepForm } from "@/components/CustomPrepForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function CustomPrepPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      {/* Render the form - It will manage its own state */}
      {/* Note: The onClose prop is no longer needed */}
      <CustomPrepForm />
    </div>
  );
} 