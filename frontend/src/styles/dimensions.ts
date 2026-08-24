export const iconSize = {
    small: '12px',
    default: '16px',
    medium: '32px',
    gtLogo: '64px',
    large: '50px',
}

export type TIconSize = keyof typeof iconSize

export const checkboxSize = {
    childContainer: '40px',
    parentContainer: '20px',
}

// Desktop sizes only. Below `BREAKPOINTS.phone` GTModal ignores these and fills the screen.
export const modalSize = {
    dialog: {
        max_height: '200px',
        min_height: 'fit-content',
        width: 'fit-content',
    },
    small: {
        max_height: '440px',
        min_height: '440px',
        width: '478px',
    },
    medium: {
        max_height: '620px',
        min_height: '620px',
        width: '723px',
    },
}

export type TModalSize = keyof typeof modalSize

// Viewport widths (in px) at which the layout changes shape. `phone` is the widest common phone
// in landscape; at or above `tablet` there is room for the full multi-column desktop shell.
export const BREAKPOINTS = {
    phone: 768,
    tablet: 1024,
} as const

// Subtracting 0.02 keeps `max-width` and `min-width` queries from both matching on displays that
// report fractional widths (zoom, scaled DPI).
const below = (px: number) => `@media (max-width: ${px - 0.02}px)`
const atLeast = (px: number) => `@media (min-width: ${px}px)`

// Use from a styled-components template literal, e.g.
//   ${mediaQuery.phone} { flex-direction: column; }
export const mediaQuery = {
    phone: below(BREAKPOINTS.phone),
    tabletOrSmaller: below(BREAKPOINTS.tablet),
    tabletOrLarger: atLeast(BREAKPOINTS.phone),
    desktop: atLeast(BREAKPOINTS.tablet),
}

// Input capability rather than viewport size — a narrow window on a desktop still has a mouse, and a
// tablet in landscape still does not. `canHover` and `noHover` are exact complements, so a rule that
// uses both never double-applies: the `hover` feature describes the *primary* pointer, so a laptop
// with a touchscreen reports `hover: hover` and keeps the desktop treatment.
//
// Use `canHover` to fence off styling that only reveals itself on hover, and `noHover` to give the
// same affordance a permanent form (or to remove it, when what it advertises cannot work on touch).
//
// `pointerFeature` holds the bare media features so a `matchMedia` check in JS (see `useCanHover`)
// and the CSS rules below stay one definition of what "can hover" means.
export const pointerFeature = {
    canHover: '(hover: hover)',
    noHover: '(hover: none)',
}
export const pointerQuery = {
    canHover: `@media ${pointerFeature.canHover}`,
    noHover: `@media ${pointerFeature.noHover}`,
}

// Clear space an overlay (popover, menu, tooltip, toast) keeps on each side so it never sits flush
// against a phone's screen edge. Doubles as Radix's `collisionPadding`, which wants a number.
export const OVERLAY_COLLISION_PADDING = 8
export const OVERLAY_GUTTER = `${OVERLAY_COLLISION_PADDING}px`
// Widest an overlay can be and still fit the viewport with those gutters. Anchored overlays need
// this on top of `collisionPadding`: Radix shifts content to stay on screen, but cannot shrink it.
export const OVERLAY_MAX_WIDTH = `calc(100vw - ${OVERLAY_GUTTER} * 2)`
// Tallest a centred or anchored overlay can be. `dvh` so mobile Safari's collapsing toolbars do
// not cut off the bottom.
export const OVERLAY_MAX_HEIGHT = `calc(100dvh - ${OVERLAY_GUTTER} * 2)`

// Reading width of the shared /task/:id and /note/:id pages. A max-width, not a fixed width.
export const SHARED_ITEM_WIDTH = '750px'
export const NAVIGATION_BAR_WIDTH = '250px'
export const TASK_ACTION_WIDTH = '200px'
export const DEFAULT_VIEW_WIDTH = '480px'
export const TASK_HEIGHT = '48px'
export const TOOLTIP_MAX_WIDTH = '300px'
