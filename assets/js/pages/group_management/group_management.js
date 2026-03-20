let StaffID = loggedInUser.user_id;
let OrgID = loggedInUser.org_id;
let groupData = {};
let resultDiv = document.getElementById("result_div");
let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");
let modalTitle = document.getElementById("modalLabel");
let submitBtn = document.getElementById("form_submit");
let Type = null;
let form = document.getElementById("form");
let groupName = document.getElementById("grp_name");
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

let classSelectionBody = document.getElementById("class_selection_body");

let allClasses = [];

backBtn.addEventListener("click", () => {
  navigate(true);
  showReportSection(allGroup);
});

addGroupBtn.addEventListener("click", () => {
  navigate(true); // Ensure modal and section state is correct for groups
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
  fetchAllOrganizationStudents();
});

// removed selectAllClassesBtn logic

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
      }),
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
        "width:1%",
      ),
    ]);
  });

  $("#result_table")
    .off("click", ".edit-button")
    .on("click", ".edit-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full")),
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
        decodeURIComponent($button.attr("data-full")),
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
    tableHeader: [
      [
        new TableStructure("#"),
        new TableStructure("Name"),
        new TableStructure("Email"),
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };

  data.forEach((user, index) => {
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(user.user_name),
      new TableStructure(user.email || "N/A"),
      new TableStructure(
        createButton(user, "", "delete-button btn-danger", "fas fa-trash-alt"),
      ),
    ]);
  });

  displayResult(tableData, resultTable);

  $("#result_table")
    .off("click", ".delete-button")
    .on("click", ".delete-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full")),
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
    groupName.setAttribute("required", "required");
    groupMembers = [];
  } else {
    setion1.classList.add("d-none");
    section2.classList.remove("d-none");
    s1Modal.classList.add("d-none");
    s2Modal.classList.remove("d-none");
    groupName.removeAttribute("required");
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
      hideOverlay();
      Swal.fire({
        icon: "warning",
        title: "Already Exists",
        text: "A group with this name already exists!",
      });
      return;
    }
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "agd",
        group_name: grpName,
        staff_id: StaffID,
        org_id: OrgID,
      }),
    );
    if (response.success) {
      let group_id = response.result.group_id;
      allGroup.push({ group_id: group_id, group_name: grpName });
      showReportSection(allGroup);
      resetForm();
      Swal.fire({
        icon: "success",
        title: "Group Added",
        text: `"${grpName}" was created successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      form.classList.remove("was-validated");
      hideOverlay();
      Swal.fire({ icon: "error", title: "Error", text: response.message });
    }
  } catch (error) {
    console.error(error);
    hideOverlay();
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while adding the group.",
    });
  }
}

addMemberBtn.addEventListener("click", () => {
  form.reset();
  resetForm();
  $("#modal").modal("show");
  modalTitle.innerHTML = "Add Group Members";
  Type = "add_member";
  fetchAllOrganizationStudents();
});

// selectAllClassesBtn logic removed

async function addMember() {
  const checked = Array.from(
    classSelectionBody.querySelectorAll('input[type="checkbox"]:checked'),
  );
  if (checked.length === 0) {
    return Swal.fire({
      icon: "warning",
      title: "No Selection",
      text: "Please select at least one class.",
    });
  }

  showOverlay();
  try {
    const classIds = checked.map((cb) => cb.value);
    let allUserIds = new Set();

    // Fetch all students from the selected classes
    for (let cid of classIds) {
      let resp = await postCall(
        groupMgmtEndPoint,
        JSON.stringify({ function: "gcm", class_id: cid }),
      );
      if (resp.success && resp.result.members) {
        resp.result.members.forEach((m) => allUserIds.add(m.user_id));
      }
    }

    let uniqueUserIds = Array.from(allUserIds);
    if (uniqueUserIds.length === 0) {
      hideOverlay();
      return Swal.fire({
        icon: "info",
        title: "Empty Classes",
        text: "No students were found in the selected classes.",
      });
    }

    let out = {
      function: "agm",
      org_id: OrgID,
      group_id: currGroupID,
      uids: uniqueUserIds,
      staff_id: StaffID,
    };

    let response = await postCall(groupMgmtEndPoint, JSON.stringify(out));
    if (response.success) {
      resetForm();
      groupMembers = response.result.all_members;
      showMembers(groupMembers);
      $("#modal").modal("hide");
      Swal.fire({
        icon: "success",
        title: "Members Added",
        text: response.message,
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      form.classList.remove("was-validated");
      Swal.fire({ icon: "error", title: "Error", text: response.message });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while adding members.",
    });
  } finally {
    hideOverlay();
  }
}

async function fetchAllOrganizationStudents() {
  showOverlay();
  if (classSelectionBody) {
    classSelectionBody.innerHTML =
      '<tr><td colspan="3" class="text-center">Loading classes...</td></tr>';
  }

  try {
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({ function: "gcl", org_id: OrgID }),
    );
    if (response.success) {
      allClasses = response.result.all_classes;
      if (allClasses.length === 0) {
        classSelectionBody.innerHTML =
          '<tr><td colspan="3" class="text-center text-muted">No classes available.</td></tr>';
      } else {
        classSelectionBody.innerHTML = allClasses
          .map(
            (c) => `
                    <tr>
                        <td class="text-center" style="vertical-align: middle;">
                            <input type="checkbox" class="form-check-input" value="${c.class_id}">
                        </td>
                        <td style="vertical-align: middle;">${c.class_name}</td>
                        <td style="text-align: right; vertical-align: middle;">
                            <button type="button" class="btn btn-sm btn-outline-info" onclick="checkClassMembers('${c.class_id}', '${c.class_name.replace(/'/g, "\\'")}')">
                                View Students
                            </button>
                        </td>
                    </tr>
                `,
          )
          .join("");
      }
    } else {
      classSelectionBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${response.message}</td></tr>`;
    }
  } catch (error) {
    console.error("Error fetching classes:", error);
    classSelectionBody.innerHTML =
      '<tr><td colspan="3" class="text-center text-danger">Error fetching classes.</td></tr>';
  }
  hideOverlay();
}

function checkClassMembers(classId, className) {
  window.open(
    `/class_management.html?class_id=${classId}&class_name=${encodeURIComponent(className)}`,
    "_blank",
  );
}

async function updateGroup() {
  showOverlay();
  try {
    let grpName = groupName.value;
    if (isEsists(grpName, allGroup, "group_name")) {
      hideOverlay();
      Swal.fire({
        icon: "warning",
        title: "Already Exists",
        text: "A group with this name already exists!",
      });
      return;
    }
    let response = await postCall(
      groupMgmtEndPoint,
      JSON.stringify({
        function: "ugd",
        group_name: grpName,
        staff_id: StaffID,
        group_id: currGroupData["group_id"],
      }),
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
      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Group renamed to "${grpName}" successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      form.classList.remove("was-validated");
      hideOverlay();
      Swal.fire({ icon: "error", title: "Error", text: response.message });
    }
    currGroupData = null;
  } catch (error) {
    console.error(error);
    hideOverlay();
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while updating the group.",
    });
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
        staff_id: StaffID,
      }),
    );

    if (response.success) {
      groupMembers = groupMembers.filter(
        (member) => member["user_id"] != user_id,
      );
      showMembers(groupMembers);
      Swal.fire({
        icon: "success",
        title: "Removed",
        text: response.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({ icon: "error", title: "Error", text: response.message });
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    hideOverlay();
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while removing the member.",
    });
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
      }),
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
      }, 1000); // 1000 was suggested in some version
      return;
    } else {
      initializePage();
    }
  }
});

function initializePage() {
  window.checkClassMembers = checkClassMembers;
  init();
}
