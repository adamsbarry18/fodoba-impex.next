"use client"

import { useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScanLine, Camera, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useBarcodeInputHandler,
  useBarcodeScannerShortcut,
} from "@/hooks/use-barcode-scanner"
import { BarcodeCameraDialog } from "@/components/barcode/barcode-camera-dialog"
import { useT } from "@/i18n/context"

interface BarcodeScanFieldProps {
  onScan: (code: string) => void | Promise<void>
  placeholder?: string
  className?: string
  inputClassName?: string
  disabled?: boolean
  processing?: boolean
  showCamera?: boolean
  enableF2Shortcut?: boolean
  onFocusHint?: () => void
}

export function BarcodeScanField({
  onScan,
  placeholder,
  className,
  inputClassName,
  disabled = false,
  processing = false,
  showCamera = true,
  enableF2Shortcut = true,
  onFocusHint,
}: BarcodeScanFieldProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [value, setValue] = useState("")

  const resolvedPlaceholder = placeholder ?? t("barcode.defaultPlaceholder")
  const cameraLabel = t("barcode.cameraScan")

  const handleKeyDown = useBarcodeInputHandler(async (code) => {
    setValue("")
    await onScan(code)
  })

  useBarcodeScannerShortcut(inputRef, {
    enabled: enableF2Shortcut && !disabled,
    onFocus: onFocusHint,
  })

  return (
    <>
      <div className={cn("relative flex gap-2", className)}>
        <div className="relative min-w-0 flex-1">
          <ScanLine
            className={cn(
              "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
              focused ? "text-primary" : "text-muted-foreground"
            )}
          />
          <Input
            ref={inputRef}
            data-barcode-scanner="true"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={resolvedPlaceholder}
            disabled={disabled || processing}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              "h-10 rounded-xl pl-10 pr-3 text-xs font-semibold",
              focused && "border-primary/50 ring-1 ring-primary/20",
              inputClassName
            )}
          />
        </div>

        {showCamera && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            disabled={disabled || processing}
            onClick={() => setCameraOpen(true)}
            title={cameraLabel}
            aria-label={cameraLabel}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {cameraOpen && (
        <BarcodeCameraDialog
          open={cameraOpen}
          onOpenChange={setCameraOpen}
          onScan={onScan}
        />
      )}
    </>
  )
}
