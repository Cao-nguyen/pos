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
      {/* Backdrop overlay listener to close when clicking outside */}
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] max-h-[85dvh] min-h-0 z-10 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 relative p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          {title ? (
            <h2 className="text-lg font-semibold leading-none tracking-tight text-slate-900">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 transition-colors opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
