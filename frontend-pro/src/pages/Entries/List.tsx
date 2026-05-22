import {
  ModalForm,
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, DatePicker, Popconfirm, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import EntryFormFields from '@/components/EntryFormFields';
import { deleteEntry, getChannels, getEntries, getProducts, getRegions, updateEntry } from '@/services/api';

const { RangePicker } = DatePicker;

const ListPage = () => {
  const actionRef = useRef<ActionType>();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [channelOptions, setChannelOptions] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [regionOptions, setRegionOptions] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>();
  const { message } = App.useApp();

  useEffect(() => {
    void Promise.all([getChannels({ pageSize: 999 }), getProducts({ pageSize: 999 }), getRegions({ pageSize: 999 })]).then(
      ([channels, products, regions]) => {
        setChannelOptions((channels.list || []).map((item: any) => ({ label: item.name, value: item.id })));
        setProductOptions((products.list || []).map((item: any) => ({ label: item.appName || item.appId, value: item.id })));
        setRegionOptions((regions.list || []).map((item: any) => ({ label: item.name, value: item.id })));
      },
    );
  }, []);

  const columns: ProColumns<any>[] = [
    { title: '日期', dataIndex: 'date', valueType: 'date', search: false },
    {
      title: '产品',
      dataIndex: 'productId',
      valueType: 'select',
      hideInTable: true,
      fieldProps: { options: productOptions, allowClear: true, placeholder: '选择产品', showSearch: true },
    },
    {
      title: '渠道',
      dataIndex: 'channelId',
      valueType: 'select',
      hideInTable: true,
      fieldProps: { options: channelOptions, allowClear: true, placeholder: '选择渠道', showSearch: true },
    },
    {
      title: '推广地区',
      dataIndex: 'regionId',
      valueType: 'select',
      hideInTable: true,
      fieldProps: { options: regionOptions, allowClear: true, placeholder: '选择推广地区', showSearch: true },
    },
    { title: '产品', dataIndex: ['app', 'appName'], search: false },
    { title: '渠道', dataIndex: ['channel', 'name'], search: false },
    { title: '推广地区', dataIndex: ['region', 'name'], search: false },
    { title: '展示量', dataIndex: 'impressions', search: false },
    { title: '点击量', dataIndex: 'clicks', search: false },
    { title: '下载量', dataIndex: 'downloads', search: false },
    { title: '消耗', dataIndex: 'spend', search: false },
    { title: '充值金额', dataIndex: 'revenue', search: false },
    { title: '充值次数', dataIndex: 'chargeCount', search: false },
    { title: '充值人数', dataIndex: 'payingUsers', search: false },
    { title: '注册人数', dataIndex: 'registrations', search: false },
    { title: '次留率', dataIndex: 'retentionD1', search: false },
    { title: '7日留存', dataIndex: 'retentionD7', search: false },
    { title: '30日留存', dataIndex: 'retentionD30', search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => [
        <a key="edit" onClick={() => setEditing({
          ...row,
          productId: row.app?.id,
          channelId: row.channel?.id,
          regionId: row.region?.id,
        })}>编辑</a>,
        <Popconfirm
          key="delete"
          title="确认删除？"
          onConfirm={async () => {
            await deleteEntry(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <ProTable<any>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 80, defaultCollapsed: false }}
        request={async (params) => {
          const queryParams: any = {
            page: params.current,
            pageSize: params.pageSize,
            channelId: params.channelId,
            appId: params.productId,
            regionId: params.regionId,
          };
          if (range) {
            queryParams.startDate = range[0].format('YYYY-MM-DD');
            queryParams.endDate = range[1].format('YYYY-MM-DD');
          }
          const result = await getEntries(queryParams);
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolbar={{
          actions: [
            <RangePicker key="range" value={range} allowClear onChange={(value) => setRange(value as [dayjs.Dayjs, dayjs.Dayjs] | null)} />,
            <Button key="refresh" onClick={() => actionRef.current?.reload()}>刷新</Button>,
          ],
        }}
      />
      <ModalForm
        title="编辑数据"
        width={720}
        open={!!editing}
        initialValues={editing}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditing(undefined) }}
        onFinish={async (values) => {
          const payload = { ...values, appId: values.productId } as any;
          delete payload.productId;
          await updateEntry(editing.id, payload);
          message.success('保存成功');
          setEditing(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        <EntryFormFields
          productOptions={productOptions}
          channelOptions={channelOptions}
          regionOptions={regionOptions}
          productDisabled
          channelDisabled
          regionDisabled
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ListPage;
