import {
  ModalForm,
  PageContainer,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { createRegion, deleteRegion, getRegions, updateRegion } from '@/services/api';

const RegionsPage = () => {
  const actionRef = useRef<ActionType>();
  const [editing, setEditing] = useState<any>();

  const columns: ProColumns<any>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '编码', dataIndex: 'code' },
    { title: '状态', dataIndex: 'status', valueType: 'switch', search: false },
    { title: '备注', dataIndex: 'remark', search: false },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'date', search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => [
        <a key="edit" onClick={() => setEditing(row)}>编辑</a>,
        <Popconfirm
          key="delete"
          title="确认删除该推广地区？"
          onConfirm={async () => {
            await deleteRegion(row.id);
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
        request={async (params) => {
          const result = await getRegions({ page: params.current, pageSize: params.pageSize, keyword: params.name });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolBarRender={() => [<Button key="add" type="primary" onClick={() => setEditing({})}>新建推广地区</Button>]}
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
    </PageContainer>
  );
};

export default RegionsPage;
