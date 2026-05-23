import {
  ModalForm,
  PageContainer,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  createModelConfig,
  deleteModelConfig,
  fetchProviderModels,
  getModelConfigs,
  updateModelConfig,
} from '@/services/api';

const providerOptions = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
];

const mapModelsToOptions = (models: Array<{ id: string; description?: string }>) =>
  models.map((item) => ({
    label: item.description ? `${item.id} — ${item.description}` : item.id,
    value: item.id,
  }));

const ModelConfigPage = () => {
  const actionRef = useRef<ActionType>();
  const [editing, setEditing] = useState<any>();
  const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const columns: ProColumns<any>[] = [
    { title: '名称', dataIndex: 'name' },
    {
      title: 'Provider',
      dataIndex: 'provider',
      valueType: 'select',
      valueEnum: {
        deepseek: { text: 'DeepSeek' },
        openai: { text: 'OpenAI' },
      },
    },
    { title: '版本', dataIndex: 'modelVersion', search: false },
    {
      title: '默认',
      dataIndex: 'isDefault',
      search: false,
      render: (_, row) => (row.isDefault ? <Tag color="gold">默认</Tag> : '-'),
    },
    {
      title: '启用',
      dataIndex: 'isActive',
      search: false,
      render: (_, row) => (row.isActive ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>),
    },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'date', fieldProps: { format: 'YYYY/MM/DD' }, search: false },
    {
      title: '操作',
      valueType: 'option',
      render: (_, row) => [
        <a
          key="edit"
          onClick={() => {
            setModelOptions(row?.modelVersion ? [{ label: row.modelVersion, value: row.modelVersion }] : []);
            setEditing(row);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该模型配置？"
          onConfirm={async () => {
            await deleteModelConfig(row.id);
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
        request={async (params) => {
          const result = await getModelConfigs({
            page: params.current,
            pageSize: params.pageSize,
            provider: params.provider,
          });
          return { data: result.list || [], success: true, total: result.total || 0 };
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            onClick={() => {
              setModelOptions([]);
              setEditing({ isActive: true, isDefault: false });
            }}
          >
            新建模型
          </Button>,
        ]}
      />
      <ModalForm
        title={editing?.id ? '编辑模型配置' : '新建模型配置'}
        open={editing !== undefined}
        initialValues={editing}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setEditing(undefined);
            setModelOptions([]);
          },
        }}
        onFinish={async (values) => {
          if (editing?.id) {
            await updateModelConfig(editing.id, values as any);
          } else {
            await createModelConfig(values as any);
          }
          setEditing(undefined);
          setModelOptions([]);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="显示名称" rules={[{ required: true }]} />
        <ProFormSelect name="provider" label="Provider" options={providerOptions} rules={[{ required: true }]} />
        <ProFormText.Password name="apiKey" label="API Key" rules={[{ required: true }]} />
        <ProFormText name="baseUrl" label="API 地址" />
        <ProFormDependency name={["provider", "apiKey", "baseUrl"]}>
          {({ provider, apiKey, baseUrl }, form) => (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Button
                loading={fetchingModels}
                onClick={async () => {
                  if (!apiKey) {
                    message.warning('请先填写 API Key');
                    return;
                  }
                  if (!provider) {
                    message.warning('请先选择 Provider');
                    return;
                  }
                  setFetchingModels(true);
                  try {
                    const result = await fetchProviderModels(provider, apiKey, baseUrl);
                    const options = mapModelsToOptions(result.models || []);
                    setModelOptions(options);
                    if (!options.length) {
                      message.warning('未获取到可用模型');
                      return;
                    }
                    const currentValue = form.getFieldValue('modelVersion');
                    if (!currentValue || !options.some((item) => item.value === currentValue)) {
                      form.setFieldValue('modelVersion', options[0].value);
                    }
                    message.success('模型列表获取成功');
                  } catch {
                    message.error('连接失败，请检查 API Key 和 Provider 是否正确');
                  } finally {
                    setFetchingModels(false);
                  }
                }}
              >
                获取模型列表
              </Button>
              <ProFormSelect
                name="modelVersion"
                label="模型版本"
                options={modelOptions}
                rules={[{ required: true }]}
                fieldProps={{
                  showSearch: true,
                  placeholder: modelOptions.length ? '请选择模型版本' : '请先获取模型列表',
                }}
              />
            </Space>
          )}
        </ProFormDependency>
        <ProFormSwitch name="isDefault" label="设为默认" />
        <ProFormSwitch name="isActive" label="启用" />
      </ModalForm>
    </PageContainer>
  );
};

export default ModelConfigPage;
