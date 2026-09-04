export { cn } from 'cn';

export function normalizeText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}
