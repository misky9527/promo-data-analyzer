import { EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { createSite, deleteSite, getProducts, getSite, getSites, updateSite } from '@/services/api';

const SitesPage = () => {
  const actionRef = useRef<ActionType>();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number>();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [productOptions, setProductOptions] = useState<{ label: string; value: number }[]>([]);
  const { message } = App.useApp();

  useEffect(() => {
    getProducts({ pageSize: 999 }).then((res: any) => {
      setProductOptions((res.list || []).map((p: any) => ({
        label: `${p.appName || p.appId} (ID:${p.id})`,
        value: p.id,
      })));
    });
  }, []);

  const columns: ProColumns<any>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 80 },
    { title: '站点名称', dataIndex: 'name' },
    {
      title: '产品数',
      dataIndex: 'productCount',
      search: false,
      render: (_, row) => <Tag color="blue">{row.productCount || 0}</Tag>,
    },
    { title: '备注', dataIndex: 'remark', search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'date', fieldProps: { format: 'YYYY/MM/DD' }, search: false },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, row) => [
        <a key="edit" onClick={async () => {
          const detail = await getSite(row.id);
          setInitialValues({
            ...detail,
            productIds: detail.products?.map((p: any) => p.id) || [],
          });
          setEditingId(row.id);
          setOpen(true);
        }}>编辑</a>,
        <a key="daily" onClick={() => history.push(`/core/sites/${row.id}/daily`)}>日数据</a>,
        <Popconfirm
          key="delete"
          title="确认删除该站点？"
          onConfirm={async () => {
            try {
              await deleteSite(row.id);
              message.success('删除成功');
              actionRef.current?.reload();
            } catch (err: any) {
              message.error(err?.message || '删除失败');
            }
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
        search={{ labelWidth: 100 }}
        request={async (params) => {
          const result = await getSites({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.name,
          });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(undefined);
            setInitialValues({});
            setOpen(true);
          }}>新建站点</Button>,
        ]}
      />
      <ModalForm
        title={editingId ? '编辑站点' : '新建站点'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => setOpen(false) }}
        initialValues={initialValues}
        onOpenChange={setOpen}
        onFinish={async (values) => {
          const payload = { ...values };
          if (editingId) {
            await updateSite(editingId, payload);
            message.success('保存成功');
          } else {
            await createSite(payload);
            message.success('创建成功');
          }
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="站点名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="productIds"
          label="关联产品"
          mode="multiple"
          options={productOptions}
          placeholder="选择关联的产品"
          showSearch
          fieldProps={{ filterOption: (input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }}
        />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>
    </PageContainer>
  );
};

export default SitesPage;
