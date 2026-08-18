import { ComponentProps, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useGlobalKeyboardShortcuts, useGTLocalStorage, useIsMobile, useWindowSize } from '../../hooks'
import { Border, Colors, Dimensions, Shadows, Spacing, Typography } from '../../styles'
import { TOOLTIP_MAX_WIDTH } from '../../styles/dimensions'
import { icons, logos } from '../../styles/images'
import { GT_MODAL_ROOT_CLASS } from '../atoms/BaseModal'
import GTButton from '../atoms/buttons/GTButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import CommandPalette from '../molecules/CommandPalette'
import CalendarView, { TCalendarType } from '../views/CalendarView'
import NavigationView from '../views/NavigationView'

const COLLAPSE_BREAKPOINT = 1500
const MOBILE_APP_BAR_HEIGHT = '56px'
const GT_MODAL_ROOT_SELECTOR = `[data-gt-modal-root], .${GT_MODAL_ROOT_CLASS}`

type DialogContentProps = ComponentProps<typeof Dialog.Content>

interface MobileRouteState {
    isDetailRoute: boolean
    backPath: string
    title: string
}

const getMobileRouteState = (pathname: string): MobileRouteState => {
    const pathParts = pathname.split('/').filter(Boolean)
    const section = pathParts[0]
    const detailId = pathParts[1]
    const nestedDetailId = pathParts[2]

    switch (section) {
        case 'overview':
            return {
                isDetailRoute: pathParts.length >= 3,
                backPath: '/overview',
                title: 'Daily Overview',
            }
        case 'tasks':
            return {
                isDetailRoute: pathParts.length >= 3,
                backPath: detailId ? `/tasks/${detailId}` : '/tasks',
                title: 'Tasks',
            }
        case 'notes':
            return {
                isDetailRoute: pathParts.length >= 2,
                backPath: '/notes',
                title: 'Notes',
            }
        case 'pull-requests':
            return {
                isDetailRoute: pathParts.length >= 2,
                backPath: '/pull-requests',
                title: 'Pull Requests',
            }
        case 'linear':
            return {
                isDetailRoute: pathParts.length >= 2,
                backPath: '/linear',
                title: 'Linear',
            }
        case 'slack':
            return {
                isDetailRoute: pathParts.length >= 2,
                backPath: '/slack',
                title: 'Slack',
            }
        case 'jira':
            return {
                isDetailRoute: pathParts.length >= 2,
                backPath: '/jira',
                title: 'Jira',
            }
        case 'recurring-tasks':
            return {
                isDetailRoute: pathParts.length >= 2,
                backPath: '/recurring-tasks',
                title: 'Recurring Tasks',
            }
        default:
            return {
                isDetailRoute: Boolean(nestedDetailId),
                backPath: '/overview',
                title: 'General Task',
            }
    }
}

const DefaultTemplateContainer = styled.div<{ $calendarType: TCalendarType; $showSidebar: boolean }>`
    display: grid;
    grid-template-columns: ${(props) =>
        props.$calendarType === 'day'
            ? `min-content minmax(300px, auto) max-content`
            : props.$showSidebar
            ? `min-content min-content auto`
            : `min-content auto`};
    grid-auto-flow: column;
    grid-template-rows: 100%;
    height: 100vh;
    background-color: ${Colors.background.base};
    position: relative;
    a {
        color: ${Colors.legacyColors.purple};
    }
    .tooltip {
        box-shadow: ${Shadows.deprecated_light} !important;
        border-radius: ${Border.radius.medium} !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu,
            Cantarell, Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol' !important;
        ${Typography.body.medium};
        padding: ${Spacing._8} !important;
        max-width: ${TOOLTIP_MAX_WIDTH};
    }

    ${Dimensions.mediaQuery.phone} {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: ${MOBILE_APP_BAR_HEIGHT} minmax(0, 1fr);
        grid-auto-flow: row;
        width: 100%;
        min-width: 0;
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
    }
`

const TasksandDetails = styled.div<{ $showMobileDetail: boolean }>`
    flex: 1;
    flex-direction: row;
    display: flex;
    position: relative;
    overflow: hidden;
    background-color: inherit;
    min-width: 0;

    ${Dimensions.mediaQuery.phone} {
        grid-row: 2;
        width: 100%;

        > * {
            flex: 1;
            min-width: 0;
            width: 100%;
        }

        ${({ $showMobileDetail }) =>
            $showMobileDetail
                ? `
                    > *:first-child:not(:only-child) {
                        display: none;
                    }
                `
                : `
                    > [data-mobile-pane='detail'] {
                        display: none;
                    }
                `}
    }
`

const MobileAppBar = styled.div`
    display: none;

    ${Dimensions.mediaQuery.phone} {
        grid-row: 1;
        display: flex;
        align-items: center;
        gap: ${Spacing._12};
        min-width: 0;
        padding: ${Spacing._8} ${Spacing._12};
        background-color: ${Colors.background.sub};
        border-bottom: 1px solid ${Colors.background.border};
        box-sizing: border-box;
        z-index: 2;
    }
`

const MobileTitle = styled.div`
    ${Typography.title.medium};
    color: ${Colors.text.black};
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const MobileLogo = styled.img`
    width: 28px;
    height: 28px;
    pointer-events: none;
`

const MobileDrawerOverlay = styled(Dialog.Overlay)`
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.28);
    z-index: 20;
`

const MobileDrawerContent = styled(Dialog.Content)`
    position: fixed;
    inset: 0 auto 0 0;
    width: min(82vw, 320px);
    max-width: 100vw;
    background-color: ${Colors.background.sub};
    z-index: 21;
    box-shadow: ${Shadows.deprecated_light};
    outline: none;
`

const HiddenDialogTitle = styled(Dialog.Title)`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
`
interface DefaultTemplateProps {
    children: React.ReactNode
}

const DefaultTemplate = ({ children }: DefaultTemplateProps) => {
    useGlobalKeyboardShortcuts()
    const { width } = useWindowSize()
    const isMobile = useIsMobile()
    const location = useLocation()
    const navigate = useNavigate()
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
    const {
        calendarType,
        showTaskToCalSidebar,
        isCollapsed: isCalCollapsed,
        setIsCollapsed: setIsCalCollapsed,
    } = useCalendarContext()
    const [isNavCollapsed, setIsNavCollapsed] = useGTLocalStorage('navigationCollapsed', false)
    const mobileRouteState = useMemo(() => getMobileRouteState(location.pathname), [location.pathname])

    useLayoutEffect(() => {
        if (!width) return
        if (width < Dimensions.BREAKPOINTS.phone) {
            if (!isCalCollapsed) setIsCalCollapsed(true)
            return
        }
        if (width < COLLAPSE_BREAKPOINT) {
            if (!isNavCollapsed) setIsNavCollapsed(true)
            if (!isCalCollapsed) setIsCalCollapsed(true)
        } else if (width > COLLAPSE_BREAKPOINT) {
            if (isNavCollapsed) setIsNavCollapsed(false)
            if (isCalCollapsed) setIsCalCollapsed(false)
        }
    }, [width])

    useEffect(() => {
        setIsMobileDrawerOpen(false)
    }, [location.pathname])

    const handleMobileDrawerPointerDownOutside: NonNullable<DialogContentProps['onPointerDownOutside']> = (event) => {
        const target = event.detail.originalEvent.target
        if (target instanceof HTMLElement && target.closest(GT_MODAL_ROOT_SELECTOR)) {
            event.preventDefault()
        }
    }

    return (
        <DefaultTemplateContainer $calendarType={calendarType} $showSidebar={showTaskToCalSidebar}>
            <MobileAppBar>
                {mobileRouteState.isDetailRoute ? (
                    <GTButton
                        styleType="icon"
                        icon={icons.arrow_left}
                        onClick={() => navigate(mobileRouteState.backPath, { replace: true })}
                        tooltipText="Back"
                    />
                ) : (
                    <GTButton
                        styleType="icon"
                        icon={icons.hamburger}
                        onClick={() => setIsMobileDrawerOpen(true)}
                        tooltipText="Menu"
                    />
                )}
                <MobileLogo src={logos.generaltask_yellow_circle} />
                <MobileTitle>{mobileRouteState.title}</MobileTitle>
                {isMobile && <CommandPalette />}
            </MobileAppBar>
            {!isMobile && <NavigationView isCollapsed={isNavCollapsed} setIsCollapsed={setIsNavCollapsed} />}
            {(isMobile || calendarType === 'day' || showTaskToCalSidebar) && (
                <TasksandDetails $showMobileDetail={mobileRouteState.isDetailRoute}>{children}</TasksandDetails>
            )}
            {!isMobile && <CalendarView initialType="day" />}
            <Dialog.Root open={isMobile && isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
                <Dialog.Portal>
                    <MobileDrawerOverlay />
                    <MobileDrawerContent onPointerDownOutside={handleMobileDrawerPointerDownOutside}>
                        <HiddenDialogTitle>Navigation</HiddenDialogTitle>
                        <NavigationView
                            isCollapsed={false}
                            setIsCollapsed={() => undefined}
                            hideCollapseControl
                            hideCommandPalette
                        />
                    </MobileDrawerContent>
                </Dialog.Portal>
            </Dialog.Root>
        </DefaultTemplateContainer>
    )
}

export default DefaultTemplate
