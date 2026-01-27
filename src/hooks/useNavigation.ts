import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback } from 'react'

export const useNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }, [navigate])

  const goHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const push = useCallback((path: string) => {
    navigate(path)
  }, [navigate])

  return {
    goBack,
    goHome,
    push,
    router: {
      push,
      back: goBack,
    },
  }
}
