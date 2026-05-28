class View {
  constructor(controller) {
    this.controller = controller;
    this.fetchingDataSection = document.getElementById("fetching_data");
    this.resultTable = document.getElementById("result_table"); // kept for compat (unused)
    this.resultDiv = document.getElementById("result_div");
    this.registerNumber = document.getElementById("register_num");
    this.registerNumberRow = document.getElementById("register_number_row");
    this.viewReport = document.getElementById("view_report");

    this.testSelect = document.getElementById("test_select");
    this.testSelectCol = document.getElementById("test_select_col");
    this.emailInputCol = document.getElementById("email_input_col");

    this.srSummaryDiv = document.getElementById("sr_summary_div");

    this.viewReport.addEventListener("click", async () => {
      if (this.registerNumber.value) {
        const selectedTestId = this.testSelect.value || null;
        await this.controller.getTestList(this.registerNumber.value);
        if (selectedTestId) {
          this.testSelect.value = selectedTestId;
        }
        await this.controller.getStudentMcqReport(
          this.registerNumber.value,
          selectedTestId,
        );
      } else {
        alert("Please enter a email.");
      }
    });
    this.registerNumber.addEventListener("input", () => {
      this.controller.tests = null;
      this.resultDiv.style.display = "none";
      this.srSummaryDiv.style.display = "none";
    });
    this.testSelect.addEventListener("change", () => {
      this.resultDiv.style.display = "none";
      this.srSummaryDiv.style.display = "none";
    });
  }

  showReportSection(data) {
    this.fetchingDataSection.style.display = "none";
    if (!data || data.length === 0) {
      this.fetchingDataSection.innerHTML = "<p>There is no data</p>";
      this.fetchingDataSection.style.display = "block";
      this.resultDiv.style.display = "none";
      hideOverlay();
      return;
    }

    // ── Group subjects ──────────────────────────────────────────────
    const subjectMap = {};
    data.forEach((subjectObj) => {
      const subjectName = subjectObj.subject;
      const sectionName = subjectObj.section;
      if (!subjectMap[subjectName]) subjectMap[subjectName] = [];
      const topics =
        typeof subjectObj.topics === "string"
          ? JSON.parse(subjectObj.topics)
          : subjectObj.topics;
      if (Array.isArray(topics)) {
        subjectMap[subjectName].push(
          ...topics.map((t) => ({ ...t, section_name: sectionName })),
        );
      }
    });

    // ── Colour palette (cycles per subject index) ───────────────────
    const dotColors = [
      "#f59e0b",
      "#3b82f6",
      "#16a34a",
      "#7c3aed",
      "#ef4444",
      "#06b6d4",
    ];
    const bgColors = [
      "#fff7ed",
      "#eff6ff",
      "#f0fdf4",
      "#faf5ff",
      "#fff1f2",
      "#ecfeff",
    ];
    const borderColors = [
      "#fed7aa",
      "#bfdbfe",
      "#bbf7d0",
      "#ddd6fe",
      "#fecdd3",
      "#a5f3fc",
    ];

    // ── Build accordion HTML ────────────────────────────────────────
    let accordionHTML = "";
    Object.keys(subjectMap).forEach((subjectName, idx) => {
      const topics = subjectMap[subjectName];
      const dot = dotColors[idx % dotColors.length];
      const bg = bgColors[idx % bgColors.length];
      const border = borderColors[idx % borderColors.length];

      const rowsHTML = topics
        .map(
          (topic, i) => `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td>${topic.section_name || "N/A"}</td>
            <td>${topic.topic_name}</td>
            <td style="text-align:center;"><span class="sr-badge sr-badge-blue">${topic.no_of_times_attempted ?? 0}</span></td>
            <td style="text-align:center;"><span class="sr-badge sr-badge-green">${topic.no_of_times_passed ?? 0}</span></td>
            <td style="text-align:center;"><span class="sr-badge sr-badge-red">${topic.no_of_wrong_answers ?? 0}</span></td>
            <td style="text-align:center;"><span class="sr-badge sr-badge-orange">${topic.no_of_unattended_questions ?? 0}</span></td>
          </tr>`,
        )
        .join("");

      accordionHTML += `
        <div class="sr-accordion-item" style="border-color:${border};">
          <div class="sr-accordion-header" style="background:${bg};"
               onclick="var b=this.nextElementSibling;var open=b.style.display!=='none';b.style.display=open?'none':'block';this.classList.toggle('sr-open',!open);">
            <span class="sr-subj-dot" style="background:${dot};"></span>
            <span class="sr-subj-name">${subjectName}</span>
            <svg class="sr-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="sr-accordion-body" style="display:none;">
            <table class="table table-bordered nd-table-override" style="margin:0;">
              <thead>
                <tr>
                  <th>#</th><th>Section</th><th>Topic Name</th>
                  <th>Attempted</th><th>Correct</th><th>Wrong</th><th>Unattended</th>
                </tr>
              </thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          </div>
        </div>`;
    });

    const accordionEl = document.getElementById("sr_accordion");
    if (accordionEl) accordionEl.innerHTML = accordionHTML;

    // ── Performance Summary ─────────────────────────────────────────
    let totalAnswered = 0,
      totalCorrect = 0,
      totalWrong = 0,
      totalUnanswered = 0;
    data.forEach((subjectObj) => {
      const topics =
        typeof subjectObj.topics === "string"
          ? JSON.parse(subjectObj.topics)
          : subjectObj.topics;
      if (Array.isArray(topics)) {
        topics.forEach((t) => {
          totalAnswered += t.no_of_times_attempted || 0;
          totalCorrect += t.no_of_times_passed || 0;
          totalWrong += t.no_of_wrong_answers || 0;
          totalUnanswered += t.no_of_unattended_questions || 0;
        });
      }
    });
    const elTA = document.getElementById("sr-total-answered");
    const elC = document.getElementById("sr-correct");
    const elW = document.getElementById("sr-wrong");
    const elU = document.getElementById("sr-unanswered");
    if (elTA) elTA.textContent = totalAnswered;
    if (elC) elC.textContent = totalCorrect;
    if (elW) elW.textContent = totalWrong;
    if (elU) elU.textContent = totalUnanswered;
    const srSummaryDiv = document.getElementById("sr_summary_div");
    if (srSummaryDiv) srSummaryDiv.style.display = "block";

    this.resultDiv.style.display = "block";
    hideOverlay();
  }
}

class Controller {
  constructor(model) {
    this.model = model;
    this.view = null;
    this.questions = [];
  }

  setView(view) {
    this.view = view;
  }

  async init() {
    const user = loggedInUser || {};

    // Default: Row should be visible (we already removed display: none from HTML)
    if (this.view.registerNumberRow) {
      this.view.registerNumberRow.style.display = "flex";
    }

    if (user.type === "TestTaker") {
      this.getTestList(user.user_id);
      this.getStudentMcqReport(user.user_id);
      if (this.view.emailInputCol)
        this.view.emailInputCol.style.display = "none";
      this.view.registerNumber.value = user.user_id;
    } else {
      if (this.view.emailInputCol)
        this.view.emailInputCol.style.display = "block";
      if (this.view.viewReport) this.view.viewReport.style.display = "block";
      if (this.view.testSelectCol)
        this.view.testSelectCol.style.display = "block";
    }
  }

  async getTestList(registerNumber) {
    showOverlay();
    try {
      let payload = JSON.stringify({
        function: "gttbs",
        user_id: registerNumber,
      });

      let response = await postCall(adminEndPoint, payload);

      if (
        response.success &&
        response.result &&
        response.result.tests &&
        response.result.tests.length > 0
      ) {
        let tests = response.result.tests;
        let options = [
          { value: "", html: "All Tests (Overall)", selected: true },
        ];
        tests.forEach((test) => {
          options.push({
            value: test.qp_id,
            html: test.name,
          });
        });
        setDropDown(options, this.view.testSelect);
      } else {
        setDropDown(
          [{ value: "", html: "All Tests (Overall)", selected: true }],
          this.view.testSelect,
        );
      }
      this.view.testSelectCol.style.display = "block";
    } catch (e) {
      setDropDown(
        [{ value: "", html: "All Tests (Overall)", selected: true }],
        this.view.testSelect,
      );
      this.view.testSelectCol.style.display = "block";
      hideOverlay();
    }
  }

  async getStudentMcqReport(registerNumber, questionPaperID = null) {
    showOverlay();
    try {
      let payloadObj = {
        function: "gesr",
        user_id: registerNumber,
        org_id: loggedInUser.org_id,
      };
      if (questionPaperID) {
        payloadObj.question_paper_id = questionPaperID;
      }
      let payload = JSON.stringify(payloadObj);

      let response = await postCall(reportEndPoint, payload);

      if (response.success) {
        this.reports = response.result.report;
        this.view.showReportSection(this.reports);
      }

      hideOverlay();
    } catch (error) {
      console.error(error);
      hideOverlay();
      alert("An error occurred while fetching report");
    }
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
  hideOverlay();
  let controller = new Controller();
  let view = new View(controller);
  controller.setView(view);
  controller.init();
}
