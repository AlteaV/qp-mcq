function emptyExistingAchievements() {
  return {
    shadow_points: 0,
    flash_points: 0,
    iron_points: 0,
    current_streak_days: 0,
    max_streak_days: 0,
    last_attempt_date: null,
    total_xp: 0,
  };
}

function toAchievementNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toExistingAchievements(row) {
  if (!row) return emptyExistingAchievements();
  return {
    shadow_points: toAchievementNumber(row.shadow_points),
    flash_points: toAchievementNumber(row.flash_points),
    iron_points: toAchievementNumber(row.iron_points),
    current_streak_days: toAchievementNumber(row.current_streak_days),
    max_streak_days: toAchievementNumber(row.max_streak_days),
    last_attempt_date: row.last_attempt_date ?? null,
    total_xp: toAchievementNumber(row.total_xp),
  };
}

function getExistingAchievementsForSubmit() {
  return toExistingAchievements(cachedExistingAchievements);
}

let cachedExistingAchievements = emptyExistingAchievements();
let lastDashboardRow = null;

function setDashboardAchievementCache(row) {
  lastDashboardRow = row;
  cachedExistingAchievements = toExistingAchievements(row);
}

async function loadGudAndCacheAchievements(userId) {
  try {
    let response = await postCall(userEndPoint, JSON.stringify({
      function: "gud",
      user_id: userId,
    }));
    if (response && response.result && response.result.data && response.result.data.length > 0) {
      setDashboardAchievementCache(response.result.data[0]);
    } else {
      setDashboardAchievementCache(null);
    }
    return response;
  } catch (error) {
    console.error("Failed to load and cache achievements:", error);
    setDashboardAchievementCache(null);
  }
}

function normalizeFinalScore(finalScore, fallbackTotalMark) {
  if (finalScore !== null && typeof finalScore === "object") {
    return {
      obtained_mark: finalScore.obtained_mark ?? 0,
      total_mark:
        finalScore.total_mark ??
        fallbackTotalMark ??
        0,
    };
  }

  return {
    obtained_mark: finalScore ?? 0,
    total_mark: fallbackTotalMark ?? 0,
  };
}

function getQuestionTimeTakenSecs(state) {
  let timeTaken = 0;

  if (state.start_times && state.start_times.length > 0) {
    state.start_times.forEach((startTime, index) => {
      if (state.completion_times && state.completion_times[index]) {
        timeTaken +=
          (new Date(state.completion_times[index]) - new Date(startTime)) /
          1000;
      }
    });
  }

  if (timeTaken === 0 && state.start_time && state.end_time) {
    timeTaken =
      (new Date(state.end_time) - new Date(state.start_time)) / 1000;
  }

  return Math.max(0, Math.floor(timeTaken));
}

function normalizeAllowTest(value) {
  const status = String(value || "").trim().toLowerCase();
  if (status === "allow") return "Allow";
  if (status === "resume") return "Resume";
  if (status === "locked out" || status === "locked_out" || status === "blocked") {
    return "Locked Out";
  }
  if (status === "test completed" || status === "completed") {
    return "Test Completed";
  }
  return value || "Allow";
}

function dedupeAssignedTests(records) {
  if (!Array.isArray(records)) return [];

  const priority = {
    Allow: 4,
    Resume: 3,
    "Locked Out": 2,
    "Test Completed": 1,
  };
  const byAssignment = new Map();

  records.forEach((record) => {
    const normalized = {
      ...record,
      allow_test: normalizeAllowTest(record.allow_test),
    };
    const assignmentId = normalized.qp_assignment_id;
    const existing = byAssignment.get(assignmentId);

    if (
      !existing ||
      (priority[normalized.allow_test] || 0) >
        (priority[existing.allow_test] || 0)
    ) {
      byAssignment.set(assignmentId, normalized);
    }
  });

  return Array.from(byAssignment.values()).sort((a, b) => {
    const priorityDiff =
      (priority[b.allow_test] || 0) - (priority[a.allow_test] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return String(a.question_paper_name || "").localeCompare(
      String(b.question_paper_name || ""),
    );
  });
}

function showMcqSubmitResultScreen({
  message,
  finalScore,
  redirectUrl = "take_mcq_test.html",
}) {
  hideOverlay();

  const existing = document.getElementById("finalScoreContainer");
  if (existing) existing.remove();

  const scoreContainer = document.createElement("div");
  scoreContainer.id = "finalScoreContainer";
  scoreContainer.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#ffffff;z-index:10000;";

  scoreContainer.innerHTML = `
    <div style="background:white;border-radius:20px;padding:50px;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;max-width:520px;">
      <div style="width:80px;height:80px;margin:0 auto 30px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1 style="font-size:32px;font-weight:700;color:#2d3748;margin-bottom:15px;">Test Submitted Successfully!</h1>
      <p style="font-size:16px;color:#718096;margin-bottom:24px;">${message || "Your test has been submitted."}</p>
      <div style="background:#f7fafc;border-radius:15px;padding:24px;margin-bottom:24px;">
        <div style="font-size:18px;color:#718096;margin-bottom:10px;">Your Score</div>
        <div style="font-size:48px;font-weight:700;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
          ${finalScore.obtained_mark} / ${finalScore.total_mark}
        </div>
      </div>
      <button type="button" id="mcq_submit_close_btn" style="background:linear-gradient(135deg,#90a0eaff 0%,#8460a8ff 100%);color:white;border:none;padding:15px 40px;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;">
        Back to Tests
      </button>
    </div>
  `;

  document.body.appendChild(scoreContainer);
  document.getElementById("mcq_submit_close_btn").onclick = () => {
    window.location.replace(redirectUrl);
  };
}

function showMcqBlockedScreen(message, redirectUrl = "take_mcq_test.html") {
  hideOverlay();

  const existing = document.getElementById("mcqBlockedContainer");
  if (existing) existing.remove();

  const blockedContainer = document.createElement("div");
  blockedContainer.id = "mcqBlockedContainer";
  blockedContainer.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100vh;display:flex;justify-content:center;align-items:center;background:#fff;z-index:10000;padding:24px;";

  blockedContainer.innerHTML = `
    <div style="max-width:520px;text-align:center;background:#fff1f2;border:1px solid #fecaca;border-radius:20px;padding:40px;">
      <div style="font-size:56px;margin-bottom:16px;">🔒</div>
      <h1 style="font-size:28px;font-weight:700;color:#991b1b;margin-bottom:12px;">Test Blocked</h1>
      <p style="font-size:16px;color:#7f1d1d;margin-bottom:24px;">${message || "You are not allowed to take this test. Please contact your administrator."}</p>
      <button type="button" id="mcq_blocked_close_btn" style="background:#b91c1c;color:white;border:none;padding:12px 28px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">
        Back to Tests
      </button>
    </div>
  `;

  document.body.appendChild(blockedContainer);
  document.getElementById("mcq_blocked_close_btn").onclick = () => {
    window.location.replace(redirectUrl);
  };
}
