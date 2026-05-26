import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Tag, Button, Popconfirm, message } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  fetchAdminUserList,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
} from '@/services/api';

const roleOptions = [
  { label: '超级管理员', value: 'super_admin' },
  { label: '管理员', value: 'admin' },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'blue',
  admin: 'green',
};

const UserManagementPage = () => {
  const actionRef = useRef<ActionType>();
  const [editing, setEditing] = useState<any>();

  const columns: ProColumns<API.AdminUserRecord>[] = [
    { title: '用户名', dataIndex: 'username' },
    {
      title: '角色',
      dataIndex: 'roleType',
      valueType: 'select',
      valueEnum: {
        super_admin: { text: '超级管理员' },
        admin: { text: '管理员' },
      },
      render: (_, row) => (
        <Tag color={ROLE_COLORS[row.roleType] || 'default'}>
          {ROLE_LABELS[row.roleType] || row.roleType}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '启用' },
        0: { text: '禁用' },
      },
      render: (_, row) => (
        <Tag color={row.status === 1 ? 'green' : 'red'}>
          {row.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => {
        const isSuperAdmin = row.roleType === 'super_admin';
        return [
          <a key="edit" onClick={() => setEditing(row)}>
            编辑
          </a>,
          <Popconfirm
            key="reset-pwd"
            title={`确认重置 ${row.username} 的密码为 admin123？`}
            onConfirm={async () => {
              await resetAdminUserPassword(row.id);
              message.success('密码已重置');
            }}
          >
            <a>重置密码</a>
          </Popconfirm>,
          !isSuperAdmin && (
            <Popconfirm
              key="delete"
              title={`确认删除用户 ${row.username}？`}
              onConfirm={async () => {
                await deleteAdminUser(row.id);
                actionRef.current?.reload();
              }}
            >
              <a style={{ color: 'red' }}>删除</a>
            </Popconfirm>
          ),
        ];
      },
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <ProTable<API.AdminUserRecord>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const result = await fetchAdminUserList({
            page: params.current,
            pageSize: params.pageSize,
            username: params.username,
            roleType: params.roleType,
          });
          return {
            data: result.list || [],
            success: true,
            total: result.total || 0,
          };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => setEditing({})}>
            新建用户
          </Button>,
        ]}
      />
      <ModalForm
        title={editing?.id ? '编辑用户' : '新建用户'}
        open={editing !== undefined}
        initialValues={editing}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditing(undefined) }}
        onFinish={async (values) => {
          if (editing?.id) {
            await updateAdminUser(editing.id, {
              roleType: values.roleType,
              status: values.status ? 1 : 0,
            });
          } else {
            await createAdminUser({
              username: values.username,
              password: values.password,
              roleType: values.roleType,
              status: values.status ? 1 : 0,
            });
          }
          setEditing(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
          disabled={!!editing?.id}
          placeholder="请输入用户名"
        />
        {!editing?.id && (
          <ProFormText.Password
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
            placeholder="请输入密码"
          />
        )}
        <ProFormSelect
          name="roleType"
          label="角色"
          options={roleOptions}
          rules={[{ required: true, message: '请选择角色' }]}
        />
        <ProFormSwitch name="status" label="启用" />
      </ModalForm>
    </PageContainer>
  );
};

export default UserManagementPage;
