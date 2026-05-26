import { PageContainer, ProTable } from '@ant-design/pro-components';
import { DatePicker, Select, Space, Empty } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
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
  const actionRef = useRef<ActionType>();
  const [dynamic2DColumns, setDynamic2DColumns] = useState<ProColumns<any>[]>([]);

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

  // 二维模式下：动态列
  const columns = useMemo((): ProColumns<any>[] => {
    if (is2D) {
      const base: ProColumns<any>[] = [{
        title: DIMENSION_LABEL[rowDimension] || '维度',
        dataIndex: 'dimension',
        fixed: 'left',
        width: 160,
      }];
      return base.concat(dynamic2DColumns);
    }
    return oneDColumns;
  }, [is2D, dynamic2DColumns, oneDColumns, rowDimension]);

  // 维度/指标/日期变化时自动刷新
  useEffect(() => {
    actionRef.current?.reload();
  }, [params]);

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
        actionRef={actionRef}
        rowKey="dimension"
        search={false}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async () => {
          const result = await getCrossAnalysis(params);
          const rows = result.rows || result.list || [];
          const respColumns: string[] = result.columns || [];

          if (is2D && respColumns.length > 0) {
            const cols: ProColumns<any>[] = [];
            respColumns.forEach((col) => {
              cols.push({
                title: col,
                children: DISPLAY_2D_METRICS.map((m) => ({
                  title: renderMetricTitle(m),
                  dataIndex: `${col}_${m}`,
                  align: 'right' as const,
                  width: 100,
                })),
              });
            });
            setDynamic2DColumns(cols);
          }

          return { data: rows, success: true };
        }}
      />
    </PageContainer>
  );
};

export default CrossPage;
