var fileInput = document.getElementById("customFile");
var table = document.getElementById("display_excel_data");

let headerData = [
  {
    header: "Subject Code",
    key: "sub_code",
    validation: null,
  },
  {
    header: "Question",
    key: "question",
    validation: null,
  },
  {
    header: "Marks",
    key: "marks",
    validation: "integer",
  },
  {
    header: "BTL",
    key: "btl",
    validation: null,
  },
  {
    header: "CO",
    key: "co",
    validation: null,
  },
  {
    header: "Unit",
    key: "unit",
    validation: "integer",
  },
];

function downloadSample() {
  let nameForKey = [];

  headerData.forEach((data) => nameForKey.push(data.header));

  var excelData = {
    header: nameForKey,
    exportResponse: [],
    fileName: "Questions Upload",
  };

  localStorage.setItem("exportData", JSON.stringify(excelData));

  downloadExcel();
}

$("#customFile").change(function () {
  $("#chooseFileLabel").text(this.files[0].name);
  checkHeader();
});

function checkHeader() {
  getExcel_headerData(fileInput.files[0]).then((response) => {
    let headings = headerData.map((a) => a.header);

    if (JSON.stringify(headings) === JSON.stringify(response)) {
      displayJsonToHtmlTable(fileInput.files[0]);
    } else alert("Make sure the excel is formatted as given in sample file.");
  });
}
var XL_row_object = [];
async function displayJsonToHtmlTable(filepath) {
  var workbook = XLSX.read(await filepath.arrayBuffer(), {
    type: "binary",
  });

  const ws = workbook.Sheets[workbook.SheetNames[0]];
  let headerKeys = [headerData.map((a) => a.key)];

  XLSX.utils.sheet_add_aoa(ws, headerKeys);

  XL_row_object = XLSX.utils.sheet_to_row_object_array(ws, {
    defval: null,
  });

  for (var i = 0; i < XL_row_object.length; i++) {
    if (Object.values(XL_row_object[i]).includes(null)) {
      XL_row_object = [];
      alert("Excel file has null value row " + (i + 2) + ".");
      return;
    }
    for (var j = 0; j < headerData.length; j++) {
      let header = headerData[j];
      if (header.validation != null) {
        if (header.validation == "integer") {
          if (isNaN(XL_row_object[i][header.key])) {
            alert(header.header + " in row " + (i + 2) + " should be a number");
            XL_row_object = [];
            return;
          }
        }
      }
    }
  }

  if (XL_row_object.length > 0) {
    var htmlData = "";
    htmlData += "<tr>";
    headerData.forEach((header) => {
      htmlData += "<th>" + header.header + "</th>";
    });
    htmlData += "</tr>";

    for (var i = 0; i < XL_row_object.length; i++) {
      var row = XL_row_object[i];

      htmlData += "<tr>";
      headerData.forEach((header) => {
        htmlData += "<td>" + row[header.key] + "</td>";
      });

      htmlData += "</tr>";
    }
    table.innerHTML = htmlData;
  } else {
    table.innerHTML = "There is no data in Excel";
  }
}
