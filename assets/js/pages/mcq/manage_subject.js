var form = document.getElementById("form");
var fetchingDataSection = document.getElementById("fetching_data");
var resultTableCount = document.getElementById("result_table_count");
var resultDiv = document.getElementById("result_div");
var resultTable = document.getElementById("result_table");
var fetchButton = document.getElementById("fetch_button");
var submitButton = document.getElementById("form_submit");
var addNewmcqsub = document.getElementById("network-button");
var subID = document.getElementById("sub_id");
var subName = document.getElementById("sub_name");
var subIdDiv = document.getElementById("sub_id_div");
var isEditing = true;
var formTitle = document.getElementById("form_title");

submitButton.addEventListener("click", () => {
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  if (isEditing) {
    updateSubname();
  } else {
    addnewMCQsubject();
  }
});

addNewmcqsub.addEventListener("click", () => {
  resetForm();
  $("#modal").modal("show");
  subIdDiv.classList.add("d-none");
  isEditing = false;
  formTitle.innerHTML = "Add Subject";
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
          new TableStructure("Subject Name"),
          new TableStructure("Actions"),
        ],
      ],
      tableBody: [],
    };

    data.forEach((sub, index) => {
      tableData.tableBody.push([
        new TableStructure(index + 1),
        new TableStructure(sub.subject),
        new TableStructure(createEditButton(sub)),
      ]);
    });

    displayResult(tableData, resultTable);
    hideOverlay();
    resultDiv.style.display = "block";

    $("#result_table").on("click", ".edit-button", (event) => {
      formTitle.innerHTML = "Update Subject";
      subIdDiv.classList.remove("d-none");
      isEditing = true;
      form.classList.remove("was-validated");
      form.reset();
      $("#modal").modal("show");
      let $button = $(event.currentTarget);
      let sub = JSON.parse(decodeURIComponent($button.attr("data-full")));
      curr_id = sub["id"];
      editButtonClicked(sub["id"]);
      subName.value = sub["subject"];
    });
  } catch (error) {
    hideOverlay();
    alert("An error occurred while displaying the report: " + error.message);
  }
}

function editButtonClicked(id) {
  try {
    subID.innerHTML = id || "";
    id = id;
    $("#modal").modal("show");
    subIdDiv.classList.add("d-none");
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
var mcqSub = null;
var curr_id = null;

async function init() {
  getSubname();
}

async function getSubname() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gms",
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      mcqSub = response.result.subject;
      showResult(mcqSub);
    } else {
      alert("An error occurred while fetching McQ Subject data");
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching data: " + error.message);
  }
}
async function updateSubname() {
  showOverlay();
  try {
    let out = {
      sub_name: subName.value,
      sub_id: subID.innerHTML,
      staff_id: loggedInUser.staff_id,
      function: "ums",
    };
    let response = await postCall(staffEndPoint, JSON.stringify(out));

    if (response.success) {
      for (let sub in mcqSub) {
        if (curr_id == mcqSub[sub]["id"]) {
          mcqSub[sub]["subject"] = subName.value;
        }
      }
      showResult(mcqSub);
      $("#modal").modal("hide");
      alert(response.message);
    } else {
      alert("An error occurred while fetching data");
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error("Error fetching request: ", error);
    alert("An error occurred while Submint data: " + error.message);
  }
}

async function addnewMCQsubject() {
  showOverlay();
  try {
    let out = {
      sub_name: subName.value,
      function: "ams",
      staff_id: loggedInUser.staff_id,
      org_id: loggedInUser.college_code,
    };

    let response = await postCall(examCellEndPoint, JSON.stringify(out));
    if (response.success) {
      mcqSub.push({
        id: response.result.id,
        subject: subName.value,
      });
      showResult(mcqSub);
      alert(response.message);
      $("#modal").modal("hide");
    } else {
      alert("An error occurred while fetching data add");
    }
    hideOverlay();
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
