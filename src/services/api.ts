import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface BackendUser {
  id: string;
  email: string | null;
  telegram_id: number | null;
  username: string | null;
  vless_uuid: string;
  status: string;
  traffic_limit_bytes: number | null;
  traffic_used_bytes: number;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_rub: number;
  duration_days: number;
  traffic_limit_gb: number | null;
  max_devices: number;
  is_active: boolean;
  sort_order: number;
}

export interface VpnConfig {
  protocol: string;
  share_link: string;
  json_config: Record<string, unknown>;
  qr_code_base64: string | null;
  node_name: string;
  fallback_nodes: string[];
}

class BackendApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: 30_000,
      headers: {
        'X-Api-Key': config.api.key,
      },
    });
  }

  async registerTelegramUser(telegramId: number, username?: string): Promise<BackendUser | null> {
    try {
      const { data } = await this.client.post<BackendUser>('/internal/users/telegram', null, {
        params: { telegram_id: telegramId, username },
      });
      return data;
    } catch (err) {
      logger.error('registerTelegramUser failed', { err, telegramId });
      return null;
    }
  }

  async fetchVpnConfig(telegramId: number): Promise<VpnConfig | null> {
    try {
      const { data } = await this.client.get<VpnConfig>(`/vpn/config/subscription/${telegramId}`, {
        params: { api_key: config.api.key },
      });
      return data;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 404 || status === 403 || status === 503) {
        return null;
      }
      logger.error('fetchVpnConfig failed', { err, telegramId });
      return null;
    }
  }

  async fetchPlans(): Promise<Plan[]> {
    try {
      const { data } = await this.client.get<Plan[]>('/public/plans');
      return data;
    } catch (err) {
      logger.error('fetchPlans failed', { err });
      return [];
    }
  }
}

export const backendApi = new BackendApi();
