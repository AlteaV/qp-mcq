let StaffID = loggedInUser.user_id;
let OrgID = loggedInUser.org_id;

let resultDiv = document.getElementById("result_div");
let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");
let modalTitle = document.getElementById("modalLabel");
let submitBtn = document.getElementById("form_submit");
let Type = null;
let form = document.getElementById("form");
let groupName = document.getElementById("grp_name");
let currGroupData = null;
let section1 = document.getElementById("section1");
let section2 = document.getElementById("section2");
let s1Modal = document.getElementById("s1-modal");
let s2Modal = document.getElementById("s2-modal");

let addGroupBtn = document.getElementById("add_group");
let addMemberBtn = document.getElementById("add_members");
let currGroupID = null;
let groupMembers = [];
let backBtn = document.getElementById("back-btn");
let allGroup = null;

let allClasses = [];

backBtn.addEventListener("click", () => {
  navigate(true);
  showReportSection(allGroup);
});

addGroupBtn.addEventListener("click", () => {
  navigate(true);
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
      adminEndPoint,
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
    section1.classList.remove("d-none");
    section2.classList.add("d-none");
    s1Modal.classList.remove("d-none");
    s2Modal.classList.add("d-none");
    groupName.setAttribute("required", "required");
    groupMembers = [];
  } else {
    section1.classList.add("d-none");
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
      adminEndPoint,
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

let pickedUserIds = new Set();
let pickedByClass = {};
let classStates = {};
let classSearchTimers = {};
const MEMBER_PAGE_SIZE = 10;

function updatePickedCountBadge() {
  const badge = document.getElementById("picked-count-badge");
  if (badge) badge.textContent = `${pickedUserIds.size} selected`;
}

function getClassPickedCount(classId) {
  return pickedByClass[classId] ? pickedByClass[classId].size : 0;
}

function updateClassBadge(classId) {
  const badge = document.getElementById(`class-badge-${classId}`);
  const count = getClassPickedCount(classId);
  const state = classStates[classId];
  const eligible =
    state && state.eligibleTotal != null ? state.eligibleTotal : null;
  if (badge) {
    const availPart =
      eligible !== null
        ? `<span style="opacity:.6">${eligible} available &nbsp;·&nbsp; </span>`
        : "";
    const selPart =
      count > 0
        ? `<span style="font-weight:600">${count} selected</span>`
        : `<span>0 selected</span>`;
    badge.innerHTML = availPart + selPart;
    badge.className =
      count > 0
        ? "badge bg-primary ms-auto me-2 flex-shrink-0"
        : "badge bg-light text-muted ms-auto me-2 flex-shrink-0 border";
  }
  updatePickedCountBadge();
}

function pickStudent(classId, userId) {
  const uid = String(userId);
  pickedUserIds.add(uid);
  if (!pickedByClass[classId]) pickedByClass[classId] = new Set();
  pickedByClass[classId].add(uid);
}

function unpickStudent(classId, userId) {
  const uid = String(userId);
  pickedUserIds.delete(uid);
  if (pickedByClass[classId]) pickedByClass[classId].delete(uid);
}

async function loadClassPage(classId) {
  const state = classStates[classId] || {
    page: 1,
    search: "",
    total: 0,
    students: [],
  };
  classStates[classId] = state;

  const bodyEl = document.getElementById(`acc-body-${classId}`);
  if (!bodyEl) return;

  bodyEl.innerHTML = `<div class="text-center text-muted py-3">
        <div class="spinner-border spinner-border-sm me-1" role="status"></div> Loading...
    </div>`;

  try {
    let resp = await postCall(
      adminEndPoint,
      JSON.stringify({
        function: "pgcm",
        class_id: classId,
        group_id: currGroupID,
        search: state.search,
        page: state.page,
        page_size: MEMBER_PAGE_SIZE,
      }),
    );

    if (resp.success) {
      state.students = resp.result.students || [];
      state.total = resp.result.total || 0;
      if (state.eligibleTotal == null && !state.search) {
        state.eligibleTotal = state.total;
        updateClassBadge(classId);
      }
    } else {
      bodyEl.innerHTML = `<div class="text-center text-danger py-2 small">${resp.message}</div>`;
      return;
    }
  } catch (err) {
    console.error(err);
    bodyEl.innerHTML = `<div class="text-center text-danger py-2 small">Error loading students.</div>`;
    return;
  }

  renderAccordionPage(classId);
}

function renderAccordionPage(classId) {
  const state = classStates[classId];
  if (!state) return;

  const bodyEl = document.getElementById(`acc-body-${classId}`);
  if (!bodyEl) return;

  const { students, total, page } = state;
  const totalPages = Math.max(1, Math.ceil(total / MEMBER_PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * MEMBER_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * MEMBER_PAGE_SIZE, total);

  let html = "";

  if (total === 0) {
    html = `<div class="text-center text-muted py-4 small">
            <i class="fas fa-user-slash mb-2 d-block" style="font-size:1.5rem;opacity:.4"></i>
            ${state.search ? "No students match your search." : "No eligible students in this class."}
        </div>`;
  } else {
    const allOnPagePicked =
      students.length > 0 &&
      students.every((s) => pickedUserIds.has(String(s.user_id)));

    html += `<table class="table table-hover table-sm mb-0" style="font-size:.85rem">
            <thead class="table-light">
                <tr>
                    <th style="width:38px" class="text-center ps-3">
                        <input type="checkbox" class="form-check-input" title="Select / deselect all on this page"
                               ${allOnPagePicked ? "checked" : ""}
                               onchange="window.toggleSelectPage('${classId}', this.checked)">
                    </th>
                    <th class="ps-1">Name</th>
                    <th class="text-muted d-none d-md-table-cell">Email</th>
                </tr>
            </thead>
            <tbody>
                ${students
                  .map((s) => {
                    const checked = pickedUserIds.has(String(s.user_id));
                    return `<tr onclick="window.toggleStudent('${classId}','${s.user_id}',this)" style="cursor:pointer">
                        <td class="text-center ps-3" onclick="event.stopPropagation()">
                            <input type="checkbox" class="form-check-input"
                                   data-uid="${s.user_id}" data-classid="${classId}"
                                   ${checked ? "checked" : ""}
                                   onchange="window.onStudentCheck(event,'${classId}')">
                        </td>
                        <td class="ps-1 fw-medium">${s.user_name}</td>
                        <td class="text-muted d-none d-md-table-cell">${s.email || ""}</td>
                    </tr>`;
                  })
                  .join("")}
            </tbody>
        </table>
        <div class="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light" style="font-size:.78rem">
            <span class="text-muted">Showing ${rangeStart}–${rangeEnd} of ${total}</span>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:.78rem"
                        ${page <= 1 ? "disabled" : ""}
                        onclick="window.classPage('${classId}', ${page - 1})">&#8249; Prev</button>
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:.78rem"
                        ${page >= totalPages ? "disabled" : ""}
                        onclick="window.classPage('${classId}', ${page + 1})">Next &#8250;</button>
            </div>
        </div>`;
  }

  bodyEl.innerHTML = html;
  updateClassBadge(classId);
}

function toggleStudent(classId, userId, row) {
  const cb = row.querySelector('input[type="checkbox"]');
  if (!cb) return;
  cb.checked = !cb.checked;
  if (cb.checked) pickStudent(classId, userId);
  else unpickStudent(classId, userId);
  syncHeaderCheckbox(classId);
  updateClassBadge(classId);
}

function onStudentCheck(event, classId) {
  const cb = event.target;
  if (cb.checked) pickStudent(classId, cb.dataset.uid);
  else unpickStudent(classId, cb.dataset.uid);
  syncHeaderCheckbox(classId);
  updateClassBadge(classId);
}

function toggleSelectPage(classId, checked) {
  const state = classStates[classId];
  if (!state) return;
  state.students.forEach((s) => {
    if (checked) pickStudent(classId, s.user_id);
    else unpickStudent(classId, s.user_id);
  });
  renderAccordionPage(classId);
}

function onClassSearch(classId, value) {
  clearTimeout(classSearchTimers[classId]);
  classSearchTimers[classId] = setTimeout(() => {
    if (!classStates[classId])
      classStates[classId] = { page: 1, search: "", total: 0, students: [] };
    classStates[classId].page = 1;
    classStates[classId].search = value.trim();
    loadClassPage(classId);
  }, 350);
}

function classPage(classId, page) {
  if (!classStates[classId])
    classStates[classId] = { page: 1, search: "", total: 0, students: [] };
  classStates[classId].page = page;
  loadClassPage(classId);
}

function syncHeaderCheckbox(classId) {
  const bodyEl = document.getElementById(`acc-body-${classId}`);
  if (!bodyEl) return;
  const state = classStates[classId];
  if (!state || state.students.length === 0) return;
  const allPicked = state.students.every((s) =>
    pickedUserIds.has(String(s.user_id)),
  );
  const hcb = bodyEl.querySelector('thead input[type="checkbox"]');
  if (hcb) hcb.checked = allPicked;
}

async function addMember() {
  if (pickedUserIds.size === 0) {
    return Swal.fire({
      icon: "warning",
      title: "No Selection",
      text: "Please expand a class and select at least one student.",
    });
  }

  showOverlay();
  try {
    let out = {
      function: "agm",
      org_id: OrgID,
      group_id: currGroupID,
      uids: Array.from(pickedUserIds),
      staff_id: StaffID,
    };

    let response = await postCall(adminEndPoint, JSON.stringify(out));
    if (response.success) {
      pickedUserIds.clear();
      pickedByClass = {};
      classStates = {};
      classSearchTimers = {};
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
  pickedUserIds.clear();
  pickedByClass = {};
  classStates = {};
  classSearchTimers = {};
  updatePickedCountBadge();

  const accordion = document.getElementById("classAccordion");
  if (accordion)
    accordion.innerHTML = `<div class="text-center text-muted p-4">
        <div class="spinner-border spinner-border-sm me-1" role="status"></div> Loading classes...
    </div>`;

  showOverlay();
  try {
    let response = await postCall(
      adminEndPoint,
      JSON.stringify({ function: "gcl", org_id: OrgID }),
    );
    if (response.success) {
      allClasses = response.result.all_classes;
      if (!accordion) return;

      if (allClasses.length === 0) {
        accordion.innerHTML =
          '<div class="text-center text-muted p-4">No classes available.</div>';
      } else {
        accordion.innerHTML = allClasses
          .map(
            (c) => `
                    <div class="accordion-item border-0 border-bottom">
                        <h2 class="accordion-header" id="heading-${c.class_id}">
                            <button class="accordion-button collapsed px-3 py-3 fw-semibold" type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#collapse-${c.class_id}"
                                    style="background:#fff;font-size:.9rem;color:#333;box-shadow:none">
                                <i class="fas fa-users me-2 text-primary" style="opacity:.7;font-size:.8rem"></i>
                                <span class="flex-grow-1">${c.class_name}</span>
                                <span class="badge bg-light text-muted border me-2 flex-shrink-0"
                                      id="class-badge-${c.class_id}">0 selected</span>
                            </button>
                        </h2>
                        <div id="collapse-${c.class_id}" class="accordion-collapse collapse"
                             data-bs-parent="#classAccordion">
                            <div class="accordion-body p-0">
                                <!-- Search bar -->
                                <div class="px-3 py-2 border-top" style="background:#f8f9fa">
                                    <div class="input-group input-group-sm">
                                        <span class="input-group-text bg-white border-end-0" style="color:#aaa">
                                            <i class="fas fa-search"></i>
                                        </span>
                                        <input type="text" class="form-control border-start-0 ps-0"
                                               placeholder="Search name or email…"
                                               oninput="window.onClassSearch('${c.class_id}', this.value)"
                                               style="font-size:.85rem">
                                    </div>
                                </div>
                                <!-- Student list + pagination injected here -->
                                <div id="acc-body-${c.class_id}">
                                    <div class="text-center text-muted py-3 small">
                                        <div class="spinner-border spinner-border-sm" role="status"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
          )
          .join("");

        allClasses.forEach((c) => {
          const collapseEl = document.getElementById(`collapse-${c.class_id}`);
          if (collapseEl) {
            collapseEl.addEventListener("show.bs.collapse", () => {
              if (!classStates[c.class_id]) {
                classStates[c.class_id] = {
                  page: 1,
                  search: "",
                  total: 0,
                  students: [],
                };
              }
              loadClassPage(c.class_id);
            });
          }
        });
      }
    } else {
      if (accordion)
        accordion.innerHTML = `<div class="text-center text-danger p-4 small">${response.message}</div>`;
    }
  } catch (error) {
    console.error("Error fetching classes:", error);
    if (accordion)
      accordion.innerHTML =
        '<div class="text-center text-danger p-4 small">Error fetching classes.</div>';
  }
  hideOverlay();
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
      adminEndPoint,
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
      adminEndPoint,
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
      adminEndPoint,
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
      }, 1000);
      return;
    } else {
      initializePage();
    }
  }
});

function initializePage() {
  window.toggleStudent = toggleStudent;
  window.onStudentCheck = onStudentCheck;
  window.toggleSelectPage = toggleSelectPage;
  window.onClassSearch = onClassSearch;
  window.classPage = classPage;
  init();
}
