import {
  ModalForm,
  PageContainer,
  ProFormCheckbox,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Tag, Button, Popconfirm, message, Modal, Form, Input } from 'antd';
import { useRef, useState } from 'react';
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

const PERMISSION_OPTIONS = [
  { label: '仪表盘', value: 'dashboard' },
  { label: '核心数据', value: 'core_data' },
  { label: '分析报表', value: 'reports' },
  { label: 'AI 总结', value: 'ai' },
  { label: '站点管理', value: 'sites' },
  { label: '字典管理', value: 'dict' },
  { label: '直播数据', value: 'live' },
  { label: '系统配置', value: 'system' },
];

function getCurrentUserId(): number | null {
  try {
    const raw = localStorage.getItem('promo_user');
    const user = raw ? JSON.parse(raw) : null;
    return user?.id ?? null;
  }
  catch {
    return null;
  }
}

const UserManagementPage = () => {
  const actionRef = useRef<ActionType>();
  const [editing, setEditing] = useState<any>();
  const [editingSelf, setEditingSelf] = useState<any>();
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdForm] = Form.useForm();
  const [changeOtherPwdOpen, setChangeOtherPwdOpen] = useState(false);
  const [changeOtherPwdLoading, setChangeOtherPwdLoading] = useState(false);
  const [changeOtherPwdForm] = Form.useForm();
  const [selectedUser, setSelectedUser] = useState<API.AdminUserRecord | null>(null);
  const currentUserId = getCurrentUserId();

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

        return [
          isSelf ? (
            <a key="edit-self" onClick={() => setEditingSelf(row)}>
              修改信息
            </a>
          ) : (
            <a key="edit" onClick={() => setEditing(row)}>
              编辑
            </a>
          ),
          <a key="change-pwd" onClick={() => openChangeOtherPassword(row)}>
            修改密码
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
      // 清除登录状态，跳转到登录页
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
          <Button key="add" type="primary" onClick={() => setEditing({})}>
            新建用户
          </Button>,
        ]}
      />

      {/* 普通编辑 / 新建 Modal */}
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
              permissions: values.permissions || [],
            });
          } else {
            await createAdminUser({
              username: values.username,
              password: values.password,
              roleType: values.roleType,
              status: values.status ? 1 : 0,
              permissions: values.permissions || [],
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
        {/* 仅 admin 角色显示权限选择，super_admin 自动拥有全部权限 */}
        <ProFormDependency name={['roleType']}>
          {({ roleType }) => {
            // For new users, only show when roleType is 'admin'
            // For editing, show when original role is 'admin' (roleType might not be set if unchanged)
            const isAdmin = roleType === 'admin' || (!editing?.id && roleType === 'admin') || (editing?.roleType === 'admin' && roleType !== 'super_admin');
            if (!isAdmin) return null;
            return (
              <ProFormCheckbox.Group
                name="permissions"
                label="模块权限"
                layout="horizontal"
                options={PERMISSION_OPTIONS}
              />
            );
          }}
        </ProFormDependency>
      </ModalForm>

      {/* 修改自己的信息 Modal - 只允许改用户名 */}
      <ModalForm
        title="修改个人信息"
        open={editingSelf !== undefined}
        initialValues={editingSelf}
        modalProps={{ destroyOnClose: true, onCancel: () => setEditingSelf(undefined) }}
        onFinish={async (values) => {
          await updateAdminUserSelf({ username: values.username });
          message.success('信息修改成功');
          // 更新 localStorage 中的用户名
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

      {/* 修改自己密码 Modal */}
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

      {/* 修改他人密码 Modal */}
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
