let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");
var resultDiv = document.getElementById("result_div");

const TEST_STATUS_META = {
  Allow: {
    label: "Available",
    badgeClass: "badge-available",
    buttonLabel: "Take Test",
    canStart: true,
  },
  Resume: {
    label: "Resume",
    badgeClass: "badge-resume",
    buttonLabel: "Resume Test",
    canStart: true,
  },
  "Locked Out": {
    label: "Blocked",
    badgeClass: "badge-blocked",
    buttonLabel: "Test Not Completed\nContact Admin",
    canStart: false,
  },
  "Test Completed": {
    label: "Completed",
    badgeClass: "badge-completed",
    buttonLabel: "Completed",
    canStart: false,
  },
};

function getTestTypeBadge(testType) {
  const type = String(testType || "").trim().toLowerCase();
  if (type === "actual") {
    return `<span class="badge badge-actual">Actual</span>`;
  }
  if (type === "practice") {
    return `<span class="badge badge-practice">Practice</span>`;
  }
  if (testType) {
    return `<span class="badge badge-practice">${testType}</span>`;
  }
  return `<span class="badge badge-completed">Test</span>`;
}

function getStatusMeta(allowTest) {
  const normalized = normalizeAllowTest(allowTest);
  return TEST_STATUS_META[normalized] || TEST_STATUS_META.Allow;
}

function buildActionButton(record, statusMeta) {
  if (!statusMeta.canStart) {
    const blockedText = statusMeta.buttonLabel;
    return `<button class="nd-btn-primary disabled" disabled title="${blockedText.replace(/\n/g, " ")}">${blockedText}</button>`;
  }

  return `
    <button
      class="nd-btn-primary take-test-btn"
      data-qp_assignment_id="${record.qp_assignment_id}"
      data-start="${record.start_date_time}"
      data-end="${record.end_date_time}"
      data-template_id="${record.template_id}"
      data-allow_test="${normalizeAllowTest(record.allow_test)}"
    >
      ${statusMeta.buttonLabel}
    </button>
  `;
}

function showQuestionPapers(data) {
  const tests = dedupeAssignedTests(data);

  if (tests.length === 0) {
    fetchingDataSection.innerHTML = "<p>No ongoing tests are assigned to you right now.</p>";
    fetchingDataSection.style.display = "block";
    resultTable.style.display = "none";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.No"),
        new TableStructure("Question Paper Name"),
        new TableStructure("Type"),
        new TableStructure("Status"),
        new TableStructure("Start Time"),
        new TableStructure("End Time"),
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };

  tests.forEach((record, index) => {
    const statusMeta = getStatusMeta(record.allow_test);
    const statusBadge = `<span class="badge ${statusMeta.badgeClass}">${statusMeta.label}</span>`;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(record.question_paper_name || "Untitled Test"),
      new TableStructure(getTestTypeBadge(record.test_type)),
      new TableStructure(statusBadge),
      new TableStructure(record.start_date_time || "-"),
      new TableStructure(record.end_date_time || "-"),
      new TableStructure(buildActionButton(record, statusMeta)),
    ]);
  });

  displayResult(tableData, resultTable);
  fetchingDataSection.style.display = "none";
  resultTable.style.display = "table";
  resultDiv.style.display = "block";

  $(".take-test-btn")
    .off("click")
    .on("click", function () {
      const qp_assignment_id = $(this).data("qp_assignment_id");
      const start = $(this).data("start");
      const end = $(this).data("end");
      const template_id = $(this).data("template_id");
      const allowTest = normalizeAllowTest($(this).data("allow_test"));

      if (allowTest === "Locked Out") {
        showMcqBlockedScreen(
          "This test is blocked for your account. Please contact your administrator to resume it.",
        );
        return;
      }

      if (allowTest === "Test Completed") {
        alert("You have already completed this test.");
        return;
      }

      const currentTime = new Date();
      const dateTimeFormat = "DD-MM-YYYY hh:mm A";
      const startDate = moment(start, dateTimeFormat, true);
      const endDate = moment(end, dateTimeFormat, true);

      if (!startDate.isValid() || !endDate.isValid()) {
        alert("Unable to read the test schedule. Please refresh and try again.");
        return;
      }

      if (startDate.toDate() > currentTime) {
        alert("The test has not started yet.");
        return;
      }

      if (endDate.toDate() < currentTime) {
        alert("The test has already ended.");
        return;
      }

      window.location.href =
        `view_ui_template.html?` +
        `qp_assignment_id=${encodeURIComponent(qp_assignment_id)}` +
        `&template_id=${encodeURIComponent(template_id)}`;
    });

  hideOverlay();
}

async function getQuestionPapers() {
  showOverlay();

  if (!loggedInUser || !loggedInUser.user_id) {
    hideOverlay();
    alert("User session not found. Please log in again.");
    return;
  }

  const out = {
    function: "gaq",
    user_id: loggedInUser.user_id,
  };

  try {
    const response = await postCall(userEndPoint, JSON.stringify(out));

    if (!response || !response.success) {
      hideOverlay();
      alert(response?.message || "Failed to load assigned tests.");
      return;
    }

    const questionPapers = response.result?.question_papers ?? [];
    showQuestionPapers(questionPapers);
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching question papers");
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
    }

    initializePage();
  }
});

function initializePage() {
  window.getQuestionPapers = getQuestionPapers;
  getQuestionPapers();
}
