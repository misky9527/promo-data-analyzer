import { AppstoreOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Avatar, Button, Divider, Image, Modal, Popconfirm, Row, Col, Space, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import EntryFormFields from '@/components/EntryFormFields';
import {
  createEntry,
  createProduct,
  deleteProduct,
  getChannels,
  getProduct,
  getProducts,
  getRegions,
  getSites,
  lookupAppleApp,
  updateProduct,
} from '@/services/api';

const countryOptions = [
  { label: '🇨🇳 中国', value: 'CN' },
  { label: '🇻🇳 越南', value: 'VN' },
  { label: '🇧🇷 巴西', value: 'BR' },
  { label: '🇹🇭 泰国', value: 'TH' },
  { label: '🇮🇩 印尼', value: 'ID' },
  { label: '🇹🇷 土耳其', value: 'TR' },
];

const ProductsPage = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const entryFormRef = useRef<ProFormInstance>();
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [editingId, setEditingId] = useState<number>();
  const [entryProductId, setEntryProductId] = useState<number>();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({ defaultCountry: 'CN', platform: 'iOS' });
  const [productOptions, setProductOptions] = useState<{ label: string; value: number }[]>([]);
  const [channelOptions, setChannelOptions] = useState<{ label: string; value: number }[]>([]);
  const [regionOptions, setRegionOptions] = useState<{ label: string; value: number }[]>([]);
  const [siteOptions, setSiteOptions] = useState<{ label: string; value: number }[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const { message } = App.useApp();

  useEffect(() => {
    void Promise.all([getProducts({ pageSize: 999 }), getChannels({ pageSize: 999 }), getRegions({ pageSize: 999 }), getSites({ pageSize: 999 })]).then(([products, channels, regions, sites]) => {
      setProductOptions((products.list || []).map((item: any) => ({ label: item.appName || item.appId, value: item.id })));
      setChannelOptions((channels.list || []).map((item: any) => ({ label: item.name, value: item.id })));
      setRegionOptions((regions.list || []).map((item: any) => ({ label: item.name, value: item.id })));
      setSiteOptions((sites.list || []).map((item: any) => ({ label: item.name, value: item.id })));
    });
  }, [open]);

  const columns: ProColumns<any>[] = [
    {
      title: '图标',
      dataIndex: 'storeIcon',
      search: false,
      render: (_, row) => <Avatar src={row.storeIcon} shape="square">{row.appName?.[0]}</Avatar>,
      width: 72,
    },
    { title: 'App ID', dataIndex: 'appId' },
    {
      title: '名称',
      dataIndex: 'appName',
      render: (text, row) => (
        <a
          onClick={async () => {
            try {
              const info = await lookupAppleApp(row.appId, row.defaultCountry || 'CN');
              setDetailData({ record: row, lookupResult: info });
              setDetailModalOpen(true);
            } catch {
              message.error('查询商店详情失败');
            }
          }}
        >
          {text}
        </a>
      ),
    },
    { title: '平台', dataIndex: 'platform' },
    { title: 'Bundle ID', dataIndex: 'bundleId', ellipsis: true },
    {
      title: '渠道数',
      dataIndex: 'channelCount',
      search: false,
      render: (_, row) => <Tag color="blue">{row.channelCount || row.channels?.length || 0}</Tag>,
    },
    {
      title: '推广地区数',
      dataIndex: 'regionCount',
      search: false,
      render: (_, row) => <Tag color="gold">{row.regionCount || row.regions?.length || 0}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Default' },
      },
    },
    {
      title: '推广开始',
      dataIndex: 'startDate',
      search: false,
      render: (_, row) => row.startDate || '-',
    },
    {
      title: '推广结束',
      dataIndex: 'endDate',
      search: false,
      render: (_, row) => row.endDate || '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'date', fieldProps: { format: 'YYYY/MM/DD' }, search: false },
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      render: (_, row) => [
        <a key="edit" onClick={async () => {
          const detail = await getProduct(row.id);
          setInitialValues({
            ...detail,
            channelIds: (detail.channels || []).map((item: any) => item.id),
            regionIds: (detail.regions || []).map((item: any) => item.id),
          });
          setEditingId(row.id);
          setOpen(true);
        }}>编辑</a>,
        <a key="entry" onClick={() => {
          setEntryProductId(row.id);
          setEntryOpen(true);
        }}>添加数据</a>,
        <a key="import" onClick={() => history.push(`/core/entries/import?productId=${row.id}`)}>导入数据</a>,
        <Popconfirm
          key="delete"
          title="确认删除该产品？"
          onConfirm={async () => {
            await deleteProduct(row.id);
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
    <PageContainer header={{ title: false }}>
      <ProTable<any>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 100 }}
        request={async (params) => {
          const result = await getProducts({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.appId || params.appName,
            status: params.status,
          });
          return {
            data: result.list || [],
            success: true,
            total: result.total || 0,
          };
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(undefined);
              setInitialValues({ defaultCountry: 'CN', platform: 'iOS' });
              setOpen(true);
            }}
          >
            新建产品
          </Button>,
        ]}
      />
      <ModalForm
        formRef={formRef}
        formKey="product-form"
        title={editingId ? '编辑产品' : '新建产品'}
        open={open}
        modalProps={{ destroyOnClose: true, onCancel: () => setOpen(false) }}
        initialValues={initialValues}
        onOpenChange={setOpen}
        onFinish={async (values) => {
          const payload = { ...values } as any;
          if (editingId) {
            await updateProduct(editingId, payload);
            message.success('保存成功');
          } else {
            await createProduct(payload);
            message.success('创建成功');
          }
          actionRef.current?.reload();
          return true;
        }}
        submitter={{ searchConfig: { submitText: editingId ? '保存' : '创建' } }}
      >
        {!editingId && (
          <ProForm.Group>
            <ProFormText name="appId" label="App Store ID" rules={[{ required: true }]} colProps={{ span: 8 }} />
            <ProFormSelect name="defaultCountry" label="地区" colProps={{ span: 8 }} options={countryOptions} />
            <div style={{ paddingTop: 30 }}>
              <Button
                onClick={async () => {
                  const formValues = formRef.current?.getFieldsValue();
                  const appId = searchParams.get('appId') || formValues?.appId;
                  const country = formValues?.defaultCountry || 'CN';
                  if (!appId) {
                    message.warning('请先输入 App ID');
                    return;
                  }
                  const info = await lookupAppleApp(appId, country);
                  formRef.current?.setFieldsValue({
                    appId,
                    appName: info.trackName || formValues?.appName,
                    bundleId: info.bundleId || formValues?.bundleId,
                    platform: 'iOS',
                  });
                  message.success('查询成功');
                }}
              >
                查询
              </Button>
            </div>
          </ProForm.Group>
        )}
        <ProForm.Group>
          <ProFormText name="appName" label="应用名称" rules={[{ required: true }]} colProps={{ span: 8 }} />
          <ProFormText name="bundleId" label="Bundle ID" colProps={{ span: 8 }} />
          <ProFormSelect name="platform" label="平台" options={[{ label: 'iOS', value: 'iOS' }, { label: 'Android', value: 'Android' }]} colProps={{ span: 8 }} />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormSelect name="regionIds" label="关联地区" fieldProps={{ mode: 'multiple' }} options={regionOptions} colProps={{ span: 12 }} />
          <ProFormSelect name="channelIds" label="关联渠道" fieldProps={{ mode: 'multiple' }} options={channelOptions} colProps={{ span: 12 }} />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormDatePicker name="startDate" label="推广开始" colProps={{ span: 12 }} />
          <ProFormDatePicker name="endDate" label="推广结束" colProps={{ span: 12 }} />
        </ProForm.Group>
        <ProFormSelect name="siteId" label="所属站点" options={siteOptions} colProps={{ span: 12 }} />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>

      <ModalForm
        formRef={entryFormRef}
        title="添加数据"
        width={720}
        open={entryOpen}
        initialValues={{ productId: entryProductId }}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setEntryOpen(false);
            setEntryProductId(undefined);
          },
        }}
        onOpenChange={(visible) => {
          setEntryOpen(visible);
          if (!visible) {
            setEntryProductId(undefined);
          }
        }}
        onFinish={async (values) => {
          const payload = { ...values, appId: values.productId } as any;
          delete payload.productId;
          await createEntry(payload);
          message.success('录入成功');
          setEntryOpen(false);
          setEntryProductId(undefined);
          actionRef.current?.reload();
          return true;
        }}
      >
        <EntryFormFields
          productOptions={productOptions}
          channelOptions={channelOptions}
          regionOptions={regionOptions}
          productDisabled={true}
        />
      </ModalForm>

      <Modal
        title={
          <Space>
            {detailData?.lookupResult?.artworkUrl100 ? (
              <img
                src={detailData.lookupResult.artworkUrl100}
                alt=""
                style={{ width: 24, height: 24, borderRadius: 4 }}
              />
            ) : null}
            <span>{detailData?.record?.appName || '商店详情'}</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={null}
        width={640}
      >
        {detailData && (
          <div>
            <Row gutter={[16, 12]}>
              <Col span={6} style={{ textAlign: 'center' }}>
                {detailData.lookupResult?.artworkUrl100 ? (
                  <Image
                    src={detailData.lookupResult.artworkUrl100.replace('100x100bb', '256x256bb')}
                    alt={detailData.record.appName}
                    style={{ borderRadius: 12, height: 120 }}
                    preview={{ mask: '查看大图' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                      color: '#d9d9d9',
                    }}
                  >
                    <AppstoreOutlined />
                  </div>
                )}
              </Col>
              <Col span={18}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  {detailData.lookupResult?.trackName || detailData.record.appName}
                </div>
                <table style={{ fontSize: 13, lineHeight: '2' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#888', paddingRight: 16, whiteSpace: 'nowrap' }}>Bundle ID</td>
                      <td>{detailData.lookupResult?.bundleId || detailData.record.bundleId}</td>
                    </tr>
                    {detailData.lookupResult?.version ? (
                      <tr>
                        <td style={{ color: '#888', paddingRight: 16 }}>版本</td>
                        <td>{detailData.lookupResult.version}</td>
                      </tr>
                    ) : null}
                    {detailData.lookupResult?.primaryGenreName ? (
                      <tr>
                        <td style={{ color: '#888', paddingRight: 16 }}>类型</td>
                        <td>{detailData.lookupResult.primaryGenreName}</td>
                      </tr>
                    ) : null}
                    {detailData.lookupResult?.languageCodesISO2A?.length ? (
                      <tr>
                        <td style={{ color: '#888', paddingRight: 16 }}>支持语言</td>
                        <td>{detailData.lookupResult.languageCodesISO2A.join(', ')}</td>
                      </tr>
                    ) : null}
                    {detailData.lookupResult?.sellerName ? (
                      <tr>
                        <td style={{ color: '#888', paddingRight: 16 }}>开发者</td>
                        <td>{detailData.lookupResult.sellerName}</td>
                      </tr>
                    ) : null}
                    {detailData.lookupResult?.releaseDate ? (
                      <tr>
                        <td style={{ color: '#888', paddingRight: 16 }}>发布日期</td>
                        <td>{detailData.lookupResult.releaseDate}</td>
                      </tr>
                    ) : null}
                    {detailData.lookupResult?.trackViewUrl ? (
                      <tr>
                        <td style={{ color: '#888', paddingRight: 16 }}>商店链接</td>
                        <td>
                          <a href={detailData.lookupResult.trackViewUrl} target="_blank" rel="noreferrer">
                            打开 App Store
                          </a>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </Col>
            </Row>

            {detailData.lookupResult?.screenshotUrls &&
            detailData.lookupResult.screenshotUrls.length > 0 ? (
              <div style={{ marginTop: 20 }}>
                <Divider
                  orientation="left"
                  plain
                  style={{ fontSize: 13, marginTop: 0, marginBottom: 12 }}
                >
                  商店截图
                </Divider>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    overflowX: 'auto',
                    paddingBottom: 4,
                  }}
                >
                  {detailData.lookupResult.screenshotUrls.map((url: string, idx: number) => (
                    <Image
                      key={idx}
                      src={url}
                      alt={`screenshot-${idx}`}
                      style={{
                        height: 180,
                        borderRadius: 8,
                        border: '1px solid #f0f0f0',
                      }}
                      preview={{ mask: '查看' }}
                    />
                  ))}
                </div>
              </div>
            ) : detailData.lookupResult?.resultCount !== undefined ? (
              <div style={{ marginTop: 16, color: '#999', textAlign: 'center', fontSize: 13 }}>
                该应用无商店截图信息
              </div>
            ) : null}

            {detailData.lookupResult && detailData.lookupResult.resultCount === 0 ? (
              <div style={{ marginTop: 16, color: '#ff4d4f', textAlign: 'center' }}>
                该应用在当前区域未上架或已下架
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default ProductsPage;
