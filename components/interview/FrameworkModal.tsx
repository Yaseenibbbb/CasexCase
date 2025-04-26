"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

interface FrameworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  framework: {
    name: string;
    icon?: React.ElementType;
    template?: string;
  } | null;
}

export function FrameworkModal({ isOpen, onClose, framework }: FrameworkModalProps) {
  if (!framework) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {framework.icon && <framework.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            {framework.name}
          </DialogTitle>
          <DialogDescription>
            Visual representation or interactive tool for the {framework.name} framework.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[300px]">
          <p className="text-center text-slate-500">
            [Placeholder for {framework.name} Visualization]
          </p>
          {framework.template && (
            <pre className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto max-h-[400px]">
              <code>{framework.template}</code>
            </pre>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 