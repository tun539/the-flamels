/** Browser exports retain source precision; string cells are spreadsheet-safe. */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map(row => row.map(value => {
    const text = typeof value === 'string' && /^[=+@\-\t\r]/.test(value) ? "'" + value : String(value);
    return '"' + text.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n') + '\r\n';
}
export function downloadFile(filename: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
