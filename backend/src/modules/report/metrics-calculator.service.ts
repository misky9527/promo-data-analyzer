import { Injectable } from '@nestjs/common';

/**
 * 指标计算服务 —— 全部除零安全，返回 0
 */
@Injectable()
export class MetricsCalculator {
  ctr(clicks: number, impressions: number): number {
    return impressions > 0 ? (clicks / impressions) * 100 : 0;
  }

  cvr(downloads: number, clicks: number): number {
    return clicks > 0 ? (downloads / clicks) * 100 : 0;
  }

  cpi(spend: number, downloads: number): number {
    return downloads > 0 ? spend / downloads : 0;
  }

  cpm(spend: number, impressions: number): number {
    return impressions > 0 ? (spend / impressions) * 1000 : 0;
  }

  cpc(spend: number, clicks: number): number {
    return clicks > 0 ? spend / clicks : 0;
  }

  roas(revenue: number, spend: number): number {
    return spend > 0 ? (revenue / spend) * 100 : 0;
  }

  registrationRate(registrations: number, downloads: number): number {
    return downloads > 0 ? (registrations / downloads) * 100 : 0;
  }

  payRate(payingUsers: number, downloads: number): number {
    return downloads > 0 ? (payingUsers / downloads) * 100 : 0;
  }

  /** 用户注册成本：消耗 ÷ 注册人数 */
  costPerRegistration(spend: number, registrations: number): number {
    return registrations > 0 ? spend / registrations : 0;
  }

  /** 充值用户成本：消耗 ÷ 充值人数 */
  costPerPayingUser(spend: number, payingUsers: number): number {
    return payingUsers > 0 ? spend / payingUsers : 0;
  }

  ltv(revenue: number, downloads: number): number {
    return downloads > 0 ? revenue / downloads : 0;
  }

  /** 对聚合行一次性计算所有指标 */
  computeAll(row: AggregatedRow): ComputedMetrics {
    return {
      ctr: this.ctr(row.clicks, row.impressions),
      cvr: this.cvr(row.downloads, row.clicks),
      cpi: this.cpi(row.spend, row.downloads),
      cpm: this.cpm(row.spend, row.impressions),
      cpc: this.cpc(row.spend, row.clicks),
      roas: this.roas(row.revenue, row.spend),
      costPerRegistration: this.costPerRegistration(row.spend, row.registrations),
      costPerPayingUser: this.costPerPayingUser(row.spend, row.payingUsers),
      payRate: this.payRate(row.payingUsers, row.downloads),
      registrationRate: this.registrationRate(row.registrations, row.downloads),
      ltv: this.ltv(row.revenue, row.downloads),
    };
  }
}

/** 聚合行（SUM 汇总结果） */
export interface AggregatedRow {
  impressions: number;
  clicks: number;
  downloads: number;
  spend: number;
  revenue: number;
  registrations: number;
  payingUsers: number;
}

/** 计算指标结果 */
export interface ComputedMetrics {
  ctr: number;
  cvr: number;
  cpi: number;
  cpm: number;
  cpc: number;
  roas: number;
  costPerRegistration: number;
  costPerPayingUser: number;
  payRate: number;
  registrationRate: number;
  ltv: number;
}
