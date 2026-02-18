let totalMarks = document.getElementById("total_marks");
let templateName = document.getElementById("template_name");
let templateDetails = document.getElementById("template_details");
let questionSection = document.getElementById("question_section");
let templateDetailsForm = document.getElementById("template_details_form");
let createTemplateBtn = document.getElementById("create_template_btn");

let saveTemplateBtn = document.getElementById("save_button");
saveTemplateBtn.style.display = "none";

let addPartsForm = document.getElementById("part_form");
let partName = document.getElementById("part_name");
let partLevel = document.getElementById("part_level");
let partSubject = document.getElementById("part_subject");
let partMarks = document.getElementById("part_marks");

let partsDiv = document.getElementById("parts_div");
let partCreateBtn = document.getElementById("part_create_btn");
let newPartDiv = document.getElementById("new_part_div");

let btlLevels = [];
let subjects = [];
let parts = [];

// event listener
partLevel.addEventListener("change", () => {
  setSubjects();
});

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
      setLevel();
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

function setLevel() {
  partLevel.innerHTML =
    "<option value='' disabled selected>Select Level</option>";

  let levelId = [];

  subjects.forEach((subject) => {
    let option = document.createElement("option");
    if (!levelId.includes(subject.level_id)) {
      option.value = subject.level_id;
      option.text = subject.level;
      partLevel.appendChild(option);
      levelId.push(subject.level_id);
    }
  });
}

function setSubjects() {
  partSubject.innerHTML =
    "<option value='' disabled selected>Select Subject</option>";
  let levelId = partLevel.value;

  subjects.forEach((subject) => {
    let option = document.createElement("option");
    if (subject.level_id == levelId) {
      option.value = subject.subject_id;
      option.text = subject.subject_name;
      partSubject.appendChild(option);
    }
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
    let questionRows = form.getElementsByClassName("question_row");

    let totalMarks = 0;

    for (let i = 0; i < questionRows.length; i++) {
      let typeSelect = questionRows[i].getElementsByClassName("type_select")[0];
      let type = typeSelect.value;

      if (type === "single") {
        let noOfQuestions = parseInt(
          questionRows[i].getElementsByClassName("no_of_questions_input")[0]
            .value,
        );
        let marksPerQuestion = parseInt(
          questionRows[i].getElementsByClassName("marks_input")[0].value,
        );
        totalMarks += noOfQuestions * marksPerQuestion;
      } else if (type === "either_or") {
        let marksInputs = questionRows[i].getElementsByClassName("marks_input");
        let noQInputs = questionRows[i].getElementsByClassName(
          "no_of_questions_input",
        );

        let marks_A = parseInt(marksInputs[0].value || 0);
        let marks_B = parseInt(marksInputs[1].value || 0);
        let noOfQuestionsA = parseInt(noQInputs[0].value || 0);
        let noOfQuestionsB = parseInt(noQInputs[1].value || 0);

        let totalMarksA = noOfQuestionsA * marks_A;
        let totalMarksB = noOfQuestionsB * marks_B;

        if (!isNaN(marks_A) && !isNaN(marks_B) && totalMarksA !== totalMarksB) {
          return "invalid";
        }

        let noQ = parseInt(noQInputs[0].value);
        totalMarks += noQ * marks_A;
      }
    }

    if (totalMarks > maxMarks) return "high";
    if (totalMarks == maxMarks) return "match";
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
      `Total marks assigned to parts exceed or equal total marks of the template.`,
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
    (subj) => subj.subject_id == partSubject.value,
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
  addQuestionBtn.type = "button";
  addQuestionBtn.classList.add("btn", "btn-primary");
  addQuestionBtn.innerText = "Add Question Row";

  addQuestionBtn.onclick = function () {
    addQuestionRow(questionContainer, sections, form);
    updateSaveButtonVisibility();
  };

  quesButtonCol.appendChild(addQuestionBtn);
  quesButton.appendChild(quesButtonCol);
  partContainer.appendChild(quesButton);

  form.appendChild(partContainer);
  partsDiv.appendChild(form);

  partsDiv.style.display = "block";
  setPartName();
  newPartDiv.style.display = "none";
  partCreateBtn.style.display = "block";
  partSubject.value = "";
  partMarks.value = "";

  newPartDiv.style.display = "none";
  partCreateBtn.style.display = "block";
  partLevel.value = "";
  partSubject.value = "";
  partMarks.value = "";

  if (checkTotalMarks(true)) {
    partCreateBtn.style.display = "none";
  }
  updateSaveButtonVisibility();
}

function addQuestionRow(questionContainer, sections, form) {
  if (form) {
    form.classList.add("was-validated");
    if (!form.checkValidity()) return;
    form.classList.remove("was-validated");

    let partName = form.id.split("part_form_")[1];
    let checkPartMark = checkPartsMark(form);

    if (checkPartMark == "invalid") {
      alert(
        "For Either-Or type, both questions must have the same marks per question.",
      );
      return;
    } else if (checkPartMark == "high") {
      alert(
        `Total marks exceed maximum marks for part ${partName}. Please adjust.`,
      );
      return;
    } else if (checkPartMark == "match") {
      alert(`Total marks match maximum marks for part ${partName}.`);
      return;
    }
  }

  let questionDiv = document.createElement("div");
  questionDiv.classList.add("row", "mb-5", "question_row");

  let trashCol = document.createElement("div");
  trashCol.classList.add("col-auto");
  trashCol.style.alignSelf = "center";

  let trash = document.createElement("i");
  trash.classList.add("fas", "fa-trash", "text-danger", "fs-4", "me-3");
  trash.style.cursor = "pointer";
  trash.onclick = () => questionDiv.remove();

  trashCol.appendChild(trash);
  questionDiv.appendChild(trashCol);

  let typeCol = document.createElement("div");
  typeCol.classList.add("col");

  let typeLabel = document.createElement("label");
  typeLabel.classList.add("form-label", "required");
  typeLabel.innerText = "Type:";

  let typeSelect = document.createElement("select");
  typeSelect.classList.add("form-select", "type_select");
  typeSelect.required = true;

  typeSelect.innerHTML = `
      <option value="" disabled selected>Select Type</option>
      <option value="single">Single</option>
      <option value="either_or">Either-Or</option>
  `;

  typeCol.appendChild(typeLabel);
  typeCol.appendChild(typeSelect);
  questionDiv.appendChild(typeCol);

  questionContainer.appendChild(questionDiv);

  typeSelect.onchange = function () {
    questionDiv.querySelectorAll(".dynamic_inputs").forEach((e) => e.remove());

    let dynamicDiv = document.createElement("div");
    dynamicDiv.classList.add("dynamic_inputs", "mt-3");

    function createFullQuestionRow() {
      let row = document.createElement("div");
      row.classList.add("row", "mb-2");

      let sectionCol = document.createElement("div");
      sectionCol.classList.add("col");
      sectionCol.innerHTML = `
        <label class="form-label required">Section:</label>
      `;
      let sectionSelect = document.createElement("select");
      sectionSelect.classList.add("form-select", "section_select");
      sectionSelect.required = true;

      sectionSelect.innerHTML = `
        <option value="" disabled selected>Select Section</option>
        <option value="any">Any Section</option>
      `;

      sections.forEach((section) => {
        let opt = document.createElement("option");
        opt.value = section.section_id;
        opt.innerText = section.section_name;
        sectionSelect.appendChild(opt);
      });

      sectionCol.appendChild(sectionSelect);
      row.appendChild(sectionCol);

      let topicCol = document.createElement("div");
      topicCol.classList.add("col");
      topicCol.innerHTML = `
        <label class="form-label required">Topic:</label>
      `;
      let topicSelect = document.createElement("select");
      topicSelect.classList.add("form-select", "topic_select");
      topicSelect.required = true;

      topicSelect.innerHTML = `
        <option value="" disabled selected>Choose Section First</option>
      `;
      topicCol.appendChild(topicSelect);
      row.appendChild(topicCol);

      sectionSelect.onchange = function () {
        topicSelect.innerHTML = `
          <option value="" disabled selected>Select Topic</option>
          <option value="any">Any Topic</option>
        `;

        if (sectionSelect.value === "") return;

        let selectedSection = sections.find(
          (sec) => sec.section_id == sectionSelect.value,
        );

        if (!selectedSection || !selectedSection.topics) return;

        selectedSection.topics.forEach((topic) => {
          let option = document.createElement("option");
          option.value = topic.topic_id;
          option.innerText = topic.topic_name;
          topicSelect.appendChild(option);
        });
      };

      let questionTypeCol = document.createElement("div");
      questionTypeCol.classList.add("col");
      let questionTypeLabel = document.createElement("label");
      questionTypeLabel.classList.add("form-label", "required");
      questionTypeLabel.innerText = "Question Type:";
      let questionTypeSelect = document.createElement("select");
      questionTypeSelect.classList.add("form-select", "question_type_select");
      questionTypeSelect.required = true;
      let defaultQuestionTypeOption = document.createElement("option");
      defaultQuestionTypeOption.value = "";
      defaultQuestionTypeOption.disabled = true;
      defaultQuestionTypeOption.selected = true;
      defaultQuestionTypeOption.innerText = "Select Question Type";
      questionTypeSelect.appendChild(defaultQuestionTypeOption);
      let mcqOption = document.createElement("option");
      mcqOption.value = "Mcq";
      mcqOption.innerText = "MCQ";
      questionTypeSelect.appendChild(mcqOption);
      let numericalOption = document.createElement("option");
      numericalOption.value = "Fib";
      numericalOption.innerText = "Fill in the Blanks";
      let descriptiveOption = document.createElement("option");
      descriptiveOption.value = "Descriptive";
      descriptiveOption.innerText = "Descriptive";
      questionTypeSelect.appendChild(numericalOption);
      questionTypeSelect.appendChild(descriptiveOption);
      questionTypeCol.appendChild(questionTypeLabel);
      questionTypeCol.appendChild(questionTypeSelect);
      row.appendChild(questionTypeCol);

      let btlCol = document.createElement("div");
      btlCol.classList.add("col");
      btlCol.innerHTML = `<label class="form-label required">BTL Level:</label>`;
      let btlSelect = document.createElement("select");
      btlSelect.classList.add("form-select", "btl_select");
      btlSelect.required = true;

      btlSelect.innerHTML = `
        <option value="" disabled selected>Select BTL Level</option>
        <option value="any">Any Level</option>
      `;

      btlLevels.forEach((level) => {
        let option = document.createElement("option");
        option.value = level.level;
        option.innerText = level.level_name;
        btlSelect.appendChild(option);
      });

      btlCol.appendChild(btlSelect);
      row.appendChild(btlCol);

      let noQCol = document.createElement("div");
      noQCol.classList.add("col");
      noQCol.innerHTML = `<label class="form-label required">No. of Questions:</label>`;
      let noQInput = document.createElement("input");
      noQInput.type = "number";
      noQInput.min = "1";
      noQInput.required = true;
      noQInput.classList.add("form-control", "no_of_questions_input");
      noQCol.appendChild(noQInput);
      row.appendChild(noQCol);

      let marksCol = document.createElement("div");
      marksCol.classList.add("col");
      marksCol.innerHTML = `<label class="form-label required">Marks per Question:</label>`;
      let marksInput = document.createElement("input");
      marksInput.type = "number";
      marksInput.min = "1";
      marksInput.required = true;
      marksInput.classList.add("form-control", "marks_input");
      marksCol.appendChild(marksInput);
      row.appendChild(marksCol);

      return row;
    }

    if (typeSelect.value === "single") {
      dynamicDiv.appendChild(createFullQuestionRow());
    }

    if (typeSelect.value === "either_or") {
      let rowA = createFullQuestionRow();
      let rowB = createFullQuestionRow();

      let marksA = rowA.querySelector(".marks_input");
      let marksB = rowB.querySelector(".marks_input");
      let noOfQuestionsA = rowA.querySelector(".no_of_questions_input");
      let noOfQuestionsB = rowB.querySelector(".no_of_questions_input");

      function checkEitherOrMarks() {
        let valA = parseInt(marksA.value);
        let valB = parseInt(marksB.value);

        let countA = parseInt(noOfQuestionsA.value);
        let countB = parseInt(noOfQuestionsB.value);

        let totalMarksA = countA * valA;
        let totalMarksB = countB * valB;

        if (!isNaN(valA) && !isNaN(valB) && totalMarksA !== totalMarksB) {
          marksB.setCustomValidity("Marks must match for Either-Or");
        } else {
          marksB.setCustomValidity("");
        }
      }

      marksA.oninput = checkEitherOrMarks;
      marksB.oninput = checkEitherOrMarks;

      dynamicDiv.appendChild(rowA);

      let orLine = document.createElement("p");
      orLine.classList.add("text-center", "fw-bold", "mt-2", "mb-2");
      orLine.innerText = "OR";
      dynamicDiv.appendChild(orLine);

      dynamicDiv.appendChild(rowB);
    }

    questionDiv.appendChild(dynamicDiv);
  };
}

function updateSaveButtonVisibility() {
  if (checkTotalMarks(true)) {
    saveTemplateBtn.style.display = "block";
  } else {
    saveTemplateBtn.style.display = "none";
  }
}

function deletePart(form) {
  let parent = form.parentElement;
  form.remove();
  updateSaveButtonVisibility();

  let index = parts.indexOf(form.id.split("part_form_")[1]);
  if (index > -1) {
    parts.splice(index, 1);
  }

  if (parent.children.length === 0) {
    partsDiv.style.display = "none";

    createTemplateBtn.style.display = "block";
    saveTemplateBtn.style.display = "none";
    questionSection.style.display = "none";
    setPartName();
    return;
  }

  setPartName();
}

function deleteQuestionRow(questionDiv) {
  questionDiv.remove();
  updateSaveButtonVisibility();
}

function saveTemplate() {
  let isTemplateMarksValid = checkTotalMarks(true);
  if (!isTemplateMarksValid) {
    alert(
      "Total marks assigned to parts do not equal total marks of the template.",
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
        `Total marks exceed maximum marks for part ${partName}. Please adjust the number of questions or marks per question.`,
      );
      return;
    } else if (checkPartMark == "low") {
      alert(
        `Total marks less than maximum marks for part ${partName}. Please adjust the number of questions or marks per question.`,
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
      let typeSelect = questionRows[j].getElementsByClassName("type_select")[0];
      let type = typeSelect.value;
      let questionData = {
        type: type,
      };

      if (type === "single") {
        let sectionSelect =
          questionRows[j].getElementsByClassName("section_select")[0];
        questionData.section_id = sectionSelect.value;

        let topicSelect =
          questionRows[j].getElementsByClassName("topic_select")[0];
        questionData.topic_id = topicSelect.value;

        let btlSelect = questionRows[j].getElementsByClassName("btl_select")[0];
        questionData.btl_level = btlSelect.value;

        let noOfQuestionsInput = questionRows[j].getElementsByClassName(
          "no_of_questions_input",
        )[0];
        questionData.no_of_questions = noOfQuestionsInput.value;

        let questionTypeSelect = questionRows[j].getElementsByClassName(
          "question_type_select",
        )[0];
        questionData.question_type = questionTypeSelect.value;

        let marksInput =
          questionRows[j].getElementsByClassName("marks_input")[0];
        questionData.marks_per_question = marksInput.value;
      } else if (type === "either_or") {
        let sectionSelects =
          questionRows[j].getElementsByClassName("section_select");
        let topicSelects =
          questionRows[j].getElementsByClassName("topic_select");
        let btlSelects = questionRows[j].getElementsByClassName("btl_select");
        let noOfQuestionsInputs = questionRows[j].getElementsByClassName(
          "no_of_questions_input",
        );
        let marksInputs = questionRows[j].getElementsByClassName("marks_input");
        let questionTypeSelects = questionRows[j].getElementsByClassName(
          "question_type_select",
        );

        questionData.questions = [
          {
            section_id: sectionSelects[0].value,
            topic_id: topicSelects[0].value,
            btl_level: btlSelects[0].value,
            no_of_questions: noOfQuestionsInputs[0].value,
            marks_per_question: marksInputs[0].value,
            question_type: questionTypeSelects[0].value,
          },
          {
            section_id: sectionSelects[1].value,
            topic_id: topicSelects[1].value,
            btl_level: btlSelects[1].value,
            no_of_questions: noOfQuestionsInputs[1].value,
            marks_per_question: marksInputs[1].value,
            question_type: questionTypeSelects[1].value,
          },
        ];
      }

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
  out.is_mcq = null;

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
