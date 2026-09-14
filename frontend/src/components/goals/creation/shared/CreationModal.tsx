import { ReactNode, useEffect, useState } from 'react'
import { Dialog, DialogDescription, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronRight, Maximize2, Minimize2, X } from 'lucide-react'

interface CreationModalProps {
    open: boolean
    onClose: () => void
    breadcrumb: string
    children: ReactNode
}

/**
 * Linear-style creation shell: a compact, centered dialog with a breadcrumb
 * header, expand + close icon-buttons, layered shadow and a scrim-lite backdrop.
 * The body (title, properties, footer) is supplied via `children` — see ReviewScreen.
 */
const CreationModal = ({ open, onClose, breadcrumb, children }: CreationModalProps) => {
    const [expanded, setExpanded] = useState(false)

    // Always reopen at the compact width.
    useEffect(() => {
        if (!open) setExpanded(false)
    }, [open])

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogPortal>
                <DialogPrimitive.Overlay
                    className={cn(
                        'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
                    )}
                />
                <DialogPrimitive.Content
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    style={{
                        boxShadow:
                            '0 0 0 1px rgb(0 0 0 / 0.04), 0 8px 16px -6px rgb(0 0 0 / 0.16), 0 24px 48px -12px rgb(0 0 0 / 0.24)',
                    }}
                    className={cn(
                        'fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-card',
                        'transition-[max-width] duration-300 ease-out',
                        expanded ? 'max-w-[920px]' : 'max-w-[640px]',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'data-[state=closed]:slide-out-to-bottom-1 data-[state=open]:slide-in-from-bottom-1'
                    )}
                >
                    {/* a11y title/description — visually the breadcrumb below stands in */}
                    <DialogTitle className="sr-only">Create a new goal</DialogTitle>
                    <DialogDescription className="sr-only">
                        Review the drafted plan, adjust its cadence and milestones, then create the goal.
                    </DialogDescription>

                    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-1.5 text-body-sm">
                            <span className="shrink-0 text-muted-foreground">Goals</span>
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="truncate font-medium text-foreground">{breadcrumb}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                            <button
                                type="button"
                                onClick={() => setExpanded((v) => !v)}
                                aria-label={expanded ? 'Collapse' : 'Expand'}
                                className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
                            >
                                {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </header>

                    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    )
}

export default CreationModal
