import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { stopKeydownPropogation } from '../../utils/utils'

export const TIME_INPUT_FORMAT = 'HH:mm'

const StyledTimeInput = styled.input`
    ${Typography.body.small};
    font-family: inherit;
    color: ${Colors.text.black};
    background-color: ${Colors.background.white};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._4} ${Spacing._8};
    /* Mobile Safari applies its own inner padding and rounded chrome to time inputs */
    -webkit-appearance: none;
    appearance: none;
    min-width: 0;
    :focus-visible {
        outline: ${Border.stroke.medium} solid ${Colors.legacyColors.purple};
    }
    :disabled {
        color: ${Colors.text.light};
        cursor: not-allowed;
    }
`

/* Parses an `HH:mm` input value onto the day of `base`. Returns null if the input is incomplete. */
export const parseTimeInput = (value: string, base: DateTime): DateTime | null => {
    const parsed = DateTime.fromFormat(value, TIME_INPUT_FORMAT)
    if (!parsed.isValid) return null
    return base.set({ hour: parsed.hour, minute: parsed.minute, second: 0, millisecond: 0 })
}

interface GTTimeInputProps {
    value: string // `HH:mm`
    onChange: (value: string) => void
    onBlur?: () => void
    disabled?: boolean
    ariaLabel: string
}
/*
 * A native time input, which gives us the platform time picker on touch devices and full
 * keyboard/screen-reader support on desktop — both of which the drag-only paths lacked.
 */
const GTTimeInput = ({ value, onChange, onBlur, disabled, ariaLabel }: GTTimeInputProps) => (
    <StyledTimeInput
        type="time"
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        // otherwise typing a time triggers the app's single-key shortcuts
        onKeyDown={(e) => {
            stopKeydownPropogation(e, [], true)
            if (e.key === 'Enter') e.currentTarget.blur()
        }}
    />
)

export default GTTimeInput
