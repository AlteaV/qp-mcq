var fetchingDataSection = document.getElementById("fetching_data");
var resultTable = document.getElementById("result_table");
var resultDiv = document.getElementById("result_div");
var registerNumber = document.getElementById("register_num");
var viewReport = document.getElementById("view_report");
var subjectDropDowm = document.getElementById("subject");
var sesctionDropDown = document.getElementById("section");
var sectionDiv = document.getElementById("section_div");

var subjects = null;
var sections = null;

viewReport.addEventListener("click", async () => {
  if (subjectDropDowm.value && sesctionDropDown.value) {
    await getReportByTopic();
  } else {
    alert("Please provide subject and section. ");
  }
});

subjectDropDowm.addEventListener("change", () => {
  resetResult(fetchingDataSection, resultDiv);
  if (subjectDropDowm.value) {
    sectionDiv.classList.remove("d-none");
  }
  let id = subjectDropDowm.value;
  let new_sections = [];
  let data = subjects.find((s) => s.subject_id == id)["sections"];
  try {
    data = JSON.parse(data);
  } catch (e) {
    data = data;
  }
  for (let s in data) {
    new_sections.push(data[s]);
  }
  renderSections(new_sections);
});

sesctionDropDown.addEventListener("change", () => {
  resetResult(fetchingDataSection, resultDiv);
});

function showReportSection(data) {
  fetchingDataSection.style.display = "none";
  if (!data || data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.NO"),
        new TableStructure("Topic"),
        new TableStructure("No of Student"),
        new TableStructure("No of Times Attempted"),
        new TableStructure("No of Times Passed"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((row, index) => {
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(row.topic),
      new TableStructure(row.total_student),
      new TableStructure(row.total_attempted),
      new TableStructure(row.total_passed),
    ]);
  });
  displayResult(tableData, resultTable);
  resultDiv.style.display = "block";
  hideOverlay();
}

function renderSubjects(subjects) {
  let sub = subjects.map((subject) => {
    return { html: subject["subject_name"], value: subject["subject_id"] };
  });
  sub.unshift({
    html: "Please select the subject",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(sub, subjectDropDowm);
}

function renderSections(sections) {
  let new_sections = sections.map((s) => {
    return { html: s["section_name"], value: s["section_id"] };
  });
  new_sections.unshift({
    html: "Please select the section",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_sections, sesctionDropDown);
}

async function init() {
  getSubjectAndSection();
}

async function getSubjectAndSection() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gsas",
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

async function getReportByTopic() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "grbt",
      section: sesctionDropDown.value,
      org_id: loggedInUser.college_code,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      showReportSection(response.result.report);
    }
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects and section");
  }
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

function initializePage() {
  init();
}
