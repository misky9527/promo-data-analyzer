import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Modal, Space, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { fetchLiveSiteList, createLiveSite, deleteLiveSite } from '@/services/api';

const LiveSitePage = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [formValue, setFormValue] = useState({ code: '', name: '' });
  const [submitting, setSubmitting] = useState(false);
  const { message: msg } = App.useApp();

  const columns: ProColumns<API.LiveSiteItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '站点 Code', dataIndex: 'code', width: 150, ellipsis: true },
    { title: '站点名称', dataIndex: 'name', width: 200, ellipsis: true },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, row) => [
        <Popconfirm
          key="delete"
          title="确认删除？"
          onConfirm={async () => {
            await deleteLiveSite(row.id);
            msg.success('已删除');
            actionRef.current?.reload();
          }}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.LiveSiteItem>
        actionRef={actionRef}
        headerTitle="直播站点"
        rowKey="id"
        search={false}
        toolbar={{
          actions: [
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setFormValue({ code: '', name: '' });
                setModalOpen(true);
              }}
            >
              新增站点
            </Button>,
          ],
        }}
        request={async () => {
          const res = await fetchLiveSiteList();
          return { data: res, total: res.length, success: true };
        }}
        columns={columns}
        pagination={false}
      />

      <Modal
        title="新增站点"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          if (!formValue.code.trim() || !formValue.name.trim()) {
            msg.error('Code 和名称不能为空');
            return;
          }
          setSubmitting(true);
          try {
            await createLiveSite({ code: formValue.code.trim(), name: formValue.name.trim() });
            msg.success('添加成功');
            setModalOpen(false);
            actionRef.current?.reload();
          } catch (err: any) {
            msg.error(err?.message || '添加失败');
          } finally {
            setSubmitting(false);
          }
        }}
        confirmLoading={submitting}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>站点 Code</label>
            <input
              value={formValue.code}
              onChange={(e) => setFormValue((v) => ({ ...v, code: e.target.value }))}
              placeholder="如 jsty"
              style={{ width: '100%', padding: '6px 12px', marginTop: 4 }}
            />
          </div>
          <div>
            <label>站点名称</label>
            <input
              value={formValue.name}
              onChange={(e) => setFormValue((v) => ({ ...v, name: e.target.value }))}
              placeholder="如 金色体育"
              style={{ width: '100%', padding: '6px 12px', marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default LiveSitePage;
