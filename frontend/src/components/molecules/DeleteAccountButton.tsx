import { useState } from 'react'
import Log from '../../services/api/log'
import { useDeleteUserAccount } from '../../services/api/settings.hooks'
import { authSignOut } from '../../utils/auth'
import GTButton from '../atoms/buttons/GTButton'
import GTDialog from '../radix/GTDialog'
import { toast } from './toast'

const DeleteAccountButton = () => {
    const { mutateAsync: deleteUserAccount, isLoading } = useDeleteUserAccount()
    const [isOpen, setIsOpen] = useState(false)

    const onDelete = async () => {
        Log('delete_account')
        try {
            await deleteUserAccount()
        } catch {
            // The account still exists, so keep the user signed in rather than
            // stranding them on the marketing site believing they were deleted.
            setIsOpen(false)
            toast('Failed to delete your account. Please try again or contact support@generaltask.com.', {
                type: 'error',
            })
            return
        }
        // The session token was deleted along with everything else, so clear the
        // cookie and leave the app.
        authSignOut()
    }

    return (
        <GTDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Delete your account?"
            description="This permanently deletes your account, your tasks and notes, and all calendar data we hold from your connected Google accounts. It also disconnects General Task from those accounts. This cannot be undone."
            actions={
                <GTButton
                    value={isLoading ? 'Deleting…' : 'Delete account'}
                    styleType="destructive"
                    textColor="red"
                    disabled={isLoading}
                    onClick={onDelete}
                />
            }
            trigger={<GTButton styleType="secondary" value="Delete account" textColor="red" />}
        />
    )
}

export default DeleteAccountButton
