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
      setDashboardAchievementCache(response.result.data[0]);
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

  const avgTime = data.avg_time ?? 0;
  udTimeSpent.textContent = `${avgTime}s`;
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
    <div class="ud-subject-row" style="display: block !important;">
  <div style="display: flex !important; justify-content: space-between !important; align-items: baseline !important; margin-bottom: 8px !important; width: 100% !important;">
    <span class="ud-subj-name" style="margin-bottom: 0 !important; display: flex !important;">${s.subjectName}</span>
    <span class="ud-subj-pct" style="margin-top: 0 !important; display: inline-block !important;">${s.accuracyPct}%</span>
  </div>
  
  <div class="ud-subj-bar-wrap" style="margin: 0 !important; width: 100% !important; display: block !important;">
    <div class="ud-subj-bar" style="width:${s.accuracyPct}% !important;"></div>
  </div>
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
      const isPositive = parseFloat(q.scorePct) >= 0;
      const scoreClass = isPositive ? "positive" : "negative";
      return `
      <div class="ud-quiz-item">
        <div>
          <div class="ud-quiz-name">${subjectLine}</div>
          <div class="ud-quiz-date">${dateStr}</div>
        </div>
        <div class="ud-quiz-score">
          <div class="ud-quiz-marks ${scoreClass}">${q.obtainedMark}/${q.maxMark}</div>
          <div class="ud-quiz-pct ${scoreClass}">${q.scorePct}%</div>
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

  renderAchievements(data);

  hideOverlay();
}

function renderAchievements(data) {
  let udAchievements = document.getElementById("ud-achievements");
  if (!udAchievements) return;

  udAchievements.innerHTML = `
    <div class="ud-achievements-container" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- XP & Achievement Points Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%;">
        <!-- XP Badge Left -->
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(99, 102, 241, 0.08); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.2); flex-grow: 1;">
          <div class="ud-badge-icon" style="font-size: 32px; filter: drop-shadow(0 2px 6px rgba(99, 102, 241, 0.3));">${data.xp_badge_icon || '🏆'}</div>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; line-height: 1.2;">${data.xp_badge_name || 'Novice'}</div>
            <div style="font-size: 11px; color: #6366f1; font-weight: 600; margin-top: 2px;">Level ${data.xp_level ?? 0} • ${data.total_xp ?? 0} XP</div>
          </div>
        </div>

        <!-- Achievement Points Right -->
        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; padding: 12px 14px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; border: 1px solid #fcd34d; min-width: 100px;">
          <div style="font-size: 9px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">AP Score</div>
          <div style="font-size: 18px; font-weight: 800; color: #78350f; margin-top: 2px; display: flex; align-items: center; gap: 2px;">⭐ ${data.total_achievement_points ?? 0}</div>
        </div>
      </div>

      <!-- Ranks List (Vertical Stack for maximum layout space and quotes readability) -->
      <div class="ud-ranks-list" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        <!-- Shadow Rank -->
        <div style="display: flex; flex-direction: column; padding: 12px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-size: 10px; font-weight: 700; color: #4f46e5; text-transform: uppercase; background: #e0e7ff; padding: 2px 6px; border-radius: 6px; letter-spacing: 0.5px;">${data.shadow_category_name || 'Shadow'} • Lvl ${data.shadow_level ?? 0}</span>
            <span style="font-size: 12px; font-weight: 600; color: #64748b;">${data.shadow_points ?? 0} pts</span>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 6px;">${data.shadow_rank_name || 'Rank 0'}</div>
          ${data.shadow_rank_quote ? `<div style="font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 4px; border-left: 2px solid #e2e8f0; padding-left: 6px; line-height: 1.3;">"${data.shadow_rank_quote}"</div>` : ''}
        </div>
        
        <!-- Flash Rank -->
        <div style="display: flex; flex-direction: column; padding: 12px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-size: 10px; font-weight: 700; color: #b45309; text-transform: uppercase; background: #fef3c7; padding: 2px 6px; border-radius: 6px; letter-spacing: 0.5px;">${data.flash_category_name || 'Flash'} • Lvl ${data.flash_level ?? 0}</span>
            <span style="font-size: 12px; font-weight: 600; color: #64748b;">${data.flash_points ?? 0} pts</span>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 6px;">${data.flash_rank_name || 'Rank 0'}</div>
          ${data.flash_rank_quote ? `<div style="font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 4px; border-left: 2px solid #e2e8f0; padding-left: 6px; line-height: 1.3;">"${data.flash_rank_quote}"</div>` : ''}
        </div>

        <!-- Iron Rank -->
        <div style="display: flex; flex-direction: column; padding: 12px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; letter-spacing: 0.5px;">${data.iron_category_name || 'Iron'} • Lvl ${data.iron_level ?? 0}</span>
            <span style="font-size: 12px; font-weight: 600; color: #64748b;">${data.iron_points ?? 0} pts</span>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 6px;">${data.iron_rank_name || 'Rank 0'}</div>
          ${data.iron_rank_quote ? `<div style="font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 4px; border-left: 2px solid #e2e8f0; padding-left: 6px; line-height: 1.3;">"${data.iron_rank_quote}"</div>` : ''}
        </div>
      </div>

      <!-- Streak Section orange styling -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: linear-gradient(135deg, #ffedd5, #fed7aa); border-radius: 12px; border: 1px solid #fdba74; width: 100%;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">🔥</span>
          <div>
            <div style="font-size: 13px; font-weight: 700; color: #c2410c; line-height: 1.2;">Streak: ${data.current_streak_days ?? 0} Days</div>
            <div style="font-size: 10px; color: #ea580c; margin-top: 1px;">Practice daily to build multiplier!</div>
          </div>
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #c2410c; background: rgba(255, 255, 255, 0.6); padding: 4px 8px; border-radius: 6px;">
          Max: ${data.max_streak_days ?? 0}d
        </div>
      </div>
    </div>
  `;
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
