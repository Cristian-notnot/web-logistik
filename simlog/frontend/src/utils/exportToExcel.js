import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}_${Date.now()}.xlsx`);
};
