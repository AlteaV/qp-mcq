let totalMarks = document.getElementById("total_marks");
let templateName = document.getElementById("template_name");
let templateDetails = document.getElementById("template_details");
let questionSection = document.getElementById("question_section");
let templateDetailsForm = document.getElementById("template_details_form");
let createTemplateBtn = document.getElementById("create_template_btn");

// add part fields
let addPartsForm = document.getElementById("part_form");
let partName = document.getElementById("part_name");
let partSubject = document.getElementById("part_subject");
let partMarks = document.getElementById("part_marks");

// parts div
let partsDiv = document.getElementById("parts_div");
let partCreateBtn = document.getElementById("part_create_btn");
let newPartDiv = document.getElementById("new_part_div");

let btlLevels = [];
let subjects = [];
let parts = [];

function createTemplate() {
  templateDetailsForm.classList.add("was-validated");
  if (templateDetailsForm.checkValidity()) {
    createTemplateBtn.style.display = "none";
    questionSection.style.display = "block";
    templateDetails.classList.remove("col");
    templateDetailsForm.classList.remove("was-validated");
    setPartName();
  }
}

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
      setSubjects();
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects");
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
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects");
  }
}

function setPartName() {
  let existingParts = document.getElementsByClassName("part_container");
  let letter = String.fromCharCode(existingParts.length + "A".charCodeAt(0));
  if (parts.includes(letter)) {
    let i = existingParts.length;
    letter = String.fromCharCode(i + "A".charCodeAt(0));
    while (parts.includes(letter)) {
      i += 1;
      letter = String.fromCharCode(i + "A".charCodeAt(0));
    }
  }
  partName.value = letter;
}

function setSubjects() {
  partSubject.innerHTML =
    "<option value='' disabled selected>Select Subject</option>";

  subjects.forEach((subject) => {
    let option = document.createElement("option");
    option.value = subject.subject_id;
    option.text = subject.subject_name;
    partSubject.appendChild(option);
  });
}

function checkTotalMarks(finalCheck = false) {
  let form = document.getElementsByClassName("part_form");

  let maxMarks = totalMarks.value;

  let totalAssignedMarks = 0;
  for (let i = 0; i < form.length; i++) {
    let partMaxMarks =
      form[i].getElementsByClassName("max_marks_input")[0].value;
    totalAssignedMarks += parseInt(partMaxMarks);
  }
  if (
    totalAssignedMarks + parseInt(partMarks.value) <= maxMarks &&
    !finalCheck
  ) {
    return true;
  }
  if (totalAssignedMarks == maxMarks && finalCheck) {
    return true;
  }
  return false;
}

function checkPartsMark(form) {
  if (form) {
    let maxMarks = form.getElementsByClassName("max_marks_input")[0].value;
    let noOfQuestionsInputs = form.getElementsByClassName(
      "no_of_questions_input"
    );
    let marksInputs = form.getElementsByClassName("marks_input");
    let totalMarks = 0;
    for (let i = 0; i < noOfQuestionsInputs.length; i++) {
      let noOfQuestions = parseInt(noOfQuestionsInputs[i].value);
      let marksPerQuestion = parseInt(marksInputs[i].value);
      totalMarks += noOfQuestions * marksPerQuestion;
    }
    if (totalMarks > maxMarks) {
      return "high";
    }

    if (totalMarks == maxMarks) {
      return "match";
    }

    return "low";
  }
}

function createPart() {
  newPartDiv.style.display = "block";
  partCreateBtn.style.display = "none";
}

function assignQuestionsToSubject() {
  addPartsForm.classList.add("was-validated");
  if (!addPartsForm.checkValidity()) {
    return;
  }
  addPartsForm.classList.remove("was-validated");

  if (!checkTotalMarks()) {
    alert(
      `Total marks assigned to parts exceed or equal total marks of the template.`
    );
    return;
  }

  let form = document.createElement("form");
  form.classList.add("part_form", "bordered");
  form.id = `part_form_${partName.value}`;
  form.classList.add("mb-4");

  parts.push(partName.value);

  let maxMarks = partMarks.value;
  let maxMarksInput = document.createElement("input");
  maxMarksInput.classList.add("max_marks_input");
  maxMarksInput.type = "hidden";
  maxMarksInput.name = `part_${partName.value}_max_marks`;
  maxMarksInput.value = maxMarks;
  form.appendChild(maxMarksInput);

  let selectedSubject = subjects.find(
    (subj) => subj.subject_id == partSubject.value
  );

  let selectedSubjectInput = document.createElement("input");
  selectedSubjectInput.type = "hidden";
  selectedSubjectInput.classList.add("part_subject_id");
  selectedSubjectInput.name = `part_${partName.value}_subject_id`;
  selectedSubjectInput.value = selectedSubject.subject_id;
  form.appendChild(selectedSubjectInput);

  let sections = JSON.parse(selectedSubject.sections);

  let partContainer = document.createElement("div");
  partContainer.classList.add("part_container");
  partContainer.id = `part_${partName.value}`;

  let divContent = document.createElement("div");
  divContent.classList.add("d-flex", "justify-content-between");

  let partTitle = document.createElement("h5");
  partTitle.innerText = `Part ${partName.value}`;

  let deletePartBtn = document.createElement("button");
  deletePartBtn.classList.add("btn", "btn-danger", "btn-sm");
  deletePartBtn.innerText = "Delete Part";
  deletePartBtn.onclick = function () {
    deletePart(form);
  };
  divContent.appendChild(partTitle);
  divContent.appendChild(deletePartBtn);
  partContainer.appendChild(divContent);

  let heading = document.createElement("h6");
  heading.innerText = `${selectedSubject.subject_name} - ${partMarks.value} Marks`;
  partContainer.appendChild(heading);

  let questionContainer = document.createElement("div");
  questionContainer.id = `question_container_part_${partName.value}`;

  addQuestionRow(questionContainer, sections, form);
  partContainer.appendChild(questionContainer);

  let quesButton = document.createElement("div");
  quesButton.classList.add("row");

  let quesButtonCol = document.createElement("div");
  quesButtonCol.classList.add("col", "align-self-end");

  let addQuestionBtn = document.createElement("button");
  addQuestionBtn.classList.add("btn", "btn-primary");
  addQuestionBtn.innerText = "Add Question Row";

  addQuestionBtn.onclick = function () {
    addQuestionRow(questionContainer, sections, form);
  };
  quesButtonCol.appendChild(addQuestionBtn);
  quesButton.appendChild(quesButtonCol);
  partContainer.appendChild(quesButton);

  form.appendChild(partContainer);
  partsDiv.appendChild(form);

  // partsDiv.appendChild(partContainer);

  partsDiv.style.display = "block";
  setPartName();
  newPartDiv.style.display = "none";
  partCreateBtn.style.display = "block";
  partSubject.value = "";
  partMarks.value = "";
}

function addQuestionRow(questionContainer, sections, form) {
  if (form) {
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      return;
    }
    form.classList.remove("was-validated");

    let partName = form.id.split("part_form_")[1];
    let checkPartMark = checkPartsMark(form);
    if (checkPartMark == "high") {
      alert(
        `Total marks exceed maximum marks for part ${partName}. Please adjust the number of questions or marks per question.`
      );
      return;
    } else if (checkPartMark == "match") {
      alert(`Total marks match maximum marks for part ${partName}.`);
      return;
    }
  }

  let questionDiv = document.createElement("div");
  questionDiv.classList.add("row", "mb-5", "question_row");

  let questionCol = document.createElement("div");
  questionCol.classList.add("col-auto");
  questionCol.style.alignSelf = "center";

  let trash = document.createElement("i");
  trash.classList.add("fas", "fa-trash", "text-danger", "fs-4", "me-3");
  trash.style.cursor = "pointer";
  trash.onclick = function () {
    deleteQuestionRow(questionDiv);
  };

  questionCol.appendChild(trash);
  questionDiv.appendChild(questionCol);

  let questionInputCol = document.createElement("div");
  questionInputCol.classList.add("col");

  let questionRow = document.createElement("div");
  questionRow.classList.add("row");

  let questionLabelCol = document.createElement("div");
  questionLabelCol.classList.add("col");

  let sectionLabel = document.createElement("label");
  sectionLabel.classList.add("form-label", "required");
  sectionLabel.innerText = "Section:";

  let sectionSelect = document.createElement("select");
  sectionSelect.classList.add("form-select", "section_select");
  sectionSelect.required = true;

  let defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.innerText = "Select Section";
  sectionSelect.appendChild(defaultOption);

  let allSectionOptions = document.createElement("option");
  allSectionOptions.value = "any";
  allSectionOptions.innerText = "Any Section";
  sectionSelect.appendChild(allSectionOptions);

  sections.forEach((section) => {
    let option = document.createElement("option");
    option.value = section.section_id;
    option.innerText = section.section_name;
    sectionSelect.appendChild(option);
  });

  questionLabelCol.appendChild(sectionLabel);
  questionLabelCol.appendChild(sectionSelect);

  questionRow.appendChild(questionLabelCol);
  questionInputCol.appendChild(questionRow);

  questionDiv.appendChild(questionInputCol);

  let topicLabelCol = document.createElement("div");
  topicLabelCol.classList.add("col");

  let topicLabel = document.createElement("label");
  topicLabel.classList.add("form-label", "required");
  topicLabel.innerText = "Topic:";

  let topicSelect = document.createElement("select");
  topicSelect.classList.add("form-select", "topic_select");
  topicSelect.required = true;

  let defaultTopicOption = document.createElement("option");
  defaultTopicOption.value = "";
  defaultTopicOption.disabled = true;
  defaultTopicOption.selected = true;
  defaultTopicOption.innerText = "Choose Section First";
  topicSelect.appendChild(defaultTopicOption);

  sectionSelect.onchange = function () {
    topicSelect.innerHTML = "";

    let defaultTopicOption = document.createElement("option");
    defaultTopicOption.value = "";
    defaultTopicOption.disabled = true;
    defaultTopicOption.selected = true;
    defaultTopicOption.innerText = "Select Topic";
    topicSelect.appendChild(defaultTopicOption);

    let allTopicsOption = document.createElement("option");
    allTopicsOption.value = "any";
    allTopicsOption.innerText = "Any Topic";
    topicSelect.appendChild(allTopicsOption);

    if (sectionSelect.value == "any") {
      return;
    }

    let selectedSection = sections.find(
      (sec) => sec.section_id == sectionSelect.value
    );
    selectedSection.topics.forEach((topic) => {
      let option = document.createElement("option");
      option.value = topic.topic_id;
      option.innerText = topic.topic_name;
      topicSelect.appendChild(option);
    });
  };

  topicLabelCol.appendChild(topicLabel);
  topicLabelCol.appendChild(topicSelect);
  questionRow.appendChild(topicLabelCol);
  questionInputCol.appendChild(questionRow);

  let btlLabelCol = document.createElement("div");
  btlLabelCol.classList.add("col");
  let btlLabel = document.createElement("label");
  btlLabel.classList.add("form-label", "required");
  btlLabel.innerText = "BTL Level:";

  let btlSelect = document.createElement("select");
  btlSelect.classList.add("form-select", "btl_select");
  btlSelect.required = true;

  let defaultBtlOption = document.createElement("option");
  defaultBtlOption.value = "";
  defaultBtlOption.disabled = true;
  defaultBtlOption.selected = true;
  defaultBtlOption.innerText = "Select BTL Level";
  btlSelect.appendChild(defaultBtlOption);

  let allBtlOption = document.createElement("option");
  allBtlOption.value = "any";
  allBtlOption.innerText = "Any Level";
  btlSelect.appendChild(allBtlOption);

  btlLevels.forEach((level) => {
    let option = document.createElement("option");
    option.value = level.level;
    option.innerText = level.level_name;
    btlSelect.appendChild(option);
  });

  btlLabelCol.appendChild(btlLabel);
  btlLabelCol.appendChild(btlSelect);
  questionRow.appendChild(btlLabelCol);
  questionInputCol.appendChild(questionRow);

  let noOfQuestionsCol = document.createElement("div");
  noOfQuestionsCol.classList.add("col");

  let noOfQuestionsLabel = document.createElement("label");
  noOfQuestionsLabel.classList.add("form-label", "required");
  noOfQuestionsLabel.innerText = "No. of Questions:";

  let noOfQuestionsInput = document.createElement("input");
  noOfQuestionsInput.type = "number";
  noOfQuestionsInput.classList.add("form-control", "no_of_questions_input");
  noOfQuestionsInput.min = "1";
  noOfQuestionsInput.required = true;

  noOfQuestionsCol.appendChild(noOfQuestionsLabel);
  noOfQuestionsCol.appendChild(noOfQuestionsInput);
  questionRow.appendChild(noOfQuestionsCol);
  questionInputCol.appendChild(questionRow);

  let marksCol = document.createElement("div");
  marksCol.classList.add("col");

  let marksLabel = document.createElement("label");
  marksLabel.classList.add("form-label", "required");
  marksLabel.innerText = "Marks per Question:";
  let marksInput = document.createElement("input");
  marksInput.type = "number";
  marksInput.classList.add("form-control", "marks_input");
  marksInput.min = "1";
  marksInput.required = true;
  marksCol.appendChild(marksLabel);
  marksCol.appendChild(marksInput);
  questionRow.appendChild(marksCol);
  questionInputCol.appendChild(questionRow);

  questionContainer.appendChild(questionDiv);
}

function deletePart(form) {
  let parent = form.parentElement;
  form.remove();

  let index = parts.indexOf(form.id.split("part_form_")[1]);
  if (index > -1) {
    parts.splice(index, 1);
  }
  if (parent.children.length == 0) {
    partsDiv.style.display = "none";
  }
  setPartName();
}

function deleteQuestionRow(questionDiv) {
  questionDiv.remove();
}

function saveTemplate() {
  let isTemplateMarksValid = checkTotalMarks(true);
  if (!isTemplateMarksValid) {
    alert(
      "Total marks assigned to parts do not equal total marks of the template."
    );
    return;
  }

  let form = document.getElementsByClassName("part_form");
  let data = [];

  for (let i = 0; i < form.length; i++) {
    form[i].classList.add("was-validated");
    if (!form[i].checkValidity()) {
      return;
    }
    form[i].classList.remove("was-validated");

    let partName = form[i].id.split("part_form_")[1];
    let checkPartMark = checkPartsMark(form[i]);
    if (checkPartMark == "high") {
      alert(
        `Total marks exceed maximum marks for part ${partName}. Please adjust the number of questions or marks per question.`
      );
      return;
    } else if (checkPartMark == "low") {
      alert(
        `Total marks less than maximum marks for part ${partName}. Please adjust the number of questions or marks per question.`
      );
      return;
    }

    let partData = {};
    partData.part_name = partName;
    partData.max_marks =
      form[i].getElementsByClassName("max_marks_input")[0].value;
    partData.subject_id =
      form[i].getElementsByClassName("part_subject_id")[0].value;
    partData.questions = [];

    let questionRows = form[i].getElementsByClassName("question_row");
    for (let j = 0; j < questionRows.length; j++) {
      let questionData = {};
      let sectionSelect =
        questionRows[j].getElementsByClassName("section_select")[0];
      questionData.section_id = sectionSelect.value;

      let topicSelect =
        questionRows[j].getElementsByClassName("topic_select")[0];
      questionData.topic_id = topicSelect.value;

      let btlSelect = questionRows[j].getElementsByClassName("btl_select")[0];
      questionData.btl_level = btlSelect.value;

      let noOfQuestionsInput = questionRows[j].getElementsByClassName(
        "no_of_questions_input"
      )[0];
      questionData.no_of_questions = noOfQuestionsInput.value;

      let marksInput = questionRows[j].getElementsByClassName("marks_input")[0];
      questionData.marks_per_question = marksInput.value;
      partData.questions.push(questionData);
    }
    data.push(partData);
  }

  var out = {};
  out.function = "amt";
  out.name = templateName.value;
  out.org_id = loggedInUser.college_code;
  out.created_by = loggedInUser["staff_id"];
  out.template = data;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      alert(response.message);
      partsDiv.innerHTML = "";
      partsDiv.style.display = "none";
      questionSection.style.display = "none";
      templateDetails.classList.add("col");
      createTemplateBtn.style.display = "block";
      templateDetailsForm.reset();
      hideOverlay();
    } else if (response.status == 409) {
      hideOverlay();
      alert(response.message);
    } else {
      hideOverlay();
      alert("Network error");
    }
  });
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    showOverlay();

    if (!window.isCheckAuthLoaded) {
      const checkInterval = setInterval(() => {
        if (window.isCheckAuthLoaded) {
          clearInterval(checkInterval);
          init();
        }
      }, 100);
      return;
    } else {
      init();
    }
  }
});

async function init() {
  await getSubjects();
  await getBtlLevels();
  hideOverlay();
}
