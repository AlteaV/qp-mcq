var programType = document.getElementById("program_type");
var branchCode = document.getElementById("branch_code");
let semester = document.getElementById("semester");
let regulation = document.getElementById("regulation");
let subject = document.getElementById("sub_code");

let fetchingDataSection = document.getElementById("fetching_data");

let questionsSection = document.getElementById("vsDetails");

programType.addEventListener("change", function () {
  setDepartment(branchCode, programType.value);
});

branchCode.addEventListener("change", function () {
  setSemester(semester, branchCode.value);
});

semester.addEventListener("change", function () {
  setRegulation(regulation, branchCode.value, semester.value);
});

regulation.addEventListener("change", function () {
  setSubject(subject, branchCode.value, semester.value, regulation.value);
});

setProgramType(programType);

let questions_papers = [];

let table = $("#questions_table").DataTable({
  info: false,
  ordering: false,
  paging: false,
  columns: [
    {
      data: "subject_question_paper_id",
      render: function (data, type, full, meta) {
        return meta.row + meta.settings._iDisplayStart + 1;
      },
    },
    { data: "question_paper_name" },
    { data: "created_time" },
    { data: "two_marks" },
    { data: "eight_marks" },
    { data: "sixteen_marks" },
    {
      data: "subject_question_paper_id",
      render: function (data, type, full, meta) {
        return (
          "<input class='btn btn-primary' type='button' data-bs-toggle='modal' data-bs-target='#exampleModalCenter' value='View'  onclick=downloadQuestionPaper('" +
          data +
          "')>"
        );
      },
    },
  ],
  columnDefs: [
    { targets: [1, 2, 3, 4] },
    { width: "40%", targets: [1] },
    { width: "10%", targets: [0, 2, 3, 4, 5] },
  ],
  orderCellsTop: true,
  fixedHeader: true,
  searching: false,
  destroy: true,
});

function displayResult() {
  table.clear();
  table.rows.add(questions_papers);
  table.draw();
  $("#details").show();
}

let questions_paper = [];
function showQuestionPaper() {
  questionsSection.innerHTML = "";

  let h3 = document.createElement("h3");
  h3.style.cssText = "text-align: center;";
  h3.textContent = "Part A";

  questionsSection.appendChild(h3);

  let twoMarks = questions_paper.filter((question) => question.marks == 2);

  twoMarks.forEach((question, index) => {
    let blockDiv = document.createElement("div");
    blockDiv.classList.add("mb-5");

    let rowDiv = document.createElement("row-div");
    rowDiv.classList.add("row");

    rowDiv.appendChild(createQuestionNumber(index + 1));

    let colDiv = document.createElement("div");
    colDiv.classList.add("col");

    let h5 = document.createElement("h5");
    h5.textContent = index + 1;

    let que = document.createElement("p");
    que.textContent = question.question;
    colDiv.appendChild(que);

    rowDiv.appendChild(colDiv);

    questionsSection.appendChild(rowDiv);
  });

  let h3PartB = document.createElement("h3");
  h3PartB.style.cssText = "text-align: center;";
  h3PartB.textContent = "Part B";
  questionsSection.appendChild(h3PartB);

  let otherQuestions = questions_paper.filter(
    (question) => question.marks != 2
  );

  for (let i = 11; i <= 15; i++) {
    let blockDiv = document.createElement("div");

    let rowDiv = document.createElement("row-div");
    rowDiv.classList.add("row");

    rowDiv.appendChild(createQuestionNumber(i));

    let colDiv2 = document.createElement("div");
    colDiv2.classList.add("col");

    let questions = otherQuestions.filter(
      (question) => JSON.parse(question.question_no).number == i
    );

    let partAQuestions = questions.filter(
      (question) => JSON.parse(question.question_no).part == "A"
    );

    let partBQuestions = questions.filter(
      (question) => JSON.parse(question.question_no).part == "B"
    );

    let rowDiv2 = document.createElement("row-div");
    rowDiv2.classList.add("row");

    if (partBQuestions.length != 0) {
      rowDiv2.appendChild(createQuestionNumber("A"));
    }
    if (partAQuestions.length == 1) {
      rowDiv2.appendChild(createQuestion(partAQuestions[0].question, ""));
    } else {
      rowDiv2.appendChild(
        createQuestion(
          "i) " + partAQuestions[0].question,
          "ii) " + partAQuestions[1].question
        )
      );
    }

    colDiv2.appendChild(rowDiv2);

    if (partBQuestions.length != 0) {
      colDiv2.appendChild(createOrElement());
      let rowDiv3 = document.createElement("row-div");
      rowDiv3.classList.add("row");
      if (partBQuestions.length == 1) {
        rowDiv3.appendChild(createQuestionNumber("B"));
        rowDiv3.appendChild(createQuestion(partBQuestions[0].question, ""));
      } else {
        rowDiv3.appendChild(createQuestionNumber("B"));
        rowDiv3.appendChild(
          createQuestion(
            "i) " + partBQuestions[0].question,
            "ii) " + partBQuestions[1].question
          )
        );
      }

      colDiv2.appendChild(rowDiv3);
    }

    rowDiv.appendChild(colDiv2);

    blockDiv.append(rowDiv);
    questionsSection.append(blockDiv);

    if (i != 15) {
      var hr = document.createElement("hr");
      questionsSection.append(hr);
    }
  }
}

function printQuestionPaper() {
  const container = document.getElementById("vsDetails");
  const content = container.innerText;

  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "questions.txt";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}
