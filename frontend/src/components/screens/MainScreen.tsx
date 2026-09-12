import { useLocation } from 'react-router-dom'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { DateTime } from 'luxon'
import { OverviewContextProvider } from '../../context/OverviewContextProvider'
import { useEventBanners, usePageFocus } from '../../hooks'
import { useGetFolders } from '../../services/api/folders.hooks'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { useFetchExternalTasks } from '../../services/api/tasks.hooks'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { useGetUserInfo } from '../../services/api/user-info.hooks'
import { focusModeBackground, noteBackground } from '../../styles/images'
import { CalendarContextProvider } from '../calendar/CalendarContext'
import DragLayer from '../molecules/DragLayer'
import DefaultTemplate from '../templates/DefaultTemplate'
import DailyOverviewView from '../views/DailyOverviewView'
import NoteListView from '../views/NoteListView'
import RecurringTasksView from '../views/RecurringTasksView'
import TaskSection from '../views/TaskSectionView'

const MainScreen = () => {
    const location = useLocation()
    useGetUserInfo()
    useGetTasksV4()
    useGetFolders()
    useGetOverviewViews()
    useFetchExternalTasks()
    useEventBanners(DateTime.now())
    usePageFocus(true)

    const currentPage = () => {
        switch (location.pathname.split('/')[1]) {
            case 'overview':
                return (
                    <OverviewContextProvider>
                        <DailyOverviewView />
                    </OverviewContextProvider>
                )
            case 'recurring-tasks':
                return <RecurringTasksView />
            case 'notes':
                return <NoteListView />
            case 'tasks':
                return <TaskSection />
            default:
                return (
                    <OverviewContextProvider>
                        <DailyOverviewView />
                    </OverviewContextProvider>
                )
        }
    }

    return (
        <CalendarContextProvider>
            <link rel="preload" as="image" href={focusModeBackground} />
            <link rel="preload" as="image" href={noteBackground} />
            <DefaultTemplate>{currentPage()}</DefaultTemplate>
            <DragLayer />
        </CalendarContextProvider>
    )
}

export default MainScreen
