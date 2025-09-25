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
  await takeTest();
});

submitButton.addEventListener("click", async () => {
  await submitAnswer();
});

function reset() {
  resultDiv.style.display = "none";
  resultTable.innerHTML = "";
  fetchingDataSection.innerHTML = "";
  let scoreDiv = document.getElementById("score_div");
  if (scoreDiv) {
    scoreDiv.style.display = "none";
  }
}

var subjects = null;
let questions = [];
async function getSubjects() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gswt",
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
      disaplyQuestions();
    } else {
      throw new Error(response.message || "Failed to fetch questions");
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching questions");
    hideOverlay();
  }
}

function disaplyQuestions() {
  let data = questions;
  let resultDiv = document.getElementById("result_div");
  let resultTable = document.getElementById("result_table");
  let fetchingDataSection = document.getElementById("fetching_data_section");
  if (data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  let tableData = {
    tableHeader: [
      [new TableStructure("S.No"), new TableStructure("Questions & Options")],
    ],
    tableBody: [],
  };

  data.forEach((record, index) => {
    let choices = JSON.parse(record.choices);

    let choiceHTML = `<div style="display: flex; flex-direction: column; gap: 8px; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;

    for (let key in choices) {
      const inputId = `choices_${record.question_id}`;

      choiceHTML += `
                    <label style="display: flex; align-items: left; gap: 5px;">
                        <input 
                            type="radio" 
                            id="${inputId}" 
                            name="question_${record.question_id}"  
                            value="${key}" 
                        />
                        <span class="latex" >
                            ${choices[key]}
                        </span>
                    </label>`;
    }

    choiceHTML += `</div>`;

    let questionHTML = `
                <div>
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                         ${record.question}
                    </p>
                    ${choiceHTML}
                </div>
            `;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(questionHTML),
    ]);
  });

  displayResult(tableData, resultTable);
  MathJax.typeset();

  hideOverlay();
  resultDiv.style.display = "block";
  submitButton.style.display = "block";

  let scoreDiv = document.getElementById("score_div");
  if (scoreDiv) {
    scoreDiv.style.display = "none";
  }
}

async function submitAnswer() {
  let questionIds = [];

  questions.forEach((item) => {
    questionIds.push(item.question_id);
  });
  let payload = JSON.stringify({
    function: "sst",
    user_id: loggedInUser.register_num,
    question_ids: questionIds,
  });
  try {
    let response = await postCall(QuestionUploadEndPoint, payload);
    showResultValidation();
  } catch (error) {
    console.error(error);
    alert("An error occurred while submitting answers");
    hideOverlay();
  }
}

function showResultValidation() {
  let totalQuestions = questions.length;
  let correctCount = 0;

  questions.forEach((record, index) => {
    let correctAnswer = record.correct_answer;
    let selected = document.querySelector(
      `input[name="question_${record.question_id}"]:checked`
    );

    let allOptions = document.querySelectorAll(
      `input[name="question_${record.question_id}"]`
    );

    allOptions.forEach((option) => {
      let label = option.parentElement;
      if (option.value == correctAnswer) {
        label.style.backgroundColor = "#87b97cff";
        label.style.fontWeight = "bold";
        label.style.padding = "5px";
        label.style.borderRadius = "6px";
      } else if (option.checked && option.value !== correctAnswer) {
        label.style.backgroundColor = "#df6e6eff";
        label.style.fontWeight = "bold";
        label.style.padding = "5px";
        label.style.borderRadius = "6px";
      }
      option.disabled = true;
    });

    if (selected && selected.value == correctAnswer) {
      correctCount++;
    }
  });

  let scoreDiv = document.getElementById("score_div");
  if (!scoreDiv) {
    scoreDiv = document.createElement("div");
    scoreDiv.id = "score_div";
    scoreDiv.style.marginTop = "20px";
    scoreDiv.style.fontSize = "120%";
    scoreDiv.style.fontWeight = "bold";
    resultDiv.appendChild(scoreDiv);
  }

  scoreDiv.innerHTML = `Total Score: ${correctCount} / ${totalQuestions}`;
  submitButton.style.display = "none";
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    await getSubjects();
  }
});
