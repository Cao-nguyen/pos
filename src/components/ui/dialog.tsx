import * as React from "react"
import { cn } from "./button"
import { X } from "lucide-react"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function Dialog({ isOpen, onClose, children, title }: DialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  )
}
