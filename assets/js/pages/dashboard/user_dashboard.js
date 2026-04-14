let UserID = loggedInUser.user_id;

let udWelcomeText = document.getElementById("ud-welcome-text");
let udTotalQuizzes = document.getElementById("ud-total-quizzes");
let udAvgScore = document.getElementById("ud-avg-score");
let udQuestionsAnswered = document.getElementById("ud-questions-answered");
let udTimeSpent = document.getElementById("ud-time-spent");
let udSubjectPerformance = document.getElementById("ud-subject-performance");
let udRecentQuizzes = document.getElementById("ud-recent-quizzes");

function init() {
  getDashboardData();
}

async function getDashboardData() {
  showOverlay();
  try {
    let response = await postCall(
      userEndPoint,
      JSON.stringify({
        function: "gud",
        user_id: UserID,
      }),
    );
    if (response && response.result.data && response.result.data.length > 0) {
      renderDashboard(response.result.data[0]);
    } else {
      console.warn(
        "No dashboard data found:",
        response ? response.message : "Empty response",
      );
      hideOverlay();
    }
  } catch (error) {
    console.error(error);
    alert("Failed to get dashboard details");
    hideOverlay();
  }
}

function renderStatCards(data) {
  udTotalQuizzes.textContent = data.total_quizzes ?? 0;
  udAvgScore.textContent = (data.avg_score_pct ?? 0) + "%";
  udQuestionsAnswered.textContent = data.questions_answered ?? 0;

  const mins = data.total_time_mins ?? 0;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    udTimeSpent.textContent = m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    udTimeSpent.textContent = `${mins}m`;
  }
}

function renderSubjectPerformance(subjects) {
  if (!subjects || subjects.length === 0) {
    udSubjectPerformance.innerHTML = `
      <div class="ud-empty-state">
        <div>No data yet</div>
      </div>`;
    return;
  }

  udSubjectPerformance.innerHTML = subjects
    .map(
      (s) => `
    <div class="ud-subject-row">
      <span class="ud-subj-name">${s.subjectName}</span>
      <div class="ud-subj-bar-wrap">
        <div class="ud-subj-bar" style="width:${s.accuracyPct}%"></div>
      </div>
      <span class="ud-subj-pct">${s.accuracyPct}%</span>
    </div>`,
    )
    .join("");
}

function renderRecentQuizzes(quizzes) {
  if (!quizzes || quizzes.length === 0) {
    udRecentQuizzes.innerHTML = `
      <div class="ud-empty-state">
        <div>No quizzes taken yet</div>
      </div>`;
    return;
  }

  udRecentQuizzes.innerHTML = quizzes
    .map((q) => {
      const dateStr = q.attemptDate
        ? new Date(q.attemptDate).toLocaleDateString()
        : "";
      const subjectLine = q.subjectName || q.quizName || "Quiz";
      return `
      <div class="ud-quiz-item">
        <div>
          <div class="ud-quiz-name">${subjectLine}</div>
          <div class="ud-quiz-date">${dateStr}</div>
        </div>
        <div class="ud-quiz-score">
          <div class="ud-quiz-marks">${q.obtainedMark}/${q.maxMark}</div>
          <div class="ud-quiz-pct">${q.scorePct}%</div>
        </div>
      </div>`;
    })
    .join("");
}

function renderDashboard(data) {
  if (loggedInUser.user_name) {
    udWelcomeText.textContent = `Welcome back, ${loggedInUser.user_name}!`;
  }

  renderStatCards(data);

  const subjects =
    typeof data.subject_performance === "string"
      ? JSON.parse(data.subject_performance)
      : data.subject_performance;
  renderSubjectPerformance(subjects);

  const quizzes =
    typeof data.recent_quizzes === "string"
      ? JSON.parse(data.recent_quizzes)
      : data.recent_quizzes;
  renderRecentQuizzes(quizzes);

  hideOverlay();
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
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
