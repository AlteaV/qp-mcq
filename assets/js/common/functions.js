
class TableStructure {
  constructor(data, colSpan, rowSpan, classes, style, attributes) {
    this.data = data;
    this.colSpan = colSpan ?? "";
    this.rowSpan = rowSpan ?? "";
    this.classes = classes ?? "";
    this.style = style ?? "";
    this.attributes = attributes ?? "";
  }
}

function displayResult(tableData, element) {
  element.innerHTML = "";
  let thead = document.createElement("thead");
  tableData.tableHeader.forEach((row) => {
    let tr = document.createElement("tr");
    row.forEach((cell) => {
      let th = document.createElement("th");
      if (cell.rowSpan !== "") {
        th.rowSpan = cell.rowSpan;
      }
      if (cell.colSpan !== "") {
        th.colSpan = cell.colSpan;
      }
      th.innerHTML = cell.data;
      th.className = cell.classes;
      th.style.cssText = cell.style;
      th.attributes = cell.attributes;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  });

  let tbody = document.createElement("tbody");
  tableData.tableBody.forEach((row) => {
    let tr = document.createElement("tr");
    row.forEach((cell) => {
      let td = document.createElement("td");
      if (cell.rowSpan !== "") {
        td.rowSpan = cell.rowSpan;
      }
      if (cell.colSpan !== "") {
        td.colSpan = cell.colSpan;
      }
      td.innerHTML = cell.data;
      td.className = cell.classes;
      td.style.cssText = cell.style;
      td.attributes = cell.attributes;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  element.appendChild(thead);
  element.appendChild(tbody);
}

function displayMultipleTables({ data: data, tableElement: table }) {
  table.innerHTML = "";
  data.forEach((tableData) => {
    let tbl = document.createElement("table");
    tbl.classList.add("table", "table-bordered");
    tbl.style.width = "100%";
    displayResult(tableData, tbl);
    table.appendChild(tbl);
  });
}

function createRow(row) {
  let tr = document.createElement("tr");
  row.forEach((cell) => {
    let td = document.createElement("td");
    if (cell.rowSpan !== "") {
      td.rowSpan = cell.rowSpan;
    }
    if (cell.colSpan !== "") {
      td.colSpan = cell.colSpan;
    }
    td.innerHTML = cell.data;
    td.className = cell.classes;
    td.style = cell.style;
    td.attributes = cell.attributes;
    tr.appendChild(td);
  });
  return tr;
}

function showOverlay() {
  var isOverlayExists = document.getElementById("overlay");
  if (isOverlayExists) {
    isOverlayExists.parentNode.removeChild(isOverlayExists);
  }

  var overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.classList.add("overlay");

  var spinner = document.createElement("div");
  spinner.classList.add("spinner");

  var loadingText = document.createElement("h4");
  loadingText.classList.add("loading-text");
  loadingText.textContent = "Fetching Data. Please Wait.";

  overlay.appendChild(spinner);
  overlay.appendChild(loadingText);

  var dashboardContent = document.querySelector(".dashboard-content");
  dashboardContent.appendChild(overlay);
  overlay.style.display = "block";
}

function hideOverlay() {
  var overlay = document.getElementById("overlay");
  if (overlay) overlay.parentNode.removeChild(overlay);
}

function resetResult(fetchingDataSection, resultSection) {
  if (fetchingDataSection) {
    fetchingDataSection.style.display = "none";
    resultSection.style.display = "none";
  }
}

function setDropDown(options, element) {
  element.innerHTML = "";
  options.forEach((option) => {
    var opt = document.createElement("option");
    opt.value = option.value;
    opt.innerHTML = option.html;
    if (option["selected"] !== undefined) {
      opt.selected = true;
    }
    element.appendChild(opt);
  });
}

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}


