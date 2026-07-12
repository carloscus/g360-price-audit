import { APP_LOCALE } from './config';

export function normalize(s: string): string {
  return s.toLocaleLowerCase(APP_LOCALE);
}
