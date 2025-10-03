let questionDiv = document.getElementById("question_div");
let resultDiv = document.getElementById("result_div");
let nextButton = document.getElementById("next_question");
let previousButton = document.getElementById("previous_question");
let questionNo = document.getElementById("question_no");
let submitButton = document.getElementById("submit_test");
let testTitle = document.getElementById("title");

let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");

let answers = [];
let questions = [];
let previousIndex = 0;
let currentQuestion = null;
let correctAnswer = [];
let testType = "";

nextButton.addEventListener("click", nextQuestion);
previousButton.addEventListener("click", previousQuestion);
submitButton.addEventListener("click", submitTest);

async function init() {
  await getQuestionPapers();
}

function showQuestionPapers(data) {
  if (data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    resultTable.style.display = "none";
    hideOverlay();
    return;
  }
  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.No"),
        new TableStructure("Question Paper Name"),
        new TableStructure("Type"),
        new TableStructure("Start Time"),
        new TableStructure("End Time"),
        new TableStructure("Attempts"),
        new TableStructure("Max Attempts"),
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((record, index) => {
    let actionBtn = `
      <button 
        class="btn btn-sm btn-primary take-test-btn" 
        data-id="${record.question_paper_id}"
        data-name="${record.question_paper_name}"
        data-start="${record.start_date_time}"
        data-end="${record.end_date_time}"
        data-attempts="${record.attempts}"
        data-max_attempts="${record.max_attempts}"
        data-group_id="${record.group_id}"
      >
        Take Test
      </button>
    `;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(record.question_paper_name),
      new TableStructure(record.test_type),
      new TableStructure(record.start_date_time),
      new TableStructure(record.end_date_time),
      new TableStructure(record.attempts ?? 0),
      new TableStructure(record.max_attempts),
      new TableStructure(actionBtn),
    ]);
  });

  displayResult(tableData, resultTable);
  fetchingDataSection.style.display = "none";
  resultTable.style.display = "table";

  $(".take-test-btn")
    .off("click")
    .on("click", function () {
      let id = $(this).data("id");
      let name = $(this).data("name");
      let start = $(this).data("start");
      let end = $(this).data("end");
      let attempts = $(this).data("attempts");
      let max_attempts = $(this).data("max_attempts");
      let group_id = $(this).data("group_id");

      let currentTime = new Date();

      if (new Date(start) > currentTime) {
        alert("The test has not started yet.");
        return;
      }

      if (new Date(end) < currentTime) {
        alert("The test has already ended.");
        return;
      }

      if (attempts >= max_attempts) {
        alert("You have reached the maximum number of attempts for this test.");
        return;
      }

      getQuestionPaperDetails(id, group_id);
    });

  hideOverlay();
}

async function getQuestionPapers() {
  showOverlay();
  var out = {
    function: "gaq",
    user_id: loggedInUser.register_num,
  };
  try {
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      showQuestionPapers(response.result.question_papers);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching question papers");
    hideOverlay();
    return;
  }
}

async function getQuestionPaperDetails(id, group_id) {
  let payload = {
    function: "gqftt",
    question_paper_id: id,
    group_id: group_id,
  };

  let response = await postCall(examCellEndPoint, JSON.stringify(payload));

  if (response.success) {
    questions = response.result.questions;
    questions.questions = JSON.parse(questions.questions);
    resultTable.style.display = "none";
    testTitle.innerText = `Test: ${questions.question_paper_name}`;
    submitButton.style.display = "inline-block";
    testType = questions.test_type;
    nextQuestion();
  }
}

function setQuestionNumber(q_no) {
  questionNo.innerText = `Question ${q_no}/${
    questions.questions.length + answers.length
  }`;
}

function saveAnswer() {
  let answerIndex = answers.findIndex(
    (a) => a.question_id == currentQuestion.question_id
  );
  let selectedOption = document.querySelector(
    `input[name="question_${currentQuestion.question_id}"]:checked`
  );

  if (selectedOption) {
    answers[answerIndex].selected_option = selectedOption.value;
  } else {
    answers[answerIndex].selected_option = null;
  }
}

function setCompletionTime() {
  let completionTime = new Date().toISOString();
  let answerIndex = answers.findIndex(
    (a) => a.question_id == currentQuestion.question_id
  );
  if (answers[answerIndex].hasOwnProperty("completion_time")) {
    answers[answerIndex].completion_time.push(completionTime);
  } else {
    answers[answerIndex].completion_time = [completionTime];
  }
}

function nextQuestion() {
  if (answers.length > 0) {
    setCompletionTime();
  }
  let selectedQuestion = null;
  if (previousIndex > 0) {
    selectedQuestion = answers[answers.length - previousIndex];
    setQuestionNumber(answers.length - previousIndex + 1);
  }
  if (selectedQuestion == null) {
    if (questions.shuffle_questions == false) {
      selectedQuestion = questions.questions[0];
    } else {
      let randomIndex = Math.floor(Math.random() * questions.questions.length);
      selectedQuestion = questions.questions[randomIndex];
    }
    answers.push(selectedQuestion);
    questions.questions = questions.questions.filter(
      (q) => q.question_id != selectedQuestion.question_id
    );
    setQuestionNumber(answers.length);
  }

  showQuestion(selectedQuestion);

  if (previousIndex > 0) {
    previousIndex -= 1;
  }
  nextButton.style.display = "inline-block";
  if (answers.length > 1 && previousIndex <= answers.length) {
    previousButton.style.visibility = "visible";
  }
  if (questions.questions.length == 0 && previousIndex == 0) {
    nextButton.style.display = "none";
  }
}

function previousQuestion() {
  previousIndex += 1;
  if (answers.length - previousIndex == 1) {
    previousButton.style.visibility = "hidden";
  }
  nextButton.style.display = "inline-block";
  let selectedQuestion = answers[answers.length - 1 - previousIndex];

  setCompletionTime();
  setQuestionNumber(answers.length - previousIndex);
  showQuestion(selectedQuestion);
}

function showQuestion(question) {
  currentQuestion = question;

  let choices = question.choices;
  let choiceHTML = `<div style="display: flex; flex-direction: column; gap: 8px; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;

  let alreadyAnswered = answers.find(
    (q) => q.question_id == question.question_id
  );

  for (let key in choices) {
    let selected = "";
    if (alreadyAnswered && alreadyAnswered.selected_option == key) {
      selected = "checked";
    }

    let inputId = `choices_${question.question_id}`;
    choiceHTML += `
                    <label  style="display: flex; align-items: left; gap: 5px;">
                        <input 
                            type="radio" 
                            id="${inputId}" 
                            name="question_${question.question_id}"  
                            value="${key}" 
                            ${selected}
                        />
                        <span class="latex" style="font-size: 100%; font-family: 'Times New Roman', Times, serif;">
                            ${choices[key]}
                        </span>
                    </label>`;
  }

  let questionHTML = `
                <div>
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                         ${question.question}
                    </p>
                    ${choiceHTML}
                </div>
            `;
  questionDiv.innerHTML = questionHTML;

  let startTime = new Date().toISOString();

  let currentAnswerIndex = answers.findIndex(
    (q) => q.question_id == question.question_id
  );

  if (answers[currentAnswerIndex].hasOwnProperty("start_time")) {
    answers[currentAnswerIndex]["start_time"].push(startTime);
  } else {
    answers[currentAnswerIndex].start_time = [startTime];
  }
  MathJax.typeset();

  $("input[type=radio]").click(function () {
    saveAnswer();
  });

  resultDiv.style.display = "block";
}

async function submitTest() {
  showOverlay();
  setCompletionTime();

  let startTime = null;
  let endTime = null;
  let totalTime = 0;

  let allAnswered = [];
  startTime = answers[0].start_time[0];
  answers.forEach((a) => {
    let completionTimes = a.completion_time;
    if (completionTimes && completionTimes.length > 0) {
      let lastCompletionTime = completionTimes[completionTimes.length - 1];
      if (endTime == null || new Date(lastCompletionTime) > new Date(endTime)) {
        endTime = lastCompletionTime;
      }
    }
  });

  answers.forEach((a) => {
    let timeTaken = 0;
    a.start_time.forEach((t, index) => {
      if (a.completion_time && a.completion_time[index]) {
        timeTaken += (new Date(a.completion_time[index]) - new Date(t)) / 1000;
      }
    });
    totalTime += timeTaken;
    allAnswered.push({
      question_id: a.question_id,
      total_time: timeTaken.toFixed(0),
      start_time: a.start_time[0],
      end_time: a.completion_time[a.completion_time.length - 1],
      selected_option: a.selected_option ? a.selected_option : null,
    });
  });

  let out = {
    question_paper_id: questions.question_paper_id,
    type: testType,
    attempt_start_time: startTime,
    attempt_end_time: endTime,
    total_time: totalTime.toFixed(0),
    answers: JSON.stringify(allAnswered),
    user_id: loggedInUser.register_num,
    get_correct_answers: false,
    function: "iusa",
  };
  try {
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      submitButton.style.display = "none";
      alert(response.message);

      if (testType == "Self") {
        displayCorrectAnswers();
      } else {
        hideOverlay();
        await getQuestionPapers();
        testTitle.innerText = `Take Test`;
        questionDiv.innerHTML = "";
        resultDiv.style.display = "none";
      }
    } else {
      throw new Error(response.message || "Failed to submit the test");
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "An error occurred while submitting the test.");
    hideOverlay();
  }
}

function displayCorrectAnswers() {
  questionDiv.innerHTML = "";
  nextButton.style.display = "none";
  previousButton.style.display = "none";
  submitButton.style.display = "none";

  questions.questions.forEach((q) => {
    answers.push({ ...q, selected_option: null });
  });

  let totalQuestions = answers.length;
  let correctCount = 0;

  answers.forEach((question, index) => {
    let choices = question.choices;
    let choiceHTML = `<div style="display: flex; flex-direction: column; gap: 8px; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;

    for (let key in choices) {
      let selected = "";
      let backgroundColor = "";
      let fontWeight = "normal";
      let padding = "5px";
      let borderRadius = "6px";

      if (key == question.correct_answer) {
        backgroundColor = "#87b97cff";
        fontWeight = "bold";
      }

      if (key == question.correct_answer && key == question.selected_option) {
        correctCount += 1;
      }

      if (question.selected_option == key) {
        selected = "checked";
      }

      if (question.selected_option == key && key != question.correct_answer) {
        backgroundColor = "#df6e6eff";
      }

      let inputId = `choices_${question.question_id}`;
      choiceHTML += `
                    <label  style="display: flex; align-items: left; gap: 5px; background-color: ${backgroundColor};  font-weight: ${fontWeight}; padding: ${padding}; border-radius: ${borderRadius};">
                        <input 
                            type="radio" 
                            id="${inputId}" 
                            name="question_${question.question_id}"  
                            value="${key}" 
                            ${selected}
                            disabled
                        />
                        <span class="latex" style="font-size: 100%; font-family: 'Times New Roman', Times, serif;">
                            ${choices[key]}
                        </span>
                    </label>`;
    }

    let questionHTML = `
                <div style="margin-bottom: 20px;">
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                      ${index + 1}) ${question.question}
                    </p>
                    ${choiceHTML}
                </div>
            `;
    questionDiv.innerHTML += questionHTML;

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

    MathJax.typeset();
  });
  questionNo.innerHTML = "";
  hideOverlay();
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
