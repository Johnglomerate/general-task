import { Dispatch } from 'react'
import { icons } from '../../../styles/images'
import GTModal from '../../mantine/GTModal'
import { AddListsModalContent } from './AddListsModal'
import ListOrderTab from './ListOrderTab'

interface OverviewListsModalProps {
    isOpen: boolean
    setisOpen: Dispatch<React.SetStateAction<boolean>>
}
const EditModal = ({ isOpen, setisOpen }: OverviewListsModalProps) => {
    return (
        <>
            <GTModal
                open={isOpen}
                setIsModalOpen={setisOpen}
                size="lg"
                tabs={[
                    {
                        title: 'Add lists',
                        icon: icons.plus,
                        body: <AddListsModalContent />,
                    },
                    {
                        title: 'List order',
                        icon: icons.arrow_up_down,
                        body: <ListOrderTab />,
                    },
                ]}
            />
        </>
    )
}

export default EditModal
