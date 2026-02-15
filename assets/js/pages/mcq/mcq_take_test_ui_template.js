// Pramams from URL
const params = new URLSearchParams(window.location.search);
const template_id = params.get("template_id");
const qp_assignment_id = params.get("qp_assignment_id");
// elements
const reviewLegend = document.getElementById("reviewLegend1");
const skipLegend = document.getElementById("skipLegend1");
const leftPanel = document.getElementById("left_panel");
const rightPanel = document.getElementById("rightPanel");
const legend = document.getElementById("legend");
const examFooter = document.getElementById("exam_footer");
const enterFullscreenBtn = document.getElementById("enterFullscreenBtn");
const fullscreenOverlay = document.getElementById("fullscreenOverlay");
const container = document.getElementById("subjectsContainer");
const timer = document.getElementById("timer");
const prevArrowBtn = document.querySelector(".arrow-btn");
const nextButton = document.getElementById("next_btn");
const submitTestBtn = document.getElementById("submit_test");
// to track current question start and end time
let currentQuestionTimeStart = null;

let questionsData = []; // to store fetched questions
let questionStates = {}; // to store question states like attempted, unattempted, review marked, etc.
let templateConfig = {}; // to store template details like time limit, ui template, etc.
let questionPaperDetails = {}; // to store qp info

let testStartTime = null;
let testEndTime = null;
let timeLeft = 0;
let currentPage = 1;
let timeElapsed = 0;
let baseFontSize = 14;
let timerInterval = null;
let showfinalScoreUser = null;

async function getQuestionPaperDetails() {
  showOverlay();
  let payload = {
    function: "gqftt",
    qp_assignment_id: qp_assignment_id,
    template_id: template_id,
    user_id:
      loggedInUser.register_num ||
      loggedInUser.user_id ||
      loggedInUser.staff_id,
  };
  try {
    let response = await postCall(examCellEndPoint, JSON.stringify(payload));

    if (response.success) {
      let questionsRes = response.result.questions;
      questionPaperDetails = questionsRes;
      let parsedQuestions = JSON.parse(questionsRes.questions);
      templateConfig = response.result.template;
      showfinalScoreUser = templateConfig.is_show_final_score;
      questionsData = parsedQuestions.map((q, index) => ({
        id: q.question_id,
        subject: q.subject_name,
        maxMark: q.mark,
        question: q.question,
        options: q.choices,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        table: q.table_data,
        images: q.images,
      }));
      questionStates = {};
      if (questionsRes.temp_answer == null) {
        questionsData.forEach((q) => {
          questionStates[q.id] = {
            status: "unattempted",
            selectedAnswer: null,
            isReviewMarked: false,
            start_times: [],
            completion_times: [],
          };
        });
      } else {
        questionStates = JSON.parse(questionsRes.temp_answer);
      }
      prepareContainer();
    } else {
      alert(response.message);
      window.history.back();
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching question paper details");
    return;
  }
}

function prepareContainer() {
  if (templateConfig.full_screen === "Y") {
    fullscreenOverlay.style.display = "flex";
    if (!document.fullscreenElement) {
      enterFullscreenBtn.onclick = () => {
        const elem = document.documentElement;

        const enterFS =
          elem.requestFullscreen ||
          elem.webkitRequestFullscreen ||
          elem.mozRequestFullScreen ||
          elem.msRequestFullscreen;

        if (enterFS) {
          enterFS
            .call(elem)
            .then(() => {
              document.addEventListener("fullscreenchange", async () => {
                if (!document.fullscreenElement) {
                  await submitTempAnswer();
                  window.history.back();
                }
              });
              fullscreenOverlay.style.display = "none";
              initializeUI();
            })
            .catch((err) => {
              alert("Failed to enter fullscreen. Please try again.");
              console.error("Fullscreen error:", err);
            });
        }
      };
    } else {
      initializeUI();
    }
  } else {
    initializeUI();
  }
}

async function submitTempAnswer() {
  showOverlay();
  const payload = {
    assignment_id: questionPaperDetails.assignment_id,
    attempt_id: questionPaperDetails.attempt_id,
    answer: JSON.stringify(questionStates),
    user_id:
      loggedInUser.register_num ||
      loggedInUser.user_id ||
      loggedInUser.staff_id,
    function: "itad",
  };

  try {
    let response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify(payload),
    );

    if (response.success) {
      hideOverlay();
      alert(response.message);
    } else {
      hideOverlay();
      throw new Error(response.message || "Failed to submit test");
    }
  } catch (error) {
    console.error(error);
    alert("Error submitting test: " + error.message);
    hideOverlay();
  }
}

function initializeUI() {
  document.querySelector(".left-panel").style.fontSize = baseFontSize + "px";
  testStartTime = new Date().toISOString();
  Object.entries(questionStates).forEach(([qId, state]) => {
    if (state.hasOwnProperty("start_time")) {
      if (new Date(state.start_time) < new Date(testStartTime)) {
        testStartTime = state.start_time;
      }
    }
  });
  timeLeft = templateConfig.total_duration_mins * 60;
  examFooter.style.display = "flex";

  examTitle.innerHTML = questionPaperDetails.question_paper_name;

  if (
    questionPaperDetails.shuffle_questions === "Y" ||
    questionPaperDetails.shuffle_questions == 1
  ) {
    questionsData = shuffleArray(questionsData);
  }

  if (templateConfig.choose_question_layout === "N") {
    leftPanel.style.display = "full-width";
    rightPanel.style.display = "none";
    legend.style.display = "none";
  } else {
    leftPanel.style.display = "block";
    rightPanel.style.display = "flex";
    legend.style.display = "block";
    renderChooseQuestionsLayout();
  }

  if (templateConfig.disable_right_click === "Y") {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  if (templateConfig.can_review === "Y") {
    reviewLegend.style.display = "flex";
  } else {
    reviewLegend.style.display = "none";
  }

  if (templateConfig.can_skip === "Y") {
    skipLegend.style.display = "flex";
  } else {
    skipLegend.style.display = "none";
  }

  if (templateConfig.show_timer === "dont_show") {
    timer.style.display = "none";
  } else {
    showTimer(templateConfig.show_timer);
  }

  let totalPages = getTotalPages();
  if (totalPages == 1) {
    nextButton.style.display = "none";
    prevArrowBtn.style.display = "none";
  } else {
    nextButton.style.display = "inline-block";
    prevArrowBtn.style.display = "inline-block";

    prevArrowBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderQuestionsPage();
      }
    };

    nextButton.onclick = () => {
      const totalPages = getTotalPages();
      if (currentPage < totalPages) {
        currentPage++;
        renderQuestionsPage();
      } else {
        alert("You are on the last page!");
      }
    };
  }

  submitTestBtn.onclick = async () => {
    submitTest();
  };

  renderQuestionsPage();
  hideOverlay();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showTimer(type) {
  if (type == "count_down") {
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        document.getElementById("timer").innerHTML =
          `⏱ ${mins} min : ${secs} sec`;
      } else {
        clearInterval(timerInterval);
        submitTest();
      }
    }, 1000);
  } else {
    timerInterval = setInterval(() => {
      if (timeElapsed < timeLeft) {
        timeElapsed++;
        const mins = Math.floor(timeElapsed / 60);
        const secs = timeElapsed % 60;
        document.getElementById("timer").innerHTML =
          `⏱ ${mins} min : ${secs} sec`;
      } else {
        clearInterval(timerInterval);
        submitTest();
      }
    }, 1000);
  }
  timer.style.display = "flex";
}

function renderChooseQuestionsLayout() {
  const subjects = {};

  questionsData.forEach((q) => {
    if (!subjects[q.subject]) subjects[q.subject] = [];
    subjects[q.subject].push(q);
  });

  container.innerHTML = "";
  Object.entries(subjects).forEach(([subject, questions]) => {
    const section = document.createElement("div");
    section.className = "subject-section";

    const header = document.createElement("div");
    header.className = "subject-header";
    header.innerHTML = `<span>${
      subject == "null" ? "Questions" : subject
    }</span><span>—</span>`;
    header.style.fontWeight = "600";
    header.style.fontSize = "18px";

    const grid = document.createElement("div");
    grid.className = "question-grid";
    grid.style.display = "grid";

    questions.forEach((q, index) => {
      const btn = document.createElement("button");
      btn.className = "question-btn";
      btn.textContent = index + 1;
      btn.dataset.qid = q.id;
      btn.onclick = () => goToQuestion(q.id);
      grid.appendChild(btn);
    });

    section.appendChild(header);
    section.appendChild(grid);
    container.appendChild(section);

    header.onclick = () => {
      const isVisible = grid.style.display === "grid";
      grid.style.display = isVisible ? "none" : "grid";
      header.querySelector("span:last-child").textContent = isVisible
        ? "+"
        : "—";
    };
  });

  updateQuestionButtons();
}

function setupFontSizeControls() {
  const increaseBtn = leftPanel.querySelector(".font-btn.increase");
  const decreaseBtn = leftPanel.querySelector(".font-btn.decrease");
  if (increaseBtn) {
    increaseBtn.onclick = () => {
      baseFontSize += 2;
      document.querySelector(".left-panel").style.fontSize =
        baseFontSize + "px";
    };
  }

  if (decreaseBtn) {
    decreaseBtn.onclick = () => {
      if (baseFontSize > 12) {
        baseFontSize -= 2;
        document.querySelector(".left-panel").style.fontSize =
          baseFontSize + "px";
      }
    };
  }
}

function goToQuestion(qId) {
  const questionIndex = questionsData.findIndex((q) => q.id === qId);
  const pageNum =
    Math.floor(questionIndex / templateConfig.questions_per_page) + 1;

  if (pageNum !== currentPage) {
    currentPage = pageNum;
    renderQuestionsPage();
  }

  const questionEl = document.querySelector(`input[name="answer-${qId}"]`);
  if (questionEl) {
    const targetDiv =
      questionEl.closest('div[style*="margin-bottom"]') ||
      questionEl.closest("#questionsContainer") ||
      questionEl;
    targetDiv.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function updateQuestionButtons() {
  document.querySelectorAll(".question-btn").forEach((btn) => {
    const qId = parseInt(btn.dataset.qid);
    const state = questionStates[qId];

    btn.className = "question-btn";

    if (state.isReviewMarked) {
      btn.classList.add("review");
    } else if (state.status === "attempted") {
      btn.classList.add("attempted");
    } else if (state.status === "skip") {
      btn.classList.add("skip");
    }
  });
}

async function renderQuestionsPage() {
  const pageQuestions = getQuestionsForPage(currentPage);
  const totalPages = getTotalPages();

  if (currentPage == 1) {
    prevArrowBtn.style.display = "none";
  } else {
    prevArrowBtn.style.display = "inline-block";
  }

  if (currentPage == totalPages) {
    nextButton.style.display = "none";
  } else {
    nextButton.style.display = "inline-block";
  }

  pageQuestions.forEach((q, idx) => {
    const state = questionStates[q.id];
    if (!state.start_times || state.start_times.length === 0) {
      state.start_times = [new Date().toISOString()];
    } else {
      state.start_times.push(new Date().toISOString());
    }
  });

  leftPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: 600; font-size: 18px;">Questions ${
          (currentPage - 1) * templateConfig.questions_per_page + 1
        } - ${Math.min(
          currentPage * templateConfig.questions_per_page,
          questionsData.length,
        )}</span>
        <button class="font-btn increase">A+</button>
        <button class="font-btn decrease">A-</button>
      </div>
      <div style="font-weight: 600;">Page ${currentPage} of ${totalPages}</div>
    </div>
    <div id="questionsContainer"></div>
  `;

  const container = leftPanel.querySelector("#questionsContainer");

  pageQuestions.forEach((q, index) => {
    const state = questionStates[q.id];
    let questionNo = questionsData.findIndex((ques) => ques.id === q.id);

    let marginBottom = "40px";
    let borderBottom = "1px solid #e0e0e0";
    if (index == pageQuestions.length - 1) {
      marginBottom = "0px";
      borderBottom = "none";
    }
    const questionDiv = document.createElement("div");
    questionDiv.style.cssText = `margin-bottom: ${marginBottom}; padding-bottom: 30px; border-bottom: ${borderBottom};`;

    let type = "";
    if (q.question_type == "Mcq") {
      type = "Select the correct answer:";
    } else if (q.question_type == "Numerical") {
      type = "Enter your answer:";
    }

    questionDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div style="font-weight: 600; font-size: 16px;">
          <span style="color: #01050bff;">Question ${questionNo + 1}:</span>
        </div>
      </div>
      
      <div style="margin-bottom: 15px; line-height: 1.8; white-space: pre-wrap; color: #333;">${
        q.question
      }</div>

      ${q.table ? `<p>${renderTableFromMarkdown(q.table)}</p>` : ""}
      ${
        q.images && q.images.length > 0
          ? q.images
              .map((imgObj) => {
                if (imgObj.image_base64) {
                  return `
                  <div style="text-align: center; margin: 15px 0;">
                    <img src="${imgObj.image_base64}" 
                         alt="Question Image" 
                         style="max-width: 300px; border: 1px solid #ccc; border-radius: 8px; padding: 5px;" />
                  </div>`;
                }
                return "";
              })
              .join("")
          : ""
      }

      <div style="font-weight: 600; margin-bottom: 10px; color: #555;">${type}</div>
      
      <div class="options-container-${
        q.id
      }" style="display: flex; flex-direction: column; gap: 10px;"></div>
      
      ${
        templateConfig.choose_question_layout !== "N"
          ? `
      <div class="question-actions" style="margin-top:15px;display:flex;align-items:center;gap:15px;">
        ${
          templateConfig.can_review === "Y"
            ? `
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:18px;font-weight:600;">
            <input type="checkbox" class="review-check-${q.id}" ${
              state.isReviewMarked ? "checked" : ""
            }>
            <span>Review</span>
          </label>`
            : ``
        }
        ${
          templateConfig.can_skip === "Y"
            ? `
          <button class="skip-question-btn" data-qid="${q.id}" style="background:#6c757d;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:18px;font-weight:600;">
            Skip
          </button>`
            : ``
        }
        <button class="reset-question-btn" data-qid="${
          q.id
        }" style="background:#6c757d;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:18px;font-weight:600;">
          Reset
        </button>
      </div>`
          : `
      <div style="margin-top:15px;">
        <button class="reset-question-btn" data-qid="${q.id}" style="background:#6c757d;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:18px;font-weight:600;">
          Reset
        </button>
      </div>`
      }
    `;

    container.appendChild(questionDiv);

    const optionsContainer = questionDiv.querySelector(
      `.options-container-${q.id}`,
    );
    if (q.question_type == "Mcq") {
      Object.entries(q.options).forEach(([key, value]) => {
        const optionDiv = document.createElement("div");
        optionDiv.className = "option-item";
        optionDiv.style.cssText =
          "display: flex; align-items: center; padding: 12px; border: 2px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s;";
        optionDiv.innerHTML = `
      <input type="radio" name="answer-${
        q.id
      }" value="${key}" style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;" ${
        state.selectedAnswer === key ? "checked" : ""
      }>
      <span style="font-weight: 600; margin-right: 8px;">${key}.</span>
      <span>${value}</span>
      `;
        optionDiv.onclick = () => selectAnswer(q.id, key);
        optionsContainer.appendChild(optionDiv);
      });
    } else if (q.question_type == "Numerical") {
      const optionDiv = document.createElement("div");
      optionDiv.className = "option-item";
      optionDiv.style.cssText =
        "display: flex; align-items: center; padding: 12px; border: 2px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s;";
      optionDiv.innerHTML = `
      <input type="text" name="answer-${
        q.id
      }" value="${state.selectedAnswer !== null ? state.selectedAnswer : ""}" class="form-control numerical-answer" style="margin-right: 12px; width:100%; height: 30px; cursor: pointer;" inputmode="decimal" pattern="^-?[0-9]*\.?[0-9]*$" oninput="let val = this.value; let hasNegative = val.startsWith('-'); val = val.replace(/[^0-9.]/g, ''); let parts = val.split('.'); if (parts.length > 2) { val = parts[0] + '.' + parts.slice(1).join(''); } this.value = (hasNegative ? '-' : '') + val;">
        `;
      optionDiv.querySelector(`input[name="answer-${q.id}"]`).onchange = (
        e,
      ) => {
        selectAnswer(q.id, e.target.value);
      };
      optionsContainer.appendChild(optionDiv);

      //       <div style="
      //   margin-top: 10px;
      //   display: flex;
      //   align-items: center;
      //   gap: 10px;
      //   max-width: 400px;
      // ">
      //   <label for="${answerId}" style="font-weight: bold; white-space: nowrap;">
      //     Answer is
      //   </label>
      //   <input
      //     type="number"
      //     id="${answerId}"
      //     class="form-control numerical-answer"
      //     value="${record.correct_answer || ""}"
      //     data-index="${index}"
      //     style="max-width: 200px;"
      //   />
      // </div>`
    }

    const reviewCheckbox = questionDiv.querySelector(`.review-check-${q.id}`);
    if (reviewCheckbox) {
      reviewCheckbox.onchange = (e) => {
        questionStates[q.id].isReviewMarked = e.target.checked;
        updateCounts();
        updateQuestionButtons();
      };
    }

    const skipBtn = questionDiv.querySelector(`.skip-question-btn`);
    if (skipBtn) {
      skipBtn.onclick = () => {
        questionStates[q.id].status = "skip";
        questionStates[q.id].completion_times.push(new Date().toISOString());
        updateCounts();
        updateQuestionButtons();
        const isLastQuestionOnPage = index === pageQuestions.length - 1;
        if (!isLastQuestionOnPage) {
          const nextQuestionDiv = questionDiv.nextElementSibling;
          if (nextQuestionDiv) {
            nextQuestionDiv.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        } else {
          if (currentPage < totalPages) {
            currentPage++;
            renderQuestionsPage();
          }
        }
      };
    }

    const resetBtn = questionDiv.querySelector(`.reset-question-btn`);
    if (resetBtn) {
      resetBtn.onclick = () => {
        questionStates[q.id].selectedAnswer = null;
        questionStates[q.id].status = "unattempted";
        questionStates[q.id].isReviewMarked = false;
        renderQuestionsPage();
        updateCounts();
      };
    }
  });

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

  currentQuestionTimeStart = new Date().toISOString();

  updateCounts();
  setupFontSizeControls();
  updateQuestionButtons();
}

function selectAnswer(qId, idx) {
  questionStates[qId].selectedAnswer = idx;
  questionStates[qId].status = "attempted";
  questionStates[qId].start_time = currentQuestionTimeStart;
  questionStates[qId].end_time = new Date().toISOString();
  questionStates[qId].completion_times.push(new Date().toISOString());

  currentQuestionTimeStart = new Date().toISOString();

  const radio = document.querySelector(
    `input[name="answer-${qId}"][value="${idx}"]`,
  );
  if (radio) radio.checked = true;

  updateCounts();
  updateQuestionButtons();
}

function getTotalPages() {
  return Math.ceil(questionsData.length / templateConfig.questions_per_page);
}

function getQuestionsForPage(pageNum) {
  const startIdx = (pageNum - 1) * templateConfig.questions_per_page;
  const endIdx = startIdx + templateConfig.questions_per_page;
  return questionsData.slice(startIdx, endIdx);
}

function updateCounts() {
  let attempted = 0,
    unattempted = 0,
    review = 0,
    skip = 0;

  Object.values(questionStates).forEach((state) => {
    if (state.isReviewMarked) {
      review++;
    } else if (state.status === "attempted") {
      attempted++;
    } else if (state.status === "skip") {
      skip++;
    } else {
      unattempted++;
    }
  });

  document.getElementById("attemptedCount").textContent = attempted;
  document.getElementById("unattemptedCount").textContent = unattempted;
  document.getElementById("reviewCount1").textContent = review;
  document.getElementById("skipCount1").textContent = skip;
}

async function submitTest() {
  showOverlay();

  testEndTime = new Date().toISOString();

  let allAnswered = [];
  let totalTime = Math.floor(
    (new Date(testEndTime) - new Date(testStartTime)) / 1000,
  );
  Object.entries(questionStates).forEach(([qId, state]) => {
    if (state.start_time && state.end_time) {
      state.time_taken_secs = Math.floor(
        (new Date(state.end_time) - new Date(state.start_time)) / 1000,
      );
    } else {
      state.time_taken_secs = 0;
    }

    if (state.status != "unattempted" && state.status != "skip") {
      let temp = {
        question_id: parseInt(qId),
        total_time: state.time_taken_secs,
        start_time: state.start_time || null,
        end_time: state.end_time || null,
        selected_option: state.selectedAnswer,
      };
      allAnswered.push(temp);
    }
  });

  const payload = {
    question_paper_id: questionPaperDetails.question_paper_id,
    group_id: questionPaperDetails.group_id,
    assignment_id: questionPaperDetails.assignment_id,
    type: questionPaperDetails.test_type,
    attempt_start_time: testStartTime,
    attempt_end_time: testEndTime,
    total_time: totalTime.toFixed(0),
    answers: JSON.stringify(allAnswered),
    user_id:
      loggedInUser.register_num ||
      loggedInUser.user_id ||
      loggedInUser.staff_id,
    attempt_id: questionPaperDetails.attempt_id,
    function: "uad",
  };

  try {
    let response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify(payload),
    );

    if (response.success) {
      let final_score = response.result.final_score;

      if (showfinalScoreUser == "Y") {
        hideOverlay();
        leftPanel.style.display = "none";
        rightPanel.style.display = "none";
        legend.style.display = "none";
        examFooter.style.display = "none";
        timer.style.display = "none";

        const scoreContainer = document.createElement("div");
        scoreContainer.id = "finalScoreContainer";
        scoreContainer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #ffffff;
          z-index: 10000;
        `;

        scoreContainer.innerHTML = `
          <div style="
            background: white;
            border-radius: 20px;
            padding: 50px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            animation: slideIn 0.5s ease-out;
          ">
            <div style="
              width: 80px;
              height: 80px;
              margin: 0 auto 30px;
              background: #22c55e; 
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <h1 style="
              font-size: 32px;
              font-weight: 700;
              color: #2d3748;
              margin-bottom: 15px;
            ">Test Submitted Successfully!</h1>
            
            <p style="
              font-size: 16px;
              color: #718096;
              margin-bottom: 40px;
            ">Your test has been submitted. Here's your result:</p>
            
            <div style="
              background: #f7fafc;
              border-radius: 15px;
              padding: 30px;
              margin-bottom: 30px;
            ">
              <div style="margin-bottom: 20px;">
                <div style="
                  font-size: 18px;
                  color: #718096;
                  margin-bottom: 10px;
                ">Your Score</div>
                <div style="
                  font-size: 48px;
                  font-weight: 700;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                ">${final_score.obtained_mark} / ${final_score.total_mark}</div>
              </div>
              
            <button onclick="window.location.replace('take_mcq_test.html')"  style="
              background: linear-gradient(135deg, #90a0eaff 0%, #8460a8ff 100%);
              color: white;
              border: none;
              padding: 15px 40px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              Close
            </button>
          </div>
          
          <style>
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-50px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          </style>
        `;

        document.body.appendChild(scoreContainer);
      } else {
        await Swal.fire({
          icon: "success",
          title: "Test Submitted",
          text:
            response.message || "Your test has been submitted successfully!",
          confirmButtonText: "OK",
          allowOutsideClick: false,
        });

        setTimeout(() => {
          window.close();

          if (!window.closed) {
            window.location.href = "take_mcq_test.html";
          }
        }, 1000);
      }
    } else {
      throw new Error(response.message || "Failed to submit test");
    }
  } catch (error) {
    console.error(error);
    alert("Error submitting test: " + error.message);
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
  await getQuestionPaperDetails();
}
