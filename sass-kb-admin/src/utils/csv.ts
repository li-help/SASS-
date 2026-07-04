import dayjs from 'dayjs';

/**
 * 对 CSV 字段进行转义：
 * - null/undefined → 空字符串
 * - 包含逗号、双引号、换行符时用双引号包裹，内部双引号转义为两个双引号
 */
export function escapeCSVField(field: unknown): string {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/** 将一个二维数组导出为 CSV 文件并触发下载 */
export function downloadCSV(headers: string[], rows: string[][], filename?: string) {
  const headerLine = headers.map(escapeCSVField).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCSVField).join(','));
  const csv = [headerLine, ...bodyLines].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `export_${dayjs().format('YYYY-MM-DD_HHmmss')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
