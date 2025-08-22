let partBContainer = document.getElementById("partBSubdivisions");
let partBQuestionType = document.getElementById("part_b_question_type");
function generatePartAQuestionsUI() {
  let partAList = document.getElementById("partAQuestions");
  for (let i = 1; i <= 10; i++) {
    let listItem = document.createElement("li");
    listItem.classList.add("list-group-item");
    listItem.textContent = `Q${i}: Question ${i}`;
    partAList.appendChild(listItem);
  }
}

function generatePartB() {
  let blockCount = 5;
  let questionNumber = 11;
  if (partBQuestionType.value == "Either Or") {
    partBContainer.innerHTML = "";
    for (let i = 1; i <= blockCount; i++) {
      let blockDiv = document.createElement("div");
      blockDiv.classList.add("mb-5");

      let rowDiv = document.createElement("row-div");
      rowDiv.classList.add("row");

      rowDiv.appendChild(createQuestionNumber(questionNumber));

      let colDiv2 = document.createElement("div");
      colDiv2.classList.add("col");

      let rowDiv2 = document.createElement("row-div");
      rowDiv2.classList.add("row");

      let name = "A_" + questionNumber;
      rowDiv2.appendChild(createQuestionNumber("A"));
      rowDiv2.appendChild(createMarks(name));
      rowDiv2.appendChild(createNoOfQuestion(name));
      rowDiv2.appendChild(createUnit(name, "A"));

      let rowDiv3 = document.createElement("row-div");
      rowDiv3.classList.add("row");

      name = "B_" + questionNumber;

      rowDiv3.appendChild(createQuestionNumber("B"));
      rowDiv3.appendChild(createMarks(name));
      rowDiv3.appendChild(createNoOfQuestion(name));
      rowDiv3.appendChild(createUnit(name, "B"));

      questionNumber++;

      colDiv2.appendChild(rowDiv2);
      colDiv2.appendChild(createOrElement());
      colDiv2.appendChild(rowDiv3);

      rowDiv.appendChild(colDiv2);

      blockDiv.append(rowDiv);

      partBContainer.appendChild(blockDiv);
    }
  } else {
    partBContainer.innerHTML = "";
    for (let i = 1; i <= blockCount; i++) {
      let blockDiv = document.createElement("div");
      blockDiv.classList.add("mb-5");

      let rowDiv = document.createElement("row-div");
      rowDiv.classList.add("row");

      let name = "A_" + questionNumber;

      rowDiv.appendChild(createQuestionNumber(questionNumber));
      rowDiv.appendChild(createMarks(name));
      rowDiv.appendChild(createNoOfQuestion(name));
      rowDiv.appendChild(createUnit(name, "A"));

      questionNumber++;

      blockDiv.appendChild(rowDiv);

      partBContainer.appendChild(blockDiv);
    }
  }
}

function createQuestionNumber(questionNumber) {
  let questionDiv = document.createElement("div");
  questionDiv.classList.add("col-auto");
  questionDiv.innerHTML = `<h5>${questionNumber}</h5>`;
  questionDiv.setAttribute("style", "align-self: center;");
  return questionDiv;
}

function createMarks(id) {
  let marksDiv = document.createElement("div");
  marksDiv.classList.add("col");

  let markId = "mark_" + id;
  let labelElement = document.createElement("label");
  labelElement.setAttribute("for", markId);
  labelElement.classList.add("required");
  labelElement.textContent = "Marks";

  let selectElement = document.createElement("select");

  selectElement.classList.add("3col", "active", "form-select");
  selectElement.setAttribute("name", markId);
  selectElement.setAttribute("id", markId);
  selectElement.setAttribute("required", "true");
  selectElement.addEventListener("change", function () {
    updateQuestions(id);
  });

  let optionElement = document.createElement("option");
  optionElement.textContent = "16";
  selectElement.appendChild(optionElement);
  optionElement = document.createElement("option");
  optionElement.textContent = "8";
  selectElement.appendChild(optionElement);

  marksDiv.appendChild(labelElement);
  marksDiv.appendChild(selectElement);

  return marksDiv;
}

function createNoOfQuestion(id) {
  let questionCountDiv = document.createElement("div");
  questionCountDiv.classList.add("col");

  let questionCountId = "question_count_" + id;
  let labelElement = document.createElement("label");
  labelElement.setAttribute("for", questionCountId);
  labelElement.classList.add("required");
  labelElement.textContent = "No of questions";

  let selectElement = document.createElement("select");

  selectElement.classList.add("3col", "active", "form-select");
  selectElement.setAttribute("name", questionCountId);
  selectElement.setAttribute("id", questionCountId);
  selectElement.setAttribute("required", "true");
  selectElement.setAttribute("disabled", "true");
  selectElement.addEventListener("change", function () {
    updateQuestions(id);
  });

  let optionElement = document.createElement("option");
  optionElement.textContent = "1";
  selectElement.appendChild(optionElement);
  optionElement = document.createElement("option");
  optionElement.textContent = "2";
  selectElement.appendChild(optionElement);

  questionCountDiv.appendChild(labelElement);
  questionCountDiv.appendChild(selectElement);

  return questionCountDiv;
}

function updateQuestions(id) {
  let markId = "mark_" + id;
  let questionCountId = "question_count_" + id;

  let markElement = document.getElementById(markId);
  let questionCountElement = document.getElementById(questionCountId);

  if (markElement.value == 16) {
    questionCountElement.value = 1;
  } else {
    questionCountElement.value = 2;
  }

  let unitName = `unit_selected_${id}`;
  let unitsCheckBox = document.querySelectorAll("[name='" + unitName + "']");

  unitsCheckBox.forEach((checkBox) => (checkBox.checked = false));
}

function createUnit(id, part) {
  let unitDiv = document.createElement("div");
  unitDiv.classList.add("col");

  let unitElement = document.createElement("label");
  unitElement.setAttribute("for", "unit");
  unitElement.classList.add("required");
  unitElement.textContent = "Unit";
  unitDiv.appendChild(unitElement);
  unitDiv.appendChild(document.createElement("br"));

  for (let i = 1; i <= 5; i++) {
    let formCheckDiv = document.createElement("div");
    formCheckDiv.classList.add("form-check", "form-check-inline");

    let checkboxInput = document.createElement("input");
    checkboxInput.classList.add("form-check-input");
    checkboxInput.type = "checkbox";
    checkboxInput.id = `unit_selected_${id}_${part}_${i}`;
    checkboxInput.name = `unit_selected_${id}`;
    checkboxInput.value = i;

    let checkboxLabel = document.createElement("label");
    checkboxLabel.classList.add("form-check-label");
    checkboxLabel.setAttribute("for", `unit_selected_${id}_${part}_${i}`);
    checkboxLabel.textContent = i;

    checkboxInput.addEventListener("change", function () {
      unitSelectionCondition(id, i, part);
    });

    checkboxLabel.addEventListener("change", function () {
      unitSelectionCondition(id, i, part);
    });

    formCheckDiv.appendChild(checkboxInput);
    formCheckDiv.appendChild(checkboxLabel);

    unitDiv.appendChild(formCheckDiv);
  }
  return unitDiv;
}

function createOrElement() {
  let orElement = document.createElement("p");
  orElement.classList.add(
    "mb-2",
    "mt-2",
    "text-center",
    "text-uppercase",
    "fw-bold",
    "or-entry"
  );
  orElement.textContent = "OR";

  return orElement;
}

function unitSelectionCondition(id, i, part) {
  let unitSelectedId = `unit_selected_${id}`;
  let checkboxes = document.querySelectorAll(
    "[name='" + unitSelectedId + "']:checked"
  );

  let selectedValues = Array.from(checkboxes).map((checkbox) => checkbox.value);

  let questionCountId = "question_count_" + id;
  let checkBoxId = `unit_selected_${id}_${part}_${i}`;

  let questionCountElement = document.getElementById(questionCountId);
  let selectedCheckBox = document.getElementById(checkBoxId);

  if (
    (questionCountElement.value == 1 && selectedValues.length > 1) ||
    (questionCountElement.value == 2 && selectedValues.length > 2)
  ) {
    let checkbox = document.querySelectorAll("[name='" + unitSelectedId + "']");

    for (let i = 0; i < checkbox.length; i++) {
      if (checkbox[i] != selectedCheckBox) {
        checkbox[i].checked = false;
      } else {
        selectedCheckBox.checked = true;
      }
    }
  }
}

function createCol(data) {
  let colDiv = document.createElement("div");
  colDiv.classList.add("col");
  colDiv.innerHTML = `${data ?? ""}`;

  return colDiv;
}
