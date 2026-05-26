import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history } from '@umijs/max';
import { App } from 'antd';
import { createStyles } from 'antd-style';
import { login } from '@/services/api';

const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    background: '#f0f2f5',
  },
  loginCard: {
    width: 400,
    margin: 'auto',
    padding: '24px 0',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
    fontSize: 24,
    fontWeight: 600,
    color: token.colorText,
  },
  subtitle: {
    color: token.colorTextSecondary,
    fontSize: 14,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 32,
  },
}));

const LoginPage = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();

  return (
    <div className={styles.container}>
      <Helmet>
        <title>登录 - 推广数据分析系统</title>
      </Helmet>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img alt="logo" src="/logo.svg" style={{ width: 36, height: 36 }} />
          </div>
          <h1 className={styles.title}>推广数据分析系统</h1>
          <div className={styles.subtitle}>数据洞察 / 报表分析 / AI 总结</div>
        </div>
        <LoginForm
          onFinish={async (values) => {
            try {
              const result = await login(values as { username: string; password: string });
              localStorage.setItem('promo_token', result.token);
              localStorage.setItem('promo_user', JSON.stringify(result.user));
              message.success('登录成功');
              history.push('/dashboard');
              return true;
            } catch {
              return false;
            }
          }}
        >
          <ProFormText
            name="username"
            fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
            placeholder="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
            placeholder="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
        </LoginForm>
      </div>
    </div>
  );
};

export default LoginPage;
