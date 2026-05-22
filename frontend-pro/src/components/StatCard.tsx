import { Card, Statistic, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number | string;
  precision?: number;
  suffix?: string;
  tooltip?: string;
}

const StatCard = ({ title, value, precision, suffix, tooltip }: StatCardProps) => (
  <Card>
    <Statistic
      title={
        tooltip ? (
          <span>
            {title}{' '}
            <Tooltip title={tooltip}>
              <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </span>
        ) : (
          title
        )
      }
      value={value}
      precision={precision}
      suffix={suffix}
    />
  </Card>
);

export default StatCard;
