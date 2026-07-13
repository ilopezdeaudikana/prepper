import { ChallengeService } from '@/services/challenge.service'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Empty, Row, Statistic } from 'antd'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  type PieSectorShapeProps,
} from 'recharts'

const CHART_COLORS = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#0891b2']

const PieSector = (props: PieSectorShapeProps) => <Sector {...props} fill={CHART_COLORS[props.index % CHART_COLORS.length]} />

export default function DashboardView() {
  const { data, isPending, error } = useQuery({
    queryKey: ['challenge', 'dashboard'],
    queryFn: ChallengeService.getDashboard,
    staleTime: 2 * 1000 * 60,
  })

  const hasData = !!data && data.total > 0

  return (
    <div className="flex flex-col gap-4 pt-3 h-[calc(100vh-90px)] min-h-0">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isPending}>
            <Statistic title="Total challenges" value={data?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isPending}>
            <Statistic title="Solved" value={data?.solved ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isPending}>
            <Statistic title="Unsolved" value={data?.unsolved ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={isPending}>
            <Statistic title="Average score" value={data?.averageScore ?? 0} precision={1} />
          </Card>
        </Col>
      </Row>

      {error && <Card>Dashboard data could not be loaded.</Card>}
      {!isPending && !error && !hasData && (
        <Card>
          <Empty description="No challenge activity yet" />
        </Card>
      )}

      {hasData && (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card title="Usage over time">
              <div className="h-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.usageOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="created" name="Created" stroke={CHART_COLORS[0]} strokeWidth={2} />
                    <Line type="monotone" dataKey="solved" name="Solved" stroke={CHART_COLORS[1]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card title="Solved by type">
              <div className="h-70">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.solvedByType}
                      dataKey="count"
                      nameKey="type"
                      innerRadius={70}
                      outerRadius={110}
                      label
                      shape={PieSector}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          

          <Col xs={24}>
            <Card title="Top topics">
              <div className="h-85">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byTopic}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Created" fill={CHART_COLORS[0]} />
                    <Bar dataKey="solved" name="Solved" fill={CHART_COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}
