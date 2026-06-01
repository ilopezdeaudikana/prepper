import { Button } from 'antd'

export const ExportToMD = ({ text, topic }: { text: string, topic: string}) => {

  const exportToMarkdown = () => {
    const date = new Date().toISOString()
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `report-${topic}-${date}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return <Button onClick={exportToMarkdown}>Export as markdown</Button>
}
