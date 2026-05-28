import {
  ModalForm,
  PageContainer,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Tag, Button, Popconfirm, message, Modal, Form, Input, Checkbox, Card, Space, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  fetchAdminUserList,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminUserPassword,
  changeAdminUserPassword,
  updateAdminUserSelf,
  setAdminUserPassword,
} from '@/services/api';
import { DEFAULT_ADMIN_PERMISSIONS, PERMISSION_MENUS } from '@/constants/permissions';

const { Text } = Typography;

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'blue',
  admin: 'green',
};

const PERMISSION_SECTIONS = [
  {
    title: PERMISSION_MENUS.dashboard.label,
    options: [{ label: PERMISSION_MENUS.dashboard.label, value: PERMISSION_MENUS.dashboard.key }],
    description: '首页仪表盘',
  },
  {
    title: PERMISSION_MENUS.core.label,
    options: [{ label: PERMISSION_MENUS.core.label, value: PERMISSION_MENUS.core.key }],
    description: (PERMISSION_MENUS.core.children || []).map((item) => item.label).join(' / '),
  },
  {
    title: PERMISSION_MENUS.reports.label,
    options: [{ label: PERMISSION_MENUS.reports.label, value: PERMISSION_MENUS.reports.key }],
    description: (PERMISSION_MENUS.reports.children || []).map((item) => item.label).join(' / '),
  },
  {
    title: PERMISSION_MENUS.ai.label,
    options: [{ label: PERMISSION_MENUS.ai.label, value: PERMISSION_MENUS.ai.key }],
    description: (PERMISSION_MENUS.ai.children || []).map((item) => item.label).join(' / '),
  },
  {
    title: PERMISSION_MENUS.monitor.label,
    options: [{ label: PERMISSION_MENUS.monitor.label, value: PERMISSION_MENUS.monitor.key }],
    description: (PERMISSION_MENUS.monitor.children || []).map((item) => item.label).join(' / '),
  },
  {
    title: PERMISSION_MENUS.dict.label,
    options: PERMISSION_MENUS.dict.children.map((item) => ({ label: item.label, value: item.key })),
    description: '按子菜单独立授权',
  },
];

function getCurrentUser(): API.CurrentUser | undefined {
  try {
    const raw = localStorage.getItem('promo_user');
    return raw ? JSON.parse(raw) : undefined;
  }
  catch {
    return undefined;
  }
}

function buildFormValues(record?: Partial<API.AdminUserRecord>) {
  if (!record) {
    return {
      roleType: 'admin',
      status: true,
      permissions: [...DEFAULT_ADMIN_PERMISSIONS],
    };
  }

  return {
    ...record,
    status: record.status === 1,
    permissions: record.permissions || [],
  };
}

const PermissionSelector = ({ value = [], onChange }: { value?: string[]; onChange?: (value: string[]) => void }) => {
  const normalizedValue = Array.isArray(value) ? value : [];

  const togglePermission = (permission: string, checked: boolean) => {
    const nextValue = checked
      ? Array.from(new Set([...normalizedValue, permission]))
      : normalizedValue.filter((item) => item !== permission);
    onChange?.(nextValue);
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {PERMISSION_SECTIONS.map((section) => (
        <Card key={section.title} size="small" title={section.title}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {section.options.map((option) => (
              <Checkbox
                key={option.value}
                checked={normalizedValue.includes(option.value)}
                onChange={(event) => togglePermission(option.value, event.target.checked)}
              >
                {option.label}
              </Checkbox>
            ))}
            <Text type="secondary">{section.description}</Text>
          </Space>
        </Card>
      ))}
    </Space>
  );
};

const UserManagementPage = () => {
  const actionRef = useRef<ActionType>();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const currentUserRole = currentUser?.roleType;

  const [editing, setEditing] = useState<any>();
  const [editingSelf, setEditingSelf] = useState<any>();
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdForm] = Form.useForm();
  const [changeOtherPwdOpen, setChangeOtherPwdOpen] = useState(false);
  const [changeOtherPwdLoading, setChangeOtherPwdLoading] = useState(false);
  const [changeOtherPwdForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [selectedUser, setSelectedUser] = useState<API.AdminUserRecord | null>(null);

  const roleOptions = useMemo(
    () => currentUserRole === 'admin'
      ? [{ label: '管理员', value: 'admin' }]
      : [
          { label: '超级管理员', value: 'super_admin' },
          { label: '管理员', value: 'admin' },
        ],
    [currentUserRole],
  );

  const openCreateModal = () => {
    const defaultRoleType = currentUserRole === 'admin' ? 'admin' : 'super_admin';
    setEditing({
      roleType: defaultRoleType,
      status: 1,
      permissions: defaultRoleType === 'admin' ? [...DEFAULT_ADMIN_PERMISSIONS] : [],
    });
  };

  const openEditModal = (row: API.AdminUserRecord) => {
    setEditing(buildFormValues(row));
  };

  const openChangeOtherPassword = (row: API.AdminUserRecord) => {
    setSelectedUser(row);
    setChangeOtherPwdOpen(true);
    changeOtherPwdForm.resetFields();
  };

  const handleChangeOtherPassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }
    if (!selectedUser) return;
    setChangeOtherPwdLoading(true);
    try {
      await setAdminUserPassword(selectedUser.id, { newPassword: values.newPassword });
      message.success(`已成功修改 ${selectedUser.username} 的密码`);
      setChangeOtherPwdOpen(false);
      changeOtherPwdForm.resetFields();
    } catch {
      // error handled by request interceptor
    } finally {
      setChangeOtherPwdLoading(false);
    }
  };

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
      title: '权限',
      dataIndex: 'permissions',
      search: false,
      render: (_, row) => {
        if (row.roleType === 'super_admin') {
          return <Tag color="blue">全部权限</Tag>;
        }
        if (!row.permissions?.length) {
          return <Text type="secondary">未设置</Text>;
        }
        return <Text>{`${row.permissions.length} 项权限`}</Text>;
      },
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
        const isSelf = row.id === currentUserId;
        const canManageRow = currentUserRole !== 'admin' || row.roleType !== 'super_admin';

        if (!canManageRow && !isSelf) {
          return [<Text key="readonly" type="secondary">仅查看</Text>];
        }

        return [
          isSelf ? (
            <a key="edit-self" onClick={() => setEditingSelf(buildFormValues(row))}>
              修改信息
            </a>
          ) : (
            <a key="edit" onClick={() => openEditModal(row)}>
              编辑
            </a>
          ),
          canManageRow && (
            <a key="change-pwd" onClick={() => openChangeOtherPassword(row)}>
              修改密码
            </a>
          ),
          canManageRow && (
            <Popconfirm
              key="reset-pwd"
              title={`确认重置 ${row.username} 的密码为 admin123？`}
              onConfirm={async () => {
                await resetAdminUserPassword(row.id);
                message.success('密码已重置');
              }}
            >
              <a>重置密码</a>
            </Popconfirm>
          ),
          canManageRow && !isSuperAdmin && !isSelf && (
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
        ].filter(Boolean);
      },
    },
  ];

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setChangePwdLoading(true);
    try {
      await changeAdminUserPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功，请重新登录');
      setChangePwdOpen(false);
      changePwdForm.resetFields();
      localStorage.removeItem('promo_token');
      localStorage.removeItem('promo_user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch {
      // error handled by request interceptor
    } finally {
      setChangePwdLoading(false);
    }
  };

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
          <Button key="change-pwd" onClick={() => setChangePwdOpen(true)}>
            修改密码
          </Button>,
          <Button key="add" type="primary" onClick={openCreateModal}>
            新建用户
          </Button>,
        ]}
      />

      <ModalForm
        title={editing?.id ? '编辑用户' : '新建用户'}
        open={editing !== undefined}
        form={editForm}
        initialValues={buildFormValues(editing)}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setEditing(undefined);
            editForm.resetFields();
          },
        }}
        onOpenChange={(open) => {
          if (open && editing !== undefined) {
            editForm.setFieldsValue(buildFormValues(editing));
          }
        }}
        onFinish={async (values) => {
          const payload = {
            roleType: values.roleType,
            status: values.status ? 1 : 0,
            permissions: values.roleType === 'admin' ? (values.permissions || []) : undefined,
          };

          if (editing?.id) {
            await updateAdminUser(editing.id, payload);
          } else {
            await createAdminUser({
              username: values.username,
              password: values.password,
              ...payload,
            });
          }
          setEditing(undefined);
          editForm.resetFields();
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
          fieldProps={{
            onChange: (value) => {
              if (value === 'admin') {
                const currentPermissions = editForm.getFieldValue('permissions');
                editForm.setFieldsValue({
                  permissions: currentPermissions?.length ? currentPermissions : [...DEFAULT_ADMIN_PERMISSIONS],
                });
              } else {
                editForm.setFieldsValue({ permissions: [] });
              }
            },
          }}
        />
        <ProFormSwitch name="status" label="启用" initialValue />
        <ProFormDependency name={['roleType']}>
          {({ roleType }) => {
            if (roleType !== 'admin') return null;
            return (
              <Form.Item
                name="permissions"
                label="菜单权限"
                rules={[
                  {
                    validator: async (_, value) => {
                      if (Array.isArray(value) && value.length > 0) {
                        return;
                      }
                      throw new Error('请至少选择一个权限');
                    },
                  },
                ]}
              >
                <PermissionSelector />
              </Form.Item>
            );
          }}
        </ProFormDependency>
      </ModalForm>

      <ModalForm
        title="修改个人信息"
        open={editingSelf !== undefined}
        initialValues={editingSelf}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditingSelf(undefined) }}
        onFinish={async (values) => {
          await updateAdminUserSelf({ username: values.username });
          message.success('信息修改成功');
          try {
            const raw = localStorage.getItem('promo_user');
            if (raw) {
              const user = JSON.parse(raw);
              user.username = values.username;
              localStorage.setItem('promo_user', JSON.stringify(user));
            }
          } catch { /* ignore */ }
          setEditingSelf(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
          placeholder="请输入用户名"
        />
        <ProFormSelect
          name="roleType"
          label="角色"
          options={roleOptions}
          disabled
        />
        <ProFormSwitch name="status" label="启用" disabled />
      </ModalForm>

      <Modal
        title="修改密码"
        open={changePwdOpen}
        onCancel={() => {
          setChangePwdOpen(false);
          changePwdForm.resetFields();
        }}
        confirmLoading={changePwdLoading}
        onOk={() => changePwdForm.submit()}
        destroyOnClose
      >
        <Form
          form={changePwdForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`修改用户密码 - ${selectedUser?.username || ''}`}
        open={changeOtherPwdOpen}
        onCancel={() => {
          setChangeOtherPwdOpen(false);
          changeOtherPwdForm.resetFields();
        }}
        confirmLoading={changeOtherPwdLoading}
        onOk={() => changeOtherPwdForm.submit()}
        destroyOnClose
      >
        <Form
          form={changeOtherPwdForm}
          layout="vertical"
          onFinish={handleChangeOtherPassword}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManagementPage;
