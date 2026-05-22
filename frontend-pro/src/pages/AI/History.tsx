import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Drawer, Popconfirm } from 'antd';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import MDEditor from '@uiw/react-md-editor';
import { deleteSummary, getSummaryDetail, getSummaryHistory } from '@/services/api';

const HistoryPage = () => {
  const [detail, setDetail] = useState<any>();

  const columns: ProColumns<any>[] = [
    { title: '标题', dataIndex: 'title' },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'date', search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row, __, action) => [
        <a
          key="view"
          onClick={async () => {
            const result = await getSummaryDetail(row.id);
            setDetail(result);
          }}
        >
          <EyeOutlined /> 查看
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除这条总结？"
          onConfirm={async () => {
            await deleteSummary(row.id);
            action?.reload();
          }}
        >
          <a><DeleteOutlined /> 删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <ProTable<any>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const result = await getSummaryHistory({ page: params.current, pageSize: params.pageSize });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
      />
      <Drawer width={720} open={!!detail} title={detail?.title || '总结详情'} onClose={() => setDetail(undefined)}>
        <div data-color-mode="light">
          <MDEditor.Markdown source={detail?.content || detail?.markdown || ''} />
        </div>
      </Drawer>
    </PageContainer>
  );
};

export default HistoryPage;
