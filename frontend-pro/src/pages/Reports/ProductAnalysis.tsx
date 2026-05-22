import { SearchOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Avatar, Button, DatePicker, Select, Space, Tabs, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  getChannelDaily,
  getChannelSummary,
  getChannels,
  getProductSummary,
  getRegionDaily,
  getRegionSummary,
  getRegions,
} from '@/services/api';
import { renderMetricTitle } from '@/utils/metrics';

const { RangePicker } = DatePicker;

type TabKey = 'products' | 'channel' | 'region';
type SummaryDimension = 'channel' | 'region';

type SummaryRow = {
  dimension?: { id?: number; name?: string };
  impressions?: number;
  clicks?: number;
  ctr?: number;
  downloads?: number;
  cvr?: number;
  spend?: number;
  revenue?: number;
  payingUsers?: number;
  registrations?: number;
  roas?: number;
  cpi?: number;
  costPerRegistration?: number;
  costPerPayingUser?: number;
  registrationRate?: number;
  payRate?: number;
  retentionD1Rate?: number;
  retentionD7Rate?: number;
};

const buildSummaryColumns = (dimension: SummaryDimension, onClick: (row: SummaryRow) => void): ProColumns<SummaryRow>[] => {
  const title = dimension === 'channel' ? '渠道' : '推广地区';
  return [
    {
      title,
      dataIndex: ['dimension', 'name'],
      width: 180,
      fixed: 'left',
      render: (_, row) => (
        <a onClick={() => onClick(row)}>{row.dimension?.name || '-'}</a>
      ),
    },
    { title: renderMetricTitle('impressions'), dataIndex: 'impressions' },
    { title: renderMetricTitle('clicks'), dataIndex: 'clicks' },
    { title: renderMetricTitle('ctr'), dataIndex: 'ctr' },
    { title: renderMetricTitle('downloads'), dataIndex: 'downloads' },
    { title: renderMetricTitle('cvr'), dataIndex: 'cvr' },
    { title: renderMetricTitle('spend'), dataIndex: 'spend' },
    { title: renderMetricTitle('revenue'), dataIndex: 'revenue' },
    { title: renderMetricTitle('payingUsers'), dataIndex: 'payingUsers' },
    { title: renderMetricTitle('registrations'), dataIndex: 'registrations' },
    { title: renderMetricTitle('roas'), dataIndex: 'roas' },
    { title: renderMetricTitle('cpi'), dataIndex: 'cpi' },
    { title: renderMetricTitle('costPerRegistration'), dataIndex: 'costPerRegistration' },
    { title: renderMetricTitle('costPerPayingUser'), dataIndex: 'costPerPayingUser' },
    { title: renderMetricTitle('registrationRate'), dataIndex: 'registrationRate' },
    { title: renderMetricTitle('payRate'), dataIndex: 'payRate' },
    { title: renderMetricTitle('retentionD1Rate'), dataIndex: 'retentionD1Rate' },
    { title: renderMetricTitle('retentionD7Rate'), dataIndex: 'retentionD7Rate' },
  ];
};

const buildDailyColumns = (dimension: SummaryDimension): ProColumns<any>[] => {
  const title = dimension === 'channel' ? '渠道' : '推广地区';
  return [
    { title: '日期', dataIndex: 'date', fixed: 'left' },
    { title, dataIndex: [dimension, 'name'], fixed: 'left' },
    { title: renderMetricTitle('impressions'), dataIndex: 'impressions' },
    { title: renderMetricTitle('clicks'), dataIndex: 'clicks' },
    { title: renderMetricTitle('ctr'), dataIndex: 'ctr' },
    { title: renderMetricTitle('downloads'), dataIndex: 'downloads' },
    { title: renderMetricTitle('cvr'), dataIndex: 'cvr' },
    { title: renderMetricTitle('spend'), dataIndex: 'spend' },
    { title: renderMetricTitle('revenue'), dataIndex: 'revenue' },
    { title: renderMetricTitle('payingUsers'), dataIndex: 'payingUsers' },
    { title: renderMetricTitle('registrations'), dataIndex: 'registrations' },
    { title: renderMetricTitle('roas'), dataIndex: 'roas' },
    { title: renderMetricTitle('cpi'), dataIndex: 'cpi' },
    { title: renderMetricTitle('costPerRegistration'), dataIndex: 'costPerRegistration' },
    { title: renderMetricTitle('costPerPayingUser'), dataIndex: 'costPerPayingUser' },
    { title: renderMetricTitle('registrationRate'), dataIndex: 'registrationRate' },
    { title: renderMetricTitle('payRate'), dataIndex: 'payRate' },
    { title: renderMetricTitle('retentionD1Rate'), dataIndex: 'retentionD1Rate' },
    { title: renderMetricTitle('retentionD7Rate'), dataIndex: 'retentionD7Rate' },
  ];
};

const productSummaryColumns: ProColumns<any>[] = [
  {
    title: '图标',
    dataIndex: ['product', 'storeIcon'],
    width: 72,
    fixed: 'left',
    search: false,
    render: (_, row) => (
      <Avatar shape="square" src={row.product?.storeIcon}>
        {row.product?.appName?.[0]}
      </Avatar>
    ),
  },
  {
    title: '名称',
    dataIndex: ['product', 'appName'],
    width: 180,
    fixed: 'left',
    search: false,
    render: (text, row) => (
      <a onClick={() => history.push(`/reports/products/${row.product?.id}`)}>
        {text || row.product?.appId}
      </a>
    ),
  },
  { title: '渠道', dataIndex: ['channel', 'name'], search: false },
  { title: '地区', dataIndex: ['region', 'name'], search: false },
  { title: '平台', dataIndex: ['product', 'platform'], search: false },
  { title: renderMetricTitle('impressions'), dataIndex: 'impressions', search: false },
  { title: renderMetricTitle('clicks'), dataIndex: 'clicks', search: false },
  { title: renderMetricTitle('ctr'), dataIndex: 'ctr', search: false },
  { title: renderMetricTitle('downloads'), dataIndex: 'downloads', search: false },
  { title: renderMetricTitle('cvr'), dataIndex: 'cvr', search: false },
  { title: renderMetricTitle('spend'), dataIndex: 'spend', search: false },
  { title: renderMetricTitle('revenue'), dataIndex: 'revenue', search: false },
  { title: renderMetricTitle('payingUsers'), dataIndex: 'payingUsers', search: false },
  { title: renderMetricTitle('registrations'), dataIndex: 'registrations', search: false },
  { title: renderMetricTitle('roas'), dataIndex: 'roas', search: false },
  { title: renderMetricTitle('cpi'), dataIndex: 'cpi', search: false },
  { title: renderMetricTitle('costPerRegistration'), dataIndex: 'costPerRegistration', search: false },
  { title: renderMetricTitle('costPerPayingUser'), dataIndex: 'costPerPayingUser', search: false },
  { title: renderMetricTitle('registrationRate'), dataIndex: 'registrationRate', search: false },
  { title: renderMetricTitle('payRate'), dataIndex: 'payRate', search: false },
  { title: renderMetricTitle('retentionD1Rate'), dataIndex: 'retentionD1Rate', search: false },
  { title: renderMetricTitle('retentionD7Rate'), dataIndex: 'retentionD7Rate', search: false },
];

const ProductAnalysisPage = () => {
  const productActionRef = useRef<ActionType>();
  const channelSummaryActionRef = useRef<ActionType>();
  const regionSummaryActionRef = useRef<ActionType>();
  const channelDailyActionRef = useRef<ActionType>();
  const regionDailyActionRef = useRef<ActionType>();
  const [activeTab, setActiveTab] = useState<TabKey>('products');
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [channelId, setChannelId] = useState<number | undefined>();
  const [regionId, setRegionId] = useState<number | undefined>();
  const [channelOptions, setChannelOptions] = useState<any[]>([]);
  const [regionOptions, setRegionOptions] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<{ id: number; name: string } | undefined>();
  const [activeRegion, setActiveRegion] = useState<{ id: number; name: string } | undefined>();

  useEffect(() => {
    void Promise.all([getChannels({ pageSize: 999 }), getRegions({ pageSize: 999 })]).then(
      ([channels, regions]) => {
        setChannelOptions((channels.list || []).map((item: any) => ({ label: item.name, value: item.id })));
        setRegionOptions((regions.list || []).map((item: any) => ({ label: item.name, value: item.id })));
      },
    );
  }, []);

  const params = useMemo(
    () => ({
      startDate: range[0].format('YYYY-MM-DD'),
      endDate: range[1].format('YYYY-MM-DD'),
      channelId,
      regionId,
    }),
    [range, channelId, regionId],
  );

  const channelSummaryColumns = useMemo(
    () =>
      buildSummaryColumns('channel', (row) => {
        if (!row.dimension?.id || !row.dimension?.name) return;
        setActiveChannel({ id: row.dimension.id, name: row.dimension.name });
        setTimeout(() => channelDailyActionRef.current?.reload(), 0);
      }),
    [],
  );

  const regionSummaryColumns = useMemo(
    () =>
      buildSummaryColumns('region', (row) => {
        if (!row.dimension?.id || !row.dimension?.name) return;
        setActiveRegion({ id: row.dimension.id, name: row.dimension.name });
        setTimeout(() => regionDailyActionRef.current?.reload(), 0);
      }),
    [],
  );

  const reloadActiveTab = () => {
    if (activeTab === 'products') {
      productActionRef.current?.reload();
      return;
    }
    if (activeTab === 'channel') {
      channelSummaryActionRef.current?.reload();
      if (activeChannel) {
        channelDailyActionRef.current?.reload();
      }
      return;
    }
    regionSummaryActionRef.current?.reload();
    if (activeRegion) {
      regionDailyActionRef.current?.reload();
    }
  };

  return (
    <PageContainer header={{ title: false }}>
      <Space wrap size={12} style={{ marginBottom: 16 }}>
        <RangePicker
          value={range}
          format="YYYY-MM-DD"
          onChange={(value) => value && setRange(value as [dayjs.Dayjs, dayjs.Dayjs])}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={reloadActiveTab}>
          查询
        </Button>
      </Space>

      <Space wrap size={12} style={{ marginBottom: 16 }}>
        <Select
          value={channelId}
          onChange={(value) => {
            setChannelId(value);
            setActiveChannel(undefined);
          }}
          options={channelOptions}
          placeholder="选择渠道"
          allowClear
          showSearch
          style={{ width: 180 }}
        />
        <Select
          value={regionId}
          onChange={(value) => {
            setRegionId(value);
            setActiveRegion(undefined);
          }}
          options={regionOptions}
          placeholder="选择地区"
          allowClear
          showSearch
          style={{ width: 180 }}
        />
      </Space>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as TabKey);
          setTimeout(() => {
            if (key === 'products') {
              productActionRef.current?.reload();
            } else if (key === 'channel') {
              channelSummaryActionRef.current?.reload();
              if (activeChannel) {
                channelDailyActionRef.current?.reload();
              }
            } else {
              regionSummaryActionRef.current?.reload();
              if (activeRegion) {
                regionDailyActionRef.current?.reload();
              }
            }
          }, 0);
        }}
        items={[
          {
            key: 'products',
            label: '产品列表',
            children: (
              <ProTable<any>
                rowKey={(row) => `${row.product?.id}-${row.channel?.id}-${row.region?.id}`}
                actionRef={productActionRef}
                search={false}
                options={{ density: true, setting: true }}
                pagination={false}
                columns={productSummaryColumns}
                scroll={{ x: 'max-content' }}
                request={async () => {
                  const result = await getProductSummary(params);
                  return {
                    data: result.rows || [],
                    success: true,
                  };
                }}
              />
            ),
          },
          {
            key: 'channel',
            label: '按渠道',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <ProTable<SummaryRow>
                  rowKey={(row) => String(row.dimension?.id || row.dimension?.name)}
                  actionRef={channelSummaryActionRef}
                  search={false}
                  options={{ density: true, setting: true }}
                  pagination={false}
                  columns={channelSummaryColumns}
                  scroll={{ x: 'max-content' }}
                  request={async () => {
                    const result = await getChannelSummary({
                      ...params,
                      productId: undefined,
                    });
                    return {
                      data: result.rows || [],
                      success: true,
                    };
                  }}
                />

                {activeChannel ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {`渠道明细：${activeChannel.name}`}
                    </Typography.Title>
                    <ProTable<any>
                      rowKey={(row) => `${row.date}-${row.channel?.id ?? row.channel?.name}`}
                      actionRef={channelDailyActionRef}
                      search={false}
                      options={{ density: true, setting: true }}
                      pagination={false}
                      columns={buildDailyColumns('channel')}
                      scroll={{ x: 'max-content' }}
                      request={async () => {
                        const result = await getChannelDaily({
                          ...params,
                          channelId: activeChannel.id,
                        });
                        return {
                          data: result.rows || [],
                          success: true,
                        };
                      }}
                    />
                  </Space>
                ) : null}
              </Space>
            ),
          },
          {
            key: 'region',
            label: '按地区',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <ProTable<SummaryRow>
                  rowKey={(row) => String(row.dimension?.id || row.dimension?.name)}
                  actionRef={regionSummaryActionRef}
                  search={false}
                  options={{ density: true, setting: true }}
                  pagination={false}
                  columns={regionSummaryColumns}
                  scroll={{ x: 'max-content' }}
                  request={async () => {
                    const result = await getRegionSummary({
                      ...params,
                      productId: undefined,
                    });
                    return {
                      data: result.rows || [],
                      success: true,
                    };
                  }}
                />

                {activeRegion ? (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {`地区明细：${activeRegion.name}`}
                    </Typography.Title>
                    <ProTable<any>
                      rowKey={(row) => `${row.date}-${row.region?.id ?? row.region?.name}`}
                      actionRef={regionDailyActionRef}
                      search={false}
                      options={{ density: true, setting: true }}
                      pagination={false}
                      columns={buildDailyColumns('region')}
                      scroll={{ x: 'max-content' }}
                      request={async () => {
                        const result = await getRegionDaily({
                          ...params,
                          regionId: activeRegion.id,
                        });
                        return {
                          data: result.rows || [],
                          success: true,
                        };
                      }}
                    />
                  </Space>
                ) : null}
              </Space>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default ProductAnalysisPage;
