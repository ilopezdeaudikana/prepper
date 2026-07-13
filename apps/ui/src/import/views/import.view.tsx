import { ChallengeService } from '@/services/challenge.service'
import {
  ChallengeType,
  Level,
  type ChallengeImportItem,
} from '@repo/shared-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Upload,
  type UploadProps,
} from 'antd'
import { FileUp, Plus } from 'lucide-react'
import { useState } from 'react'
import { CodeArea } from '../../common/components/code-area'

type ChallengeFormValues = {
  question: string
  initialCode?: string
  type: ChallengeImportItem['type']
  topic?: string
  level: ChallengeImportItem['level']
}

const parseImportedChallenges = (text: string): ChallengeImportItem[] => {
  const parsed = JSON.parse(text) as unknown
  const challenges = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && 'challenges' in parsed
      ? (parsed as { challenges: unknown }).challenges
      : null

  if (!Array.isArray(challenges)) {
    throw new Error('Upload a JSON array or an object with a challenges array.')
  }

  return challenges.map((item) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Every uploaded challenge must be an object.')
    }

    const challenge = item as Partial<ChallengeImportItem>
    if (!challenge.question?.trim()) {
      throw new Error('Every uploaded challenge needs a question.')
    }

    return {
      question: challenge.question,
      initialCode: challenge.initialCode,
      type: challenge.type ?? ChallengeType.Mixed,
      topic: challenge.topic,
      level: challenge.level ?? Level.Mid,
    }
  })
}

export default function ImportView() {
  const [form] = Form.useForm<ChallengeFormValues>()
  const [pendingUpload, setPendingUpload] = useState<ChallengeImportItem[]>([])
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: ChallengeService.importChallenges,
    onSuccess: async (result) => {
      message.success(
        `${result.inserted} challenge${result.inserted === 1 ? '' : 's'} imported`,
      )
      form.resetFields()
      setPendingUpload([])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['challenge', 'all'] }),
        queryClient.invalidateQueries({ queryKey: ['challenge', 'dashboard'] }),
      ])
    },
    onError: () => {
      message.error('Could not import challenges')
    },
  })

  const uploadProps: UploadProps = {
    accept: 'application/json,.json',
    maxCount: 1,
    beforeUpload: async (file) => {
      try {
        const text = await file.text()
        const challenges = parseImportedChallenges(text)
        setPendingUpload(challenges)
        message.success(
          `${challenges.length} challenge${challenges.length === 1 ? '' : 's'} ready to import`,
        )
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : 'Could not read uploaded JSON',
        )
      }
      return false
    },
    onRemove: () => {
      setPendingUpload([])
    },
  }

  const example = `{
  "user":string
  "challenges": {
    "question":string
    "initialCode?":string
    "type":"coding" | "theoretical"
    "topic": string
    "level":"mid" | "junior" | "senior"
  }[]
}`

  const handleManualSubmit = (values: ChallengeFormValues) => {
    importMutation.mutate([
      {
        question: values.question,
        initialCode: values.initialCode,
        type: values.type,
        topic: values.topic,
        level: values.level,
      },
    ])
  }

  const handleUploadSubmit = () => {
    importMutation.mutate(pendingUpload)
  }

  return (
    <div className="py-4 flex flex-col gap-4 h-[calc(100vh-90px)] min-h-0">
      <div className="flex flex-col gap-1">
        <Typography.Title level={3} className="!mb-0">
          Import Challenges
        </Typography.Title>
        <Typography.Text type="secondary">
          Add a single challenge or upload a JSON batch.
        </Typography.Text>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_480px] gap-4 h-[calc(100vh-90px)] min-h-0">
        <Card title="Single entry">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ type: ChallengeType.Mixed, level: Level.Mid }}
            onFinish={handleManualSubmit}
          >
            <Form.Item
              label="Question"
              name="question"
              rules={[
                { required: true, message: 'Add the challenge question' },
              ]}
            >
              <Input.TextArea rows={7} />
            </Form.Item>

            <Form.Item label="Initial code" name="initialCode">
              <Input.TextArea rows={7} />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Form.Item label="Type" name="type">
                <Select
                  options={[
                    { value: ChallengeType.Coding, label: 'Coding' },
                    { value: ChallengeType.Theoretical, label: 'Theoretical' },
                    { value: ChallengeType.Mixed, label: 'Mixed' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="Level" name="level">
                <Select
                  options={[
                    { value: Level.Junior, label: 'Junior' },
                    { value: Level.Mid, label: 'Mid' },
                    { value: Level.Senior, label: 'Senior' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="Topic" name="topic">
                <Input />
              </Form.Item>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              icon={<Plus className="size-4" />}
              loading={importMutation.isPending}
            >
              Add challenge
            </Button>
          </Form>
        </Card>

        <Card title="Batch upload">
          <Space orientation="vertical" size="middle" className="w-full">
            <CodeArea 
              value={example} 
              readOnly={true} 
              height={220}
              id={'example-code'} 
            />
            <Upload.Dragger {...uploadProps}>
              <div className="flex flex-col items-center gap-3 py-6">
                <FileUp className="size-8 text-blue-600" />
                <Typography.Text>
                  Drop a JSON file here or click to select one
                </Typography.Text>
              </div>
            </Upload.Dragger>

            <Typography.Text type="secondary">
              Ready: {pendingUpload.length}
            </Typography.Text>

            <Button
              type="primary"
              onClick={handleUploadSubmit}
              disabled={pendingUpload.length === 0}
              loading={importMutation.isPending}
              block
            >
              Import upload
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  )
}
