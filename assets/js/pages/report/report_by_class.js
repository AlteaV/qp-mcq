var testTypeDropDown = document.getElementById("test_type");
var levelDropDown = document.getElementById("level");
var groupDropDown = document.getElementById("group");

var networkButton = document.getElementById("network_button");
var submitButton = document.getElementById("submit_button");
var toggleBtnChart = document.getElementById("btn-chart");
var toggleBtnTable = document.getElementById("btn-table");

let infoTable = document.getElementById("info_table");
let resultDiv = document.getElementById("result_div");
let resultTable = document.getElementById("result_table");
let fetchingDataSection = document.getElementById("fetching_data");

var allLevel = null;
let allGroup = [];
var subjects = [];
let currentItems = subjects;
let myChart;
const ctx = document.getElementById("drillChart").getContext("2d");

let navStack = [{ label: "All Subjects", data: subjects, type: "Overview" }];

// event listener
levelDropDown.addEventListener("change", () => {
  reset();
});
testTypeDropDown.addEventListener("change", async () => {
  reset();
});
groupDropDown.addEventListener("change", async () => {
  reset();
});

networkButton.addEventListener("click", async () => {
  reset();
  await getReport();
});

toggleBtnChart.addEventListener("click", () => toggleView("chart"));
toggleBtnTable.addEventListener("click", () => toggleView("table"));

function jumpTo(index) {
  navStack = navStack.slice(0, index + 1);
  renderDashboard(navStack[index].data);
}

function handleDrill(index) {
  let selected = currentItems[index];

  if (selected.children && selected.children.length > 0) {
    const nextType = navStack.length === 1 ? "Sections" : "Topics";
    navStack.push({
      label: selected.name,
      data: selected.children,
      type: nextType,
    });
    renderDashboard(selected.children);
  } else {
    if (navStack.length === 1) {
      checkDrillDownAvailability(selected.id, null);
    } else if (navStack.length === 2) {
      checkDrillDownAvailability(null, selected.id);
    } else {
      alert("No further details available for this item.");
    }
  }
}

window.jumpTo = jumpTo;
window.handleDrill = handleDrill;

async function init() {
  if (loggedInUser.type == "Student") {
    testTypeDropDown.appendChild(new Option("Self Learning", "Self"));
  }
  renderLevels();
}

function reset() {
  resultDiv.style.display = "none";
  fetchingDataSection.innerHTML = "";
}

function renderLevels() {
  allLevel.forEach((lev) => {
    const option = document.createElement("option");
    option.value = lev.id;
    option.textContent = lev.level;
    levelDropDown.appendChild(option);
  });
  hideOverlay();
}

function renderGroups() {
  allGroup.forEach((grp) => {
    const option = document.createElement("option");
    option.value = grp.group_id;
    option.textContent = grp.group_name;
    groupDropDown.appendChild(option);
  });
  hideOverlay();
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

function renderDashboard(data) {
  fetchingDataSection.style.display = "none";
  if (!data || data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  currentItems = data;

  // update chart
  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: "bar",
    data: getChartConfig(data),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        // mode: "index", // to show tooltip for both bars on hover
        intersect: false,
      },
      scales: {
        x: {
          stacked: false, //  for side-by-side bars
        },
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          title: { display: true, text: "Pass Rate (%)" },
        },
      },

      onClick: (event, activeElements) => {
        if (activeElements.length > 0) handleDrill(activeElements[0].index);
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              let item = data[c.dataIndex];
              let isOverall = c.datasetIndex === 0; // 0 is overall, 1 is group

              let labelPrefix = isOverall ? "Overall" : "Group";
              let attended = isOverall
                ? item.attended_overall
                : item.attended_group;
              let passed = isOverall ? item.passed_overall : item.passed_group;
              let avgTime = isOverall
                ? item.overall_avg_time
                : item.group_avg_time;
              let difficulty = isOverall
                ? item.difficulty_overall
                : item.difficulty_group;

              return [
                `${labelPrefix} Pass Rate: ${c.raw}%`,
                `Attended: ${attended || 0}`,
                `Passed: ${passed || 0}`,
                `Avg Time: ${avgTime || 0}m`,
                `Difficulty: ${difficulty || "N/A"}`,
              ];
            },
          },
        },
      },
    },
  });

  // update title and breadcrumb
  const currentLevel = navStack[navStack.length - 1];
  document.getElementById("view-title").innerText =
    navStack.length === 1
      ? "All Subjects Overview"
      : `${currentLevel.type} in ${currentLevel.label}`;
  document.getElementById("breadcrumb").innerHTML = navStack
    .map(
      (step, i) =>
        `<span style="cursor:pointer; color:blue; text-decoration:underline; margin-right:5px;" onclick="window.jumpTo(${i})">${step.label}</span>`,
    )
    .join(" -> ");

  // update stats
  // overall Calculations
  let attO = data.reduce((s, i) => s + Number(i.attended_overall || 0), 0);
  let passO = data.reduce((s, i) => s + Number(i.passed_overall || 0), 0);
  let rateO = attO > 0 ? ((passO / attO) * 100).toFixed(1) : 0;
  let timeO =
    data.length > 0
      ? (
          data.reduce((s, i) => {
            const timeParts = (i.overall_avg_time || "0:0:0").split(":");
            const minutes =
              parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
            return s + minutes;
          }, 0) / data.length
        ).toFixed(1)
      : 0;

  // group Calculations
  let attG = data.reduce((s, i) => s + Number(i.attended_group || 0), 0);
  let passG = data.reduce((s, i) => s + Number(i.passed_group || 0), 0);
  let rateG = attG > 0 ? ((passG / attG) * 100).toFixed(1) : 0;
  let timeG =
    data.length > 0
      ? (
          data.reduce((s, i) => {
            const timeParts = (i.group_avg_time || "0:0:0").split(":");
            const minutes =
              parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
            return s + minutes;
          }, 0) / data.length
        ).toFixed(1)
      : 0;

  document.getElementById("s-att-o").innerText = attO;
  document.getElementById("s-att-g").innerText = attG;
  document.getElementById("s-pass-o").innerText = passO;
  document.getElementById("s-pass-g").innerText = passG;
  document.getElementById("s-rate-o").innerText = rateO + "%";
  document.getElementById("s-rate-g").innerText = rateG + "%";
  document.getElementById("s-time-o").innerText = timeO;
  document.getElementById("s-time-g").innerText = timeG;

  // update table
  document.getElementById("table-body").innerHTML = data
    .map((item, index) => {
      // Calculate Rates
      const overallRate =
        item.attended_overall > 0
          ? ((item.passed_overall / item.attended_overall) * 100).toFixed(1)
          : 0;
      const groupRate =
        item.attended_group > 0
          ? ((item.passed_group / item.attended_group) * 100).toFixed(1)
          : 0;

      return `
      <tr>
          <td rowspan="2" style="vertical-align: middle; border-bottom: 2px solid #dee2e6;">
            <a href="javascript:void(0)" class="drill-link" onclick="handleDrill(${index})">
              <strong>${item.name}</strong>
            </a>
          </td>
          <td style="background-color: #f8f9fa; font-weight: 500;">Overall</td>
          <td>${item.attended_overall}</td>
          <td>${item.passed_overall}</td>
          <td style="font-weight:bold;">${overallRate}%</td>
          <td>${item.overall_avg_time || "0"}m</td>
          <td>${getDifficultyBadge(item.difficulty_overall)}</td>
      </tr>
      <tr style="border-bottom: 2px solid #dee2e6;">
          <td style="background-color: #fff; font-style: italic;">Group</td>
          <td>${item.attended_group || 0}</td>
          <td>${item.passed_group || 0}</td>
          <td style="font-weight:bold;">${groupRate}%</td>
          <td>${item.group_avg_time || "0"}m</td>
          <td>${getDifficultyBadge(item.difficulty_group)}</td>
      </tr>`;
    })
    .join("");
  resultDiv.style.display = "block";
}

function checkDrillDownAvailability(subjectID, sectionID) {
  // check if drill down data is already available in the current item, if not make API call

  if (subjectID) {
    const subject = currentItems.find((s) => s.id === subjectID);
    if (subject && subject.section) {
      navStack.push({
        label: subject.name,
        data: subject.section,
        type: "Sections",
      });
      renderDashboard(subject.section);
      return;
    }
  } else if (sectionID) {
    const section = currentItems.find((s) => s.id === sectionID);
    if (section && section.topic) {
      navStack.push({
        label: section.name,
        data: section.topic,
        type: "Topics",
      });
      renderDashboard(section.topic);
      return;
    }
  }

  if (subjectID) {
    getReport(subjectID, null); // Drill into Sections
  } else if (sectionID) {
    getReport(null, sectionID); // Drill into Topics
  }
}

function getChartConfig(data) {
  return {
    labels: data.map((i) => i.name),
    datasets: [
      {
        label: "Overall Pass Rate",
        data: data.map((i) =>
          i.attended_overall > 0
            ? ((i.passed_overall / i.attended_overall) * 100).toFixed(1)
            : 0,
        ),
        backgroundColor: data.map(
          (i) => difficultyColors[i.difficulty_overall],
        ),
        borderColor: data.map((i) => difficultyColors[i.difficulty_overall]),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.9,
        categoryPercentage: 0.8,
      },
      {
        label: "Group Pass Rate",
        data: data.map((i) =>
          i.attended_group > 0
            ? ((i.passed_group / i.attended_group) * 100).toFixed(1)
            : 0,
        ),
        backgroundColor: data.map((i) => difficultyColors[i.difficulty_group]),
        borderColor: data.map((i) => difficultyColors[i.difficulty_group]),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.9,
        categoryPercentage: 0.8,
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

async function getReport(subjectID = null, sectionID = null) {
  if (!testTypeDropDown.value) {
    alert("Please select test type");
    return;
  }
  if (!levelDropDown.value) {
    alert("Please select level");
    return;
  }
  if (!groupDropDown.value) {
    alert("Please select group");
    return;
  }

  let out = {
    function: "ggwr",
    subject_id: subjectID,
    section_id: sectionID,
    group_id: groupDropDown.value,
    test_type: testTypeDropDown.value,
    level_id: levelDropDown.value,
    org_id: loggedInUser.college_code,
  };

  if (loggedInUser.type == "Student") {
    out.user_id =
      loggedInUser.register_num ||
      loggedInUser.user_id ||
      loggedInUser.staff_id;
  }

  try {
    showOverlay();
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));

    if (response.success) {
      let reportData = response.result.report;

      if (subjectID == null && sectionID == null) {
        subjects = reportData;
        navStack = [
          { label: "All Subjects", data: subjects, type: "Overview" },
        ];
        renderDashboard(subjects);
      } else {
        let parent = navStack[navStack.length - 1];
        let nextType = navStack.length === 1 ? "Sections" : "Topics";

        // find the name from the previous level to set the correct label
        let selectedItem = parent.data.find(
          (i) => i.id === (subjectID || sectionID),
        );

        // update subjects or sections in the previous level to avoid future API calls for the same item
        if (subjectID) {
          for (let subject of subjects) {
            if (subject.id === subjectID) {
              subject.section = reportData;
              break;
            }
          }
        } else if (sectionID) {
          for (let subject of subjects) {
            if (subject.section) {
              for (let section of subject.section) {
                if (section.id === sectionID) {
                  section.topic = reportData;
                  break;
                }
              }
            }
          }
        }
        // update navStack with new data for the drilled down level
        navStack.push({
          label: selectedItem ? selectedItem.name : "",
          data: reportData,
          type: nextType,
        });
        renderDashboard(reportData);
      }
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching data");
  } finally {
    hideOverlay();
  }
}

async function getGroupData() {
  showOverlay();
  try {
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "ggd",
        org_id: loggedInUser.college_code,
      }),
    );
    if (response.success) {
      allGroup = response.result.all_group;
      renderGroups();
    } else {
      alert(response.message);
      hideOverlay();
    }
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching group data");
  }
}

async function initializePage() {
  await fetchLevel();
  await getGroupData();
  allLevel = JSON.parse(sessionStorage.getItem("levels")) || [];
  init();
}
