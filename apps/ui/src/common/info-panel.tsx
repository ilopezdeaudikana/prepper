import { notification, type NotificationArgsProps } from 'antd'
import { type ReactNode, useEffect, useRef } from 'react'

interface InfoPanelProps {
  children: ReactNode,
  title: string
  placement?: NotificationArgsProps['placement']
}

export const InfoPanel = ({ children, title, placement }: InfoPanelProps) => {

  const [api, contextHolder] = notification.useNotification()

  const ref= useRef(true)
  
  const openNotification = () => {
    api.open({
      title,
      description: children,
      placement: placement ?? 'bottomLeft',
      duration: 0,
    })
  }

  useEffect(() => {
    if (ref.current) {
      openNotification()
    } 
      
    return () => {
      ref.current = false
    }
  }, [])

  return (
    <>
      {contextHolder}
    </>
  )
}