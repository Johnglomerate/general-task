import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface UseMobileDetailRouteFallbackParams {
    isMobile: boolean
    detailId?: string
    canValidate: boolean
    hasSelectedDetail: boolean
    listPath: string
}

const useMobileDetailRouteFallback = ({
    isMobile,
    detailId,
    canValidate,
    hasSelectedDetail,
    listPath,
}: UseMobileDetailRouteFallbackParams) => {
    const navigate = useNavigate()
    const hasDetailRoute = Boolean(detailId)

    useEffect(() => {
        if (!isMobile || !hasDetailRoute || !canValidate || hasSelectedDetail) return
        navigate(listPath, { replace: true })
    }, [canValidate, hasDetailRoute, hasSelectedDetail, isMobile, listPath, navigate])

    return isMobile && hasDetailRoute && !hasSelectedDetail
}

export default useMobileDetailRouteFallback
