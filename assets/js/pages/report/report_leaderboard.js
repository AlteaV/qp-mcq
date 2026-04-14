var fetchingDataSection = document.getElementById("fetching_data");
var resultTable = document.getElementById("result_table");
var resultDiv = document.getElementById("result_div");
var registerNumber = document.getElementById("register_num");
var addBtn = document.getElementById("add_btn");
var subjectDropDown = document.getElementById("subject");
var sectionDropDown = document.getElementById("section");
var topicDropDown = document.getElementById("topic");
var subjectDiv = document.getElementById("subject_div");
var sectionDiv = document.getElementById("section_div");
var topicDiv = document.getElementById("topic_div");
var form = document.getElementById("form");
var networkButton = document.getElementById("network_button");
var formSubmit = document.getElementById("form_submit");
var modalTitle = document.getElementById("modal_title");
var isEditing = false;
var topicName = document.getElementById("topic_name");
var levelDropdown = document.getElementById("level");
var levelDiv = document.getElementById("level_div");

var subjects = null;
var sections = null;
var topics = null;
var cur_data = null;
var allLevel = null;

networkButton.addEventListener("click", async () => {
  await getTopPerformers();
});

levelDropdown.addEventListener("change", () => {
  resultDiv.style.display = "none";
  renderSubjects();
});

subjectDropDown.addEventListener("change", () => {
  let id = subjectDropDown.value;
  let new_sections = [];
  const data = sections;
  for (let s in data) {
    if (data[s]["subject_id"] == id) {
      new_sections.push(data[s]);
    }
  }
  renderSections(new_sections);
  resultDiv.style.display = "none";
  topicDiv.style.display = "none";
  topicDropDown.innerHTML = "";
});

sectionDropDown.addEventListener("change", () => {
  if (sectionDropDown.value != "") {
    let id = sectionDropDown.value;
    let new_topics = [];
    const data = topics;
    for (let t in data) {
      if (data[t]["section_id"] == id) {
        new_topics.push(data[t]);
      }
    }
    renderTopic(new_topics);
  } else {
    topicDiv.style.display = "none";
    topicDropDown.innerHTML = "";
  }
  resultDiv.style.display = "none";
});

topicDropDown.addEventListener("change", () => {
  resultDiv.style.display = "none";
});

function populateLevel() {
  allLevel.forEach((lev) => {
    const option = document.createElement("option");
    option.value = lev.level;
    option.textContent = lev.level;
    levelDropdown.appendChild(option);
  });
}

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
        new TableStructure("User Name"),
        new TableStructure("Email"),
        new TableStructure("Total Score"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((row, index) => {
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(row.user_name),
      new TableStructure(row.email),
      new TableStructure(row.total_correct),
    ]);
  });
  displayResult(tableData, resultTable);
  resultDiv.style.display = "block";
  hideOverlay();
}

function indertDefaultData(data) {
  topicName.value = data["topic"];
}

function renderSubjects() {
  resetResult(fetchingDataSection, resultDiv);
  let existingSubjectId = [];
  let level = levelDropdown.value;
  let subjectsValues = [];
  subjects.forEach((s) => {
    if (s.level == level && !existingSubjectId.includes(s.id)) {
      subjectsValues.push({ html: s["subject"], value: s["id"] });
      existingSubjectId.push(s.id);
    }
  });

  subjectsValues.unshift({
    html: "Please select subject",
    value: "",
    disabled: true,
    selected: true,
  });
  sectionDropDown.innerHTML = "";
  topicDropDown.innerHTML = "";
  setDropDown(subjectsValues, subjectDropDown);
}

function renderSections(sections) {
  let new_sections = sections.map((s) => {
    return { html: s["section"], value: s["id"] };
  });
  new_sections.unshift({
    html: "All Sections",
    value: "",
    selected: true,
  });
  setDropDown(new_sections, sectionDropDown);
  topicDropDown.innerHTML = "";
}

function renderTopic(topics) {
  let new_topics = topics.map((s) => {
    return { html: s["topic"], value: s["id"] };
  });
  new_topics.unshift({
    html: "All Topics",
    value: "",
    selected: true,
  });
  setDropDown(new_topics, topicDropDown);
  topicDiv.style.display = "block";
}

async function getSubjectsSectionsTopics() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gsst",
      org_id: loggedInUser.org_id,
    });

    let response = await postCall(adminEndPoint, payload);

    if (response.success) {
      subjects = response.result.subjects;
      sections = response.result.sections;
      topics = response.result.topics;
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects, sections and topics");
  }
}

async function getTopPerformers() {
  showOverlay();
  let subject_id = subjectDropDown.value;
  let section_id = sectionDropDown.value == "" ? null : sectionDropDown.value;
  let topic_id = topicDropDown.value == "" ? null : topicDropDown.value;
  try {
    let payload = JSON.stringify({
      function: "gtp",
      org_id: loggedInUser.org_id,
      subject_id: subject_id,
      section_id: section_id,
      topic_id: topic_id,
    });

    let response = await postCall(reportEndPoint, payload);

    if (response.success) {
      showReportSection(response.result.report);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects, sections and topics");
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

async function initializePage() {
  await Promise.all([fetchLevel()]);
  allLevel = JSON.parse(sessionStorage.getItem("levels"));
  await getSubjectsSectionsTopics();
  populateLevel();
  hideOverlay();
}
