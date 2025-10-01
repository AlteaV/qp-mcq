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
  let id = subName.value;
  if (id == "") {
    addBtnDiv.classList.add("d-none");
    resultDiv.style.display = "none";
    return;
  }
  addBtnDiv.classList.remove("d-none");

  let selectedSub = mcqSub.find((s) => s.subject_id == id);

  let sections = selectedSub["sections"];
  sections = sections.sort((a, b) => {
    return a.section_name.localeCompare(b.section_name);
  });
  showResult(sections);
});

function rendersubject(data) {
  let newData = data.map((subject) => {
    return { html: subject["subject_name"], value: subject["subject_id"] };
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
        new TableStructure(sub.section_name),
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
      editButtonClicked(curr_data["section_id"]);
      secName.value = curr_data["section_name"];
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
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      mcqSub = response.result.subjects;
      mcqSub = mcqSub.sort((a, b) => {
        return a.subject_name.localeCompare(b.subject_name);
      });
      mcqSub.forEach((s) => {
        s["sections"] = JSON.parse(s["sections"]);
      });
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
      sec_id: curr_data["section_id"],
      sec_name: secName.value,
      staff_id: loggedInUser.staff_id,
      type: "update",
      function: "ms",
    };

    let response = await postCall(staffEndPoint, JSON.stringify(out));
    if (response.success) {
      mcqSub.forEach((s) => {
        if (s.subject_id == subName.value) {
          s["sections"].forEach((sec) => {
            if (sec.section_id == curr_data["section_id"]) {
              sec.section_name = secName.value;
            }
          });
        }
      });

      let selectedSub = mcqSub.find((s) => s.subject_id == subName.value);
      let sections = selectedSub["sections"];
      sections = sections.sort((a, b) => {
        return a.section_name.localeCompare(b.section_name);
      });

      showResult(sections);
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
      mcqSub.forEach((s) => {
        if (s.subject_id == subName.value) {
          s["sections"].push({ section_id: id, section_name: secName.value });
        }
      });

      let selectedSub = mcqSub.find((s) => s.subject_id == subName.value);
      let sections = selectedSub["sections"];
      sections = sections.sort((a, b) => {
        return a.section_name.localeCompare(b.section_name);
      });

      showResult(sections);
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
