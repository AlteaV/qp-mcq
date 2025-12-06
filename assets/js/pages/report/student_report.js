class View {
  constructor(controller) {
    this.controller = controller;
    this.fetchingDataSection = document.getElementById("fetching_data");
    this.resultTable = document.getElementById("result_table");
    this.resultDiv = document.getElementById("result_div");
    this.registerNumber = document.getElementById("register_num");
    this.registerNumberRow = document.getElementById("register_number_row");
    this.viewReport = document.getElementById("view_report");

    this.viewReport.addEventListener("click", async () => {
      if (this.registerNumber.value) {
        await this.controller.getStudentMcqReport(this.registerNumber.value);
      } else {
        alert("Please enter a register number.");
      }
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
      subjectObj.topics = JSON.parse(subjectObj.topics);

      let sections = [];
      if (subjectObj.sections && Array.isArray(subjectObj.sections)) {
        sections = subjectObj.sections;
      } else if (subjectObj.section && subjectObj.topics) {
        sections = [{ section: subjectObj.section, topics: subjectObj.topics }];
      }

      tableData.tableBody.push([
        new TableStructure(
          subjectObj.subject,
          sections.length * 4,
          "",
          "",
          "text-align:center; font-weight:bold;"
        ),
      ]);

      let sectionRow = [];
      sections.forEach((sectionObj) => {
        sectionRow.push(
          new TableStructure(
            sectionObj.section,
            4,
            "",
            "",
            "text-align:center; font-weight:bold;"
          )
        );
      });
      tableData.tableBody.push(sectionRow);

      let headerRow = [];
      sections.forEach(() => {
        headerRow.push(
          new TableStructure(
            "#",
            "",
            "",
            "",
            "text-align:center; font-weight:bold;"
          )
        );
        headerRow.push(
          new TableStructure(
            "Topic Name",
            "",
            "",
            "",
            "text-align:center; font-weight:bold;"
          )
        );
        headerRow.push(
          new TableStructure(
            "No. of attempts made",
            "",
            "",
            "",
            "text-align:center; font-weight:bold;"
          )
        );
        headerRow.push(
          new TableStructure(
            "No. of times passed",
            "",
            "",
            "",
            "text-align:center; font-weight:bold;"
          )
        );
      });
      tableData.tableBody.push(headerRow);

      let maxTopics = 0;
      sections.forEach((s) => {
        if (s.topics && s.topics.length > maxTopics) {
          maxTopics = s.topics.length;
        }
      });

      for (let i = 0; i < maxTopics; i++) {
        let row = [];
        sections.forEach((sectionObj) => {
          let topic = sectionObj.topics[i];
          if (topic) {
            row.push(
              new TableStructure(i + 1, "", "", "", "text-align:center;")
            );
            row.push(new TableStructure(topic.topic_name));
            row.push(
              new TableStructure(
                topic.no_of_times_attempted,
                "",
                "",
                "",
                "text-align:center;"
              )
            );
            row.push(
              new TableStructure(
                topic.no_of_times_passed,
                "",
                "",
                "",
                "text-align:center;"
              )
            );
          } else {
            row.push(new TableStructure(""));
            row.push(new TableStructure(""));
            row.push(new TableStructure(""));
            row.push(new TableStructure(""));
          }
        });
        tableData.tableBody.push(row);
      }
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
  }

  setView(view) {
    this.view = view;
  }

  async init() {
    if (loggedInUser.type == "Student") {
      this.getStudentMcqReport(
        loggedInUser.register_num ||
          loggedInUser.user_id ||
          loggedInUser.staff_id
      );
      this.view.registerNumberRow.style.display = "none";
    } else {
      this.view.registerNumberRow.style.display = "flex";
    }
  }

  async getStudentMcqReport(registerNumber) {
    showOverlay();
    try {
      let payload = JSON.stringify({
        function: "gesr",
        user_id: registerNumber,
        org_id: loggedInUser.college_code,
      });

      let response = await postCall(QuestionUploadEndPoint, payload);

      if (response.success) {
        this.reports = response.result.report;
        this.view.showReportSection(this.reports);
      }

      hideOverlay();
    } catch (error) {
      console.error(error);
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
