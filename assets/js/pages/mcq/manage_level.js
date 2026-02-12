var form = document.getElementById("form");
var fetchingDataSection = document.getElementById("fetching_data");
var resultTableCount = document.getElementById("result_table_count");
var resultDiv = document.getElementById("result_div");
var resultTable = document.getElementById("result_table");
var fetchButton = document.getElementById("fetch_button");
var submitButton = document.getElementById("form_submit");
var addNewmcqlevel = document.getElementById("network-button");

var levelID = document.getElementById("level_id");
var levelIdDiv = document.getElementById("level_id_div");
var levelName = document.getElementById("level_name");

var isEditing = true;
var formTitle = document.getElementById("form_title");

submitButton.addEventListener("click", () => {
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  if (isEditing) {
    updateLevelname();
  } else {
    addnewMCQLevel();
  }
});

addNewmcqlevel.addEventListener("click", () => {
  resetForm();
  $("#modal").modal("show");
  levelIdDiv.classList.add("d-none");
  isEditing = false;
  formTitle.innerHTML = "Add Level";
});

function showResult(data) {
  try {
    fetchingDataSection.style.display = "none";
    if (data.length === 0) {
      fetchingDataSection.innerHTML = "<p>There is no data</p>";
      fetchingDataSection.style.display = "block";
      resultDiv.style.display = "none";
      hideOverlay();
      return;
    }

    let tableData = {
      tableHeader: [
        [
          new TableStructure("S.No"),
          new TableStructure("Level"),
          new TableStructure("Actions"),
        ],
      ],
      tableBody: [],
    };

    data.forEach((ml, index) => {
      tableData.tableBody.push([
        new TableStructure(index + 1),
        new TableStructure(ml.level),
        new TableStructure(createEditButton(ml)),
      ]);
    });

    displayResult(tableData, resultTable);
    hideOverlay();
    resultDiv.style.display = "block";

    $("#result_table").on("click", ".edit-button", (event) => {
      formTitle.innerHTML = "Update Level";
      levelIdDiv.classList.remove("d-none");
      isEditing = true;
      form.classList.remove("was-validated");
      form.reset();
      $("#modal").modal("show");
      let $button = $(event.currentTarget);
      let manlevel = JSON.parse(decodeURIComponent($button.attr("data-full")));
      curr_id = manlevel["id"];
      editButtonClicked(manlevel["id"]);
      levelName.value = manlevel["level"];
    });
  } catch (error) {
    hideOverlay();
    alert("An error occurred while displaying the report: " + error.message);
  }
}

function editButtonClicked(id) {
  try {
    levelID.innerHTML = id || "";
    id = id;
    $("#modal").modal("show");
    levelIdDiv.classList.add("d-none");
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while click Edit Button" + error);
  }
}

function resetForm() {
  form.reset();
  form.classList.remove("was-validated");
  $("#modal").modal("hide");
}

var mcqLevel = null;
var curr_id = null;
async function init() {
  getlevel();
}

async function getlevel() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gl",
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(examCellEndPoint, payload);
    if (response.success) {
      mcqLevel = response.result.levels;
      showResult(mcqLevel);
    } else {
      alert("An error occurred while fetching McQ Level data");
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching data: " + error.message);
  }
}

async function addnewMCQLevel() {
  showOverlay();
  try {
    const userInput = levelName.value;
    const isDuplicate = mcqLevel.some((item) => item.level === userInput);
    if (isDuplicate) {
      alert("Duplicate Level Entry!");
      hideOverlay();
      return;
    }
    let out = {
      level_name: levelName.value,
      function: "al",
      staff_id: loggedInUser.staff_id,
      org_id: loggedInUser.college_code,
    };
    let response = await postCall(examCellEndPoint, JSON.stringify(out));
    if (response.success) {
      sessionStorage.removeItem("levels");
      mcqLevel.push({
        id: response.result.id,
        level: levelName.value,
      });
      showResult(mcqLevel);
      alert(response.message);
      $("#modal").modal("hide");
    } else {
      alert("An error occurred while fetching data add" + response.message);
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error("Error fetching request: ", error);
    alert("An error occurred while Submint data: " + error.message);
  }
}

async function updateLevelname() {
  showOverlay();
  try {
    const userInput = levelName.value;
    const isDuplicate = mcqLevel.some((item) => item.level === userInput);
    if (isDuplicate) {
      alert("Duplicate Level Entry!");
      hideOverlay();
      return;
    }
    let out = {
      level_name: levelName.value,
      level_id: levelID.innerHTML,
      staff_id: loggedInUser.staff_id,
      function: "ul",
    };
    let response = await postCall(examCellEndPoint, JSON.stringify(out));
    if (response.success) {
      sessionStorage.removeItem("levels");
      for (let ml in mcqLevel) {
        if (curr_id == mcqLevel[ml]["id"]) {
          mcqLevel[ml]["level"] = levelName.value;
        }
      }
      showResult(mcqLevel);
      $("#modal").modal("hide");
      alert(response.message);
    } else {
      alert("An error occurred while fetching data");
      hideOverlay();
    }
  } catch (error) {
    hideOverlay();
    console.error("Error fetching request: ", error);
    alert("An error occurred while Submint data: " + error.message);
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
