const CURRENT_ORG_ID = loggedInUser.org_id;

var managementDiv = document.getElementById("management-div");
var memberManagementDiv = document.getElementById("member-management-div");
var backToClassesBtn = document.getElementById("back_to_classes");
var classTableBody = document.getElementById("class-table-body");
var memberTableBody = document.getElementById("member-table-body");
var classModal = document.getElementById("class-modal");
var classForm = document.getElementById("class-form");
var classNameInput = document.getElementById("class-name-input");
var editClassId = document.getElementById("edit-class-id");
var modalTitle = document.getElementById("modal-title");
var addClassBtn = document.getElementById("add_class_btn");
var memberPickerModal = document.getElementById("member-picker-modal");
var studentSelectionBody = document.getElementById("student_selection_body");
var studentSearchInput = document.getElementById("student_search_input");
var addMembersToClassBtn = document.getElementById("add_members_to_class_btn");
var selectAllStudentsBtn = document.getElementById("select_all_students_btn");
var submitMemberSelection = document.getElementById("submit_member_selection");

var classes = [];
var members = [];
var potentialMembers = [];
var currentClassId = null;
var isEditing = false;

function initializePage() {
  window.editClassBtnClicked = editClassBtnClicked;
  window.deleteClassClicked = deleteClassClicked;
  window.viewMembersClicked = viewMembersClicked;
  window.removeMemberClicked = removeMemberClicked;
  window.closeClassModal = closeClassModal;
  window.closeMemberPicker = closeMemberPicker;

  fetchClasses().then(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlClassId = urlParams.get("class_id");
    const urlClassName = urlParams.get("class_name");
    if (urlClassId && urlClassName) {
      viewMembersClicked(urlClassId, urlClassName);
    }
  });
}

async function fetchClasses() {
  showOverlay();
  try {
    let out = {
      function: "gcl",
      org_id: CURRENT_ORG_ID,
    };
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      classes = response.result.all_classes;
      renderClasses();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: response.message || "Failed to fetch classes",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred: " + error.message,
    });
  } finally {
    hideOverlay();
  }
}

function renderClasses() {
  if (classes.length === 0) {
    classTableBody.innerHTML =
      "<tr><td colspan='3' class='text-center py-4'>No classes found.</td></tr>";
    return;
  }

  classTableBody.innerHTML = classes
    .map(
      (cls, index) => `
        <tr>
            <td style="text-align: center; vertical-align: middle;">${index + 1}</td>
            <td class="text-start" style="vertical-align: middle;">
                <span class="class-link" onclick="viewMembersClicked('${cls.class_id}', '${cls.class_name}')">
                    ${cls.class_name}
                </span>
            </td>
            <td style="text-align: right; vertical-align: middle;">
                <button class="btn btn-sm btn-outline-primary me-2" title="Rename Class" onclick="editClassBtnClicked('${cls.class_id}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn btn-sm btn-outline-success me-2" title="Manage Users" onclick="viewMembersClicked('${cls.class_id}', '${cls.class_name}')">
                    <i class="fa-solid fa-users"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" title="Delete Class" onclick="deleteClassClicked('${cls.class_id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

addClassBtn.addEventListener("click", () => {
  isEditing = false;
  classForm.reset();
  modalTitle.innerHTML = "Add New Class";
  classModal.classList.remove("hidden");
});

classForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (classNameInput.value.trim() === "") {
    return Swal.fire({
      icon: "warning",
      title: "Missing Info",
      text: "Please enter a class name.",
    });
  }

  showOverlay();
  try {
    let out = {
      function: isEditing ? "ucl" : "acl",
      class_id: editClassId.value,
      class_name: classNameInput.value,
      org_id: CURRENT_ORG_ID,
      staff_id: loggedInUser.staff_id,
    };
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      closeClassModal();
      fetchClasses();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({ icon: "error", title: "Error", text: response.message });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({ icon: "error", title: "Error", text: "Submission failed." });
  } finally {
    hideOverlay();
  }
});

function editClassBtnClicked(id) {
  let cls = classes.find((c) => c.class_id == id);
  if (!cls) return;

  isEditing = true;
  editClassId.value = cls.class_id;
  classNameInput.value = cls.class_name;
  modalTitle.innerHTML = "Edit Class";
  classModal.classList.remove("hidden");
}

async function deleteClassClicked(id) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You are about to delete this class. All students will be unassigned from it. This cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  showOverlay();
  try {
    let out = {
      function: "dcl",
      class_id: id,
      org_id: CURRENT_ORG_ID,
    };
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      fetchClasses();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: response.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: response.message || "Failed to delete class",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while deleting the class.",
    });
  } finally {
    hideOverlay();
  }
}

function closeClassModal() {
  classModal.classList.add("hidden");
}

function viewMembersClicked(id, name) {
  currentClassId = id;
  document.getElementById("class_title_display").innerHTML =
    `Members: <span class="text-primary">${name}</span>`;
  managementDiv.classList.add("hidden");
  memberManagementDiv.classList.remove("hidden");
  fetchClassMembers();
}

async function fetchClassMembers() {
  showOverlay();
  try {
    let out = {
      function: "gcm",
      class_id: currentClassId,
    };
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      members = response.result.members;
      renderMembers();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: response.message || "Failed to fetch members",
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    hideOverlay();
  }
}

function renderMembers() {
  if (members.length === 0) {
    memberTableBody.innerHTML =
      "<tr><td colspan='4' class='text-center py-4 text-muted'>No members in this class.</td></tr>";
    return;
  }

  memberTableBody.innerHTML = members
    .map(
      (mem, index) => `
        <tr>
            <td style="text-align: center; vertical-align: middle;">${index + 1}</td>
            <td class="text-start" style="vertical-align: middle;">${mem.user_name}</td>
            <td class="text-start" style="color: var(--text-muted); vertical-align: middle;">${mem.email}</td>
            <td style="text-align: right; vertical-align: middle;">
                <button class="btn btn-sm btn-outline-danger" onclick="removeMemberClicked('${mem.user_id}')">
                    <i class="fa-solid fa-user-minus"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

async function removeMemberClicked(userId) {
  const result = await Swal.fire({
    title: "Remove Student?",
    text: "Are you sure you want to remove this student from the class?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, remove them",
  });

  if (!result.isConfirmed) return;

  showOverlay();
  try {
    let out = {
      function: "dcm",
      class_id: currentClassId,
      user_id: userId,
    };
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      fetchClassMembers();
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
  } catch (error) {
    console.error(error);
  } finally {
    hideOverlay();
  }
}

backToClassesBtn.addEventListener("click", () => {
  memberManagementDiv.classList.add("hidden");
  managementDiv.classList.remove("hidden");
  fetchClasses();
});

addMembersToClassBtn.addEventListener("click", async () => {
  showOverlay();
  try {
    let out = {
      function: "pcm",
      class_id: currentClassId,
      org_id: CURRENT_ORG_ID,
    };
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      potentialMembers = response.result.users;
      renderStudentSelection();
      memberPickerModal.classList.remove("hidden");
    }
  } catch (error) {
    console.error(error);
  } finally {
    hideOverlay();
  }
});

function renderStudentSelection() {
  const term = studentSearchInput.value.toLowerCase();
  const filtered = potentialMembers.filter(
    (s) =>
      s.user_name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term),
  );

  if (filtered.length === 0) {
    studentSelectionBody.innerHTML =
      "<tr><td colspan='3' class='text-center py-4 bg-light'>No more students found.</td></tr>";
    return;
  }

  studentSelectionBody.innerHTML = filtered
    .map(
      (s) => `
        <tr onclick="this.querySelector('input').click()">
            <td class="text-center" onclick="event.stopPropagation()">
                <input type="checkbox" class="student-checkbox form-check-input" value="${s.user_id}">
            </td>
            <td>${s.user_name}</td>
            <td>${s.email}</td>
        </tr>
    `,
    )
    .join("");
}

studentSearchInput.oninput = renderStudentSelection;

selectAllStudentsBtn.onclick = () => {
  const checkboxes = document.querySelectorAll(".student-checkbox");
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
  checkboxes.forEach((cb) => (cb.checked = !allChecked));
  selectAllStudentsBtn.innerText = allChecked ? "Select All" : "Deselect All";
};

submitMemberSelection.onclick = async () => {
  const checked = Array.from(
    document.querySelectorAll(".student-checkbox:checked"),
  ).map((cb) => cb.value);
  if (checked.length === 0) {
    return Swal.fire({
      icon: "warning",
      title: "No Selection",
      text: "Please select at least one student.",
    });
  }

  showOverlay();
  try {
    let out = {
      function: "acm",
      class_id: currentClassId,
      uids: checked,
      staff_id: loggedInUser.staff_id || loggedInUser.user_id,
    };
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      closeMemberPicker();
      fetchClassMembers();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({ icon: "error", title: "Error", text: response.message });
    }
  } catch (error) {
    console.error(error);
  } finally {
    hideOverlay();
  }
};

function closeMemberPicker() {
  memberPickerModal.classList.add("hidden");
  studentSearchInput.value = "";
  selectAllStudentsBtn.innerText = "Select All";
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

// Running it directly to skip indefinite loading
/*
setTimeout(() => {
    initializePage();
}, 500);
*/
