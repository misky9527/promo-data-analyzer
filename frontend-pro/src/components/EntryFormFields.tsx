import {
  ProFormDatePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormSelect,
} from '@ant-design/pro-components';
import { METRICS } from '@/utils/metrics';

type Option = { label: string; value: number };

interface EntryFormFieldsProps {
  productOptions: Option[];
  channelOptions: Option[];
  regionOptions: Option[];
  productDisabled?: boolean;
  channelDisabled?: boolean;
  regionDisabled?: boolean;
}

const quarterCol = { xs: 24, sm: 12, md: 6 };
const thirdCol = { xs: 24, sm: 12, md: 8 };

const EntryFormFields = ({
  productOptions,
  channelOptions,
  regionOptions,
  productDisabled = false,
  channelDisabled = false,
  regionDisabled = false,
}: EntryFormFieldsProps) => {
  return (
    <>
      <ProFormGroup rowProps={{ gutter: 16 }}>
        <ProFormDatePicker name="date" label="日期" rules={[{ required: true }]} colProps={quarterCol} />
        <ProFormSelect
          name="productId"
          label="产品"
          options={productOptions}
          rules={[{ required: true }]}
          colProps={quarterCol}
          disabled={productDisabled}
          fieldProps={{ showSearch: true }}
        />
        <ProFormSelect
          name="channelId"
          label="渠道"
          options={channelOptions}
          rules={[{ required: true }]}
          colProps={quarterCol}
          disabled={channelDisabled}
          fieldProps={{ showSearch: true }}
        />
        <ProFormSelect
          name="regionId"
          label="推广地区"
          options={regionOptions}
          rules={[{ required: true }]}
          colProps={quarterCol}
          disabled={regionDisabled}
          fieldProps={{ showSearch: true }}
        />
      </ProFormGroup>

      <ProFormGroup rowProps={{ gutter: 16 }}>
        <ProFormDigit name="spend" label="花费(元)" tooltip={METRICS.spend.description} min={0} fieldProps={{ precision: 2 }} colProps={quarterCol} />
        <ProFormDigit name="impressions" label="曝光" tooltip={METRICS.impressions.description} min={0} colProps={quarterCol} />
        <ProFormDigit name="clicks" label="点击" tooltip={METRICS.clicks.description} min={0} colProps={quarterCol} />
        <ProFormDigit name="downloads" label="下载" tooltip={METRICS.downloads.description} min={0} colProps={quarterCol} />
      </ProFormGroup>

      <ProFormGroup rowProps={{ gutter: 16 }}>
        <ProFormDigit name="revenue" label="充值金额(元)" tooltip={METRICS.revenue.description} min={0} fieldProps={{ precision: 2 }} colProps={thirdCol} />
        <ProFormDigit name="chargeCount" label="充值次数" tooltip="用户充值行为总次数" min={0} colProps={thirdCol} />
        <ProFormDigit name="payingUsers" label="充值人数" tooltip="当日充值用户数（去重）" min={0} colProps={thirdCol} />
        <ProFormDigit name="registrations" label="注册人数" tooltip={METRICS.registrations.description} min={0} colProps={thirdCol} />
      </ProFormGroup>


    </>
  );
};

export default EntryFormFields;
