import { PageContainer, ProTable } from '@ant-design/pro-components';
import { DatePicker, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import { getCrossAnalysis } from '@/services/api';
import { getMetricLabel, renderMetricTitle } from '@/utils/metrics';

const { RangePicker } = DatePicker;

const DIMENSION_OPTIONS = [
  { label: '渠道', value: 'channel' },
  { label: '推广地区', value: 'region' },
  { label: '产品', value: 'app' },
];

const DIMENSION_LABEL: Record<string, string> = {
  channel: '渠道',
  region: '推广地区',
  app: '产品',
};

const ALL_METRICS = ['impressions', 'clicks', 'downloads', 'spend', 'revenue', 'ctr', 'cvr', 'roas'];
const DISPLAY_2D_METRICS = ['spend', 'downloads', 'ctr', 'roas'];

const CrossPage = () => {
  const [rowDimension, setRowDimension] = useState('channel');
  const [colDimension, setColDimension] = useState<string | undefined>(undefined);
  const [metrics, setMetrics] = useState<string[]>(ALL_METRICS);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const is2D = !!colDimension;

  const params = useMemo(
    () => ({
      rowDimension,
      colDimension,
      metrics,
      startDate: range[0].format('YYYY-MM-DD'),
      endDate: range[1].format('YYYY-MM-DD'),
    }),
    [rowDimension, colDimension, metrics, range],
  );

  // 一维模式：动态构建指标列
  const oneDColumns = useMemo((): ProColumns<any>[] => {
    const cols: ProColumns<any>[] = [
      {
        title: DIMENSION_LABEL[rowDimension] || '维度',
        dataIndex: 'dimension',
        fixed: 'left',
        width: 160,
      },
    ];
    metrics.forEach((m) => {
      cols.push({
        title: renderMetricTitle(m),
        dataIndex: m,
        align: 'right',
        width: 100,
      });
    });
    return cols;
  }, [rowDimension, metrics]);

  // 二维模式：根据后端返回的 col 值构建分组列
  const build2DColumns = (respColumns: string[]): ProColumns<any>[] => {
    const result: ProColumns<any>[] = [
      {
        title: DIMENSION_LABEL[rowDimension] || '维度',
        dataIndex: 'dimension',
        fixed: 'left',
        width: 160,
      },
    ];
    respColumns.forEach((col) => {
      result.push({
        title: col,
        children: DISPLAY_2D_METRICS.map((m) => ({
          title: renderMetricTitle(m),
          dataIndex: `${col}_${m}`,
          align: 'right' as const,
          width: 100,
        })),
      });
    });
    return result;
  };

  return (
    <PageContainer header={{ title: false }}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={rowDimension}
          style={{ width: 120 }}
          onChange={setRowDimension}
          options={DIMENSION_OPTIONS}
          placeholder="行维度"
        />
        <Select
          value={colDimension}
          style={{ width: 140 }}
          onChange={setColDimension}
          allowClear
          placeholder="列维度（可选）"
          options={DIMENSION_OPTIONS}
        />
        {is2D ? (
          <span style={{ color: '#888', lineHeight: '32px', fontSize: 12 }}>
            展示指标：{DISPLAY_2D_METRICS.map((m) => getMetricLabel(m)).join('、')}
          </span>
        ) : (
          <Select
            mode="multiple"
            value={metrics}
            style={{ minWidth: 240 }}
            onChange={setMetrics}
            placeholder="指标"
            options={ALL_METRICS.map((m) => ({ label: getMetricLabel(m), value: m }))}
            maxTagCount={3}
          />
        )}
        <RangePicker
          value={range}
          onChange={(value) => value && setRange(value as [dayjs.Dayjs, dayjs.Dayjs])}
        />
      </Space>
      <ProTable<any>
        rowKey="dimension"
        search={false}
        columns={is2D ? [{ title: '维度', dataIndex: 'dimension', fixed: 'left' }] : oneDColumns}
        scroll={{ x: 'max-content' }}
        request={async () => {
          const result = await getCrossAnalysis(params);
          const rows = result.rows || result.list || [];
          const respColumns: string[] = result.columns || [];

          if (is2D && respColumns.length > 0) {
            return {
              data: rows,
              success: true,
              columns: build2DColumns(respColumns),
            } as any;
          }

          return {
            data: rows,
            success: true,
          } as any;
        }}
      />
    </PageContainer>
  );
};

export default CrossPage;
