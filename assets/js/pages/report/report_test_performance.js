var fetchingDataSection = document.getElementById("fetching_data");
var resultTable = document.getElementById("result_table");
var resultDiv = document.getElementById("result_div");
var registerNumber = document.getElementById("register_num");
var viewReport = document.getElementById("view_report");
var questionPaperDropDown = document.getElementById("question_paper");

var qp = null;
var sections = null;
var selectedStudent = null;

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
    tableHeader: [[new TableStructure("S.NO")]],
    tableBody: [],
  };

  if (loggedInUser.type == "Student") {
    tableData.tableHeader[0].push(new TableStructure("Question Paper Name"));
    tableData.tableHeader[0].push(new TableStructure(`Correct Answers`));
    tableData.tableHeader[0].push(new TableStructure(`Total Questions`));
  } else {
    tableData.tableHeader[0].push(new TableStructure("User ID"));
    tableData.tableHeader[0].push(new TableStructure("User Name"));
    tableData.tableHeader[0].push(
      new TableStructure(
        `Total Score<br><small>(out of ${data[0].total_questions})</small>`
      )
    );
  }

  tableData.tableHeader[0].push(new TableStructure("Average Time"));
  tableData.tableHeader[0].push(new TableStructure("Actions"));

  data.forEach((row, index) => {
    let viewButton = createButton(
      row.attempt_id,
      "",
      "view-button",
      "fas fa-eye"
    );

    let temp = [];
    temp.push(new TableStructure(index + 1));
    if (loggedInUser.type == "Student") {
      temp.push(new TableStructure(row.name));
      temp.push(new TableStructure(row.total_score));
      temp.push(new TableStructure(row.total_questions));
    } else {
      temp.push(new TableStructure(row.user_id));
      temp.push(new TableStructure(row.user_name));
      temp.push(new TableStructure(row.total_score));
    }
    temp.push(new TableStructure(row.average_time));
    temp.push(new TableStructure(viewButton));
    tableData.tableBody.push(temp);
  });

  displayResult(tableData, resultTable);

  $("#result_table").off("click", ".view-button");
  $("#result_table").on("click", ".view-button", async (event) => {
    let attemptId = JSON.parse(
      decodeURIComponent(event.currentTarget.getAttribute("data-full"))
    );
    selectedStudent = data.find((d) => d.attempt_id == attemptId);
    getIndividualPerformance(attemptId, selectedStudent);
  });
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
  if (loggedInUser.type == "Student") {
    await getStudentTests();
  } else {
    filterDiv.style.display = "flex";
    await getQuestionPaper();
  }
}

async function getStudentTests() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gttbs",
      user_id: loggedInUser.register_num,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      showReportSection(response.result.tests);
    } else {
      alert(response.message);
    }
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching test performance by student");
  }
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
      function: "grbqp",
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
