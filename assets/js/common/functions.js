var cachedDepartment = JSON.parse(sessionStorage.getItem("program_details"));

function setProgramType(program) {
  if (cachedDepartment != undefined && cachedDepartment != null) {
    var uniquePrograms = cachedDepartment.map(
      ({ program_type }) => program_type
    );
    uniquePrograms = new Set(uniquePrograms);

    program.innerHTML = "";

    let programOption = program.options;

    uniquePrograms.forEach((program) => {
      programOption.add(new Option(program, program));
    });

    program.value = [...uniquePrograms][0];

    simulateEvent("change", program);
  }
}

function setDepartment(departments, selectedProgram) {
  var departmentsForSelectedProgram = cachedDepartment.filter(
    (x) => x.program_type === selectedProgram
  );

  departments.innerHTML = "";

  let departmentOptions = departments.options;

  departmentsForSelectedProgram.forEach((department) => {
    departmentOptions.add(
      new Option(
        department.branch_name + " - " + department.program_code,
        department.branch_code
      )
    );
  });

  simulateEvent("change", departments);
}

function setYear(year, selectedBranch) {
  let departmentSelected = cachedDepartment.find(
    (o) => o.branch_code == selectedBranch
  );
  year.innerHTML = "";

  let yearOptions = year.options;

  for (var i = 1; i <= departmentSelected.duration; i++) {
    yearOptions.add(new Option(i));
  }

  simulateEvent("change", year);
}

function setSemester(semester, selectedBranch) {
  let departmentSelected = cachedDepartment.find(
    (o) => o.branch_code == selectedBranch
  );

  semester.innerHTML = "";

  let semesterOptions = semester.options;

  for (var i = 1; i <= departmentSelected.duration * 2; i++) {
    semesterOptions.add(new Option(i));
  }

  simulateEvent("change", semester);
}

async function setRegulation(regulation, selectedBranch, selectedSemester) {
  sessionStorage.removeItem("subjects");

  var cachedSubjects = JSON.parse(sessionStorage.getItem("subjects"));

  if (cachedSubjects == null || cachedSubjects == undefined) {
    let payload = {
      function: "gbws",
      college_code: loggedInUser["college_code"],
    };
    let response = await postCall(staffEndPoint, JSON.stringify(payload));
    if (response.status == 200) {
      sessionStorage.setItem(
        "subjects",
        JSON.stringify(response["result"].branches)
      );
    }
    cachedSubjects = JSON.parse(sessionStorage.getItem("subjects"));
  }

  var regulationForSelectedProgram = cachedSubjects.find(
    (x) => x.branch_code === selectedBranch
  );

  var subjects = regulationForSelectedProgram.subjects.filter(
    (x) => x.semester == selectedSemester
  );

  let uniqueRegulation = subjects
    .filter((x) => x.regulation !== null)
    .map((y) => y.regulation);

  uniqueRegulation = new Set(uniqueRegulation);

  regulation.innerHTML = "";

  let regulationOption = regulation.options;

  uniqueRegulation.forEach((regulation) => {
    regulationOption.add(new Option(regulation, regulation));
  });

  regulation.value = [...uniqueRegulation][0];

  simulateEvent("change", regulation);
}

function setSubject(
  subject,
  selectedBranch,
  selectedSemester,
  selectedRegulation
) {
  var cachedSubjects = JSON.parse(sessionStorage.getItem("subjects"));

  var subjectsForSelectedProgram = cachedSubjects.find(
    (x) => x.branch_code === selectedBranch
  );

  let filteredSubjects = subjectsForSelectedProgram["subjects"].filter(
    (x) => x.semester == selectedSemester && x.regulation == selectedRegulation
  );

  subject.innerHTML = "";

  let subjectOptions = subject.options;

  filteredSubjects.forEach((sub) => {
    subjectOptions.add(
      new Option(sub.sub_name + " - " + sub.sub_code, sub.sub_code)
    );
  });

  simulateEvent("change", subject);
}

function simulateEvent(eventName, element) {
  ev = document.createEvent("Event");
  ev.initEvent(eventName, true, true);

  element.dispatchEvent(ev);
}

function validateForm() {
  validate = true;
  var validate_inputs = document.querySelectorAll("#exampleModalCenter *");
  validate_inputs.forEach(function (vaildate_input) {
    vaildate_input.classList.remove("warning");
    if (vaildate_input.hasAttribute("required")) {
      if (vaildate_input.value.length == 0) {
        validate = false;
        vaildate_input.classList.add("warning");
      }
      if (
        vaildate_input.name == "student_email" &&
        vaildate_input.value.length > 0
      ) {
        if (!validateEmail(vaildate_input.value)) {
          validate = false;
          vaildate_input.classList.add("warning");
        }
      }
    }
  });
  return validate;
}

async function getExcel_headerData(filepath) {
  var workbookHeaders = XLSX.read(await filepath.arrayBuffer(), {
    type: "binary",
    sheetRows: 1,
  });
  let sheetNames = workbookHeaders.SheetNames;
  return XLSX.utils.sheet_to_json(workbookHeaders.Sheets[sheetNames[0]], {
    header: 1,
  })[0];
}

function removeTags(str) {
  if (str === null || str === "") return false;
  else str = str.toString();
  return str.replace(/(<([^>]+)>)/gi, "");
}

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

function createEditButton(data, attributes) {
  return (
    '<button class="btn btn-primary edit-button" ' +
    attributes +
    " data-full=" +
    encodeURIComponent(JSON.stringify(data)) +
    '><i class="fas fa-pencil-alt"></i></button>'
  );
}
