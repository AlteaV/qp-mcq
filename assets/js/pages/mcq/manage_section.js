var form = document.getElementById("form");
var fetchingDataSection = document.getElementById("fetching_data");
var resultTableCount = document.getElementById("result_table_count");
var resultDiv = document.getElementById("result_div");
var resultTable = document.getElementById("result_table");
var fetchButton = document.getElementById("fetch_button");
var submitButton = document.getElementById("form_submit");
var addNewmcqsub = document.getElementById("network-button");
var subName = document.getElementById("subject_name");
var secName = document.getElementById("sec_name");
var formTitle = document.getElementById("form_title");
var addBtnDiv = document.getElementById("add_btn_div");

var mcqSub = null;
var mcqSubsec = null;
var curr_id = null;
var mcqSec = null;
var curr_data = null;
var isEditing = true;

submitButton.addEventListener("click", () => {
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  if (secName.value == "") {
    alert("field can't be empty");
    hideOverlay();
    return;
  }
  if (isEditing) {
    updatemcqSecname();
  } else {
    addnewmcqSubsec();
  }
});

addNewmcqsub.addEventListener("click", () => {
  resetForm();
  $("#modal").modal("show");
  isEditing = false;
  formTitle.innerHTML = "Add Section";
});

subName.addEventListener("change", () => {
  addBtnDiv.classList.remove("d-none");
  let id = subName.value;
  let data = [];
  for (let sec in mcqSec) {
    if (mcqSec[sec]["subject_id"] == id) {
      data.push(mcqSec[sec]);
    }
  }
  showResult(data);
});

function rendersubject(data) {
  let newData = data.map((d) => {
    return { html: d["subject"], value: d["id"] };
  });
  newData.unshift({
    html: "Please select subject",
    value: "",
    disabled: true,
    selected: true,
  });
  setDropDown(newData, subName);
}

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
          new TableStructure("Section"),
          new TableStructure("Action"),
        ],
      ],
      tableBody: [],
    };

    data.forEach((sub, index) => {
      tableData.tableBody.push([
        new TableStructure(index + 1),
        new TableStructure(sub.section),
        new TableStructure(createEditButton(sub)),
      ]);
    });

    displayResult(tableData, resultTable);
    hideOverlay();
    resultDiv.style.display = "block";

    $("#result_table").on("click", ".edit-button", (event) => {
      formTitle.innerHTML = "Update Section";
      isEditing = true;
      form.classList.remove("was-validated");
      form.reset();
      $("#modal").modal("show");
      let $button = $(event.currentTarget);
      curr_data = JSON.parse(decodeURIComponent($button.attr("data-full")));
      curr_id = curr_data["id"];
      editButtonClicked(curr_data["id"]);
      secName.value = curr_data["section"];
    });
  } catch (error) {
    hideOverlay();
    alert("An error occurred while displaying the report: " + error.message);
  }
}

function editButtonClicked(id) {
  try {
    id = id;
    $("#modal").modal("show");
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

async function init() {
  getSubname();
}

async function getSubname() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gsas",
      get_btl: false,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      mcqSub = response.result.subjects;
      mcqSec = response.result.sections;
      rendersubject(mcqSub);
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

async function updatemcqSecname() {
  showOverlay();
  try {
    let out = {
      sec_id: curr_data["id"],
      sec_name: secName.value,
      staff_id: loggedInUser.staff_id,
      type: "update",
      function: "ms",
    };
    let response = await postCall(staffEndPoint, JSON.stringify(out));
    if (response.success) {
      for (let sec in mcqSec) {
        if (mcqSec[sec]["id"] == curr_data["id"]) {
          mcqSec[sec] = {
            id: curr_data["id"],
            subject_id: subName.value,
            section: secName.value,
          };
          break;
        }
      }
      let data = [];
      for (let sec in mcqSec) {
        if (mcqSec[sec]["subject_id"] == subName.value) {
          data.push(mcqSec[sec]);
        }
      }
      showResult(data);
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

async function addnewmcqSubsec() {
  showOverlay();
  try {
    let out = {
      subject_id: subName.value,
      sec_name: secName.value,
      staff_id: loggedInUser.staff_id,
      type: "add",
      function: "ms",
    };
    let response = await postCall(examCellEndPoint, JSON.stringify(out));

    if (response.success) {
      let id = response.result.id;
      mcqSec.push({
        id: id,
        subject_id: subName.value,
        section: secName.value,
      });
      let data = [];
      for (let sec in mcqSec) {
        if (mcqSec[sec]["subject_id"] == subName.value) {
          data.push(mcqSec[sec]);
        }
      }
      showResult(data);
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
    init();
  }
});
