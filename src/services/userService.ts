import { backendApi, type BackendUser } from './api';

export interface TelegramFrom {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export async function getOrCreateUser(from: TelegramFrom): Promise<{
  user: BackendUser | null;
  languageCode: string;
}> {
  const user = await backendApi.registerTelegramUser(from.id, from.username);
  const languageCode = from.language_code === 'en' ? 'en' : 'ru';
  return { user, languageCode };
}
