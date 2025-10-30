let questionDiv = document.getElementById("question_div");
let resultDiv = document.getElementById("result_div");
let nextButton = document.getElementById("next_question");
let previousButton = document.getElementById("previous_question");
let submitButton = document.getElementById("submit_test");
let testTitle = document.getElementById("title");
let questionNo = document.getElementById("question_no");
resultTable = document.getElementById("result_table");

nextButton.addEventListener("click", nextQuestion);
previousButton.addEventListener("click", previousQuestion);
submitButton.addEventListener("click", submitTest);

let answers = [];
let previousIndex = 0;
let questions = [];
let currentQuestion = null;
let correctAnswer = [];
let testType = "";

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
  } else {
    submitButton.style.display = "block";
    nextButton.style.visibility = "visible";
    submitButton.style.visibility = "visible";
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
  hideOverlay();
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

async function showQuestion(question) {
  currentQuestion = question;

  let choices = question.choices;
  if (typeof choices === "string") {
    try {
      choices = JSON.parse(choices);
    } catch {
      choices = question.choices;
    }
  }
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
  try {
    if (window.MathJax) {
      if (typeof MathJax.typesetPromise === "function") {
        await MathJax.typesetPromise();
      } else if (typeof MathJax.typeset === "function") {
        MathJax.typeset();
      }
    }
  } catch (error) {
    console.error("MathJax typeset error:", error);
    alert("Error rendering mathematical expressions.");
  }

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

  let correctCount = 0;
  answers.forEach((a) => {
    let timeTaken = 0;
    a.start_time.forEach((t, index) => {
      if (a.completion_time && a.completion_time[index]) {
        timeTaken += (new Date(a.completion_time[index]) - new Date(t)) / 1000;
      }
    });
    totalTime += timeTaken;
    let temp = {
      question_id: a.question_id,
      total_time: timeTaken.toFixed(0),
      start_time: a.start_time[0],
      end_time: a.completion_time[a.completion_time.length - 1],
      selected_option: a.selected_option ? a.selected_option : null,
    };
    if (testType == "Self") {
      let ques = questions.questions.find(
        (q) => q.question_id == a.question_id
      );
      if (!ques) {
        ques = answers.find((q) => q.question_id == a.question_id);
      }

      if (ques && ques.correct_answer == a.selected_option) {
        temp.is_correct = true;
        correctCount += 1;
      } else {
        temp.is_correct = false;
      }
    }
    allAnswered.push(temp);
  });

  if (testType == "Self") {
    questions.questions.forEach((q) => {
      allAnswered.push({
        question_id: q.question_id,
        total_time: 0,
        start_time: null,
        end_time: null,
        selected_option: null,
        is_correct: false,
      });
    });
  }

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

  if (testType == "Self") {
    out.total_questions = allAnswered.length;
    out.obtained_mark = correctCount;
    out.question_paper_id = null;
    out.function = "sst";
  }

  try {
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      submitButton.style.display = "none";
      alert(response.message);

      if (testType == "Self") {
        displayCorrectAnswers();
      } else {
        hideOverlay();

        answers = [];
        previousIndex = 0;
        questions = [];
        currentQuestion = null;
        correctAnswer = [];
        testType = "";

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
  nextButton.style.visibility = "hidden";
  previousButton.style.visibility = "hidden";
  submitButton.style.visibility = "hidden";

  questions.questions.forEach((q) => {
    answers.push({ ...q, selected_option: null });
  });

  let totalQuestions = answers.length;
  let correctCount = 0;

  answers.forEach(async (question, index) => {
    let choices = question.choices;
    if (typeof choices === "string") {
      try {
        choices = JSON.parse(choices);
      } catch {
        choices = question.choices;
      }
    }
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
    scoreDiv.style.display = "block";
    scoreDiv.style.visibility = "visible";
    try {
      if (window.MathJax) {
        if (typeof MathJax.typesetPromise === "function") {
          await MathJax.typesetPromise();
        } else if (typeof MathJax.typeset === "function") {
          MathJax.typeset();
        }
      }
    } catch (error) {
      console.error("MathJax typeset error:", error);
      alert("Error rendering mathematical expressions.");
    }
  });
  questionNo.innerHTML = "";
  hideOverlay();
}
