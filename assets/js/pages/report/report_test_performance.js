var fetchingDataSection = document.getElementById("fetching_data");
var resultTable = document.getElementById("result_table");
var resultDiv = document.getElementById("result_div");
var registerNumber = document.getElementById("register_num");
var viewReport = document.getElementById("view_report");
var questionPaperDropDown = document.getElementById("question_paper");
var toggleBtnChart = document.getElementById("btn-chart");
var toggleBtnTable = document.getElementById("btn-table");

var qp = null;
var sections = null;
var selectedStudent = null;
let summary = [];

let currentItems = summary;
let myChart;
const ctx = document.getElementById("drillChart").getContext("2d");

let navStack = [{ label: "All Sections", data: summary, type: "Overview" }];

toggleBtnChart.addEventListener("click", () => toggleView("chart"));
toggleBtnTable.addEventListener("click", () => toggleView("table"));

function jumpTo(index) {
  navStack = navStack.slice(0, index + 1);
  renderChart(navStack[index].data);
}

function handleDrill(index) {
  if (navStack.length === 1) {
    let selectedSection = currentItems[index];
    let topics = [];
    try {
      topics =
        typeof selectedSection.topics_list === "string"
          ? JSON.parse(selectedSection.topics_list)
          : selectedSection.topics_list;
    } catch (e) {
      console.error("Error parsing topics:", e);
    }

    if (topics && topics.length > 0) {
      navStack.push({
        label: selectedSection.section_name,
        data: topics,
        type: "Topics",
      });
      renderChart(topics);
    } else {
      alert("No topic details available for this section.");
    }
  } else {
    alert("No further details available for this item.");
  }
}

window.jumpTo = jumpTo;
window.handleDrill = handleDrill;

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
    tableData.tableHeader[0].push(new TableStructure(`Total Questions`));
    tableData.tableHeader[0].push(new TableStructure(`Total Mark Obtained`));
  } else {
    let totalQues = null;
    for (let i = 0; i < data.length; i++) {
      let element = data[i];
      if (element.total_questions) {
        totalQues = element.total_questions;
        break;
      }
    }
    tableData.tableHeader[0].push(new TableStructure("User ID"));
    tableData.tableHeader[0].push(new TableStructure("User Name"));
    tableData.tableHeader[0].push(
      new TableStructure(`Total Score<br><small>(out of ${totalQues})</small>`),
    );
  }

  tableData.tableHeader[0].push(new TableStructure("Average Time"));
  tableData.tableHeader[0].push(new TableStructure("Actions"));

  data.forEach((row, index) => {
    let viewButton = createButton(
      row.attempt_id,
      "",
      "view-button",
      "fas fa-eye",
    );

    let temp = [];
    temp.push(new TableStructure(index + 1));
    if (loggedInUser.type == "Student") {
      temp.push(new TableStructure(row.name));
      temp.push(new TableStructure(row.total_questions));
      temp.push(new TableStructure(row.total_score));
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
  navStack = [{ label: "All Sections", data: summary, type: "Overview" }];
  renderChart(summary);

  $("#result_table").off("click", ".view-button");
  $("#result_table").on("click", ".view-button", async (event) => {
    let attemptId = JSON.parse(
      decodeURIComponent(event.currentTarget.getAttribute("data-full")),
    );
    selectedStudent = data.find((d) => d.attempt_id == attemptId);
    getIndividualPerformance(attemptId, selectedStudent);
  });
  resultDiv.style.display = "block";
  hideOverlay();
}

function renderChart(data) {
  // update chart
  if (myChart) myChart.destroy();
  currentItems = data;
  try {
    myChart = new Chart(ctx, {
      type: "bar",
      data: getChartConfig(data),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
          },
        },
        onClick: (event, activeElements) => {
          if (activeElements.length > 0) handleDrill(activeElements[0].index);
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => [
                `Pass Rate: ${c.raw}%`,
                `Attended: ${data[c.dataIndex].attended}`,
                `Passed: ${data[c.dataIndex].passed}`,
                `Average Time: ${data[c.dataIndex].avg_time}m`,
                `Difficulty: ${data[c.dataIndex].difficulty_level}`,
              ],
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error rendering chart:", error);
    alert("An error occurred while rendering the chart.");
    hideOverlay();
  }

  // update title and breadcrumb
  const currentLevel = navStack[navStack.length - 1];
  document.getElementById("view-title").innerText =
    navStack.length === 1
      ? "All Sections Overview"
      : `${currentLevel.type} in ${currentLevel.label}`;
  document.getElementById("breadcrumb").innerHTML = navStack
    .map(
      (step, i) =>
        `<span style="cursor:pointer; color:blue; text-decoration:underline; margin-right:5px;" onclick="window.jumpTo(${i})">${step.label}</span>`,
    )
    .join(" -> ");

  // update table
  document.getElementById("table-body").innerHTML = data
    .map((item, index) => {
      const passRate =
        item.attended > 0
          ? ((item.passed / item.attended) * 100).toFixed(1)
          : 0;

      let name = item.name || item.section_name || item.topic_name || "Unknown";
      return `
            <tr>
                <td><a href="javascript:void(0)" class="drill-link" onclick="handleDrill(${index})">${name}</a></td>
                <td>${item.attended}</td>
                <td>${item.passed}</td>
                <td style="font-weight:bold;">${passRate}%</td>
                <td>${item.avg_time || "0"}m</td>
                <td>${getDifficultyBadge(item.difficulty_level)}</td>
            </tr>`;
    })
    .join("");
  resultDiv.style.display = "block";
}

function getChartConfig(data) {
  return {
    labels: data.map((i) => i.section_name || i.topic_name || "Unknown"),
    datasets: [
      {
        label: "Pass Rate (%)",
        data: data.map((i) => {
          const attended = Number(i.attended) || 0;
          const passed = Number(i.passed) || 0;
          return attended > 0 ? ((passed / attended) * 100).toFixed(1) : 0;
        }),
        backgroundColor: data.map(
          (i) =>
            difficultyColors[i.difficulty_level || i.difficulty_level] ||
            "#36a2eb",
        ),
        borderRadius: 8,
        barThickness: 45,
      },
    ],
  };
}
function toggleView(view) {
  document
    .getElementById("chart-wrapper")
    .classList.toggle("hidden", view === "table");
  document
    .getElementById("table-wrapper")
    .classList.toggle("hidden", view === "chart");
  document
    .getElementById("btn-chart")
    .classList.toggle("active", view === "chart");
  document
    .getElementById("btn-table")
    .classList.toggle("active", view === "table");
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
      user_id:
        loggedInUser.register_num ||
        loggedInUser.user_id ||
        loggedInUser.staff_id,
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
      summary = response.result.summary;
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
