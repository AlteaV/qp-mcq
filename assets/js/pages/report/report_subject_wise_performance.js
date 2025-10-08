var testTypeDropDown = document.getElementById("test_type");
var subjectDropDown = document.getElementById("subject");
var sectionDropDown = document.getElementById("section");
var sectionDiv = document.getElementById("section_div");
var networkButton = document.getElementById("network_button");
var submitButton = document.getElementById("submit_button");

let infoTable = document.getElementById("info_table");
let resultDiv = document.getElementById("result_div");
let resultTable = document.getElementById("result_table");
let fetchingDataSection = document.getElementById("fetching_data");

testTypeDropDown.addEventListener("change", async () => {
  reset();
});
subjectDropDown.addEventListener("change", async () => {
  if (subjectDropDown.value) {
    reset();
    renderSection();
  }
});

sectionDropDown.addEventListener("change", async () => {
  reset();
});

networkButton.addEventListener("click", async () => {
  reset();
  await getReport();
});

async function init() {
  if (loggedInUser.type == "Student") {
    testTypeDropDown.appendChild(new Option("Self Learning", "Self"));
  }
  await getSubjects();
}

function reset() {
  resultDiv.style.display = "none";
  resultTable.innerHTML = "";
  fetchingDataSection.innerHTML = "";
}

var subjects = null;

async function getSubjects() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gswt",
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      subjects = response.result.subjects;
      renderSubjects(subjects);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects and section");
  }
}

function renderSubjects(subjects) {
  let option = document.createElement("option");
  option.innerHTML = "Please select subject";
  option.value = "";
  option.selected = true;
  option.disabled = true;
  subjectDropDown.appendChild(option);

  subjects.forEach((subject) => {
    let option = document.createElement("option");
    option.value = subject.subject_id;
    option.text = subject.subject_name;
    subjectDropDown.appendChild(option);
  });
}

function renderSection() {
  let subjectID = subjectDropDown.value;
  sectionDropDown.innerHTML = "";

  let selectedSubject = subjects.find((s) => s.subject_id == subjectID);

  if (!selectedSubject) {
    sectionDiv.classList.add("d-none");
    return;
  }

  let sections = JSON.parse(selectedSubject.sections);
  let option = document.createElement("option");
  option.innerHTML = "All sections";
  option.value = "";
  option.selected = true;
  sectionDropDown.appendChild(option);

  sections.forEach((section) => {
    let option = document.createElement("option");
    option.value = section.section_id;
    option.text = section.section_name;
    sectionDropDown.appendChild(option);
  });

  sectionDiv.classList.remove("d-none");
}

async function getReport() {
  if (!testTypeDropDown.value) {
    alert("Please select test type");
    return;
  }

  if (!subjectDropDown.value) {
    alert("Please select subject");
    return;
  }

  let subjectID = subjectDropDown.value;
  let sectionID = sectionDropDown.value ? sectionDropDown.value : null;
  let out = {
    function: "gswpr",
    subject_id: subjectID,
    section_id: sectionID,
    test_type: testTypeDropDown.value,
    org_id: loggedInUser.college_code,
  };
  if (loggedInUser.type == "Student") {
    out.user_id = loggedInUser.register_num;
  }

  let payload = JSON.stringify(out);

  try {
    showOverlay();
    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      let report = response.result.report;
      showReport(report);
    } else {
      throw new Error(response.message || "Failed to fetch questions");
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching questions");
    hideOverlay();
  }
}

function showReport(report) {
  fetchingDataSection.style.display = "none";
  if (!report || report.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }
  let tempHeader = [];
  let infoHeader = [];

  tempHeader.push(new TableStructure("S.NO"));
  if (sectionDropDown.value) {
    tempHeader.push(new TableStructure("Topics"));
    infoHeader.push(new TableStructure("Section Name"));
  } else {
    tempHeader.push(new TableStructure("Sections"));
    infoHeader.push(new TableStructure("Subject Name"));
  }
  tempHeader.push(new TableStructure("Total Attended"));
  tempHeader.push(new TableStructure("Total Passed"));
  tempHeader.push(new TableStructure("Average Time"));

  infoHeader.push(new TableStructure("Total Attended"));
  infoHeader.push(new TableStructure("Total Passed"));
  infoHeader.push(new TableStructure("Average Time"));

  let tableData = {
    tableHeader: [tempHeader],
    tableBody: [],
  };

  let infoData = {
    tableHeader: [infoHeader],
    tableBody: [
      [
        new TableStructure(report.details_for),
        new TableStructure(report.total_times_attended),
        new TableStructure(report.total_times_correct),
        new TableStructure(report.total_average_time),
      ],
    ],
  };

  let data = JSON.parse(report.details);
  data.forEach((d, index) => {
    let avgTime = d.average_time;
    if (avgTime && avgTime.includes(".")) {
      avgTime = avgTime.split(".")[0];
    }

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(d.name),
      new TableStructure(d.times_attended),
      new TableStructure(d.times_correct),
      new TableStructure(avgTime),
    ]);
  });

  displayResult(tableData, resultTable);
  displayResult(infoData, infoTable);
  hideOverlay();
  resultDiv.style.display = "block";
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    showOverlay();

    if (!window.isCheckAuthLoaded) {
      const checkInterval = setInterval(() => {
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
  init();
}
