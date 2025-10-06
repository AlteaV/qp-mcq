var subjectDropDown = document.getElementById("subject");
var sectionDropDown = document.getElementById("section");
var topicDropDown = document.getElementById("topic");
var sectionDiv = document.getElementById("section_div");
var topicDiv = document.getElementById("topic_div");
var networkButton = document.getElementById("network_button");
var submitButton = document.getElementById("submit_button");

let resultDiv = document.getElementById("result_div");
let resultTable = document.getElementById("result_table");
let fetchingDataSection = document.getElementById("fetching_data");

subjectDropDown.addEventListener("change", async () => {
  if (subjectDropDown.value) {
    reset();
    renderSection();
  }
});

sectionDropDown.addEventListener("change", async () => {
  reset();
  renderTopic();
});

topicDropDown.addEventListener("change", async () => {
  reset();
});

networkButton.addEventListener("click", async () => {
  reset();
  await takeTest();
});

function reset() {
  resultDiv.style.display = "none";
  resultTable.innerHTML = "";
  fetchingDataSection.innerHTML = "";
  let scoreDiv = document.getElementById("score_div");
  if (scoreDiv) {
    scoreDiv.style.display = "none";
  }

  answers = [];
  previousIndex = 0;
  questions = [];
  currentQuestion = null;
  correctAnswer = [];
  testType = "";
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
  topicDropDown.innerHTML = "";

  let selectedSubject = subjects.find((s) => s.subject_id == subjectID);

  if (!selectedSubject) {
    sectionDiv.classList.add("d-none");
    topicDiv.classList.add("d-none");
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
  topicDiv.classList.add("d-none");
}

function renderTopic() {
  let subjectID = subjectDropDown.value;
  let sectionID = sectionDropDown.value;
  topicDropDown.innerHTML = "";

  if (sectionID === "") {
    topicDiv.classList.add("d-none");
    return;
  }
  let selectedSubject = subjects.find((s) => s.subject_id == subjectID);

  let selectedSection = JSON.parse(selectedSubject.sections).find(
    (sec) => sec.section_id == sectionID
  );
  if (!selectedSection) {
    topicDiv.classList.add("d-none");
    return;
  }

  let topics = selectedSection.topics;
  let option = document.createElement("option");
  option.innerHTML = "All topics";
  option.value = "";
  option.selected = true;
  topicDropDown.appendChild(option);

  topics.forEach((topic) => {
    let option = document.createElement("option");
    option.value = topic.topic_id;
    option.text = topic.topic_name;
    topicDropDown.appendChild(option);
  });

  topicDiv.classList.remove("d-none");
}

async function takeTest() {
  if (!subjectDropDown.value) {
    alert("Please select subject");
    return;
  }

  let subjectID = subjectDropDown.value;
  let sectionID = sectionDropDown.value ? sectionDropDown.value : null;
  let topicID = topicDropDown.value ? topicDropDown.value : null;
  let payload = JSON.stringify({
    function: "grqfl",
    subject_id: subjectID,
    section_id: sectionID,
    topic_id: topicID,
  });

  try {
    showOverlay();
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      questions = response.result.questions;

      questions = {
        question_paper_id: null,
        questions: [],
        question_paper_name: "",
        shuffle_questions: false,
        test_type: "Self",
      };
      questions.questions = response.result.questions;

      testType = questions.test_type;
      nextQuestion();
    } else {
      throw new Error(response.message || "Failed to fetch questions");
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching questions");
    hideOverlay();
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
  await getSubjects();
}
