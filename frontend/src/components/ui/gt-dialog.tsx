/* eslint-disable react/prop-types */
import * as React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { stopKeydownPropogation } from '../../utils/utils'

/**
 * GTDialog — the one modal shell for every dialog in the app.
 *
 * Derived from the "New task" composer, which is the reference design: a compact centered
 * card, an eyebrow label instead of a heading, borderless title/description fields, a single
 * horizontal property row, and a ghost Cancel + primary confirm footer. ⌘/Ctrl+Enter submits,
 * Escape closes.
 *
 * Spacing, width, radius, and shadow live ONLY here. To restyle every modal at once, edit the
 * tokens below — never override them at a call site.
 *
 *   <GTDialog open onOpenChange={…} label="New task" onSubmit={create}>
 *       <GTDialogBody>
 *           <GTDialogTitleInput … />
 *           <GTDialogTextarea … />
 *       </GTDialogBody>
 *       <GTDialogProperties>…pills…</GTDialogProperties>
 *       <GTDialogFooter onCancel={close} confirmLabel="Create" onConfirm={create} confirmDisabled={!ok} />
 *   </GTDialog>
 */

// ---- tokens -------------------------------------------------------------------------------

const WIDTH = {
    default: 'max-w-[480px]',
    wide: 'max-w-[640px]',
} as const
export type TGTDialogSize = keyof typeof WIDTH

/** Card chrome: radius, border, shadow, no built-in padding (the inner column owns it).
 *  The shadcn primitive's absolute-positioned X is hidden; the header row renders its own close. */
const CARD = 'box-border gap-0 rounded-xl border-border p-0 shadow-gt-l focus:outline-none [&>button.absolute]:hidden'
/** Inner column: horizontal + vertical padding and the gap between the header, body, properties, and footer. */
const COLUMN = 'flex flex-col gap-6 px-5 py-4'
/** Scroll region — the body scrolls, the header and footer stay put. */
const BODY_MAX_HEIGHT = 'max-h-[70vh]'

const EYEBROW = 'text-label-md text-muted-foreground'
const TITLE_INPUT =
    'box-border w-full border-none bg-transparent p-0 text-title-md text-foreground outline-none placeholder:text-muted-foreground/60'
const TEXTAREA =
    'box-border min-h-0 w-full resize-none border-none bg-transparent p-0 text-body-md text-foreground outline-none placeholder:text-muted-foreground/60'

// ---- shell --------------------------------------------------------------------------------

interface GTDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Eyebrow shown top-left in place of a heading, e.g. "New task". Also the a11y title. */
    label: string
    /** a11y description (visually hidden). Defaults to the label. */
    description?: string
    /** Optional content rendered top-right on the header row (e.g. a step indicator). */
    meta?: React.ReactNode
    size?: TGTDialogSize
    /** ⌘/Ctrl+Enter anywhere inside the dialog. */
    onSubmit?: () => void
    /** Keys (getKeyCode format) that should still bubble to the app, e.g. a shortcut that toggles this dialog. */
    keyExceptions?: string[]
    /** Focus the first focusable element on open. Off by default so an `autoFocus` field wins. */
    autoFocus?: boolean
    className?: string
    children: React.ReactNode
}

const GTDialog = ({
    open,
    onOpenChange,
    label,
    description,
    meta,
    size = 'default',
    onSubmit,
    keyExceptions = [],
    autoFocus = false,
    className,
    children,
}: GTDialogProps) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // keep app-level shortcuts (e.g. "c", "j/k") from firing while typing in the dialog
        stopKeydownPropogation(e, ['Escape', ...keyExceptions], true)
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) {
            e.preventDefault()
            onSubmit()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(WIDTH[size], CARD, className)}
                onKeyDown={handleKeyDown}
                onOpenAutoFocus={autoFocus ? undefined : (e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">{label}</DialogTitle>
                <DialogDescription className="sr-only">{description ?? label}</DialogDescription>
                <div className={COLUMN}>
                    <div className="flex items-center justify-between gap-3">
                        <span className={EYEBROW}>{label}</span>
                        <div className="flex items-center gap-3">
                            {meta}
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                aria-label="Close"
                                className="-mr-1.5 flex size-7 items-center justify-center rounded-md bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ---- slots --------------------------------------------------------------------------------

/** Main content: title + description fields, or any custom body. Scrolls when tall. */
const GTDialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex min-h-0 flex-col gap-2 overflow-y-auto', BODY_MAX_HEIGHT, className)} {...props} />
)

/** A short heading + supporting line for dialogs that ask a question (steps, confirmations). */
const GTDialogHeading = ({ title, subtitle }: { title: React.ReactNode; subtitle?: React.ReactNode }) => (
    <div>
        <h2 className="text-balance text-title-md leading-snug text-foreground">{title}</h2>
        {subtitle && <p className="mt-1.5 text-body-sm text-muted-foreground">{subtitle}</p>}
    </div>
)

/** Borderless single-line title field (the reference composer's "Task title"). */
const GTDialogTitleInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => <input ref={ref} className={cn(TITLE_INPUT, className)} {...props} />
)
GTDialogTitleInput.displayName = 'GTDialogTitleInput'

/** Borderless auto-growing description field. */
const GTDialogTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, onChange, rows = 1, ...props }, ref) => (
        <textarea
            ref={ref}
            rows={rows}
            onChange={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
                onChange?.(e)
            }}
            className={cn(TEXTAREA, className)}
            {...props}
        />
    )
)
GTDialogTextarea.displayName = 'GTDialogTextarea'

/** The single horizontal property row (due date, folder, priority, …). */
const GTDialogProperties = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-row flex-wrap items-center gap-2', className)} {...props} />
)

interface GTDialogFooterProps {
    /** Rendered at the start of the row (status text, a Back button, a secondary action). */
    start?: React.ReactNode
    onCancel?: () => void
    cancelLabel?: string
    onConfirm?: () => void
    confirmLabel?: React.ReactNode
    confirmDisabled?: boolean
    confirmVariant?: ButtonProps['variant']
    /** Extra buttons placed between Cancel and confirm. */
    children?: React.ReactNode
}

/** Ghost Cancel + primary confirm, flush right. Pass `start` for anything that belongs on the left. */
const GTDialogFooter = ({
    start,
    onCancel,
    cancelLabel = 'Cancel',
    onConfirm,
    confirmLabel = 'Create',
    confirmDisabled,
    confirmVariant = 'default',
    children,
}: GTDialogFooterProps) => (
    <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">{start}</div>
        <div className="flex shrink-0 items-center gap-2">
            {onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    {cancelLabel}
                </Button>
            )}
            {children}
            {onConfirm && (
                <Button size="sm" variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
                    {confirmLabel}
                </Button>
            )}
        </div>
    </div>
)

/** "Step N of M" + progress dots, for the `meta` slot of a multi-step dialog. */
const GTDialogSteps = ({ step, total }: { step: number; total: number }) => (
    <div className="flex items-center gap-2.5">
        <span className="text-body-sm tabular-nums text-muted-foreground">
            Step {step} of {total}
        </span>
        <div className="flex items-center gap-1">
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
                <span
                    key={n}
                    className={cn(
                        'h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out',
                        n === step ? 'w-4 bg-primary' : n < step ? 'w-1.5 bg-primary' : 'w-1.5 bg-muted'
                    )}
                />
            ))}
        </div>
    </div>
)

export {
    GTDialog,
    GTDialogBody,
    GTDialogHeading,
    GTDialogTitleInput,
    GTDialogTextarea,
    GTDialogProperties,
    GTDialogFooter,
    GTDialogSteps,
}
