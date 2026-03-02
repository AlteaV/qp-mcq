function extractFullTableDataAndMerges(table) {
  let rows = table.querySelectorAll("thead tr, tbody tr");

  let totalCols = 0;
  rows.forEach((row) => {
    let cols = 0;
    row.querySelectorAll("th, td").forEach((cell) => {
      let colspan = parseInt(cell.getAttribute("colspan")) || 1;
      cols += colspan;
    });
    totalCols = Math.max(totalCols, cols);
  });

  let numRows = rows.length;
  let data = Array.from({ length: numRows }, () => Array(totalCols).fill(""));
  let occupancy = Array.from({ length: numRows }, () =>
    Array(totalCols).fill(false)
  );
  let merges = [];

  rows.forEach((row, r) => {
    let colIndex = 0;
    let cells = row.querySelectorAll("th, td");
    cells.forEach((cell) => {
      while (colIndex < totalCols && occupancy[r][colIndex]) {
        colIndex++;
      }
      let cellText = cell.innerHTML.replace(/<br\s*\/?>/gi, "\n").trim();
      let colspan = parseInt(cell.getAttribute("colspan")) || 1;
      let rowspan = parseInt(cell.getAttribute("rowspan")) || 1;

      data[r][colIndex] = cellText;

      for (let i = r; i < r + rowspan; i++) {
        for (let j = colIndex; j < colIndex + colspan; j++) {
          occupancy[i][j] = true;
          if (!(i === r && j === colIndex)) {
            data[i][j] = "";
          }
        }
      }

      if (colspan > 1 || rowspan > 1) {
        merges.push({
          s: { r: r, c: colIndex },
          e: { r: r + rowspan - 1, c: colIndex + colspan - 1 },
        });
      }
      colIndex += colspan;
    });
  });

  let headerRowCount = table.querySelectorAll("thead tr").length;
  return { data, merges, headerRowCount };
}

//to remove actions column
function filterColumns(data, merges, headerRowCount) {
  if (data.length === 0) {
    return { data: [["There is no data"]], merges: [] };
  }
  let numCols = data[0].length;
  let removeCols = new Set();

  for (let c = 0; c < numCols; c++) {
    let headerVal = "";
    for (let r = 0; r < headerRowCount; r++) {
      if (data[r][c] && data[r][c].trim() !== "") {
        headerVal = data[r][c].trim().toLowerCase();
        break;
      }
    }
    if (headerVal === "action") {
      removeCols.add(c);
    }
  }

  let newData = data.map((row) =>
    row.filter((_, index) => !removeCols.has(index))
  );

  let colMapping = {};
  let newIndex = 0;
  for (let c = 0; c < numCols; c++) {
    if (!removeCols.has(c)) {
      colMapping[c] = newIndex;
      newIndex++;
    }
  }

  let newMerges = [];
  merges.forEach((merge) => {
    let keep = false;
    for (let c = merge.s.c; c <= merge.e.c; c++) {
      if (!removeCols.has(c)) {
        keep = true;
        break;
      }
    }
    if (!keep) return;

    let newStartC = null;
    for (let c = merge.s.c; c <= merge.e.c; c++) {
      if (!removeCols.has(c)) {
        newStartC = colMapping[c];
        break;
      }
    }

    let newEndC = null;
    for (let c = merge.e.c; c >= merge.s.c; c--) {
      if (!removeCols.has(c)) {
        newEndC = colMapping[c];
        break;
      }
    }
    if (newStartC !== null && newEndC !== null) {
      newMerges.push({
        s: { r: merge.s.r, c: newStartC },
        e: { r: merge.e.r, c: newEndC },
      });
    }
  });

  return { data: newData, merges: newMerges };
}

// adjust column widths
function autoAdjustColumnWidth(ws, data) {
  let numCols = data[0].length;
  let colWidths = [];
  for (let c = 0; c < numCols; c++) {
    let maxLength = 0;
    for (let r = 0; r < data.length; r++) {
      let cellValue = data[r][c];
      if (cellValue) {
        let lines = cellValue.toString().split("\n");
        lines.forEach((line) => {
          maxLength = Math.max(maxLength, line.length);
        });
      }
    }
    colWidths[c] = { wch: maxLength + 2 };
  }
  ws["!cols"] = colWidths;
}

// add empty columns to row in data
function padRows(data, targetWidth) {
  return data.map((row) => {
    let newRow = row.slice();
    while (newRow.length < targetWidth) {
      newRow.push("");
    }
    return newRow;
  });
}

// extraTables is an array of objects: [{ title: "Title 1", table: HTMLTableElement }, ...]
function exportFullTableToExcel(
  mainTable,
  fileName = "result",
  extraTables = []
) {
  let mainData = [];
  let mainMerges = [];
  let mainHeaderRowCount = 0;
  let mainWidth = 0;
  if (
    mainTable &&
    mainTable.querySelectorAll("thead tr, tbody tr").length > 0
  ) {
    let mainResult = extractFullTableDataAndMerges(mainTable);
    let filtered = filterColumns(
      mainResult.data,
      mainResult.merges,
      mainResult.headerRowCount
    );
    mainData = filtered.data;
    mainMerges = filtered.merges;
    mainHeaderRowCount = mainResult.headerRowCount;
    mainWidth = mainData[0].length;
  }

  let extraTablesData = [];
  let extraWidths = [];
  extraTables.forEach((obj) => {
    let result = extractFullTableDataAndMerges(obj.table);
    let filteredExtra = filterColumns(
      result.data,
      result.merges,
      result.headerRowCount
    );
    let extData = filteredExtra.data;
    let extMerges = filteredExtra.merges;
    let extHeaderCount = result.headerRowCount;
    let extWidth = extData.length > 0 ? extData[0].length : 0;
    extraWidths.push(extWidth);
    extraTablesData.push({
      title: obj.title,
      data: extData,
      merges: extMerges,
      headerRowCount: extHeaderCount,
      width: extWidth,
    });
  });

  let finalMaxCols = mainWidth;
  extraWidths.forEach((w) => {
    finalMaxCols = Math.max(finalMaxCols, w);
  });

  if (mainData.length > 0) {
    mainData = padRows(mainData, finalMaxCols);
  }

  let finalData = [];
  let finalMerges = [];
  let currentRow = 0;

  if (mainData.length > 0) {
    mainData.forEach((row) => {
      finalData.push(row);
      currentRow++;
    });
    finalMerges = finalMerges.concat(mainMerges);
  }

  let extraMeta = [];
  extraTablesData.forEach((ext, idx) => {
    if (currentRow > 0) {
      for (let i = 0; i < 2; i++) {
        finalData.push(Array(finalMaxCols).fill(""));
        currentRow++;
      }
    }
    let titleRow = Array(finalMaxCols).fill("");
    titleRow[0] = ext.title;
    finalData.push(titleRow);
    finalMerges.push({
      s: { r: currentRow, c: 0 },
      e: { r: currentRow, c: ext.width - 1 },
    });
    let titleRowIndex = currentRow;
    currentRow++;

    let headerStart = currentRow;
    let headerCount = ext.headerRowCount;

    ext.data = padRows(ext.data, finalMaxCols);
    ext.data.forEach((row) => {
      finalData.push(row);
      currentRow++;
    });

    ext.merges.forEach((m) => {
      finalMerges.push({
        s: { r: m.s.r + headerStart, c: m.s.c },
        e: { r: m.e.r + headerStart, c: m.e.c },
      });
    });

    extraMeta.push({
      titleRow: titleRowIndex,
      headerStart: headerStart,
      headerCount: headerCount,
      dataRowsCount: ext.data.length,
    });
  });

  let ws = XLSX.utils.aoa_to_sheet(finalData);
  if (finalMerges.length > 0) {
    ws["!merges"] = finalMerges;
  }

  // Default style: all cells center aligned.
  let totalRows = finalData.length;
  let totalCols = finalMaxCols;
  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      let cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) {
        continue;
      }
      ws[cellRef].s = {
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
      };
      if (r < mainHeaderRowCount && mainData.length > 0) {
        ws[cellRef].s.font = { bold: true };
      }
      extraMeta.forEach((meta) => {
        if (r === meta.titleRow) {
          ws[cellRef].s.font = { bold: true };
        }
        if (r >= meta.headerStart && r < meta.headerStart + meta.headerCount) {
          ws[cellRef].s.font = { bold: true };
        }
      });
    }
  }

  autoAdjustColumnWidth(ws, finalData);

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  let xlsFile = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  let blob = new Blob([xlsFile], { type: "application/octet-stream" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
