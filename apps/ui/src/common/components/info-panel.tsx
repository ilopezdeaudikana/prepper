import { notification, type NotificationArgsProps } from 'antd'
import { type ReactNode, useCallback, useEffect, useRef } from 'react'

interface InfoPanelProps {
  children: ReactNode,
  title: string
  placement?: NotificationArgsProps['placement']
}

export const InfoPanel = ({ children, title, placement }: InfoPanelProps) => {

  const [api, contextHolder] = notification.useNotification({  })

  const ref= useRef(true)
  
  const closeNotification = () => {
    localStorage.setItem('prepper-info', 'true')
  }

  const openNotification = useCallback(() => {
    api.open({
      title,
      description: children,
      placement: placement ?? 'bottomLeft',
      duration: 0,
      onClose: closeNotification
    })
  },[api, children, placement, title])

  useEffect(() => {
    if (ref.current && !localStorage.getItem('prepper-info')) {
      openNotification()
    } 
      
    return () => {
      ref.current = false
    }
  }, [openNotification])

  return (
    <>
      {contextHolder}
    </>
  )
}