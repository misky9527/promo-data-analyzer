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
    roleType?: 'super_admin' | 'admin';
    permissions?: string[] | null;
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
    leagueId?: string;
    liveInfo?: string;
    eventTime?: string;
    league?: string;
    eventName?: string;
    eventId?: string;
    category?: string;
    host?: string;
    isPaid?: string;
    startTime: string;
    duration?: number;
    commentCount: number;
    totalComments: number;
    platformComments: number;
    externalComments: number;
    hostComments: number;
    avgStayVisit?: number;
    avgStayPerson?: number;
    peakOnline?: number;
    uv: number;
    unlockCount: number;
    unlockAmount: number;
    tipCount: number;
    tipAmount: number;
    couponCount: number;
    planAmount: number;
    packageAmount: number;
  }

  interface DailySummaryRecord {
    siteCode: string;
    siteName: string;
    liveDate: string;
    hostCount: number;
    totalComments: number;
    totalPlatformComments: number;
    totalExternalComments: number;
    totalHostComments: number;
    totalStayVisit: number;
    totalStayPerson: number;
    avgPeakOnline: number;
    totalUv: number;
    totalUnlockCount: number;
    totalUnlockAmount: number;
    totalTipCount: number;
    totalTipAmount: number;
    streamCount: number;
  }

  interface EventSummaryRecord {
    eventId: string;
    eventTime: string;
    eventName: string;
    liveDate: string;
    roomCount: number;
    league: string;
    category: string;
    hostCount: number;
    totalComments: number;
    totalPlatformComments: number;
    totalExternalComments: number;
    totalHostComments: number;
    totalStayVisit: number;
    totalStayPerson: number;
    avgPeakOnline: number;
    totalUv: number;
    totalUnlockCount: number;
    totalUnlockAmount: number;
    totalTipCount: number;
    totalTipAmount: number;
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

  interface EventHostSummaryRecord {
    eventName: string;
    liveDate: string;
    host: string;
    siteCount: number;
    avgDuration: number;
    totalComments: number;
    avgStayVisit: number;
    avgStayPerson: number;
    avgPeakOnline: number;
  }

  interface LiveSiteItem {
    id: number;
    code: string;
    name: string;
  }

  interface ImportRecordItem {
    id: number;
    fileName: string;
    siteCode: string;
    liveDate: string;
    recordCount: number;
    operator: string;
    createdAt: string;
  }

  interface AdminUserRecord {
    id: number;
    username: string;
    roleType: 'super_admin' | 'admin';
    status: number;
    jwtVersion: number;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    permissions: string[] | null;
  }
}
