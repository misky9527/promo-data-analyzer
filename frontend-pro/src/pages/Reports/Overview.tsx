import { DownloadOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Button, DatePicker, Space, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { exportReport, getOverview } from '@/services/api';
import { METRICS } from '@/utils/metrics';

const { RangePicker } = DatePicker;

const OverviewPage = () => {
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);
  const params = useMemo(() => ({
    startDate: range[0].format('YYYY-MM-DD'),
    endDate: range[1].format('YYYY-MM-DD'),
  }), [range]);

  return (
    <PageContainer header={{ title: false }}
      extra={[
        <Button
          key="export"
          icon={<DownloadOutlined />}
          onClick={async () => {
            const blob = await exportReport();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'overview-report.xlsx';
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Excel 导出
        </Button>,
      ]}
    >
      <Space style={{ marginBottom: 16 }}>
        <RangePicker value={range} onChange={(value) => value && setRange(value as [dayjs.Dayjs, dayjs.Dayjs])} />
      </Space>
      <ProCard title="指标汇总" style={{ marginBottom: 16 }}>
        <ProTable<any>
          rowKey="key"
          search={false}
          options={{ density: true, setting: true }}
          pagination={false}
          request={async () => {
            const data = await getOverview(params);
            const summary = data.summary || {};
            const fmtVal = (v: number, isPercent?: boolean) => isPercent ? `${v?.toFixed(2)}%` : (v?.toFixed(2) ?? '0');
            return {
              data: [
                { key: 'spend', metric: <Tooltip title={METRICS.spend.description}>{METRICS.spend.label}</Tooltip>, value: fmtVal(summary.spend) },
                { key: 'downloads', metric: <Tooltip title={METRICS.downloads.description}>{METRICS.downloads.label}</Tooltip>, value: summary.downloads || 0 },
                { key: 'cpi', metric: <Tooltip title={METRICS.cpi.description}>{METRICS.cpi.label}（{METRICS.cpi.description}）</Tooltip>, value: fmtVal(summary.cpi) },
                { key: 'roas', metric: <Tooltip title={METRICS.roas.description}>{METRICS.roas.label}（{METRICS.roas.description}）</Tooltip>, value: fmtVal(summary.roas, true) },
                { key: 'costPerRegistration', metric: <Tooltip title={METRICS.costPerRegistration.description}>{METRICS.costPerRegistration.label}（消耗÷注册）</Tooltip>, value: fmtVal(summary.costPerRegistration) },
                { key: 'costPerPayingUser', metric: <Tooltip title={METRICS.costPerPayingUser.description}>{METRICS.costPerPayingUser.label}（消耗÷充值人数）</Tooltip>, value: fmtVal(summary.costPerPayingUser) },
              ],
              success: true,
            };
          }}
          columns={[
            { title: '指标', dataIndex: 'metric' },
            { title: '值', dataIndex: 'value' },
          ]}
        />
      </ProCard>
      <ProCard title="渠道对比表">
        <ProTable<any>
          rowKey={(row) => row.dimension || row.channel || row.name}
          search={false}
          scroll={{ x: 'max-content' }}
          request={async () => {
            const data = await getOverview(params);
            return { data: data.byChannel || [], success: true };
          }}
          columns={[
            { title: '渠道', dataIndex: 'dimension', fixed: 'left' },
            { title: <Tooltip title={METRICS.impressions.description}>{METRICS.impressions.label}</Tooltip>, dataIndex: 'impressions' },
            { title: <Tooltip title={METRICS.clicks.description}>{METRICS.clicks.label}</Tooltip>, dataIndex: 'clicks' },
            { title: <Tooltip title={METRICS.ctr.description}>{METRICS.ctr.label}</Tooltip>, dataIndex: 'ctr' },
            { title: <Tooltip title={METRICS.downloads.description}>{METRICS.downloads.label}</Tooltip>, dataIndex: 'downloads' },
            { title: <Tooltip title={METRICS.cvr.description}>{METRICS.cvr.label}</Tooltip>, dataIndex: 'cvr' },
            { title: <Tooltip title={METRICS.spend.description}>{METRICS.spend.label}</Tooltip>, dataIndex: 'spend' },
            { title: <Tooltip title={METRICS.revenue.description}>{METRICS.revenue.label}</Tooltip>, dataIndex: 'revenue' },
            { title: <Tooltip title={METRICS.roas.description}>{METRICS.roas.label}</Tooltip>, dataIndex: 'roas' },
            { title: <Tooltip title={METRICS.cpi.description}>{METRICS.cpi.label}</Tooltip>, dataIndex: 'cpi' },
            { title: <Tooltip title={METRICS.costPerRegistration.description}>{METRICS.costPerRegistration.label}</Tooltip>, dataIndex: 'costPerRegistration' },
            { title: <Tooltip title={METRICS.costPerPayingUser.description}>{METRICS.costPerPayingUser.label}</Tooltip>, dataIndex: 'costPerPayingUser' },
            { title: <Tooltip title={METRICS.registrationRate.description}>{METRICS.registrationRate.label}</Tooltip>, dataIndex: 'registrationRate' },
            { title: <Tooltip title={METRICS.payRate.description}>{METRICS.payRate.label}</Tooltip>, dataIndex: 'payRate' },
          ]}
        />
      </ProCard>
    </PageContainer>
  );
};

export default OverviewPage;
