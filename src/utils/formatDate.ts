/**
 * 日付をフォーマットする共通関数
 * Vercel環境でも動作するように Intl.DateTimeFormat を使用
 *
 * @param date - フォーマットする日付
 * @returns フォーマットされた日付文字列 (例: 2026/01/15 16:30:45)
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(date);
}
