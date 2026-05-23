import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { ModalForm, PageContainer, ProFormDatePicker, ProFormGroup, ProFormText, ProTable } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { App, Button, Card, Popconfirm, Radio, Select, Space, Typography, Upload } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  createSiteDailyData,
  deleteSiteDailyData,
  downloadSiteDailyTemplate,
  getSite,
  getSiteDailyData,
  importSiteDailyExcel,
  updateSiteDailyData,
} from '@/services/api';

const DailyDataPage = () => {
  const { id } = useParams<{ id: string }>();
  const siteId = Number(id);
  const actionRef = useRef<ActionType>();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number>();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [siteName, setSiteName] = useState('');
  const [importMode, setImportMode] = useState('append');
  const { message } = App.useApp();

  useEffect(() => {
    getSite(siteId).then((s) => setSiteName(s.name));
  }, [siteId]);

  const columns: ProColumns<any>[] = [
    { title: '日期', dataIndex: 'date', key: 'date', valueType: 'date', fieldProps: { format: 'YYYY/MM/DD' } },
    { title: '注册人数', dataIndex: 'registrations', search: false },
    { title: '充值人数', dataIndex: 'payingUsers', search: false },
    { title: '首冲人数', dataIndex: 'firstChargeUsers', search: false },
    { title: '娱乐流水', dataIndex: 'entertainmentRevenue', search: false },
    { title: '娱乐人数', dataIndex: 'entertainmentUsers', search: false },
    { title: '充值金币', dataIndex: 'rechargeGold', search: false },
    { title: '兑换金额', dataIndex: 'exchangeAmount', search: false },
    { title: '兑换人数', dataIndex: 'exchangeUsers', search: false },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, row) => [
        <a key="edit" onClick={() => {
          setInitialValues(row);
          setEditingId(row.id);
          setOpen(true);
        }}>编辑</a>,
        <Popconfirm
          key="delete"
          title="确认删除？"
          onConfirm={async () => {
            await deleteSiteDailyData(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer header={{ title: `站点日数据 - ${siteName}` }}>
      <ProTable<any>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 80 }}
        request={async (params) => {
          const result = await getSiteDailyData({
            page: params.current,
            pageSize: params.pageSize,
            siteId,
            startDate: params.date,
            endDate: params.date,
          });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolbar={{
          search: {
            onSearch: (value: string) => {
              actionRef.current?.reload();
            },
          },
        }}
        toolBarRender={() => [
          <Button key="manual" type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingId(undefined);
            setInitialValues({});
            setOpen(true);
          }}>手动录入</Button>,
        ]}
        tableRender={(_, dom) => (
          <>
            <Card title="Excel 批量导入" size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Radio.Group value={importMode} onChange={(e) => setImportMode(e.target.value)}>
                  <Radio.Button value="append">追加导入</Radio.Button>
                  <Radio.Button value="overwrite">覆盖导入</Radio.Button>
                </Radio.Group>
                <Upload.Dragger
                  accept=".xls,.xlsx"
                  maxCount={1}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    try {
                      await importSiteDailyExcel(file as File, importMode, siteId);
                      message.success('导入成功');
                      onSuccess?.({}, new XMLHttpRequest());
                      actionRef.current?.reload();
                    } catch (error) {
                      onError?.(error as Error);
                    }
                  }}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">点击或拖拽 Excel 文件到此处上传</p>
                </Upload.Dragger>
                <Typography.Link onClick={async () => {
                  const blob = await downloadSiteDailyTemplate();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'site-daily-template.xlsx';
                  link.click();
                  URL.revokeObjectURL(url);
                }}>下载导入模板</Typography.Link>
              </Space>
            </Card>
            {dom}
          </>
        )}
      />
      <ModalForm
        title={editingId ? '编辑日数据' : '手动录入'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => setOpen(false) }}
        initialValues={initialValues}
        onOpenChange={setOpen}
        onFinish={async (values) => {
          const payload = { ...values, date: values.date?.format?.('YYYY-MM-DD') || values.date, siteId };
          if (editingId) {
            await updateSiteDailyData(editingId, payload);
            message.success('保存成功');
          } else {
            await createSiteDailyData(payload);
            message.success('录入成功');
          }
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormGroup>
          <ProFormDatePicker name="date" label="日期" colProps={{ span: 8 }} rules={[{ required: true }]} fieldProps={{ style: { width: '100%' } }} />
          <ProFormText name="registrations" label="注册人数" colProps={{ span: 8 }} />
          <ProFormText name="payingUsers" label="充值人数" colProps={{ span: 8 }} />
        </ProFormGroup>
        <ProFormGroup>
          <ProFormText name="firstChargeUsers" label="首冲人数" colProps={{ span: 8 }} />
          <ProFormText name="entertainmentRevenue" label="娱乐流水" colProps={{ span: 8 }} />
          <ProFormText name="entertainmentUsers" label="娱乐人数" colProps={{ span: 8 }} />
        </ProFormGroup>
        <ProFormGroup>
          <ProFormText name="rechargeGold" label="充值金币" colProps={{ span: 8 }} />
          <ProFormText name="exchangeAmount" label="兑换金额" colProps={{ span: 8 }} />
          <ProFormText name="exchangeUsers" label="兑换人数" colProps={{ span: 8 }} />
        </ProFormGroup>
      </ModalForm>
    </PageContainer>
  );
};

export default DailyDataPage;
