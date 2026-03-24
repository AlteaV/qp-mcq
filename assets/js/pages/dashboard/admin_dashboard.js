let adTotalSubjects = document.getElementById("ad-total-subjects");
let adTotalTopics = document.getElementById("ad-total-topics");
let adTotalQuestions = document.getElementById("ad-total-questions");
let adActiveUsers = document.getElementById("ad-active-users");
let adAvgScore = document.getElementById("ad-avg-score");
let adAvgTime = document.getElementById("ad-avg-time");
let adSubjectPerformance = document.getElementById("ad-subject-performance");
let adHardSubjects = document.getElementById("ad-hard-subjects");
let adEasySubjects = document.getElementById("ad-easy-subjects");
let adHardTopics = document.getElementById("ad-hard-topics");
let adEasyTopics = document.getElementById("ad-easy-topics");
let adRecentAttempts = document.getElementById("ad-recent-attempts");

const difficultyColors = {
  Easy: "#2ec4b6",
  Medium: "#ffd166",
  Hard: "#ff9f1c",
  "Very Hard": "#e71d36",
};

function init() {
  getOrgDashboardData();
}

async function getOrgDashboardData() {
  showOverlay();
  try {
    let response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify({
        function: "gadmd",
        org_id: loggedInUser.org_id,
      }),
    );
    if (response && response.result.data && response.result.data.length > 0) {
      renderDashboard(response.result.data[0]);
    } else {
      console.warn(
        "No org dashboard data found:",
        response ? response.message : "Empty response",
      );
    }
  } catch (error) {
    console.error(error);
    alert("Failed to get dashboard details");
    hideOverlay();
  }
}

function renderStatCards(data) {
  adTotalSubjects.textContent = data.total_subjects ?? 0;
  adTotalTopics.textContent = data.total_topics ?? 0;
  adTotalQuestions.textContent = data.total_questions ?? 0;
  adActiveUsers.textContent = data.active_users ?? 0;

  const avgScore = data.avg_score ?? 0;
  adAvgScore.textContent = avgScore + "%";

  const mins = data.avg_time ?? 0;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    adAvgTime.textContent = m > 0 ? `${h}h ${m}m` : `${h}h`;
  } else {
    adAvgTime.textContent = `${Math.round(mins)}m`;
  }
}

function renderSubjectPerformance(subjects) {
  if (!subjects || subjects.length === 0) {
    adSubjectPerformance.innerHTML = `
      <div class="ud-empty-state">
        <div>No data yet</div>
      </div>`;
    return;
  }

  adSubjectPerformance.innerHTML = subjects
    .map((s) => {
      const displayName = s.level_name
        ? `${s.level_name} - ${s.subject_name}`
        : s.subject_name;
      return `
    <div class="ud-subject-row">
      <span class="ud-subj-name">${displayName}</span>
      <div class="ud-subj-bar-wrap">
        <div class="ud-subj-bar" style="width:${s.accuracy}%"></div>
      </div>
      <span class="ud-subj-pct">${s.accuracy}% (${s.attempts} ${s.attempts === 1 ? "attempt" : "attempts"})</span>
    </div>`;
    })
    .join("");
}

function renderAnalysisPanel(container, items, nameField) {
  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="ud-empty-state">
        <div>No data yet</div>
      </div>`;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      let displayName = item[nameField];
      if (nameField === "subject_name" && item.level_name) {
        displayName = `${item.level_name} - ${item.subject_name}`;
      }
      let subLine = "";
      if (nameField === "topic_name" && item.subject_name) {
        subLine = `<span class="ad-analysis-sub">${item.subject_name}</span>`;
      }
      return `
    <div class="ad-analysis-row">
      <div class="ad-analysis-info">
        <span class="ad-analysis-name">${displayName}</span>
        ${subLine}
      </div>
      <div class="ad-analysis-meta">
        <span class="ad-analysis-pct">${item.accuracy}%</span>
        <span class="ad-analysis-badge" style="background:${difficultyColors[item.difficulty] || "#ccc"}">${item.difficulty}</span>
      </div>
    </div>`;
    })
    .join("");
}

function formatStartTime(startTime) {
  if (!startTime) return "";
  try {
    const dt = new Date(startTime);
    if (isNaN(dt.getTime())) return startTime;
    const month = dt.getMonth() + 1;
    const day = dt.getDate();
    const year = dt.getFullYear();
    let hours = dt.getHours();
    const minutes = dt.getMinutes().toString().padStart(2, "0");
    const seconds = dt.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  } catch {
    return startTime;
  }
}

function renderRecentAttempts(attempts) {
  if (!attempts || attempts.length === 0) {
    adRecentAttempts.innerHTML = `
      <div class="ud-empty-state">
        <div>No attempts yet</div>
      </div>`;
    return;
  }

  adRecentAttempts.innerHTML = attempts
    .map((a) => {
      const dateStr = formatStartTime(a.start_time);
      const subjectLine = a.subject_name || a.quiz_name || "Quiz";
      const scorePct = a.score ?? 0;
      return `
      <div class="ud-quiz-item">
        <div>
          ${a.user_name ? `<div class="ud-quiz-name">${a.user_name}</div>` : ""}
          <div style="font-size:13px; color:#555; margin-top:2px;">${subjectLine}</div>
          <div class="ud-quiz-date">${dateStr}</div>
        </div>
        <div class="ud-quiz-score">
          <div class="ud-quiz-marks">${a.obtained}/${a.total}</div>
          <div class="ud-quiz-pct">${scorePct}%</div>
        </div>
      </div>`;
    })
    .join("");
}

function parseJsonField(field) {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return null;
    }
  }
  return field;
}

function renderDashboard(data) {
  renderStatCards(data);

  renderSubjectPerformance(parseJsonField(data.subject_performance));
  renderAnalysisPanel(
    adHardSubjects,
    parseJsonField(data.hard_subjects),
    "subject_name",
  );
  renderAnalysisPanel(
    adEasySubjects,
    parseJsonField(data.easy_subjects),
    "subject_name",
  );
  renderAnalysisPanel(
    adHardTopics,
    parseJsonField(data.hard_topics),
    "topic_name",
  );
  renderAnalysisPanel(
    adEasyTopics,
    parseJsonField(data.easy_topics),
    "topic_name",
  );
  renderRecentAttempts(parseJsonField(data.recent_attempts));
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
