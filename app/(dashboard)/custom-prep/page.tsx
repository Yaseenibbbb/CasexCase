"use client"

import { CustomPrepForm } from "@/components/CustomPrepForm";
import React from "react";

export default function CustomPrepPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* We can add a title or breadcrumbs here if needed */}
      {/* Render the form - It will manage its own state */}
      {/* Note: The onClose prop is no longer needed */}
      <CustomPrepForm />
    </div>
  );
} 