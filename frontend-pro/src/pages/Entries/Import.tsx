import { InboxOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import { App, Card, Radio, Select, Space, Typography, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { downloadTemplate, getProducts, importExcel } from '@/services/api';

const ImportPage = () => {
  const [mode, setMode] = useState('append');
  const [searchParams] = useSearchParams();
  const [productId, setProductId] = useState<number | undefined>(Number(searchParams.get('productId')) || undefined);
  const [productOptions, setProductOptions] = useState<{ label: string; value: number }[]>([]);
  const { message } = App.useApp();

  useEffect(() => {
    getProducts({ pageSize: 999 }).then((result) => {
      setProductOptions((result.list || []).map((item: any) => ({ label: item.appName || item.appId, value: item.id })));
    });
  }, []);

  return (
    <PageContainer header={{ title: false }}>
      <Card title="Excel 导入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">选择产品</Typography.Text>
            <Select
              allowClear
              showSearch
              placeholder="选择要导入的产品（可选）"
              value={productId}
              onChange={setProductId}
              options={productOptions}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio.Button value="append">追加导入</Radio.Button>
            <Radio.Button value="replace">覆盖导入</Radio.Button>
          </Radio.Group>
          <Upload.Dragger
            accept=".xls,.xlsx"
            maxCount={1}
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                await importExcel(file as File, mode, productId || undefined);
                message.success('导入成功');
                onSuccess?.({}, new XMLHttpRequest());
              } catch (error) {
                onError?.(error as Error);
              }
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此处上传</p>
          </Upload.Dragger>
          <Typography.Link
            onClick={async () => {
              const blob = await downloadTemplate();
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'promo-template.xlsx';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            下载导入模板
          </Typography.Link>
        </Space>
      </Card>
    </PageContainer>
  );
};

export default ImportPage;
