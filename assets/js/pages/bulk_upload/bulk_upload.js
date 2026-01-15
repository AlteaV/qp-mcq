let sampleButton = document.getElementById("sample-button");
let fileInput = document.getElementById("custom_file");

let fetchingDataSection = document.getElementById("fetching_data");
let resultDiv = document.getElementById("result_div");
let resultTable = document.getElementById("result_table");
let networkButton = document.getElementById("network-button");
let orgID = loggedInUser.org_id || loggedInUser.college_code || null;

let expectHeaders = ["User ID", "User Name", "Branch Code", "Class", "Section"];
let xlData = [];

function downloadSample() {
  try {
    let sampleData = [expectHeaders];
    let workbook = XLSX.utils.book_new();
    let worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
    let xlsFile = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    let blob = new Blob([xlsFile], { type: "application/octet-stream" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "User Upload sample.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(
      "An error occurred during the Excel file download process:",
      error
    );
  }
}

async function checkExcel(filepath) {
  var workbook = XLSX.read(await filepath.arrayBuffer(), {
    type: "binary",
  });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  let headers = XLSX.utils.sheet_to_json(ws, {
    header: 1,
  })[0];

  if (JSON.stringify(expectHeaders) != JSON.stringify(headers)) {
    xlData = [];
    fileInput.value = "";
    alert("Make sure the excel is formatted as given in sample file.");
    return false;
  }

  var XL_row_object = XLSX.utils.sheet_to_row_object_array(ws, {
    defval: null,
    raw: false, //To avoid date format issue
  });

  if (XL_row_object.length == 0) {
    xlData = [];
    fileInput.value = "";
    alert("There is no data in Excel");
    return false;
  }

  for (var i = 0; i < XL_row_object.length; i++) {
    let row = XL_row_object[i];
    // should have either branch code or class
    if (row["Branch Code"] == null && row["Class"] == null) {
      xlData = [];
      fileInput.value = "";
      alert(`Either Branch Code or Class should be present at ROW: ${i + 1}`);
      return false;
    }
    // can have either branch code or class not both
    if (row["Branch Code"] != null && row["Class"] != null) {
      xlData = [];
      fileInput.value = "";
      alert(
        `Either Branch Code or Class should be present at ROW: ${
          i + 1
        }, not both`
      );
      return false;
    }
    // user id and user name should not be null
    if (row["User ID"] == null || row["User Name"] == null) {
      xlData = [];
      fileInput.value = "";
      alert(`User ID and User Name cannot be null at ROW: ${i + 1}`);
      return false;
    }
    xlData.push({
      user_id: row["User ID"].toString().trim(),
      user_name: row["User Name"].toString().trim(),
      branch: row["Branch Code"] ? row["Branch Code"].toString().trim() : null,
      std_year: row["Class"] ? row["Class"].toString().trim() : null,
      section: row["Section"] ? row["Section"].toString().trim() : null,
    });
  }
  showData();
}

function showData() {
  let tableData = {
    //used array incase there are more than one header
    tableHeader: [
      [
        new TableStructure("#"),
        ...expectHeaders.map((h) => new TableStructure(h)),
      ],
    ],
    tableBody: [],
  };

  xlData.forEach((d, index) => {
    let row = [
      new TableStructure(index + 1),
      new TableStructure(d.user_id),
      new TableStructure(d.user_name),
      new TableStructure(d.branch),
      new TableStructure(d.std_year),
      new TableStructure(d.section),
    ];

    tableData.tableBody.push(row);
  });
  displayResult(tableData, resultTable);

  hideOverlay();
  resultDiv.style.display = "block";
}

async function uploadBulkUsers() {
  if (xlData.length == 0) {
    alert("Please upload a file");
    return;
  }
  try {
    showOverlay();
    let response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify({
        function: "mubu",
        org_id: orgID,
        user_id: loggedInUser.staff_id || loggedInUser.user_id,
        users: xlData,
      })
    );
    if (response.status == 200) {
      alert(response["message"]);
      xlData = [];
      fileInput.value = "";
      resultDiv.style.display = "none";
    } else if (response.status == 409) {
      alert(response["message"]);
    } else {
      alert(response["message"]);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while uploading student details");
  }
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    showOverlay();

    if (!window.isCheckAuthLoaded) {
      let checkInterval = setInterval(() => {
        if (window.isCheckAuthLoaded) {
          clearInterval(checkInterval);
          initializePage();
        }
      }, 100);
      return;
    } else {
      initializePage();
    }
  }
});

async function initializePage() {
  sampleButton.addEventListener("click", () => {
    downloadSample();
  });

  fileInput.addEventListener("click", () => {
    fileInput.value = "";
    resultDiv.style.display = "none";
  });

  fileInput.addEventListener("change", async () => {
    resultDiv.style.display = "none";
    let selectedFile = fileInput.files[0];
    if (selectedFile) {
      await checkExcel(selectedFile);
    }
  });
  networkButton.addEventListener("click", async () => {
    await uploadBulkUsers();
  });
  hideOverlay();
}
