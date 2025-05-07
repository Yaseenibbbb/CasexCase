"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Clock, Wifi, WifiOff, HelpCircle, Volume2, VolumeX } from "lucide-react"
import { Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Tooltip, Switch, useDisclosure, Spacer } from "@nextui-org/react"
import type { CaseType } from "@/lib/data"

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
      <header className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-lg bg-background/90 border-b border-divider shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-3 min-w-0">
              <Tooltip content="Exit Interview" placement="bottom">
                  <Button
                    isIconOnly
                    variant="light"
                    aria-label="Exit Interview"
                    onClick={openExitModal}
                    className="text-foreground-500"
                  >
                    <X size={20} />
                  </Button>
              </Tooltip>

              <div className="min-w-0">
                <h1 className="font-semibold text-lg text-foreground truncate">
                  {caseTitle || "Case Interview"}
                </h1>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {caseType && (
                    <Chip size="sm" variant="flat" color="secondary">
                      {caseType?.difficulty || "Intermediate"}
                    </Chip>
                  )}
                  <Chip 
                    size="sm" 
                    variant="light" 
                    color={getTimerColor()} 
                    startContent={<Clock size={14} />}
                    className="font-mono"
                  >
                    {formatTime(remainingTime)}
                  </Chip>
                  <Chip 
                    size="sm" 
                    variant="light" 
                    color={isConnected ? "success" : "danger"} 
                    startContent={isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                  >
                    {isConnected ? "Online" : "Offline"}
                  </Chip>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  <Button isIconOnly variant="light" aria-label="Help" className="text-foreground-500">
                     <HelpCircle size={18} />
                  </Button>
              </Tooltip>
              <Spacer x={2} />
            </div>
          </div>
        </div>
      </header>
      
      {/* Add invisible spacer to prevent content from being hidden under the fixed header */}
      <div className="h-[64px] w-full"></div>

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
