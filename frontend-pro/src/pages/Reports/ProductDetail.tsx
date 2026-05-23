import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Avatar, Button, DatePicker, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getChannels, getProductDetail, getRegions } from '@/services/api';
import { renderMetricTitle } from '@/utils/metrics';

const { RangePicker } = DatePicker;

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const actionRef = useRef<ActionType>();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(29, 'day'), dayjs()]);
  const [channelId, setChannelId] = useState<number | undefined>();
  const [regionId, setRegionId] = useState<number | undefined>();
  const [channelOptions, setChannelOptions] = useState<any[]>([]);
  const [regionOptions, setRegionOptions] = useState<any[]>([]);
  const [product, setProduct] = useState<any>();

  useEffect(() => {
    void Promise.all([getChannels({ pageSize: 999 }), getRegions({ pageSize: 999 })]).then(([channels, regions]) => {
      setChannelOptions((channels.list || []).map((item: any) => ({ label: item.name, value: item.id })));
      setRegionOptions((regions.list || []).map((item: any) => ({ label: item.name, value: item.id })));
    });
  }, []);

  const params = useMemo(() => ({
    productId,
    startDate: range[0].format('YYYY-MM-DD'),
    endDate: range[1].format('YYYY-MM-DD'),
    channelId,
    regionId,
  }), [productId, range, channelId, regionId]);

  const columns: ProColumns<any>[] = [
    { title: '日期', dataIndex: 'date', valueType: 'date', fieldProps: { format: 'YYYY/MM/DD' }, fixed: 'left' },
    { title: '渠道', dataIndex: ['channel', 'name'], fixed: 'left' },
    { title: '地区', dataIndex: ['region', 'name'], fixed: 'left' },
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

  if (!productId || Number.isNaN(productId)) {
    return <PageContainer header={{ title: false }}><Typography.Text type="danger">产品 ID 无效</Typography.Text></PageContainer>;
  }

  return (
    <PageContainer
      header={{ title: false }}
      extra={[
        <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => history.push('/reports/products')}>
          返回
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space align="center">
          <Avatar shape="square" src={product?.storeIcon}>{product?.appName?.[0]}</Avatar>
          <Typography.Title level={4} style={{ margin: 0 }}>{product?.appName || '产品明细'}</Typography.Title>
          {product?.appId ? <Typography.Text type="secondary">App ID: {product.appId}</Typography.Text> : null}
        </Space>

        <Space wrap size={12}>
          <RangePicker value={range} onChange={(value) => value && setRange(value as [dayjs.Dayjs, dayjs.Dayjs])} />
          <Select
            value={channelId}
            onChange={setChannelId}
            options={channelOptions}
            placeholder="选择渠道"
            allowClear
            showSearch
            style={{ width: 180 }}
          />
          <Select
            value={regionId}
            onChange={setRegionId}
            options={regionOptions}
            placeholder="选择地区"
            allowClear
            showSearch
            style={{ width: 180 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => actionRef.current?.reload()}>查询</Button>
        </Space>

        <ProTable<any>
          rowKey={(row) => `${row.date}-${row.channel?.id}-${row.region?.id}`}
          actionRef={actionRef}
          search={false}
          options={{ density: true, setting: true }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async () => {
            const result = await getProductDetail(params);
            setProduct(result.product);
            return {
              data: result.rows || [],
              success: true,
            };
          }}
        />
      </Space>
    </PageContainer>
  );
};

export default ProductDetailPage;
