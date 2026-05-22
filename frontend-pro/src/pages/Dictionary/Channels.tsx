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
import { createChannel, deleteChannel, getChannels, updateChannel } from '@/services/api';

const ChannelsPage = () => {
  const actionRef = useRef<ActionType>();
  const [editing, setEditing] = useState<any>();

  const columns: ProColumns<any>[] = [
    { title: '编码', dataIndex: 'code' },
    { title: '名称', dataIndex: 'name' },
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
          title="确认删除该渠道？"
          onConfirm={async () => {
            await deleteChannel(row.id);
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
          const result = await getChannels({ page: params.current, pageSize: params.pageSize, keyword: params.name });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolBarRender={() => [<Button key="add" type="primary" onClick={() => setEditing({})}>新建渠道</Button>]}
      />
      <ModalForm
        title={editing?.id ? '编辑渠道' : '新建渠道'}
        open={editing !== undefined}
        initialValues={editing}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditing(undefined) }}
        onFinish={async (values) => {
          const payload = { ...values, status: values.status ? 1 : 0 } as any;
          if (editing?.id) {
            await updateChannel(editing.id, payload);
          } else {
            await createChannel(payload);
          }
          setEditing(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="code" label="编码" rules={[{ required: true }]} tooltip="导入Excel时用的匹配码，如 FB / GOOGLE / TIKTOK" />
        <ProFormText name="name" label="名称" rules={[{ required: true }]} />
        <ProFormSwitch name="status" label="启用" />
        <ProFormText name="remark" label="备注" />
      </ModalForm>
    </PageContainer>
  );
};

export default ChannelsPage;
