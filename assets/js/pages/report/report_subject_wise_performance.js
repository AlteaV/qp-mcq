var testTypeDropDown = document.getElementById("test_type");
var levelDropDown = document.getElementById("level");
var networkButton = document.getElementById("network_button");
var submitButton = document.getElementById("submit_button");
var toggleBtnChart = document.getElementById("btn-chart");
var toggleBtnTable = document.getElementById("btn-table");

let infoTable = document.getElementById("info_table");
let resultDiv = document.getElementById("result_div");
let resultTable = document.getElementById("result_table");
let fetchingDataSection = document.getElementById("fetching_data");

var allLevel = null;
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
  if (loggedInUser.type == "TestTaker" && loggedInUser.practice) {
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
  let att = data.reduce((s, i) => s + Number(i.attended || 0), 0);
  let pass = data.reduce((s, i) => s + Number(i.passed || 0), 0);
  let rate = att > 0 ? ((pass / att) * 100).toFixed(1) : 0;

  document.getElementById("s-att").innerText = att;
  document.getElementById("s-pass").innerText = pass;
  document.getElementById("s-rate").innerText = rate + "%";
  document.getElementById("s-time").innerText =
    data.length > 0
      ? (
          data.reduce((s, i) => {
            const timeParts = (i.avg_time || "0:0:0").split(":");
            const minutes =
              parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
            return s + minutes;
          }, 0) / data.length
        ).toFixed(1)
      : 0;

  // update table
  document.getElementById("table-body").innerHTML = data
    .map((item, index) => {
      const passRate =
        item.attended > 0
          ? ((item.passed / item.attended) * 100).toFixed(1)
          : 0;
      return `
            <tr>
                <td><a href="javascript:void(0)" class="drill-link" onclick="handleDrill(${index})">${item.name}</a></td>
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
        data: data.map((i) => ((i.passed / i.attended) * 100).toFixed(1)),
        backgroundColor: data.map((i) => difficultyColors[i.difficulty_level]),
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

async function getReport(subjectID = null, sectionID = null) {
  if (!testTypeDropDown.value || !levelDropDown.value) {
    alert("Please select test type and level");
    return;
  }

  let out = {
    function: "gsrbl",
    subject_id: subjectID,
    section_id: sectionID,
    test_type: testTypeDropDown.value,
    level_id: levelDropDown.value,
    org_id: loggedInUser.org_id,
  };

  if (loggedInUser.type == "TestTaker") {
    out.user_id = loggedInUser.user_id;
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

async function initializePage() {
  await fetchLevel();
  allLevel = JSON.parse(sessionStorage.getItem("levels")) || [];
  init();
}
