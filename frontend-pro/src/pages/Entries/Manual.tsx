import { PageContainer, ProForm } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Card } from 'antd';
import { useEffect, useState } from 'react';
import EntryFormFields from '@/components/EntryFormFields';
import { createEntry, getChannels, getProducts, getRegions } from '@/services/api';

const ManualEntryPage = () => {
  const [searchParams] = useSearchParams();
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [channelOptions, setChannelOptions] = useState<any[]>([]);
  const [regionOptions, setRegionOptions] = useState<any[]>([]);

  useEffect(() => {
    void Promise.all([getProducts({ pageSize: 999 }), getChannels({ pageSize: 999 }), getRegions({ pageSize: 999 })]).then(
      ([products, channels, regions]) => {
        setProductOptions((products.list || []).map((item: any) => ({ label: item.appName || item.appId, value: item.id })));
        setChannelOptions((channels.list || []).map((item: any) => ({ label: item.name, value: item.id })));
        setRegionOptions((regions.list || []).map((item: any) => ({ label: item.name, value: item.id })));
      },
    );
  }, []);

  return (
    <PageContainer header={{ title: false }}>
      <Card>
        <ProForm
          grid
          initialValues={{ productId: Number(searchParams.get('productId')) || undefined }}
          onFinish={async (values) => {
            const payload = { ...values, appId: values.productId } as any;
            delete payload.productId;
            await createEntry(payload);
            history.push('/core/entries/list');
            return true;
          }}
          submitter={{ searchConfig: { submitText: '提交录入' } }}
        >
          <EntryFormFields
            productOptions={productOptions}
            channelOptions={channelOptions}
            regionOptions={regionOptions}
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default ManualEntryPage;
