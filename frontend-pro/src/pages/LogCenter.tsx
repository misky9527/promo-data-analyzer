import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { getOperationLogs } from '@/services/api';

const OPERATION_TYPE_OPTIONS = [
  { label: '导入', value: 'import' },
  { label: '删除', value: 'delete' },
  { label: '插入', value: 'insert' },
  { label: '更新', value: 'update' },
  { label: 'SQL', value: 'sql' },
  { label: '还原', value: 'restore' },
  { label: '清空回收站', value: 'clear_recycle' },
];

const typeColorMap: Record<string, string> = {
  import: 'blue',
  delete: 'red',
  insert: 'green',
  update: 'orange',
  sql: 'purple',
  restore: 'cyan',
  clear_recycle: 'volcano',
};

interface OperationLogItem {
  id: number;
  operationType: string;
  description: string;
  operator: string;
  targetTable: string;
  recordCount: number;
  createdAt: string;
}

const LogCenterPage = () => {
  const columns: ProColumns<OperationLogItem>[] = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
      sorter: true,
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 120,
      valueType: 'select',
      fieldProps: { options: OPERATION_TYPE_OPTIONS },
      render: (_, record) => (
        <Tag color={typeColorMap[record.operationType] || 'default'}>
          {OPERATION_TYPE_OPTIONS.find((o) => o.value === record.operationType)?.label ||
            record.operationType}
        </Tag>
      ),
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      search: false,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
      search: false,
    },
    {
      title: '目标表',
      dataIndex: 'targetTable',
      key: 'targetTable',
      width: 140,
      search: false,
    },
    {
      title: '影响行数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 100,
      search: false,
    },
  ];

  const fetchData = async (params: any) => {
    const { current, pageSize, operationType } = params;
    const res = await getOperationLogs({
      page: current,
      pageSize,
      operationType,
    });
    return {
      data: res.list || [],
      total: res.total || 0,
      success: true,
    };
  };

  return (
    <PageContainer header={{ title: '日志中心' }}>
      <ProTable<OperationLogItem>
        columns={columns}
        request={fetchData}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        dateFormatter="string"
      />
    </PageContainer>
  );
};

export default LogCenterPage;
