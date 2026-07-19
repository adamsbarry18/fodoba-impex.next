"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, AlertTriangle } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { normalizeScanCode } from "@/hooks/use-barcode-scanner"
import { useT } from "@/i18n/context"

interface BarcodeCameraDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (code: string) => void | Promise<void>
  title?: string
}

export function BarcodeCameraDialog({
  open,
  onOpenChange,
  onScan,
  title,
}: BarcodeCameraDialogProps) {
  const t = useT()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const onOpenChangeRef = useRef(onOpenChange)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readerElement, setReaderElement] = useState<HTMLDivElement | null>(null)
  const scannerId = useId().replace(/:/g, "")

  const resolvedTitle = title ?? t("barcode.cameraTitle")

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  useEffect(() => {
    if (!open || !readerElement) return

    let cancelled = false

    const start = async () => {
      setStarting(true)
      setError(null)

      try {
        const scanner = new Html5Qrcode(scannerId, { verbose: false })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.5,
          },
          async (decoded) => {
            const code = normalizeScanCode(decoded)
            if (!code) return
            await scanner.stop().catch(() => {})
            scannerRef.current = null
            onOpenChangeRef.current(false)
            await onScanRef.current(code)
          },
          () => {
            // frames sans détection - ignoré
          }
        )
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("barcode.cameraAccessError")
          )
        }
      } finally {
        if (!cancelled) setStarting(false)
      }
    }

    start()

    return () => {
      cancelled = true
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
      scannerRef.current = null
    }
  }, [open, readerElement, scannerId, t])

  useEffect(() => {
    if (open) return
    setError(null)
    setStarting(false)
    setReaderElement(null)
  }, [open])

  const handleReaderRef = useCallback((node: HTMLDivElement | null) => {
    setReaderElement(node)
  }, [])

  const handleClose = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
    }
    scannerRef.current = null
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b bg-muted/30 p-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" />
            {resolvedTitle}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("barcode.cameraDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black p-2">
          <div
            ref={handleReaderRef}
            id={scannerId}
            className="min-h-[240px] w-full overflow-hidden rounded-xl"
          />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 border-t bg-destructive/5 p-4 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border-t bg-muted/20 p-4">
          <Button variant="outline" className="w-full rounded-xl" onClick={handleClose}>
            {t("common.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
