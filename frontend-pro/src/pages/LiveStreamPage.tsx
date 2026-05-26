import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Upload, Progress, Modal, Table, Tabs, Spin, Input } from 'antd';
import { UploadOutlined, InboxOutlined, SearchOutlined, CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import {
  getLiveStreamList,
  getDailySummary,
  getEventSummary,
  getHostSummary,
  getEventHostSummary,
  deleteLiveStreamRecord,
  importLiveStreamData,
  batchDeleteLiveStreamRecords,
  fetchLiveSiteList,
} from '@/services/api';

/** 秒数转为可读时长字符串 "X小时X分X秒" */
function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds === 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}小时`);
  if (m > 0) parts.push(`${m}分`);
  if (s > 0 || parts.length === 0) parts.push(`${s}秒`);
  return parts.join('');
}

interface ImportResultItem {
  fileName: string;
  success: number;
  failed: number;
  error?: string;
}

const LiveStreamPage = () => {
  const actionRef = useRef<ActionType>();
  const detailFormRef = useRef<ProFormInstance>();
  const summaryRef = useRef<ActionType>();
  const [activeTab, setActiveTab] = useState('detail');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<ImportResultItem[]>([]);
  const [siteOptions, setSiteOptions] = useState<{ label: string; value: string }[]>([]);
  const { message: msg } = App.useApp();

  /** 点击每日汇总「查看明细」时，切换到直播数据并预设筛选 */
  const jumpToDetail = (siteCode: string, liveDate: any) => {
    setActiveTab('detail');
    // JSON序列化后 Date 变成 "2026-05-23T16:00:00.000Z"，需按本地时间解析
    let dateStr: string;
    if (liveDate?.$d instanceof Date) {
      dateStr = dayjs(liveDate).format('YYYY-MM-DD');
    } else if (liveDate instanceof Date) {
      dateStr = `${liveDate.getFullYear()}-${String(liveDate.getMonth() + 1).padStart(2, '0')}-${String(liveDate.getDate()).padStart(2, '0')}`;
    } else if (typeof liveDate === 'string') {
      // JSON 序列化后的 ISO 字符串，用 dayjs 按本地时区解析
      dateStr = dayjs(liveDate).format('YYYY-MM-DD');
    } else {
      dateStr = dayjs(liveDate).format('YYYY-MM-DD');
    }
    setTimeout(() => {
      detailFormRef.current?.setFieldsValue({ siteCode, liveDate: dateStr });
      detailFormRef.current?.submit();
    }, 200);
  };

  // 加载站点列表（用于搜索下拉）
  useEffect(() => {
    fetchLiveSiteList()
      .then((list: any) => {
        setSiteOptions(
          (list || []).map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.code })),
        );
      })
      .catch(() => {});
  }, []);

  const columns: ProColumns<API.LiveStreamRecord>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    {
      title: '站点',
      dataIndex: 'siteCode',
      width: 120,
      ellipsis: true,
      render: (_, r) => (r as any).siteName || r.siteCode,
      valueType: 'select',
      fieldProps: {
        options: siteOptions,
        allowClear: true,
        placeholder: '全部站点',
      },
    },
    {
      title: '日期',
      dataIndex: 'liveDate',
      width: 110,
      valueType: 'date',
    },
    { title: '直播间ID', dataIndex: 'roomId', width: 110, search: false },
    {
      title: '赛事时间',
      dataIndex: 'eventTime',
      width: 80,
      search: false,
      render: (_, row) => (row as any).eventTime || '-',
    },
    {
      title: '联赛',
      dataIndex: 'league',
      width: 80,
      fieldProps: { placeholder: '模糊搜索联赛' },
      render: (_, row) => (row as any).league || '-',
    },
    {
      title: '赛事',
      dataIndex: 'eventName',
      width: 160,
      ellipsis: true,
      fieldProps: { placeholder: '模糊搜索赛事' },
      render: (_, row) => (row as any).eventName || (row as any).liveInfo || '-',
    },
    {
      title: '类型',
      dataIndex: 'category',
      width: 100,
      fieldProps: { placeholder: '模糊搜索类型' },
    },
    {
      title: '主播',
      dataIndex: 'host',
      width: 100,
      fieldProps: { allowClear: true, placeholder: '全部' },
    },
    {
      title: '开播时间',
      dataIndex: 'startTime',
      width: 170,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '直播时长',
      dataIndex: 'duration',
      width: 110,
      search: false,
      render: (_, row) => formatDuration(row.duration),
    },
    {
      title: '评论数',
      dataIndex: 'commentCount',
      width: 90,
      sorter: true,
      search: false,
      render: (_, row) => (row.commentCount ?? 0).toLocaleString(),
    },
    {
      title: '次均停留',
      dataIndex: 'avgStayVisit',
      width: 100,
      sorter: true,
      search: false,
      render: (_, row) => formatDuration(row.avgStayVisit),
    },
    {
      title: '人均停留',
      dataIndex: 'avgStayPerson',
      width: 100,
      sorter: true,
      search: false,
      render: (_, row) => formatDuration(row.avgStayPerson),
    },
    {
      title: '峰值在线',
      dataIndex: 'peakOnline',
      width: 90,
      sorter: true,
      search: false,
      render: (_, row) => (row.peakOnline ?? 0).toLocaleString(),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, row) => [
        <Popconfirm
          key="delete"
          title="确认删除？"
          onConfirm={async () => {
            await deleteLiveStreamRecord(row.id);
            msg.success('已删除');
            actionRef.current?.reload();
          }}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  const summaryColumns: ProColumns<API.DailySummaryRecord>[] = [
    {
      title: '站点',
      dataIndex: 'siteCode',
      width: 150,
      ellipsis: true,
      render: (_, r) => r.siteName || r.siteCode,
      valueType: 'select',
      fieldProps: {
        options: siteOptions,
        allowClear: true,
        placeholder: '全部站点',
      },
    },
    {
      title: '日期',
      dataIndex: 'liveDate',
      width: 120,
      valueType: 'date',
    },
    {
      title: '主播数',
      dataIndex: 'hostCount',
      width: 80,
      search: false,
    },
    {
      title: '评论总数',
      dataIndex: 'totalComments',
      width: 100,
      search: false,
      render: (_, r) => r.totalComments.toLocaleString(),
    },
    {
      title: '次均停留总数',
      dataIndex: 'totalStayVisit',
      width: 120,
      search: false,
      render: (_, r) => formatDuration(r.totalStayVisit),
    },
    {
      title: '人均停留总数',
      dataIndex: 'totalStayPerson',
      width: 120,
      search: false,
      render: (_, r) => formatDuration(r.totalStayPerson),
    },
    {
      title: '平均峰值在线',
      dataIndex: 'avgPeakOnline',
      width: 120,
      search: false,
      render: (_, r) => r.avgPeakOnline.toLocaleString(),
    },
    {
      title: '直播场次',
      dataIndex: 'streamCount',
      width: 90,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, r) => [
        <a
          key="detail"
          onClick={() => jumpToDetail(r.siteCode, r.liveDate)}
        >
          <SearchOutlined /> 查看明细
        </a>,
      ],
    },
  ];

  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<string | undefined>(undefined);

  const [eventSortField, setEventSortField] = useState<string | undefined>(undefined);
  const [eventSortOrder, setEventSortOrder] = useState<string | undefined>(undefined);

  // 赛事汇总内联展开
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [expandedDataCache, setExpandedDataCache] = useState<Record<string, API.HostSummaryRecord[]>>({});
  const [expandingRow, setExpandingRow] = useState<string | null>(null);

  const toggleEventDetail = async (rowKey: string, eventName: string, liveDate: any) => {
    // 已展开 → 收起
    if (expandedRowKeys.includes(rowKey)) {
      setExpandedRowKeys((prev) => prev.filter((k) => k !== rowKey));
      return;
    }
    // 已缓存 → 直接展开
    if (expandedDataCache[rowKey]) {
      setExpandedRowKeys((prev) => [...prev, rowKey]);
      return;
    }
    // 请求数据后展开
    const dateStr = dayjs(liveDate).format('YYYY-MM-DD');
    setExpandingRow(rowKey);
    try {
      const data = await getHostSummary({ eventName, liveDate: dateStr });
      const list = Array.isArray(data) ? data : data.list || [];
      setExpandedDataCache((prev) => ({ ...prev, [rowKey]: list }));
      setExpandedRowKeys((prev) => [...prev, rowKey]);
    } catch {
      msg.error('加载明细失败');
    } finally {
      setExpandingRow(null);
    }
  };

  const hostDetailColumns = [
    { title: '主播', dataIndex: 'host', key: 'host', width: 120 },
    { title: '站点', dataIndex: 'siteName', key: 'siteName', width: 120 },
    {
      title: '直播时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 110,
      render: (_: any, r: any) => formatDuration(r.duration),
    },
    {
      title: '评论数',
      dataIndex: 'commentCount',
      key: 'commentCount',
      width: 90,
      render: (_: any, r: any) => (r.commentCount ?? 0).toLocaleString(),
    },
    {
      title: '次均停留',
      dataIndex: 'avgStayVisit',
      key: 'avgStayVisit',
      width: 100,
      render: (_: any, r: any) => formatDuration(r.avgStayVisit),
    },
    {
      title: '人均停留',
      dataIndex: 'avgStayPerson',
      key: 'avgStayPerson',
      width: 100,
      render: (_: any, r: any) => formatDuration(r.avgStayPerson),
    },
    {
      title: '峰值在线',
      dataIndex: 'avgPeakOnline',
      key: 'avgPeakOnline',
      width: 90,
      render: (_: any, r: any) => (r.avgPeakOnline ?? 0).toLocaleString(),
    },
  ];

  // L1：按主播聚合（去重站点，汇总指标）
  const aggregateByHost = (data: API.HostSummaryRecord[]) => {
    const map = new Map<string, {
      siteCodes: Set<string>;
      totalDuration: number;
      totalComments: number;
      totalStayVisit: number;
      totalStayPerson: number;
      totalPeakOnline: number;
      detail: API.HostSummaryRecord[];
    }>();
    data.forEach((r) => {
      if (!map.has(r.host)) {
        map.set(r.host, {
          siteCodes: new Set(),
          totalDuration: 0,
          totalComments: 0,
          totalStayVisit: 0,
          totalStayPerson: 0,
          totalPeakOnline: 0,
          detail: [],
        });
      }
      const g = map.get(r.host)!;
      g.siteCodes.add(r.siteCode);
      g.totalDuration += r.duration || 0;
      g.totalComments += r.commentCount || 0;
      g.totalStayVisit += r.avgStayVisit || 0;
      g.totalStayPerson += r.avgStayPerson || 0;
      g.totalPeakOnline += r.avgPeakOnline || 0;
      g.detail.push(r);
    });
    return Array.from(map.entries()).map(([host, g]) => ({
      host,
      siteCount: g.siteCodes.size,
      avgDuration: Math.round(g.totalDuration / g.siteCodes.size),
      totalComments: g.totalComments,
      avgStayVisit: Math.round(g.totalStayVisit / g.detail.length),
      avgStayPerson: Math.round(g.totalStayPerson / g.detail.length),
      avgPeakOnline: Math.round(g.totalPeakOnline / g.detail.length),
      detail: g.detail,
    }));
  };

  const hostAggColumns = [
    { title: '主播', dataIndex: 'host', width: 120 },
    { title: '站点数', dataIndex: 'siteCount', width: 70 },
    {
      title: '平均直播时长',
      dataIndex: 'avgDuration',
      width: 120,
      render: (_: any, r: any) => formatDuration(r.avgDuration),
    },
    {
      title: '评论总数',
      dataIndex: 'totalComments',
      width: 100,
      render: (_: any, r: any) => r.totalComments.toLocaleString(),
    },
    {
      title: '平均次均停留',
      dataIndex: 'avgStayVisit',
      width: 130,
      render: (_: any, r: any) => formatDuration(r.avgStayVisit),
    },
    {
      title: '平均人均停留',
      dataIndex: 'avgStayPerson',
      width: 130,
      render: (_: any, r: any) => formatDuration(r.avgStayPerson),
    },
    {
      title: '平均峰值在线',
      dataIndex: 'avgPeakOnline',
      width: 130,
      render: (_: any, r: any) => r.avgPeakOnline.toLocaleString(),
    },
  ];

  const [dedupFiles, setDedupFiles] = useState<any[]>([]);
  const [dedupModalOpen, setDedupModalOpen] = useState(false);
  const [dedupCount, setDedupCount] = useState(0);

  const doImport = async (files: File[], mode?: string) => {
    const res: any = await importLiveStreamData(files, mode);
    return res;
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      msg.warning('请先选择 CSV 文件');
      return;
    }
    setImporting(true);
    setImportProgress({ current: 0, total: fileList.length });

    try {
      const rawFiles = fileList
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj as File);

      const res: any = await doImport(rawFiles);

      // 检测重复数据，弹窗让用户选择
      const files = res.files || [];
      const hasDupError = files.some((f: any) => f.duplicates > 0 && !f.error);
      const hasRealDup = files.some((f: any) => f.duplicates > 0 && f.error);
      if (hasRealDup || hasDupError) {
        setDedupFiles(rawFiles);
        setDedupCount(files.reduce((s: number, f: any) => s + (f.duplicates || 0), 0));
        setDedupModalOpen(true);
        setImporting(false);
        return;
      }

      setImportResults(res.files || []);
      setResultModalOpen(true);

      const totalOk = res.totalSuccess || 0;
      const totalFail = res.totalFailed || 0;
      if (totalFail === 0) {
        msg.success(`全部导入成功: ${totalOk} 条`);
      } else {
        msg.warning(`导入完成: 成功 ${totalOk} 条, 失败 ${totalFail} 条`);
      }

      setFileList([]);
      setImportProgress({ current: fileList.length, total: fileList.length });
      actionRef.current?.reload();
    } catch (err: any) {
      msg.error(err?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleDedupChoice = async (mode: 'overwrite' | 'ignore') => {
    setDedupModalOpen(false);
    setImporting(true);
    try {
      const res: any = await doImport(dedupFiles, mode);
      setImportResults(res.files || []);
      setResultModalOpen(true);
      msg.success(`导入完成 (${mode === 'overwrite' ? '已覆盖' : '已忽略'}重复数据)`);
      setFileList([]);
      actionRef.current?.reload();
    } catch (err: any) {
      msg.error(err?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const eventSummaryColumns: ProColumns<API.EventSummaryRecord>[] = [
    {
      title: '赛事时间',
      dataIndex: 'eventTime',
      width: 80,
      search: false,
    },
    {
      title: '赛事',
      dataIndex: 'eventName',
      width: 180,
      ellipsis: true,
      fieldProps: { placeholder: '模糊搜索赛事' },
    },
    {
      title: '日期',
      dataIndex: 'liveDate',
      width: 110,
      valueType: 'date',
      fieldProps: { placeholder: '选择日期' },
    },
    {
      title: '直播间数',
      dataIndex: 'roomCount',
      width: 90,
      search: false,
    },
    {
      title: '联赛',
      dataIndex: 'league',
      width: 80,
      search: false,
    },
    {
      title: '类型',
      dataIndex: 'category',
      width: 80,
      search: false,
    },
    {
      title: '主播数',
      dataIndex: 'hostCount',
      width: 80,
      search: false,
    },
    {
      title: '评论总数',
      dataIndex: 'totalComments',
      width: 100,
      sorter: true,
      search: false,
      render: (_, r) => r.totalComments.toLocaleString(),
    },
    {
      title: '总人均停留',
      dataIndex: 'totalStayPerson',
      width: 110,
      sorter: true,
      search: false,
      render: (_, r) => formatDuration(r.totalStayPerson),
    },
    {
      title: '平均峰值在线',
      dataIndex: 'avgPeakOnline',
      width: 120,
      sorter: true,
      search: false,
      render: (_, r) => r.avgPeakOnline.toLocaleString(),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, r) => {
        const key = `${r.eventTime}-${r.eventName}-${r.liveDate}-${r.league}-${r.category}`;
        return [
          <a
            key="hostDetail"
            onClick={() => toggleEventDetail(key, r.eventName, r.liveDate)}
          >
            <SearchOutlined /> {expandedRowKeys.includes(key) ? '收起明细' : '查看明细'}
          </a>,
        ];
      },
    },
  ];

  const resultColumns = [
    { title: '文件名', dataIndex: 'fileName', key: 'fileName' },
    { title: '成功', dataIndex: 'success', key: 'success', width: 80 },
    { title: '失败', dataIndex: 'failed', key: 'failed', width: 80 },
    {
      title: '错误信息',
      dataIndex: 'error',
      key: 'error',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ];

  return (
    <PageContainer>
      <div style={{ marginBottom: 24 }}>
        <Upload.Dragger
          accept=".csv,.xlsx"
          multiple
          fileList={fileList}
          beforeUpload={(file) => {
            const name = file.name.toLowerCase();
            const isCSV = name.endsWith('.csv') || name.endsWith('.xlsx');
            if (!isCSV) {
              msg.error(`${file.name} 不是 CSV/XLSX 文件`);
              return Upload.LIST_IGNORE;
            }
            setFileList((prev) => [...prev, { uid: file.name + Date.now(), name: file.name, originFileObj: file } as any]);
            return false;
          }}
          onRemove={(file) => {
            setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
          }}
          showUploadList={{ showPreviewIcon: false, showRemoveIcon: true }}
          disabled={importing}
          style={{ padding: '16px 0' }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 CSV 文件到此区域上传</p>
          <p className="ant-upload-hint">支持批量上传，文件名格式: {"{code}-{date}.csv 或 .xlsx"}</p>
        </Upload.Dragger>

        {fileList.length > 0 && (
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={importing}
              onClick={handleImport}
            >
              开始导入 ({fileList.length} 个文件)
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => setFileList([])}
              disabled={importing}
            >
              清空
            </Button>
          </div>
        )}

        {importing && importProgress.total > 0 && (
          <div style={{ marginTop: 12 }}>
            <Progress
              percent={Math.round((importProgress.current / importProgress.total) * 100)}
              format={() => `${importProgress.current}/${importProgress.total}`}
            />
          </div>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'detail',
            label: '直播数据',
            children: (
              <div>
                <ProTable<API.LiveStreamRecord>
                  actionRef={actionRef}
                  onChange={(_, __, sorter: any) => {
                    if (sorter && !Array.isArray(sorter)) {
                      const s = sorter as { field?: string; columnKey?: string; order?: string };
                      const field = s.field || s.columnKey;
                      if (field && s.order) {
                        setSortField(field);
                        setSortOrder(s.order);
                      } else {
                        setSortField(undefined);
                        setSortOrder(undefined);
                      }
                    } else {
                      setSortField(undefined);
                      setSortOrder(undefined);
                    }
                  }}
                  formRef={detailFormRef}
                  headerTitle="直播数据"
                  rowKey="id"
                  search={{ labelWidth: 80 }}
                  toolbar={{
                    actions: [
                      selectedRowKeys.length > 0 && (
                        <Popconfirm
                          key="batchDelete"
                          title="确认批量删除？"
                          onConfirm={async () => {
                            await batchDeleteLiveStreamRecords(selectedRowKeys as number[]);
                            msg.success('已批量删除');
                            setSelectedRowKeys([]);
                            actionRef.current?.reload();
                          }}
                        >
                          <Button danger>批量删除 ({selectedRowKeys.length})</Button>
                        </Popconfirm>
                      ),
                    ].filter(Boolean) as React.ReactNode[],
                  }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                  }}
                  tableAlertRender={false}
                  request={async (params: any) => {
                    const { current, pageSize, siteCode, category, host, league, eventName, liveDate } = params;
                    const res = await getLiveStreamList({ page: current, pageSize, siteCode, category, host, league, liveInfo: eventName, liveDate, sortField, sortOrder });
                    return { data: res.list, total: res.total, success: true };
                  }}
                  columns={columns}
                  pagination={{ defaultPageSize: 20 }}
                />

                <Modal
                  title="导入结果"
                  open={resultModalOpen}
                  onCancel={() => setResultModalOpen(false)}
                  footer={[
                    <Button key="close" type="primary" onClick={() => setResultModalOpen(false)}>
                      关闭
                    </Button>,
                  ]}
                  width={700}
                >
                  <Table
                    dataSource={importResults}
                    columns={resultColumns}
                    rowKey="fileName"
                    pagination={false}
                    size="small"
                    summary={() => {
                      const totalSuccess = importResults.reduce((s, r) => s + r.success, 0);
                      const totalFailed = importResults.reduce((s, r) => s + r.failed, 0);
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <strong>合计</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <strong style={{ color: '#52c41a' }}>{totalSuccess}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>
                            <strong style={{ color: '#ff4d4f' }}>{totalFailed}</strong>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Modal>

                <Modal
                  title="发现已有数据"
                  open={dedupModalOpen}
                  onCancel={() => setDedupModalOpen(false)}
                  footer={[
                    <Button key="cancel" onClick={() => setDedupModalOpen(false)}>
                      取消
                    </Button>,
                    <Button key="overwrite" type="primary" danger onClick={() => handleDedupChoice('overwrite')}>
                      覆盖该日期数据
                    </Button>,
                  ]}
                >
                  <p>当前日期已有 {dedupCount} 条导入数据。</p>
                  <p><strong>覆盖：</strong>删除该站点+该日期的全部旧数据，写入新数据。</p>
                  <p><strong>取消：</strong>跳过该文件，不导入。</p>
                </Modal>
              </div>
            ),
          },
          {
            key: 'summary',
            label: '每日汇总',
            children: (
              <ProTable<API.DailySummaryRecord>
                actionRef={summaryRef}
                headerTitle="每日汇总"
                rowKey={(r) => `${r.siteCode}-${r.liveDate}`}
                search={{ labelWidth: 80 }}
                request={async (params: any) => {
                  const { current, pageSize, siteCode, liveDate } = params;
                  const res = await getDailySummary({ page: current, pageSize, siteCode, liveDate });
                  return { data: res.list, total: res.total, success: true };
                }}
                columns={summaryColumns}
                pagination={{ defaultPageSize: 20 }}
              />
            ),
          },
          {
            key: 'event-host-summary',
            label: '赛事主播汇总',
            children: <EventHostSummaryTab />,
          },
          {
            key: 'event-summary',
            label: '赛事汇总',
            children: (
              <div>
                <ProTable<API.EventSummaryRecord>
                  headerTitle="赛事汇总"
                  rowKey={(r) => `${r.eventTime}-${r.eventName}-${r.liveDate}-${r.league}-${r.category}`}
                  search={{ labelWidth: 80 }}
                  onChange={(_, __, sorter: any) => {
                    if (sorter && !Array.isArray(sorter)) {
                      const s = sorter as { field?: string; columnKey?: string; order?: string };
                      const field = s.field || s.columnKey;
                      if (field && s.order) {
                        setEventSortField(field);
                        setEventSortOrder(s.order);
                      } else {
                        setEventSortField(undefined);
                        setEventSortOrder(undefined);
                      }
                    } else {
                      setEventSortField(undefined);
                      setEventSortOrder(undefined);
                    }
                  }}
                  request={async (params: any) => {
                    const { current, pageSize, liveDate, eventName } = params;
                    const res = await getEventSummary({
                      page: current,
                      pageSize,
                      liveDate,
                      eventName,
                      sortField: eventSortField,
                      sortOrder: eventSortOrder,
                    });
                    return { data: res.list, total: res.total, success: true };
                  }}
                  columns={eventSummaryColumns}
                  expandable={{
                    expandedRowKeys,
                    onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
                    expandedRowRender: (record) => {
                      const key = `${record.eventTime}-${record.eventName}-${record.liveDate}-${record.league}-${record.category}`;
                      const detailData = expandedDataCache[key] || [];
                      if (expandingRow === key) {
                        return (
                          <div style={{ textAlign: 'center', padding: 24 }}>
                            <Spin />
                          </div>
                        );
                      }
                      if (detailData.length === 0) return null;
                      const l1Data = aggregateByHost(detailData);
                      const l1Summary = l1Data.reduce(
                        (acc: any, r: any) => {
                          acc.siteCount += r.siteCount;
                          acc.totalComments += r.totalComments;
                          acc.totalDuration += r.siteCount * r.avgDuration;
                          acc.avgStayVisit += r.avgStayVisit;
                          acc.avgStayPerson += r.avgStayPerson;
                          acc.avgPeakOnline += r.avgPeakOnline;
                          acc.count++;
                          return acc;
                        },
                        { siteCount: 0, totalComments: 0, totalDuration: 0, avgStayVisit: 0, avgStayPerson: 0, avgPeakOnline: 0, count: 0 },
                      );
                      return (
                        <Table
                          dataSource={l1Data}
                          columns={hostAggColumns}
                          rowKey="host"
                          pagination={false}
                          size="small"
                          style={{ margin: '8px 0 8px 48px' }}
                          expandable={{
                            expandedRowRender: (l1: any) => (
                              <Table<API.HostSummaryRecord>
                                dataSource={l1.detail}
                                columns={hostDetailColumns}
                                rowKey={(r: any) => `${r.host}-${r.siteCode}`}
                                pagination={false}
                                size="small"
                                style={{ margin: '4px 0 4px 24px' }}
                              />
                            ),
                          }}
                          summary={() => {
                            if (l1Data.length === 0) return null;
                            const c = l1Summary.count || 1;
                            return (
                              <Table.Summary.Row>
                                <Table.Summary.Cell index={0}><strong>合计</strong></Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>{l1Summary.siteCount}</Table.Summary.Cell>
                                <Table.Summary.Cell index={2}>{formatDuration(Math.round(l1Summary.totalDuration / l1Summary.siteCount))}</Table.Summary.Cell>
                                <Table.Summary.Cell index={3}>{l1Summary.totalComments.toLocaleString()}</Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>{formatDuration(Math.round(l1Summary.avgStayVisit / c))}</Table.Summary.Cell>
                                <Table.Summary.Cell index={5}>{formatDuration(Math.round(l1Summary.avgStayPerson / c))}</Table.Summary.Cell>
                                <Table.Summary.Cell index={6}>{Math.round(l1Summary.avgPeakOnline / c).toLocaleString()}</Table.Summary.Cell>
                              </Table.Summary.Row>
                            );
                          }}
                        />
                      );
                    },
                  }}
                  pagination={{ defaultPageSize: 20 }}
                />

              </div>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

// ═══════════════════════════════════════════════════════════
// 赛事主播汇总 Tab（自包含组件）
// ═══════════════════════════════════════════════════════════

const EventHostSummaryTab = () => {
  const { message: msg } = App.useApp();
  const [rawData, setRawData] = useState<API.EventHostSummaryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadData = useCallback(async (eventName?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (eventName) params.eventName = eventName;
      const res = await getEventHostSummary(params);
      setRawData(Array.isArray(res) ? res : res.list || []);
    } catch {
      msg.error('加载赛事主播汇总失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    loadData(value || undefined);
  }, [loadData]);

  // 扁平数据源：group → hosts → 下一组
  const dataSource = useMemo(() => {
    const rows: any[] = [];
    const map = new Map<string, API.EventHostSummaryRecord[]>();
    rawData.forEach((r) => {
      const key = `${r.eventName}|${r.liveDate}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    map.forEach((hosts, key) => {
      const [eventName, liveDate] = key.split('|');
      rows.push({ _key: `g-${key}`, _type: 'group', eventName, liveDate });
      hosts.forEach((h) => rows.push({ _key: `h-${key}-${h.host}`, _type: 'host', ...h }));
    });
    return rows;
  }, [rawData]);

  const columns: any[] = [
    {
      title: '主播', dataIndex: 'host', width: 260,
      render: (_: any, row: any) => {
        if (row._type === 'group') {
          return {
            children: <strong>{row.eventName} · {dayjs(row.liveDate).format('YYYY-MM-DD')}</strong>,
            props: { colSpan: 7, style: { textAlign: 'center' as const } },
          };
        }
        return <span style={{ paddingLeft: 16 }}>{row.host}</span>;
      },
    },
    {
      title: '站点数', dataIndex: 'siteCount', width: 80,
      render: (_: any, row: any) => {
        if (row._type === 'group') return { children: null, props: { colSpan: 0 } };
        return row.siteCount;
      },
    },
    {
      title: '均时长', dataIndex: 'avgDuration', width: 120,
      render: (_: any, row: any) => {
        if (row._type === 'group') return { children: null, props: { colSpan: 0 } };
        return formatDuration(row.avgDuration);
      },
    },
    {
      title: '评论', dataIndex: 'totalComments', width: 100,
      render: (_: any, row: any) => {
        if (row._type === 'group') return { children: null, props: { colSpan: 0 } };
        return (row.totalComments ?? 0).toLocaleString();
      },
    },
    {
      title: '均次均', dataIndex: 'avgStayVisit', width: 120,
      render: (_: any, row: any) => {
        if (row._type === 'group') return { children: null, props: { colSpan: 0 } };
        return formatDuration(row.avgStayVisit);
      },
    },
    {
      title: '均人均', dataIndex: 'avgStayPerson', width: 120,
      render: (_: any, row: any) => {
        if (row._type === 'group') return { children: null, props: { colSpan: 0 } };
        return formatDuration(row.avgStayPerson);
      },
    },
    {
      title: '均峰值', dataIndex: 'avgPeakOnline', width: 90,
      render: (_: any, row: any) => {
        if (row._type === 'group') return { children: null, props: { colSpan: 0 } };
        return (row.avgPeakOnline ?? 0).toLocaleString();
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>赛事主播汇总</h4>
        <Input.Search
          placeholder="搜索赛事名"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
      </div>
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="_key"
        loading={loading}
        pagination={false}
        size="middle"
      />
    </div>
  );
};

export default LiveStreamPage;
