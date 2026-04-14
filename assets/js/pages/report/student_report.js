class View {
  constructor(controller) {
    this.controller = controller;
    this.fetchingDataSection = document.getElementById("fetching_data");
    this.resultTable = document.getElementById("result_table");
    this.resultDiv = document.getElementById("result_div");
    this.registerNumber = document.getElementById("register_num");
    this.registerNumberRow = document.getElementById("register_number_row");
    this.viewReport = document.getElementById("view_report");

    this.testSelect = document.getElementById("test_select");
    this.testSelectCol = document.getElementById("test_select_col");
    this.emailInputCol = document.getElementById("email_input_col");

    this.viewReport.addEventListener("click", async () => {
      if (this.registerNumber.value) {
        // Snapshot the selected test value BEFORE getTestList
        // rebuilds the dropdown and resets its value to ""
        const selectedTestId = this.testSelect.value || null;
        if (this.controller.tests == null) {
          await this.controller.getTestList(this.registerNumber.value);
        }
        // Restore the selection the user had chosen
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
    // No change listener — API is triggered only via the View Report button
    this.registerNumber.addEventListener("input", () => {
      this.controller.tests = null;
      this.resultDiv.style.display = "none";
    });
    this.testSelect.addEventListener("change", () => {
      this.resultDiv.style.display = "none";
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

    let tableData = {
      tableHeader: [],
      tableBody: [],
    };

    data.forEach((subjectObj) => {
      const topics =
        typeof subjectObj.topics === "string"
          ? JSON.parse(subjectObj.topics)
          : subjectObj.topics;

      // 1. Subject Header Row
      let subjectHeaderRow = [];
      subjectHeaderRow.push(
        new TableStructure(
          subjectObj.subject,
          7,
          "",
          "",
          "text-align:center; font-weight:bold; background-color: #f8f9fa;",
        ),
      );
      tableData.tableBody.push(subjectHeaderRow);

      // 2. Column Headers using .push()
      let headerRow = [];
      headerRow.push(
        new TableStructure(
          "#",
          "",
          "",
          "",
          "text-align:center; font-weight:bold;",
        ),
      );
      headerRow.push(
        new TableStructure(
          "Section",
          "",
          "",
          "",
          "text-align:center; font-weight:bold;",
        ),
      );
      headerRow.push(
        new TableStructure(
          "Topic Name",
          "",
          "",
          "",
          "text-align:center; font-weight:bold;",
        ),
      );
      headerRow.push(
        new TableStructure(
          "Attended",
          "",
          "",
          "",
          "text-align:center; font-weight:bold;",
        ),
      );
      headerRow.push(
        new TableStructure(
          "Correct",
          "",
          "",
          "",
          "text-align:center; font-weight:bold;",
        ),
      );
      headerRow.push(
        new TableStructure(
          "Wrong",
          "",
          "",
          "",
          "text-align:center; font-weight:bold;",
        ),
      );
      headerRow.push(
        new TableStructure(
          "Unattended",
          "",
          "",
          "",
          "text-align:center; font-weight:bold;",
        ),
      );
      tableData.tableBody.push(headerRow);

      // 3. Data Rows using .push()
      topics.forEach((topic, index) => {
        let row = [];
        row.push(
          new TableStructure(index + 1, "", "", "", "text-align:center;"),
        );
        row.push(
          new TableStructure(
            subjectObj.section || "N/A",
            "",
            "",
            "",
            "text-align:center;",
          ),
        );
        row.push(new TableStructure(topic.topic_name));
        row.push(
          new TableStructure(
            topic.no_of_times_attempted,
            "",
            "",
            "",
            "text-align:center;",
          ),
        );
        row.push(
          new TableStructure(
            topic.no_of_times_passed,
            "",
            "",
            "",
            "text-align:center; color:green; font-weight:bold;",
          ),
        );
        row.push(
          new TableStructure(
            topic.no_of_wrong_answers,
            "",
            "",
            "",
            "text-align:center; color:red; font-weight:bold;",
          ),
        );
        row.push(
          new TableStructure(
            topic.no_of_unattended_questions,
            "",
            "",
            "",
            "text-align:center; color:orange; font-weight:bold;",
          ),
        );
        tableData.tableBody.push(row);
      });
    });

    displayResult(tableData, this.resultTable);
    this.resultDiv.style.display = "block";
    hideOverlay();
  }
}

class Controller {
  constructor(model) {
    this.model = model;
    this.view = null;
    this.questions = [];
    this.tests = null;
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
        this.tests = response.result.tests;
        let options = [
          { value: "", html: "All Tests (Overall)", selected: true },
        ];
        this.tests.forEach((test) => {
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
