import { ArrowRightOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Col, DatePicker, Row, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import EChart from '@/components/EChart';
import StatCard from '@/components/StatCard';
import { getOverview } from '@/services/api';
import { METRICS } from '@/utils/metrics';

const { RangePicker } = DatePicker;

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>({});
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);
  const [metric, setMetric] = useState('spend');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOverview({
        startDate: range[0].format('YYYY-MM-DD'),
        endDate: range[1].format('YYYY-MM-DD'),
      });
      setOverview(data || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [metric, range[0].valueOf(), range[1].valueOf()]);

  const summary = overview.summary || {};

  const pieOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        data: (overview.byChannel || []).map((item: any) => ({
          name: item.dimension || item.channel || item.name,
          value: item.spend || 0,
        })),
      },
    ],
  }), [overview.byChannel]);

  const lineOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: (overview.daily || []).map((item: any) => item.date) },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        smooth: true,
        data: (overview.daily || []).map((item: any) => item[metric] || 0),
      },
    ],
  }), [overview.daily, metric]);

  return (
    <PageContainer header={{ title: false }}
      extra={[
        <Button key="report" type="link" icon={<ArrowRightOutlined />} onClick={() => history.push('/reports/overview')}>
          查看详细报表
        </Button>,
      ]}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><StatCard title={METRICS.spend.label} value={summary.spend || 0} precision={2} tooltip={METRICS.spend.description} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title={METRICS.downloads.label} value={summary.downloads || 0} tooltip={METRICS.downloads.description} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title={METRICS.cpi.label} value={summary.cpi || 0} precision={2} tooltip={METRICS.cpi.description} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title={METRICS.roas.label} value={summary.roas || 0} precision={2} suffix="%" tooltip={METRICS.roas.description} /></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} xl={10}>
          <ProCard
            title="渠道花费占比"
            loading={loading}
            extra={<RangePicker value={range} onChange={(value) => value && setRange(value as [dayjs.Dayjs, dayjs.Dayjs])} />}
          >
            <EChart option={pieOption} />
          </ProCard>
        </Col>
        <Col xs={24} xl={14}>
          <ProCard
            title="日趋势"
            loading={loading}
            extra={(
              <Space>
                <Select
                  value={metric}
                  style={{ width: 140 }}
                  onChange={setMetric}
                  options={[
                    { label: '花费', value: 'spend' },
                    { label: '下载', value: 'downloads' },
                    { label: 'CPI', value: 'cpi' },
                  ]}
                />
              </Space>
            )}
          >
            <EChart option={lineOption} />
          </ProCard>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default DashboardPage;
