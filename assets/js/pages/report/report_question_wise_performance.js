let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");
let resultDiv = document.getElementById("result_div");
let registerNumber = document.getElementById("register_num");
let viewReport = document.getElementById("view_report");
let questionPaperDropDown = document.getElementById("question_paper");

let qpAttendCount = document.getElementById("qp_attend_count");
let qp = null;

viewReport.addEventListener("click", async () => {
  if (questionPaperDropDown.value) {
    await getReport();
  } else {
    alert("Please choose a question paper.");
  }
});

questionPaperDropDown.addEventListener("change", () => {
  resetResult(fetchingDataSection, resultDiv);
});

function showReportSection(data) {
  fetchingDataSection.style.display = "none";
  if (!data || data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.NO"),
        new TableStructure("Topic"),
        new TableStructure("Question"),
        new TableStructure("BTL Level"),
        new TableStructure("Total Attended"),
        new TableStructure("Total Correct"),
        new TableStructure("Total Unattended"),
        new TableStructure("Average Time"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((row, index) => {
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(row.topic),
      new TableStructure(row.question, "", "", "", "text-align: left;"),
      new TableStructure(row.btl_level),
      new TableStructure(row.total_attended ?? 0),
      new TableStructure(row.total_correct ?? 0),
      new TableStructure(row.total_unattended ?? 0),
      new TableStructure(row.average_time),
    ]);
  });

  displayResult(tableData, resultTable);
  qpAttendCount.innerHTML = `Total times attended: ${
    data[0].total_attended + data[0].total_unattended
  }`;
  MathJax.typeset();

  resultDiv.style.display = "block";
  hideOverlay();
}

function renderQp(qp) {
  let q = qp.map((questionPaper) => {
    return { html: questionPaper["name"], value: questionPaper["question_id"] };
  });
  q.unshift({
    html: "Please select a question paper",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(q, questionPaperDropDown);
}

async function init() {
  await getQuestionPaper();
}

async function getQuestionPaper() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gaqatg",
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      qp = response.result.qp;
      renderQp(qp);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects and section");
  }
}

async function getReport() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gqwp",
      question_paper_id: questionPaperDropDown.value,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      showReportSection(response.result.report);
    }
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects and section");
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

function initializePage() {
  init();
}
