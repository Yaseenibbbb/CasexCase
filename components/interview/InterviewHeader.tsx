"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Clock, Wifi, WifiOff, HelpCircle, Volume2, VolumeX } from "lucide-react"
import { Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Tooltip, Switch, useDisclosure, Spacer } from "@heroui/react"
import type { CaseType } from "@/lib/data"
import { cn } from "@/lib/utils"

interface InterviewHeaderProps {
  caseType: CaseType | null
  elapsedTime: number
  remainingTime: number
  isConnected: boolean
  isTtsEnabled: boolean
  onExit: () => void
  onTtsToggle: (enabled: boolean) => void
  currentStep: number
  caseTitle: string | null
  totalDuration: number
  onSave: () => void
  onComplete: () => void
}

export function InterviewHeader({
  caseType,
  elapsedTime,
  remainingTime,
  isConnected,
  isTtsEnabled,
  onExit,
  onTtsToggle,
  caseTitle,
  totalDuration,
  onSave,
  onComplete,
}: InterviewHeaderProps) {
  const router = useRouter()
  const {isOpen: isExitModalOpen, onOpen: openExitModal, onOpenChange: onExitModalOpenChange} = useDisclosure()
  const [isLowTime, setIsLowTime] = useState(false)
  const [isVeryLowTime, setIsVeryLowTime] = useState(false)

  useEffect(() => {
    const fiveMinutes = 5 * 60;
    const twoMinutes = 2 * 60;
    setIsLowTime(remainingTime <= fiveMinutes);
    setIsVeryLowTime(remainingTime <= twoMinutes);
  }, [remainingTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getTimerColor = (): "default" | "warning" | "danger" => {
    if (isVeryLowTime) return "danger"
    if (isLowTime) return "warning"
    return "default"
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-lg bg-white/95 border-b border-slate-200 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-4 min-w-0">
              <Tooltip content="Exit Interview" placement="bottom">
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label="Exit Interview"
                    onClick={openExitModal}
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X size={20} />
                  </Button>
              </Tooltip>

              <div className="min-w-0">
                <h1 className="font-bold text-xl text-slate-800 truncate">
                  {caseTitle || "Case Interview"}
                </h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {caseType && (
                    <Chip size="sm" variant="flat" className="bg-blue-100 text-blue-700 border border-blue-200">
                      {caseType?.difficulty || "Intermediate"}
                    </Chip>
                  )}
                  <Chip 
                    size="sm" 
                    variant="flat"
                    className={cn(
                      "font-mono font-semibold",
                      isVeryLowTime ? "bg-red-100 text-red-700 border border-red-200" :
                      isLowTime ? "bg-orange-100 text-orange-700 border border-orange-200" :
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    )}
                    startContent={<Clock size={14} />}
                  >
                    {formatTime(remainingTime)}
                  </Chip>
                  <Chip 
                    size="sm" 
                    variant="flat"
                    className={cn(
                      isConnected ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                    )}
                    startContent={isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                  >
                    {isConnected ? "Online" : "Offline"}
                  </Chip>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tooltip content={isTtsEnabled ? "Disable AI Voice (TTS)" : "Enable AI Voice (TTS)"} placement="bottom">
                  <Switch
                     isSelected={isTtsEnabled}
                     onValueChange={onTtsToggle}
                     size="sm"
                     color="primary"
                     thumbIcon={isTtsEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                     aria-label="Toggle Text-to-Speech"
                  />
              </Tooltip>

              <Tooltip content="Help & Shortcuts" placement="bottom">
                  <Button isIconOnly variant="light" aria-label="Help" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                     <HelpCircle size={18} />
                  </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>
      
      {/* Add invisible spacer to prevent content from being hidden under the fixed header */}
      <div className="h-[72px] w-full"></div>

      <Modal isOpen={isExitModalOpen} onOpenChange={onExitModalOpenChange} backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-xl">Exit Interview?</ModalHeader>
              <ModalBody>
                <p className="text-foreground-600">
                  Your progress will be saved. You can resume this interview later from your dashboard.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" color="default" onPress={onClose}> 
                  Cancel
                </Button>
                <Button color="danger" onPress={() => { onExit(); onClose(); }}>
                  Save & Exit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
