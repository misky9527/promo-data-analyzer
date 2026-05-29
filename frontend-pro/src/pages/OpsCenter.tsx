import { PlayCircleOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Button, Input, message, Space, Typography } from 'antd';
import { useState, useRef } from 'react';
import { executeSql } from '@/services/api';

const { TextArea } = Input;
const { Text } = Typography;

const OpsCenterPage = () => {
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [executed, setExecuted] = useState(false);
  const editorRef = useRef<any>(null);

  const handleExecute = async () => {
    const trimmed = sql.trim();
    if (!trimmed) {
      message.warning('请输入 SQL 语句');
      return;
    }

    setLoading(true);
    setExecuted(false);
    try {
      const res = await executeSql(trimmed);
      const cols = (res.columns || []).map((col: string) => ({
        title: col,
        dataIndex: col,
        key: col,
        ellipsis: true,
        width: 150,
      }));
      setColumns(cols);
      setDataSource(res.rows || []);
      setExecuted(true);
      message.success(`查询成功，返回 ${res.rows?.length ?? 0} 行`);
    } catch (err: any) {
      message.error(err?.message || '执行失败');
      setColumns([]);
      setDataSource([]);
      setExecuted(true);
    } finally {
      setLoading(false);
    }
  };

  // Ctrl/Cmd + Enter 快捷键执行
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <PageContainer header={{ title: '运维中心' }}>
      <ProCard title="SQL 查询" style={{ marginBottom: 16 }}>
        <TextArea
          ref={editorRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'SELECT * FROM ...\n\n仅支持 SELECT / EXPLAIN / SHOW / DESCRIBE / WITH 查询\nCtrl+Enter 执行'}
          rows={8}
          style={{
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace",
            fontSize: 14,
            marginBottom: 12,
          }}
        />
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={loading}
            onClick={handleExecute}
          >
            执行
          </Button>
          <Text type="secondary">提示：Ctrl+Enter 快速执行，超时限制 30 秒</Text>
        </Space>
      </ProCard>

      {executed && (
        <ProTable
          headerTitle={`查询结果（${dataSource.length} 行）`}
          columns={columns}
          dataSource={dataSource}
          rowKey={(_, index) => String(index)}
          search={false}
          options={false}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={dataSource.length > 50 ? { pageSize: 50 } : false}
          bordered
          size="small"
        />
      )}
    </PageContainer>
  );
};

export default OpsCenterPage;
