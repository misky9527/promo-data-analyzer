declare namespace API {
  interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
  }

  interface CurrentUser {
    id?: number;
    username?: string;
    token?: string;
    name?: string;
  }

  interface PageResult<T> {
    list: T[];
    total: number;
    page?: number;
    pageSize?: number;
  }

  interface LiveStreamRecord {
    id: number;
    siteCode: string;
    siteName?: string;
    liveDate: string;
    roomId: string;
    liveInfo?: string;
    category?: string;
    host?: string;
    startTime: string;
    duration?: number;
    commentCount: number;
    avgStayVisit?: number;
    avgStayPerson?: number;
    peakOnline?: number;
  }

  interface DailySummaryRecord {
    siteCode: string;
    siteName: string;
    liveDate: string;
    hostCount: number;
    totalComments: number;
    totalStayVisit: number;
    totalStayPerson: number;
    avgPeakOnline: number;
    streamCount: number;
  }

  interface EventSummaryRecord {
    eventTime: string;
    eventName: string;
    liveDate: string;
    roomCount: number;
    league: string;
    category: string;
    hostCount: number;
    totalComments: number;
    totalStayPerson: number;
    avgPeakOnline: number;
  }

  interface HostSummaryRecord {
    host: string;
    siteCode: string;
    siteName: string;
    duration: number;
    commentCount: number;
    avgStayVisit: number;
    avgStayPerson: number;
    avgPeakOnline: number;
  }

  interface LiveSiteItem {
    id: number;
    code: string;
    name: string;
  }
}
