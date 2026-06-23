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
    user_id: loggedInUser.user_id,
  };
  try {
    let response = await postCall(userEndPoint, JSON.stringify(payload));
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
      hideOverlay();
      const blocked =
        response.status === 405 ||
        /not allowed|blocked|locked out|max attempts/i.test(
          String(response.message || ""),
        );
      if (blocked) {
        showMcqBlockedScreen(
          response.message ||
            "You are not allowed to take this test. Please contact your administrator.",
        );
      } else {
        alert(response.message || "Unable to open this test.");
        window.history.back();
      }
    }
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching question paper details");
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
    user_id: loggedInUser.user_id,
    function: "itad",
  };

  try {
    let response = await postCall(userEndPoint, JSON.stringify(payload));

    if (response.success) {
      if (response.status == 429) {
        submitTest();
      } else {
        hideOverlay();
        alert(response.message);
        window.history.back();
      }
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
    if (state.hasOwnProperty("start_times")) {
      if (new Date(state.start_times[0]) < new Date(testStartTime)) {
        testStartTime = state.start_times[0];
      }
    }
  });

  timeLeft = Math.min(
    questionPaperDetails.qp_time_remaining * 60,
    templateConfig.total_duration_mins * 60,
  );

  let currentTime = new Date();
  let startTime = new Date(testStartTime);
  timeElapsed = Math.floor((currentTime - startTime) / 1000);

  timeLeft = Math.max(0, timeLeft - timeElapsed);

  examFooter.style.display = "flex"; // nav is now inside the question card area
  // Keep #submit_test hidden in right panel — nav card button triggers it
  // if (submitTestBtn) submitTestBtn.style.display = "none";

  examTitle.innerHTML = questionPaperDetails.question_paper_name;

  if (
    questionPaperDetails.shuffle_questions === "Y" ||
    questionPaperDetails.shuffle_questions == 1
  ) {
    questionsData = groupAndShuffle(questionsData);
  }

  // ── Force single-question card + always show right panel navigator ──
  templateConfig.questions_per_page = 1;

  leftPanel.style.display = "block";
  rightPanel.style.display = "flex";
  legend.style.display = "block";
  renderChooseQuestionsLayout();

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
    let result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to submit the test?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, submit it!",
      cancelButtonText: "No, cancel",
    });
    if (result.isConfirmed) {
      submitTest();
    }
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

function groupAndShuffle(data) {
  const grouped = data.reduce((acc, item) => {
    const id = item.subject;
    if (!acc[id]) acc[id] = [];
    acc[id].push(item);
    return acc;
  }, {});
  return Object.values(grouped).flatMap((group) => shuffleArray(group));
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

function getSubjectColor(subject) {
  const s = (subject || "").toLowerCase();
  if (s.includes("physics")) return "#22c55e";
  if (s.includes("chemistry")) return "#f59e0b";
  if (s.includes("math")) return "#3b82f6";
  if (s.includes("biology")) return "#a855f7";
  return "#6366f1";
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
    const displayName = subject == "null" ? "Questions" : subject;
    const dotColor = getSubjectColor(subject);
    header.innerHTML = `
      <div class="tui-subject-name">
        <span class="tui-subject-dot" style="background:${dotColor}"></span>
        ${displayName}
      </div>
      <span class="tui-subject-toggle">—</span>`;

    // Apply per-subject colored border + faint tint
    header.style.borderColor = dotColor;
    header.style.background = `${dotColor}18`; // ~10% opacity tint

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
      header.querySelector(".tui-subject-toggle").textContent = isVisible
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
  // Current question = the one on screen (1 question per page)
  const currentQ = questionsData[currentPage - 1];
  const currentQId = currentQ ? currentQ.id : null;

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

    // Highlight current question (overrides other states visually)
    if (qId === currentQId) {
      btn.classList.add("current");
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
    <div class="tui-page-header mb-4">
      <div class="tui-page-header-left">
        <span class="tui-q-range">Questions ${
          (currentPage - 1) * templateConfig.questions_per_page + 1
        } - ${Math.min(
          currentPage * templateConfig.questions_per_page,
          questionsData.length,
        )}</span>
        <button class="font-btn increase">A+</button>
        <button class="font-btn decrease">A-</button>
      </div>
      <div class="tui-page-info">Page ${currentPage} of ${totalPages}</div>
    </div>
    <div id="questionsContainer" class="mb-4"></div>
    <div class="tui-nav-card">
      <div class="tui-nav-left" style="display: flex; gap: 8px;width: 100% !important;">
        <button class="tui-nav-prev" id="tui_prev_btn" ${currentPage <= 1 ? 'style="display:none"' : ""}>&#8592; Previous</button>
        <button class="tui-nav-next" id="tui_next_btn" ${currentPage >= totalPages ? 'style="display:none"' : 'style="margin-left: auto !important;"'}>Next &#8594;</button>
      </div>
    </div>

  `;

  // Wire inline nav buttons (re-created on each render)
  const tuiPrevBtn = document.getElementById("tui_prev_btn");
  const tuiNextBtn = document.getElementById("tui_next_btn");
  const tuiSubmitBtn = document.getElementById("tui_submit_btn");
  if (tuiPrevBtn) {
    tuiPrevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderQuestionsPage();
      }
    };
  }
  if (tuiNextBtn) {
    tuiNextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderQuestionsPage();
      } else {
        alert("You are on the last question!");
      }
    };
  }
  if (tuiSubmitBtn) {
    tuiSubmitBtn.onclick = () => {
      submitTestBtn.click();
    };
  }

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
    questionDiv.className = "tui-question-card";
    // Only add bottom margin between cards (multi-question pages)
    if (index < pageQuestions.length - 1) {
      questionDiv.style.marginBottom = "16px";
    }

    let type = "";
    if (q.question_type == "Mcq") {
      type = "Select the correct answer:";
    } else if (q.question_type == "Numerical") {
      type = "Enter your answer:";
    }

    let markAsWrong = `<button class="mark-as-wrong-btn tui-btn tui-btn-wrong" data-qid="${q.id}">Mark as Wrong</button>`;

    if (
      (!"flag_wrong_question") in templateConfig ||
      templateConfig.flag_wrong_question != "Y"
    ) {
      markAsWrong = ``;
    }

    if (
      "wrong_question" in questionStates[q.id] &&
      questionStates[q.id].wrong_question
    ) {
      markAsWrong = `<button disabled class="tui-btn tui-btn-disabled">Marked as Wrong</button>`;
    }

    questionDiv.innerHTML = `
      <div class="tui-q-heading">
        <div class="tui-q-title">
          <span class="tui-q-number">Question ${questionNo + 1}:</span>
        </div>
      </div>

      <div class="tui-q-text">${renderQuestionText(q.question)}</div>

      ${q.table ? `<p>${renderTableFromMarkdown(q.table)}</p>` : ""}
      ${
        q.images && q.images.length > 0
          ? q.images
              .map((imgObj) => {
                if (imgObj.image_base64) {
                  return `<div class="tui-q-img-wrap"><img src="${imgObj.image_base64}" alt="Question Image" /></div>`;
                }
                return "";
              })
              .join("")
          : ""
      }

      <div class="tui-q-prompt">${type}</div>

      <div class="options-container-${q.id} tui-options-list"></div>

      ${
        templateConfig.question_layout !== "N"
          ? `
      <div class="question-actions tui-q-actions">
        ${
          templateConfig.can_review === "Y"
            ? `<label class="tui-review-label">
                <input type="checkbox" class="review-check-${q.id}" ${state.isReviewMarked ? "checked" : ""}>
                <span>Review</span>
               </label>`
            : ``
        }
        ${
          templateConfig.can_skip === "Y"
            ? `<button class="skip-question-btn tui-btn tui-btn-skip" data-qid="${q.id}">Skip</button>`
            : ``
        }
        <button class="reset-question-btn tui-btn tui-btn-reset" data-qid="${q.id}">Reset</button>
        ${markAsWrong}
      </div>`
          : `
      <div class="tui-q-actions">
        <button class="reset-question-btn tui-btn tui-btn-reset" data-qid="${q.id}">Reset</button>
        ${markAsWrong}
      </div>`
      }
    `;

    container.appendChild(questionDiv);

    const optionsContainer = questionDiv.querySelector(
      `.options-container-${q.id}`,
    );
    if (q.question_type == "Mcq") {
      q.options = parseChoices(q.options) || {};
      let optionsArray = [];
      Object.entries(q.options).forEach(([key, value]) => {
        const optionDiv = document.createElement("div");
        optionDiv.className = "option-item tui-option-item";
        optionDiv.innerHTML = `
      <input type="radio" name="answer-${
        q.id
      }" value="${key}" style="margin-right: 12px; width: 18px; height: 18px; cursor: pointer;" ${
        state.selectedAnswer === key ? "checked" : ""
      }>
      <span>${renderQuestionText(value)}</span>
      `;
        optionDiv.onclick = () => selectAnswer(q.id, key);
        // optionsContainer.appendChild(optionDiv);
        optionsArray.push(optionDiv);
      });
      if ("shuffle_array" in templateConfig && templateConfig.shuffle_array) {
        optionsArray = shuffleChoices(optionsArray);
      }
      for (let option in optionsArray) {
        optionsContainer.appendChild(optionsArray[option]);
      }
    } else if (q.question_type == "Numerical") {
      const optionDiv = document.createElement("div");
      optionDiv.className = "option-item tui-option-item";
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

    const markWrongBtn = questionDiv.querySelector(`.mark-as-wrong-btn`);
    if (markWrongBtn) {
      markWrongBtn.onclick = () => {
        markQuestionAsWrong(q.id);

        markWrongBtn.disabled = true;
        markWrongBtn.innerText = "Marked as Wrong";

        markWrongBtn.style.background = "#e9ecef";
        markWrongBtn.style.color = "#6c757d";
        markWrongBtn.style.cursor = "not-allowed";
        markWrongBtn.style.border = "1px solid #dee2e6";
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
    const timeTakenSecs = getQuestionTimeTakenSecs(state);
    const startTime =
      (state.start_times && state.start_times[0]) || state.start_time || null;
    const endTime =
      (state.completion_times &&
        state.completion_times[state.completion_times.length - 1]) ||
      state.end_time ||
      null;

    allAnswered.push({
      question_id: parseInt(qId, 10),
      total_time: timeTakenSecs,
      start_time: startTime,
      end_time: endTime,
      selected_option:
        state.status === "attempted" ? state.selectedAnswer : null,
    });
  });

  const payload = {
    question_paper_id: questionPaperDetails.question_paper_id,
    group_id: questionPaperDetails.group_id,
    assignment_id: questionPaperDetails.assignment_id,
    type: questionPaperDetails.test_type,
    attempt_start_time: testStartTime,
    attempt_end_time: testEndTime,
    total_time: Math.round(totalTime),
    answers: JSON.stringify(allAnswered),
    user_id: loggedInUser.user_id,
    attempt_id: questionPaperDetails.attempt_id,
    existing_achievements: getExistingAchievementsForSubmit(),
    function: "uad",
  };

  try {
    let response = await postCall(userEndPoint, JSON.stringify(payload));

    if (response.success) {
      await loadGudAndCacheAchievements(loggedInUser.user_id);
      const fallbackTotalMark = questionsData.reduce(
        (sum, q) => sum + (parseFloat(q.maxMark) || 0),
        0,
      );
      const final_score = normalizeFinalScore(
        response.result.final_score,
        fallbackTotalMark,
      );

      if (timerInterval) {
        clearInterval(timerInterval);
      }

      leftPanel.style.display = "none";
      rightPanel.style.display = "none";
      legend.style.display = "none";
      examFooter.style.display = "none";
      timer.style.display = "none";

      showMcqSubmitResultScreen({
        message: response.message || "Test submitted successfully!",
        finalScore: final_score,
        redirectUrl: "take_mcq_test.html",
      });
    } else {
      throw new Error(response.message || "Failed to submit test");
    }
  } catch (error) {
    console.error(error);
    alert("Error submitting test: " + error.message);
    hideOverlay();
  }
}

async function markQuestionAsWrong(qId) {
  const payload = {
    question_id: qId,
    user_id: loggedInUser.user_id,
    function: "mqaw",
  };
  try {
    let response = await postCall(userEndPoint, JSON.stringify(payload));

    if (response.success) {
      questionStates[qId].wrong_question = true;
    }
  } catch (error) {
    console.error(error);
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
  await loadGudAndCacheAchievements(loggedInUser.user_id);
  await getQuestionPaperDetails();
}
