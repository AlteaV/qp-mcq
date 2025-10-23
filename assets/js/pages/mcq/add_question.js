let subjectDropDown = document.getElementById("subject");
var sectionDiv = document.getElementById("section_div");
let sectionDropDown = document.getElementById("section");
var topicDiv = document.getElementById("topic_div");
let topicDropDown = document.getElementById("topic");

let addQuestionBtn = document.getElementById("add_question_btn");

let filterForm = document.getElementById("filter_form");
let questionForm = document.getElementById("question_form");

let questionInput = document.getElementById("question");
let optionAInput = document.getElementById("option_a");
let optionBInput = document.getElementById("option_b");
let optionCInput = document.getElementById("option_c");
let optionDInput = document.getElementById("option_d");
let optionEInput = document.getElementById("option_e");
let btlLevelDropDown = document.getElementById("btl_level");
let imageInput = document.getElementById("image");
let correctOptionDropDown = document.getElementById("correct_option");

var resultDiv = document.getElementById("result_div");

let subjects = [];
let btlLevels = [];

addQuestionBtn.addEventListener("click", async () => {
  filterForm.classList.add("was-validated");
  if (!filterForm.checkValidity()) {
    return;
  }
  questionForm.classList.add("was-validated");
  if (!questionForm.checkValidity()) {
    return;
  }
  if (correctOptionDropDown.value == "E" && optionEInput.value.trim() == "") {
    questionForm.classList.remove("was-validated");
    alert("Please provide option E text\nOr select a different correct option");
    return;
  }
  uploadQuestion();
});

async function init() {
  // await getSubjectsSectionsTopics();
  // await getBtlLevels();

  btlLevels = [
    {
      level: 1,
      level_name: "Remember",
    },
    {
      level: 2,
      level_name: "Understand",
    },
    {
      level: 3,
      level_name: "Apply",
    },
    {
      level: 4,
      level_name: "Analyze",
    },
    {
      level: 5,
      level_name: "Evaluate",
    },
    {
      level: 6,
      level_name: "Create",
    },
  ];

  subjects = [
    {
      subject_id: 1,
      subject_name: "Quantitative Aptitude",
      sections:
        '[{"topics": [{"topic_id": 32, "topic_name": "Partnership"}, {"topic_id": 34, "topic_name": "Time and Work"}, {"topic_id": 35, "topic_name": "Time and Distance"}, {"topic_id": 11, "topic_name": "Simplification"}, {"topic_id": 3, "topic_name": "Simple Interest"}, {"topic_id": 4, "topic_name": "Profit and Loss"}, {"topic_id": 1, "topic_name": "Problems on Trains"}, {"topic_id": 27, "topic_name": "Problems on Numbers"}, {"topic_id": 20, "topic_name": "Probability"}, {"topic_id": 23, "topic_name": "Pipes and Cistern"}, {"topic_id": 5, "topic_name": "Percentage"}, {"topic_id": 22, "topic_name": "Alligation or Mixture"}, {"topic_id": 9, "topic_name": "Numbers"}, {"topic_id": 33, "topic_name": "Compound Interest"}, {"topic_id": 30, "topic_name": "Clock"}, {"topic_id": 13, "topic_name": "Chain Rule"}, {"topic_id": 6, "topic_name": "Calendar"}, {"topic_id": 7, "topic_name": "Average"}, {"topic_id": 29, "topic_name": "Area"}], "section_id": 1, "section_name": "Arithmetic"}, {"topics": [{"topic_id": 64, "topic_name": "Logical Problems"}], "section_id": 3, "section_name": "Logical Reasoning"}, {"topics": [{"topic_id": 87, "topic_name": "Data Sufficiency"}], "section_id": 4, "section_name": "Verbal Reasoning"}]',
    },
  ];
  hideOverlay();
  renderSubjects(subjects);
  renderBtlLevels(btlLevels);
}

subjectDropDown.addEventListener("change", () => {
  if (subjectDropDown.value) {
    sectionDiv.classList.remove("d-none");
  }
  let id = subjectDropDown.value;
  let new_sections = [];
  let section = subjects.find((sub) => sub.subject_id == id);

  const data = JSON.parse(section.sections);

  for (let s in data) {
    new_sections.push(data[s]);
  }

  renderSections(new_sections);
  resultDiv.style.display = "none";
});

sectionDropDown.addEventListener("change", () => {
  if (sectionDropDown.value) {
    topicDiv.classList.remove("d-none");
  } else {
    topicDiv.classList.remove("d-none");
  }
  let sectionId = sectionDropDown.value;
  let subjectId = subjectDropDown.value;

  let subject = subjects.find((sub) => sub.subject_id == subjectId);
  let sections = JSON.parse(subject.sections);
  let section = sections.find((sec) => sec.section_id == sectionId);
  let topics = section.topics;
  let new_topics = [];
  for (let t in topics) {
    new_topics.push(topics[t]);
  }
  renderTopics(new_topics);
  resultDiv.style.display = "none";
});

topicDropDown.addEventListener("change", () => {
  resultDiv.style.display = "block";
});

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
  setDropDown(sub, subjectDropDown);
}

function renderSections(sections) {
  let new_sections = sections.map((s) => {
    return { html: s["section_name"], value: s["section_id"] };
  });
  new_sections.unshift({
    html: "Please select the subject",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_sections, sectionDropDown);
}

function renderTopics(topics) {
  let new_topics = topics.map((t) => {
    return { html: t["topic_name"], value: t["topic_id"] };
  });
  new_topics.unshift({
    html: "Please select the topic",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_topics, topicDropDown);
}

function renderBtlLevels(btlLevels) {
  let new_btl_levels = btlLevels.map((btl) => {
    return { html: btl["level_name"], value: btl["level"] };
  });
  new_btl_levels.unshift({
    html: "Please select the BTL level",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_btl_levels, btlLevelDropDown);
}

async function getSubjectsSectionsTopics() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gswt",
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      subjects = response.result.subjects;
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects, sections and topics");
  }
}

async function getBtlLevels() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gbl",
      org_id: loggedInUser.college_code,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      btlLevels = response.result.btl_level;
    } else {
      throw new Error(response.message);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching BTL levels");
  }
}

async function uploadQuestion() {
  let out = {};
  out["function"] = "isq";

  out.question = sanitizeInput(questionInput.value);
  out.choices = {
    A: sanitizeInput(optionAInput.value),
    B: sanitizeInput(optionBInput.value),
    C: sanitizeInput(optionCInput.value),
    D: sanitizeInput(optionDInput.value),
  };
  if (optionEInput.value.trim() != "") {
    out.choices["E"] = sanitizeInput(optionEInput.value);
  }
  out.correct_answer = correctOptionDropDown.value;
  out.topic_id = topicDropDown.value;
  out.btl_level = btlLevelDropDown.value;
  if (imageInput.files.length > 0) {
    let files = imageInput.files;
    out.image = await convertToBase64(files[0]);
  } else {
    out.image = null;
  }
  out.mark = 1;
  out.staff_id = loggedInUser.staff_id;

  showOverlay();
  try {
    let payload = JSON.stringify(out);
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      alert(response.message);
      questionForm.reset();
      questionForm.classList.remove("was-validated");
      filterForm.classList.remove("was-validated");
      hideOverlay();
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert(error.message || "An error occurred while uploading question");
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
