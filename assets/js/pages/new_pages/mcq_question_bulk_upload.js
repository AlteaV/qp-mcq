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
    header: "Option A",
    key: "a",
    validation: null,
  },
  {
    header: "Option B",
    key: "b",
    validation: null,
  },
  {
    header: "Option C",
    key: "c",
    validation: null,
  },
  {
    header: "Option D",
    key: "d",
    validation: null,
  },
  {
    header: "Correct Answer",
    key: "correct_answer",
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

var XL_row_object = [];
$("#customFile").change(function () {
  $("#chooseFileLabel").text(this.files[0].name);
  XL_row_object = [];
  checkHeader();
});

async function checkHeader() {
  let filepath = fileInput.files[0];
  var workbookHeaders = XLSX.read(await filepath.arrayBuffer(), {
    type: "binary",
    sheetRows: 1,
  });
  let sheetNames = workbookHeaders.SheetNames;
  let h = XLSX.utils.sheet_to_json(workbookHeaders.Sheets[sheetNames[0]], {
    header: 1,
  })[0];

  let headings = headerData.map((a) => a.header);

  if (JSON.stringify(headings) != JSON.stringify(h)) {
    alert("Make sure the excel is formatted as given in sample file.");
    return;
  }

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

  for (let i = 0; i < XL_row_object.length; i++) {
    let question = XL_row_object[i];
    let correct_answer = null;

    if (question.a == question.correct_answer) {
      correct_answer = "a";
    } else if (question.b == question.correct_answer) {
      correct_answer = "b";
    } else if (question.c == question.correct_answer) {
      correct_answer = "c";
    } else if (question.d == question.correct_answer) {
      correct_answer = "d";
    }

    if (!correct_answer) {
      alert(
        "Correct answer should be one of the options in row " + (i + 2) + "."
      );
      return;
    }
    XL_row_object[i]["correct_option"] = correct_answer;
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

async function uploadQuestions() {
  if (XL_row_object.length == 0) {
    alert("Please upload a valid excel file");
    return;
  }

  let questions = [];
  for (let i = 0; i < XL_row_object.length; i++) {
    let question = XL_row_object[i];

    questions.push({
      sub_code: question.sub_code,
      question: question.question,
      choices: {
        a: question.a,
        b: question.b,
        c: question.c,
        d: question.d,
      },
      correct_answer: question.correct_option,
      marks: question.marks,
      btl: question.btl,
      co: question.co,
      unit: question.unit,
    });
  }

  try {
    let payload = JSON.stringify({
      function: "umq",
      questions: questions,
    });

    let response = await postCall(examCellEndPoint, payload);

    alert(response.message);
    fileInput.value = "";
    table.innerHTML = "";
    $("#chooseFileLabel").text("Choose file");
  } catch (error) {
    console.error(error);
  }
}

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
