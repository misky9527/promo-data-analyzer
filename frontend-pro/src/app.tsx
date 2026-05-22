import { LogoutOutlined, MoonOutlined, SunOutlined, UserOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { Button, Dropdown, Modal } from 'antd';
import defaultSettings from '../config/defaultSettings';

const loginPath = '/login';

function getStoredUser(): API.CurrentUser | undefined {
  try {
    const raw = localStorage.getItem('promo_user');
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
}> {
  const savedTheme = localStorage.getItem('promo_theme');
  return {
    currentUser: getStoredUser(),
    settings: {
      ...defaultSettings,
      ...(savedTheme ? { navTheme: savedTheme as 'light' | 'realDark' } : {}),
    },
  };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => ({
  actionsRender: () => {
    const isDark = initialState?.settings?.navTheme === 'realDark';
    return [
      <Button
        key="theme"
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={() => {
          const nextTheme = isDark ? 'light' : 'realDark';
          localStorage.setItem('promo_theme', nextTheme);
          setInitialState((prev) => ({
            ...prev,
            settings: {
              ...prev?.settings,
              navTheme: nextTheme,
            },
          }));
        }}
      />,
    ];
  },
  avatarProps: {
    icon: <UserOutlined />,
    title: initialState?.currentUser?.username || '分析员',
    render: (_, avatarChildren) => (
      <Dropdown
        menu={{
          items: [
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '退出登录',
              onClick: () => {
                Modal.confirm({
                  title: '确认退出登录？',
                  okText: '退出',
                  cancelText: '取消',
                  okButtonProps: { danger: true },
                  onOk: () => {
                    localStorage.removeItem('promo_token');
                    localStorage.removeItem('promo_user');
                    history.push(loginPath);
                  },
                });
              },
            },
          ],
        }}
      >
        {avatarChildren}
      </Dropdown>
    ),
  },
  onPageChange: () => {
    const token = localStorage.getItem('promo_token');
    if (!token && history.location.pathname !== loginPath) {
      history.push(loginPath);
    }
  },
  menuHeaderRender: undefined,
  childrenRender: (children) => (
    <>
      {children}
      <SettingDrawer
        disableUrlParams
        enableDarkTheme
        settings={initialState?.settings}
        onSettingChange={(settings) => {
          setInitialState((prev) => ({ ...prev, settings }));
        }}
      />
    </>
  ),
  ...initialState?.settings,
});

export const request: RequestConfig = {};
