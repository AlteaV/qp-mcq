var fetchingDataSection = document.getElementById("fetching_data");
var resultTable = document.getElementById("result_table");
var resultDiv = document.getElementById("result_div");
var registerNumber = document.getElementById("register_num");
var addBtn = document.getElementById("add_btn");
var subjectDropDowm = document.getElementById("subject");
var sesctionDropDown = document.getElementById("section");
var sectionDiv = document.getElementById("section_div");
var form = document.getElementById("form");
var addBtnDiv = document.getElementById("add_btn_div");
var formSubmit = document.getElementById("form_submit");
var modalTitle = document.getElementById("modal_title");
var isEditing = false;
var topicName = document.getElementById("topic_name");

var subjects = null;
var sections = null;
var topics = null;
var cur_data = null;

addBtn.addEventListener("click", async () => {
  resetForm();
  $("#modal").modal("show");
  modalTitle.innerHTML = "Add Topic";
  isEditing = false;
});

formSubmit.addEventListener("click", () => {
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  if (isEditing) {
    let id = cur_data["id"];
    let section_id = cur_data["section_id"];
    let topic = topicName.value;
    updateTopic(id, section_id, topic);
  } else {
    let section_id = sesctionDropDown.value;
    let topic = topicName.value;
    addNewTopic(section_id, topic);
  }
});

subjectDropDowm.addEventListener("change", () => {
  if (subjectDropDowm.value) {
    sectionDiv.classList.remove("d-none");
  }
  let id = subjectDropDowm.value;
  let new_sections = [];
  const data = sections;
  for (let s in data) {
    if (data[s]["subject_id"] == id) {
      new_sections.push(data[s]);
    }
  }
  renderSections(new_sections);
  resultDiv.style.display = "none";
  addBtnDiv.classList.add("d-none");
});

sesctionDropDown.addEventListener("change", () => {
  if (sesctionDropDown.value) {
    addBtnDiv.classList.remove("d-none");
  }
  let id = sesctionDropDown.value;
  let new_topics = [];
  const data = topics;
  for (let t in data) {
    if (data[t]["section_id"] == id) {
      new_topics.push(data[t]);
    }
  }
  showReportSection(new_topics);
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
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((row, index) => {
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(row.topic),
      new TableStructure(createEditButton(row)),
    ]);
  });

  $("#result_table").on("click", ".edit-button", (event) => {
    resetForm();
    isEditing = true;
    modalTitle.innerHTML = "Update Topic";
    let $button = $(event.currentTarget);
    let data = JSON.parse(decodeURIComponent($button.attr("data-full")));
    indertDefaultData(data);
    cur_data = data;
    $("#modal").modal("show");
  });
  displayResult(tableData, resultTable);
  resultDiv.style.display = "block";
  hideOverlay();
}

function indertDefaultData(data) {
  topicName.value = data["topic"];
}

function renderSubjects(subjects) {
  let sub = subjects.map((subject) => {
    return { html: subject["subject"], value: subject["id"] };
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
    return { html: s["section"], value: s["id"] };
  });
  new_sections.unshift({
    html: "Please select the subject",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_sections, sesctionDropDown);
}

function resetForm() {
  form.reset();
  form.classList.remove("was-validated");
  $("#modal").modal("hide");
}

async function init() {
  getSubjectsSectionsTopics();
}

async function getSubjectsSectionsTopics() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gsst",
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      subjects = response.result.subjects;
      sections = response.result.sections;
      topics = response.result.topics;
      renderSubjects(subjects);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects, sections and topics");
  }
}

async function addNewTopic(section_id, topic) {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "ant",
      section_id: section_id,
      topic: topic,
      staff_id: loggedInUser.staff_id,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      let id = response.result.id;
      topics.push({ id: id, section_id: section_id, topic: topic });
      let new_topics = [];
      const data = topics;
      for (let t in data) {
        if (data[t]["section_id"] == section_id) {
          new_topics.push(data[t]);
        }
      }
      showReportSection(new_topics);
      resetForm();
      alert(response.message);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects, sections and topics");
  }
}

async function updateTopic(id, section_id, topic) {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "ut",
      id: id,
      topic: topic,
      staff_id: loggedInUser.staff_id,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      for (let t in topics) {
        if (topics[t]["id"] == id) {
          topics[t] = { id: id, section_id: section_id, topic: topic };
          break;
        }
      }
      let new_topics = [];
      const data = topics;
      for (let t in data) {
        if (data[t]["section_id"] == section_id) {
          new_topics.push(data[t]);
        }
      }
      showReportSection(new_topics);
      resetForm();
      alert(response.message);
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
    init();
  }
});
