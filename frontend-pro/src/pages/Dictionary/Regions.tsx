import {
  ModalForm,
  PageContainer,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, Popconfirm, message } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  createRegion,
  updateRegion,
  disableRegion,
  enableRegion,
  deleteRegion,
  restoreRegion,
  permanentDeleteRegion,
  getRegions,
  getRecycleRegions,
} from '@/services/api';

const RegionsPage = () => {
  const actionRef = useRef<ActionType>();
  const recycleRef = useRef<ActionType>();
  const [editing, setEditing] = useState<any>();
  const [recycleOpen, setRecycleOpen] = useState(false);

  const columns: ProColumns<any>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '编码', dataIndex: 'code' },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      render: (_, row) => (row.status === 1 ? '启用' : '禁用'),
    },
    { title: '备注', dataIndex: 'remark', search: false },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'date', fieldProps: { format: 'YYYY/MM/DD' }, search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => {
        const actions: React.ReactNode[] = [
          <a key="edit" onClick={() => setEditing(row)}>编辑</a>,
        ];
        if (row.status === 1) {
          actions.push(
            <Popconfirm
              key="disable"
              title="确认禁用该推广地区？"
              onConfirm={async () => {
                await disableRegion(row.id);
                message.success('已禁用');
                actionRef.current?.reload();
              }}
            >
              <a style={{ color: '#faad14' }}>禁用</a>
            </Popconfirm>,
          );
        } else {
          actions.push(
            <Popconfirm
              key="enable"
              title="确认启用该推广地区？"
              onConfirm={async () => {
                await enableRegion(row.id);
                message.success('已启用');
                actionRef.current?.reload();
              }}
            >
              <a style={{ color: '#52c41a' }}>启用</a>
            </Popconfirm>,
          );
          actions.push(
            <Popconfirm
              key="delete"
              title="确认删除该推广地区？删除后可到回收站恢复。"
              onConfirm={async () => {
                await deleteRegion(row.id);
                message.success('已移至回收站');
                actionRef.current?.reload();
              }}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>,
          );
        }
        return actions;
      },
    },
  ];

  const recycleColumns: ProColumns<any>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '编码', dataIndex: 'code' },
    { title: '删除时间', dataIndex: 'deletedAt', valueType: 'dateTime', search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => [
        <Popconfirm
          key="restore"
          title="确认恢复该推广地区？"
          onConfirm={async () => {
            await restoreRegion(row.id);
            message.success('已恢复');
            recycleRef.current?.reload();
            actionRef.current?.reload();
          }}
        >
          <a style={{ color: '#52c41a' }}>恢复</a>
        </Popconfirm>,
        <Popconfirm
          key="permanent"
          title="确认永久删除？此操作不可恢复！"
          onConfirm={async () => {
            await permanentDeleteRegion(row.id);
            message.success('已永久删除');
            recycleRef.current?.reload();
          }}
        >
          <a style={{ color: '#ff4d4f' }}>永久删除</a>
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
          const result = await getRegions({ page: params.current, pageSize: params.pageSize, keyword: params.name });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolBarRender={() => [
          <Button key="recycle" onClick={() => setRecycleOpen(true)}>回收站</Button>,
          <Button key="add" type="primary" onClick={() => setEditing({})}>新建推广地区</Button>,
        ]}
      />
      <ModalForm
        title={editing?.id ? '编辑推广地区' : '新建推广地区'}
        open={editing !== undefined}
        initialValues={editing}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditing(undefined) }}
        onFinish={async (values) => {
          const payload = { ...values, status: values.status ? 1 : 0 } as any;
          if (editing?.id) {
            await updateRegion(editing.id, payload);
          } else {
            await createRegion(payload);
          }
          setEditing(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} />
        <ProFormText name="code" label="编码" rules={[{ required: true }]} tooltip="导入Excel时匹配用，如 BR / VN / TH" />
        <ProFormSwitch name="status" label="启用" />
        <ProFormText name="remark" label="备注" />
      </ModalForm>

      {/* 回收站 */}
      <Modal
        title="推广地区回收站"
        open={recycleOpen}
        onCancel={() => setRecycleOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ProTable<any>
          rowKey="id"
          actionRef={recycleRef}
          columns={recycleColumns}
          request={async (params) => {
            const result = await getRecycleRegions({ page: params.current, pageSize: params.pageSize });
            return { data: result.list || [], success: true, total: result.total || 0 };
          }}
          search={false}
          options={false}
        />
      </Modal>
    </PageContainer>
  );
};

export default RegionsPage;
