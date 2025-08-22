function downloadExcel() {
  var storedExcelData = JSON.parse(localStorage.getItem("exportData"));

  const rows = storedExcelData.exportResponse;
  const header = storedExcelData.header;
  const fileName = storedExcelData.fileName;
  /* generate worksheet and workbook */
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  /* fix headers */
  XLSX.utils.sheet_add_aoa(worksheet, [header], {
    origin: "A1",
  });

  const columnWidth = [];
  header.forEach((element) => {
    let width = element.length > 15 ? element.length : 15;
    columnWidth.push({ wch: width });
  });
  worksheet["!cols"] = columnWidth;
  for (index in worksheet) {
    if (typeof worksheet[index] != "object") continue;
    let cell = XLSX.utils.decode_cell(index);
    if (cell.r === 0) {
      // first row
      worksheet[index].s = {
        // bottom border
        alignment: {
          vertical: "center",
          horizontal: "center",
          wrapText: "1", // any truthy value here
        },
        font: { bold: true },
      };
    }
  }

  /* create an XLSX file and try to save to details.xlsx */
  XLSX.writeFile(workbook, fileName + ".xlsx", { compression: true });
  //   window.close();
}
