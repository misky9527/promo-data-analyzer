import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormDigit,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  getStreamers,
  createStreamer,
  updateStreamer,
  deleteStreamer,
  getSites,
} from '@/services/api';

const LEVEL_OPTIONS = ['普通', '优质', '高级', '头部'];

const StreamerCenterPage = () => {
  const actionRef = useRef<ActionType>();
  const [editing, setEditing] = useState<any>();

  const columns: ProColumns<any>[] = [
    { title: '主播名称', dataIndex: 'name' },
    { title: '主播归属', dataIndex: 'affiliation', search: false },
    {
      title: '基础工资',
      dataIndex: 'baseSalary',
      search: false,
      render: (_, row) => (row.baseSalary != null ? `¥${Number(row.baseSalary).toFixed(2)}` : '-'),
    },
    {
      title: '主播级别',
      dataIndex: 'level',
      valueType: 'select',
      valueEnum: Object.fromEntries(LEVEL_OPTIONS.map((l) => [l, l])),
      search: true,
    },
    { title: '主播备注', dataIndex: 'remark', search: false },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'date',
      fieldProps: { format: 'YYYY/MM/DD' },
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => [
        <a key="edit" onClick={() => setEditing(row)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该主播？此操作不可恢复！"
          onConfirm={async () => {
            await deleteStreamer(row.id);
            message.success('已删除');
            actionRef.current?.reload();
          }}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
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
        request={async (params) => {
          const result = await getStreamers({
            page: params.current,
            pageSize: params.pageSize,
            name: params.name,
            level: params.level,
          });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => setEditing({})}>
            新增主播
          </Button>,
        ]}
      />
      <ModalForm
        title={editing?.id ? '编辑主播' : '新增主播'}
        open={editing !== undefined}
        initialValues={editing}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditing(undefined) }}
        onFinish={async (values) => {
          const payload = { ...values };
          if (editing?.id) {
            await updateStreamer(editing.id, payload);
          } else {
            await createStreamer(payload);
          }
          setEditing(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="主播名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="affiliation"
          label="主播归属"
          request={async () => {
            const res = await getSites({ page: 1, pageSize: 999 });
            return (res.list || []).map((s: any) => ({ label: s.name, value: s.name }));
          }}
        />
        <ProFormDigit name="baseSalary" label="基础工资" fieldProps={{ precision: 2, prefix: '¥' }} />
        <ProFormSelect
          name="level"
          label="主播级别"
          options={LEVEL_OPTIONS.map((l) => ({ label: l, value: l }))}
          initialValue="普通"
        />
        <ProFormText name="remark" label="主播备注" />
      </ModalForm>
    </PageContainer>
  );
};

export default StreamerCenterPage;
