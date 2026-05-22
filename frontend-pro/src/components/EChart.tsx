import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartProps {
  option: echarts.EChartsOption;
  height?: number;
}

const EChart = ({ option, height = 320 }: EChartProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = echarts.init(ref.current);
    instance.setOption(option);
    const onResize = () => instance.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      instance.dispose();
    };
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height }} />;
};

export default EChart;
