export const exportToExcel = async (data, fileName) => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor!');
    return;
  }
  const XLSX = await import('xlsx-js-style');
  const headers = Object.keys(data[0]);
  const title = fileName.replace(/_/g, ' ');
  const rows = data.map(row => headers.map(header => row[header] ?? ''));
  const worksheet = XLSX.utils.aoa_to_sheet([
    [title],
    [`Dibuat pada ${new Date().toLocaleString('id-ID')}`],
    [],
    headers,
    ...rows
  ]);
  const lastColumn = headers.length - 1;
  const lastColumnName = XLSX.utils.encode_col(lastColumn);
  const lastRow = rows.length + 4;
  const border = {
    bottom: { style: 'thin', color: { rgb: 'D8E7E1' } }
  };

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } }
  ];
  worksheet['!cols'] = headers.map((header, columnIndex) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[columnIndex] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 3, 12), 40) };
  });
  worksheet['!rows'] = [
    { hpt: 30 },
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 25 }
  ];
  worksheet['!autofilter'] = { ref: `A4:${lastColumnName}${lastRow}` };

  worksheet.A1.s = {
    fill: { patternType: 'solid', fgColor: { rgb: '145A50' } },
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 16 },
    alignment: { vertical: 'center' }
  };
  worksheet.A2.s = {
    fill: { patternType: 'solid', fgColor: { rgb: 'E7F3EE' } },
    font: { color: { rgb: '42675F' }, italic: true, sz: 10 },
    alignment: { vertical: 'center' }
  };

  headers.forEach((header, columnIndex) => {
    const cell = XLSX.utils.encode_cell({ r: 3, c: columnIndex });
    worksheet[cell].s = {
      fill: { patternType: 'solid', fgColor: { rgb: '197C6C' } },
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', wrapText: true },
      border
    };
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const cell = XLSX.utils.encode_cell({ r: rowIndex + 4, c: columnIndex });
      const isCondition = /kondisi|status/i.test(headers[columnIndex]);
      const conditionColors = {
        baik: ['E4F5EA', '176B3A'],
        rusak: ['FDE8E7', 'B42318'],
        hilang: ['ECEFF3', '475467'],
        maintenance: ['FFF2D6', '9A5B00'],
        'perlu perbaikan': ['FFF2D6', '9A5B00'],
        selesai: ['E4F5EA', '176B3A'],
        'tidak terlaksana': ['FDE8E7', 'B42318']
      };
      const conditionStyle = isCondition
        ? conditionColors[String(value).toLowerCase()]
        : null;

      worksheet[cell].s = {
        fill: {
          patternType: 'solid',
          fgColor: {
            rgb: conditionStyle?.[0] || (rowIndex % 2 ? 'F2F8F6' : 'FFFFFF')
          }
        },
        font: {
          color: { rgb: conditionStyle?.[1] || '263B36' },
          bold: Boolean(conditionStyle)
        },
        alignment: {
          vertical: 'center',
          horizontal: /jumlah|total/i.test(headers[columnIndex]) ? 'center' : 'left'
        },
        border
      };
    });
    worksheet['!rows'][rowIndex + 4] = { hpt: 21 };
  });

  const workbook = XLSX.utils.book_new();
  workbook.Props = { Title: title, Subject: 'Laporan SIM Logistik' };
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
  XLSX.writeFile(workbook, `${fileName}_${Date.now()}.xlsx`);
};
