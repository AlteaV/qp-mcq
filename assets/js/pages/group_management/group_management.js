let StaffID = loggedInUser.staff_id;
let OrgID = loggedInUser.college_code;
let groupData = {};
let resultDiv = document.getElementById("result_div");
let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");
let modalTitle = document.getElementById("modalLabel");
let submitBtn = document.getElementById("form_submit");
let Type = null;
let form = document.getElementById("form");
let groupName = document.getElementById("grp_name");
let userID = document.getElementById("user_id");
let currGroupData = null;
let setion1 = document.getElementById("section1");
let section2 = document.getElementById("section2");
let s1Modal = document.getElementById("s1-modal");
let s2Modal = document.getElementById("s2-modal");

let addGroupBtn = document.getElementById("add_group");
let addMemberBtn = document.getElementById("add_members");
let currGroupID = null;
let groupMembers = [];
let backBtn = document.getElementById("back-btn");
let allGroup = null;

backBtn.addEventListener("click", () => {
  navigate(true);
  showReportSection(allGroup);
});

addGroupBtn.addEventListener("click", () => {
  form.reset();
  resetForm();
  $("#modal").modal("show");
  Type = "add";
});

addMemberBtn.addEventListener("click", () => {
  form.reset();
  resetForm();
  $("#modal").modal("show");
  modalTitle.innerHTML = "Add Group Members";
  Type = "add_member";
});

submitBtn.addEventListener("click", () => {
  form.classList.add("was-validated");
  if (form.checkValidity()) {
    if (Type == "add_member") {
      addMember();
    }
    if (Type == "update") {
      updateGroup();
    }
    if (Type == "add") {
      addGroup();
    }
  }
});

function init() {
  getGroupData();
}

async function getGroupData() {
  showOverlay();
  try {
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "ggd",
        org_id: OrgID,
      })
    );
    if (response.success) {
      allGroup = response.result.all_group;
      showReportSection(allGroup);
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

function showReportSection(data) {
  fetchingDataSection.style.display = "none";
  if (data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  let tableData = {
    //used array incase there are more than one header
    tableHeader: [
      [
        new TableStructure("#"),
        new TableStructure("Group Name"),
        new TableStructure("Action", "2"),
      ],
    ],
    tableBody: [],
  };

  data.forEach((grp, index) => {
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(grp.group_name),
      new TableStructure(createEditButton(grp), "", "", "", "width:1%"),
      new TableStructure(
        createButton(grp, "", "member-buton", "fas fa-eye"),
        "",
        "",
        "",
        "width:1%"
      ),
    ]);
  });

  $("#result_table")
    .off("click", ".edit-buton")
    .on("click", ".edit-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full"))
      );
      currGroupData = fullData;
      populateForm(fullData);
    });

  $("#result_table")
    .off("click", ".member-buton")
    .on("click", ".member-buton", (event) => {
      navigate();
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full"))
      );
      currGroupID = fullData.group_id;
      getGroupMembers(fullData);
    });

  displayResult(tableData, resultTable);
  hideOverlay();
  resultDiv.style.display = "block";
}

function showMembers(data) {
  fetchingDataSection.style.display = "none";
  if (data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  let tableData = {
    //used array incase there are more than one header
    tableHeader: [
      [
        new TableStructure("#"),
        new TableStructure("User ID"),
        new TableStructure("Name"),
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };

  data.forEach((user, index) => {
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(user.user_id),
      new TableStructure(user.user_name),
      new TableStructure(
        createButton(user, "", "delete-button btn-danger", "fas fa-trash-alt")
      ),
    ]);
  });

  displayResult(tableData, resultTable);

  $("#result_table")
    .off("click", ".delete-button")
    .on("click", ".delete-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full"))
      );
      deleteMember(fullData["user_id"], fullData["group_id"]);
    });

  hideOverlay();
  resultDiv.style.display = "block";
}

function navigate(back = false) {
  if (back) {
    setion1.classList.remove("d-none");
    section2.classList.add("d-none");
    s1Modal.classList.remove("d-none");
    s2Modal.classList.add("d-none");
    userID.removeAttribute("required");
    groupName.setAttribute("required", "required");
    groupMembers = [];
  } else {
    setion1.classList.add("d-none");
    section2.classList.remove("d-none");
    s1Modal.classList.add("d-none");
    s2Modal.classList.remove("d-none");
    groupName.removeAttribute("required");
    userID.setAttribute("required", "required");
  }
}

function populateForm(data) {
  resetForm();
  insertDataForUpdate(data);
  $("#modal").modal("show");
}

function resetForm() {
  modalTitle.innerHTML = "Add Group";
  form.classList.remove("was-validated");
  $("#modal").modal("hide");
  submitBtn.innerHTML = "Submit";
}

function insertDataForUpdate(data) {
  modalTitle.innerHTML = "Update Group";
  submitBtn.innerHTML = "Update";
  groupName.value = data["group_name"];
  Type = "update";
}

async function addGroup() {
  showOverlay();
  try {
    let grpName = groupName.value;
    if (isEsists(grpName, allGroup, "group_name")) {
      alert("Group already exists!");
      hideOverlay();
      return;
    }
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "agd",
        group_name: grpName,
        staff_id: StaffID,
        org_id: OrgID,
      })
    );
    if (response.success) {
      let group_id = response.result.group_id;
      allGroup.push({ group_id: group_id, group_name: grpName });
      showReportSection(allGroup);
      resetForm();
    } else {
      form.classList.remove("was-validated");
      alert(response.message);
      hideOverlay();
    }
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while updating the group");
  }
}

async function addMember() {
  showOverlay();
  try {
    let uids = userID.value.split("\n").filter((id) => id);
    for (let id in uids) {
      uids[id] = sanitizeInput(uids[id]);
      if (!/^\d+$/.test(uids[id])) {
        alert(`${uids[id]} is not a valid user ID! Only numbers are allowed.`);
        hideOverlay();
        return;
      }
      if (isEsists(uids[id], groupMembers, "user_id")) {
        alert(`${uids[id]} already exists!`);
        hideOverlay();
        return;
      }
    }
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "agm",
        uids: uids,
        group_id: currGroupID,
        staff_id: StaffID,
      })
    );
    if (response.success) {
      resetForm();
      groupMembers = response.result.all_members;
      showMembers(groupMembers);
    } else {
      form.classList.remove("was-validated");
      alert(response.message);
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while updating the group");
  }
}

async function updateGroup() {
  showOverlay();
  try {
    let grpName = groupName.value;
    if (isEsists(grpName, allGroup, "group_name")) {
      alert("Group already exists!");
      hideOverlay();
      return;
    }
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "ugd",
        group_name: grpName,
        staff_id: StaffID,
        group_id: currGroupData["group_id"],
      })
    );
    if (response.success) {
      for (let grp in allGroup) {
        if (allGroup[grp]["group_name"] == currGroupData["group_name"]) {
          allGroup[grp] = {
            group_id: currGroupData["group_id"],
            group_name: grpName,
          };
          break;
        }
      }
      showReportSection(allGroup);
      resetForm();
    } else {
      form.classList.remove("was-validated");
      alert(response.message);
      hideOverlay();
    }
    currGroupData = null;
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while updating the group");
    currGroupData = null;
  }
}

async function deleteMember(user_id, group_id) {
  showOverlay();
  try {
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "dgm",
        group_id: group_id,
        user_id: user_id,
      })
    );

    if (response.success) {
      groupMembers = groupMembers.filter(
        (member) => member["user_id"] != user_id
      );
      showMembers(groupMembers);
      alert(response.message);
    } else {
      alert(response.message);
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching group members data");
  }
}

function isEsists(key, array, searchString) {
  for (let obj in array) {
    if (array[obj][searchString] == key) {
      return true;
    }
  }
  return false;
}

async function getGroupMembers(data) {
  showOverlay();
  try {
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "ggm",
        group_id: data["group_id"],
      })
    );
    if (response.success) {
      groupMembers = response.result.all_members;
      showMembers(groupMembers);
    } else {
      alert(response.message);
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching group members data");
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
