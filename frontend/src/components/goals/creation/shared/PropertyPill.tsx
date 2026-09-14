import { ReactNode, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronDown } from 'lucide-react'

/** Canned alternatives — this is a scripted prototype; every option is on rails. */
export const TIMEFRAME_OPTIONS = ['Jul 14 – Oct 31', 'Jul 14 – Dec 31', 'Aug 1 – Sep 30']
export const CAPACITY_OPTIONS = ['~6 hrs / week', '~4 hrs / week', '~10 hrs / week']

interface PropertyPillProps {
    /** Optional leading glyph — pass `null` for the icon-less frequency pill. */
    icon: ReactNode
    value: string
    options: string[]
    /** Popover edge alignment (ReviewScreen's frequency pill anchors `end`). */
    align?: 'start' | 'end'
    onSelect: (value: string) => void
    /** Reports open state up so a stepper can suppress Enter-to-advance mid-choose. */
    onOpenChange?: (open: boolean) => void
}

/**
 * A Badge-style trigger opening a popover of 3–4 canned options — shared by
 * ScaffoldFlow's step 3 and ReviewScreen's property row (and per-cadence
 * frequency picker). Reports open state up via the optional `onOpenChange`.
 */
const PropertyPill = ({ icon, value, options, align = 'start', onSelect, onOpenChange }: PropertyPillProps) => {
    const [open, setOpen] = useState(false)
    const changeOpen = (next: boolean) => {
        setOpen(next)
        onOpenChange?.(next)
    }
    return (
        <Popover open={open} onOpenChange={changeOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-transparent px-2.5 text-body-sm font-medium text-foreground',
                        'transition-[background-color,color,transform] duration-150 hover:bg-muted active:scale-[0.96]',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                        open && 'bg-muted'
                    )}
                >
                    {icon && <span className="text-muted-foreground">{icon}</span>}
                    {value}
                    <ChevronDown className="size-3 text-muted-foreground/70" />
                </button>
            </PopoverTrigger>
            <PopoverContent align={align} className="w-52 p-1">
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => {
                            onSelect(option)
                            changeOpen(false)
                        }}
                        className={cn(
                            'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-body-sm',
                            'transition-colors duration-150 hover:bg-muted',
                            option === value ? 'font-medium text-foreground' : 'text-secondary-foreground'
                        )}
                    >
                        {option}
                        {option === value && <Check className="size-3.5 text-primary" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}

export default PropertyPill
export { PropertyPill }
