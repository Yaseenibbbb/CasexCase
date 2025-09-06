"use client"

import { useState, useMemo } from "react"
// Removed Shadcn Tooltip imports
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// Added NextUI imports
import { Progress, Tooltip, Card, CardBody, CardHeader } from "@heroui/react";
import { Check } from "lucide-react"; // Import Check icon

interface ProgressMeterProps {
  currentStep: number // Step index (0-4)
}

// Define steps data directly in the component or import from elsewhere
const steps = [
  { id: 0, name: "Problem Definition" },
  { id: 1, name: "Framework Development" },
  { id: 2, name: "Analysis" },
  { id: 3, name: "Recommendations" },
  { id: 4, name: "Conclusion" },
];
const totalSteps = steps.length;

export function ProgressMeter({ currentStep }: ProgressMeterProps) {

  // Calculate progress percentage (0-100)
  // Ensure currentStep doesn't exceed the maximum step index for calculation
  const progressValue = useMemo(() => {
     // Map currentStep (0-4) to progress (0, 25, 50, 75, 100)
     // If step 0 is active -> 0%, step 1 active -> 25%, ..., step 4 active -> 100%
     const effectiveStep = Math.min(currentStep, totalSteps - 1);
     // If step 0 is done (currentStep = 1), progress is 25% for step 1
     // If step 4 is done (currentStep = 5 or more), progress is 100%
     return Math.min(100, (Math.max(0, currentStep) / totalSteps) * 100); 
  }, [currentStep]);

  // Content for the Tooltip
  const tooltipContent = (
    <Card shadow="md" className="max-w-xs bg-content1/95 border border-content2">
      <CardHeader className="pb-2">
         <h4 className="text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Interview Progress
         </h4>
      </CardHeader>
      <CardBody className="pt-0 pb-2 px-3">
         <div className="space-y-2">
         {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            return (
               <div key={step.id} className="flex items-center gap-2">
                  {/* Step Indicator Icon */}
                  <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${ 
                        isActive
                        ? "border-primary bg-primary/30"
                        : isCompleted
                           ? "border-success bg-success/30"
                           : "border-default bg-content2/90"
                  }`}
                  >
                  {isCompleted && <Check size={10} className="text-success" strokeWidth={3}/>}
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>} 
                  </div>
                  {/* Step Name */}
                  <span
                     className={`text-xs ${ 
                        isActive
                        ? "font-medium text-primary"
                        : isCompleted
                           ? "text-success font-medium line-through"
                           : "text-foreground"
                     }`}
                  >
                     {step.name}
                  </span>
               </div>
            );
         })}
         </div>
      </CardBody>
    </Card>
  );

  return (
      <Tooltip 
         content={tooltipContent} 
         placement="left" 
         radius="lg"
         className="p-0 bg-transparent" // Make tooltip background transparent
      >
         {/* NextUI Progress Component with improved visibility */}
         <Progress
            aria-label="Interview progress"
            value={progressValue}
            maxValue={100}
            color="primary"
            size="md"
            showValueLabel={true}
            valueLabel={`${Math.round(progressValue)}%`}
            className="w-full cursor-pointer font-medium shadow-sm" // Added font-medium and shadow
            classNames={{
              track: "bg-content2/80", // Changed from default to be more opaque
              value: "bg-gradient-to-r from-primary to-primary-500", // More prominent gradient
              label: "font-medium text-foreground-600" // Make label more visible
            }}
         />
      </Tooltip>
  )
}
