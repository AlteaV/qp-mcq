let fetchedQuestions = [];
let fetchedQuestionsCopy = [];

let questionPaper = [];

function displayResult() {
  if (!checkQuestions()) {
    return;
  }
  fetchedQuestionsCopy = [...fetchedQuestions];
  resultDivSection.innerHTML = "";
  questionPaper = [];

  let twoMarks = fetchedQuestions.filter((question) => question.marks == 2);

  let h3 = document.createElement("h3");
  h3.style.cssText = "text-align: center;";
  h3.textContent = "Part A";

  resultDivSection.appendChild(h3);

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

    resultDivSection.appendChild(rowDiv);

    questionPaper.push({
      question_id: question.id,
      question_no: { number: index + 1, part: "", sub_division: "" },
    });
  });
  let h3PartB = document.createElement("h3");
  h3PartB.style.cssText = "text-align: center;";
  h3PartB.textContent = "Part B";
  resultDivSection.appendChild(h3PartB);
  for (let i = 11; i <= 15; i++) {
    let questions = partBQuestions.filter(
      (question) => question.questionNumber == i
    );

    let questionsPartCount = questions.length;

    let blockDiv = document.createElement("div");

    let rowDiv = document.createElement("row-div");
    rowDiv.classList.add("row");

    rowDiv.appendChild(createQuestionNumber(i));

    let colDiv2 = document.createElement("div");
    colDiv2.classList.add("col");

    questions.forEach((question, index) => {
      let rowDiv2 = document.createElement("row-div");
      rowDiv2.classList.add("row");
      if (questionsPartCount > 1) {
        rowDiv2.appendChild(createQuestionNumber(question.part));
      }
      let que = "";
      let que2 = "";
      if (question.noOfQestions == 2) {
        que = filterQuestion(question.units[0], question.marksSelected);

        if (question.units.lenth == 2) {
          que2 = filterQuestion(question.units[1], question.marksSelected);
        } else {
          que2 = filterQuestion(question.units[0], question.marksSelected);
        }

        questionPaper.push({
          question_id: que.id,
          question_no: { number: i, part: question.part, sub_division: "1" },
        });

        questionPaper.push({
          question_id: que2.id,
          question_no: { number: i, part: question.part, sub_division: "2" },
        });
        rowDiv2.appendChild(
          createQuestion("i) " + que.question, "ii) " + que2.question)
        );
      } else {
        que = filterQuestion(question.units[0], question.marksSelected);
        rowDiv2.appendChild(createQuestion(que.question, ""));

        questionPaper.push({
          question_id: que.id,
          question_no: { number: i, part: question.part, sub_division: "" },
        });
      }

      colDiv2.appendChild(rowDiv2);

      if (questionsPartCount > 1 && questionsPartCount != index + 1) {
        colDiv2.appendChild(createOrElement());
      }
    });

    rowDiv.appendChild(colDiv2);

    blockDiv.append(rowDiv);

    resultDivSection.append(blockDiv);

    if (i != 15) {
      var hr = document.createElement("hr");
      resultDivSection.append(hr);
    }
  }
  $("#template_selection_div").hide();
  $("#questions_div").show();
}
function checkQuestions() {
  let twoMarks = fetchedQuestions.filter(
    (question) => question.marks == 2
  ).length;

  if (twoMarks < out.two_marks.no_of_questions) {
    alert(
      `Not enough 2 marks questions available for ${subject.value}.\nUpload questions.`
    );
    return false;
  }

  let eightMarkNeeded = out.eight_marks.reduce(
    (n, { no_of_questions }) => n + no_of_questions,
    0
  );

  let eightMarks = fetchedQuestions.filter(
    (question) => question.marks == 8
  ).length;
  if (eightMarks < eightMarkNeeded) {
    alert(
      `Not enough 8 marks questions available for ${subject.value}.\nUpload questions.`
    );
    return false;
  }

  let sixteenMarkNeeded = out.sixteen_marks.reduce(
    (n, { no_of_questions }) => n + no_of_questions,
    0
  );

  let sixteenMarks = fetchedQuestions.filter(
    (question) => question.marks == 16
  ).length;

  if (sixteenMarks < sixteenMarkNeeded) {
    alert(
      `Not enough 16 marks questions available for ${subject.value}.\nUpload questions.`
    );
    return false;
  }

  return true;
}
function createQuestion(q1, q2) {
  let questionDiv = document.createElement("div");
  questionDiv.classList.add("col");

  let que = document.createElement("p");
  que.textContent = q1;

  if (q2 != "") {
    let questionDiv = document.createElement("div");
    questionDiv.classList.add("additional-content");

    let que2 = document.createElement("p");
    que2.textContent = q2;
    que.appendChild(que2);
  }

  questionDiv.appendChild(que);

  return questionDiv;
}

function filterQuestion(unit, mark) {
  let question = fetchedQuestionsCopy.find(
    (q) => q.marks == mark && q.unit == unit
  );
  let index = fetchedQuestionsCopy.indexOf(question);

  let deletedQuestion = fetchedQuestionsCopy.splice(index, 1);

  return deletedQuestion[0];
}
