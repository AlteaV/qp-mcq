const CURRENT_ORG_ID = loggedInUser.org_id;

var form = document.getElementById("user-form");
var resultTable = document.getElementById("user-table-body");
var addNewUserBtn = document.getElementById("add_user");
var formTitle = document.getElementById("modal-title");
var closeBtn = document.getElementById("close-modal-btn");

var searchButton = document.getElementById("search_button");
var userName = document.getElementById("user-name-input");
var userEmail = document.getElementById("user-email-input");
var userRole = document.getElementById("user-role-input");
var editIndex = document.getElementById("edit-user-id");
var searchInput = document.getElementById("search");
var filterRole = document.getElementById("filter-role");
var filterStatus = document.getElementById("filter-status");
var countSpan = document.getElementById("current-user-count");

var addMethodRadios = document.querySelectorAll('input[name="addMethod"]');
var addMethodSelector = document.getElementById("add-method-selector");
var individualAddSection = document.getElementById("individual-add-section");
var bulkAddSection = document.getElementById("bulk-add-section");
var bulkExcelInput = document.getElementById("bulk-excel-input");
var userClassSelect = document.getElementById("user_class_select");

var users = null;
var allClasses = [];
var curr_data = null;
var isEditing = false;
var currentPage = 1;
var itemsPerPage = 10;

searchButton.addEventListener("click", () => {
  applyFilters();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let addMethod = document.querySelector(
    'input[name="addMethod"]:checked',
  ).value;
  if (isEditing || addMethod === "individual") {
    if (userName.value.trim() === "" || userEmail.value.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "Missing Info",
        text: "Name and Email fields can't be empty",
      });
      return;
    }
    if (isEditing) {
      updateUser();
    } else {
      addNewUser();
    }
  } else {
    if (!bulkExcelInput.files || bulkExcelInput.files.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing File",
        text: "Please select an Excel file.",
      });
      return;
    }
    processBulkAdd(bulkExcelInput.files[0]);
  }
});

addNewUserBtn.addEventListener("click", () => {
  resetForm();
  document.getElementById("user-modal").classList.remove("hidden");
  document.getElementById("management-div").classList.add("hidden");
  isEditing = false;
  formTitle.innerHTML = "Add New User";

  if (loggedInUser.type == "TestCoordinator") {
    if (addMethodSelector) addMethodSelector.style.display = "none";
    individualAddSection.style.display = "flex";
    bulkAddSection.style.display = "none";
  } else {
    if (addMethodSelector) addMethodSelector.style.display = "flex";
    document.querySelector(
      'input[name="addMethod"][value="individual"]',
    ).checked = true;
    individualAddSection.style.display = "flex";
    bulkAddSection.style.display = "none";
  }

  // Fetch classes for dropdown if haven't already
  if (userClassSelect && allClasses.length === 0) {
    fetchClassesForFilter();
  } else {
    // Reset class select
    if (userClassSelect) userClassSelect.value = "";
  }
});

if (addMethodRadios) {
  addMethodRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.value === "individual") {
        individualAddSection.style.display = "flex";
        bulkAddSection.style.display = "none";
        userName.required = true;
        userEmail.required = true;
        userRole.required = true;
        bulkExcelInput.required = false;
      } else {
        individualAddSection.style.display = "none";
        bulkAddSection.style.display = "flex";
        userName.required = false;
        userEmail.required = false;
        userRole.required = false;
        bulkExcelInput.required = true;
      }
    });
  });
}

function closeMyModal() {
  document.getElementById("user-modal").classList.add("hidden");
  document.getElementById("management-div").classList.remove("hidden");
}

if (closeBtn) closeBtn.addEventListener("click", closeMyModal);

function resetForm() {
  form.reset();
  form.classList.remove("was-validated");
  if (userClassSelect) userClassSelect.value = "";
}

async function fetchClassesForFilter() {
  try {
    let response = await postCall(
      adminEndPoint,
      JSON.stringify({ function: "gcl", org_id: CURRENT_ORG_ID }),
    );
    if (response.success) {
      allClasses = response.result.all_classes;
      renderClassSelect();
    }
  } catch (e) {
    console.error("Error fetching classes:", e);
  }
}

function renderClassSelect() {
  if (!userClassSelect) return;
  let options = '<option value="">Select Class...</option>';
  if (allClasses.length > 0) {
    options += allClasses
      .map(
        (c) => `
            <option value="${c.class_id}">${c.class_name}</option>
        `,
      )
      .join("");
  }
  userClassSelect.innerHTML = options;
}

function getSelectedClass() {
  return userClassSelect ? userClassSelect.value : "";
}

async function fetchUsers() {
  showOverlay();
  try {
    let searchTxt = searchInput ? searchInput.value.trim() : "";
    let roleVal = filterRole ? filterRole.value : "All";
    let statusVal = filterStatus ? filterStatus.value : "All";

    let out = {
      function: "gus", // Fixed: gubo -> gus
      org_id: CURRENT_ORG_ID,
      search: searchTxt,
      role: roleVal,
      status: statusVal,
      page: currentPage,
      limit: itemsPerPage,
    };
    let data = await postCall(adminEndPoint, JSON.stringify(out));

    if (data.success) {
      users = data.result.users;
      let filtered_total = data.result.filtered_total;

      showResult(filtered_total);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while fetching users",
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while fetching data: " + error.message,
    });
  }
}

function applyFilters() {
  currentPage = 1;
  fetchUsers();
}

function showResult(filtered_total) {
  try {
    let data = users || [];
    if (data.length === 0) {
      resultTable.innerHTML =
        "<tr><td colspan='6' class='text-center py-4'>There is no data</td></tr>";
      document.getElementById("user-count-footer").style.display = "none";
      document.getElementById("pagination-controls").innerHTML = "";
      hideOverlay();
      return;
    }

    document.getElementById("user-count-footer").style.display = "flex";

    let totalPages = Math.ceil(filtered_total / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = Math.min(startIndex + itemsPerPage, filtered_total);

    let startSpan = document.getElementById("current-user-start");
    let endSpan = document.getElementById("current-user-end");
    if (startSpan) startSpan.innerText = startIndex + 1;
    if (endSpan) endSpan.innerText = endIndex;
    if (countSpan) countSpan.innerText = filtered_total;

    resultTable.innerHTML = data
      .map((user, index) => {
        let ActionBtn = `
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="action-btn" title="Edit" 
                            style="background: transparent; border: none; outline: none; cursor: pointer;" 
                            onclick="editButtonClicked('${user.user_id}')">
                        <i class="fa-solid fa-pen" style="color: var(--text-muted);"></i>
                    </button>
                </div>`;

        let StatusBtn = `
                <div style="display: flex;  gap: 0.75rem; justify-content: flex-end;">
                    <span class="${user.active ? "status-active" : "status-inactive"}">${user.active ? "Active" : "Inactive"}</span>
                    <label class="switch">
                        <input type="checkbox" ${user.active ? "checked" : ""} onchange="toggleUserStatus('${user.user_id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>`;

        let role = user.role == "TestTaker" ? "Student" : "Teacher";

        return `<tr>
                <td style="text-align: center; vertical-align: middle;">${startIndex + index + 1}</td>
                <td class="text-start" style="color: var(--text-muted); vertical-align: middle;">${user.user_name}</td>
                <td class="text-start" style="color: var(--text-muted); vertical-align: middle;">${user.email}</td>
                <td class="text-start" style="vertical-align: middle;">${role}</td>
                <td class="text-start" style="vertical-align: middle; color: var(--text-muted); font-size: 0.875rem;">${user.class_name || "<em>None</em>"}</td>
                <td class="text-start" style="vertical-align: middle;">${ActionBtn}</td>
                <td class="text-align: right" style="vertical-align: middle;">${StatusBtn}</td>
            </tr>`;
      })
      .join("");

    renderPagination(totalPages);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Render Error",
      text: "An error occurred while displaying the report: " + error.message,
    });
    console.error("Display error:", error);
  }
}

function renderPagination(totalPages) {
  let paginationDiv = document.getElementById("pagination-controls");
  if (!paginationDiv) return;

  let html = "";

  html += `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="changePage(${currentPage - 1})">
        <i class="fa-solid fa-chevron-left page-arrow"></i>
    </button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-btn" style="pointer-events: none;">...</span>`;
    }
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="changePage(${currentPage + 1})">
        <i class="fa-solid fa-chevron-right page-arrow"></i>
    </button>`;

  paginationDiv.innerHTML = html;

  hideOverlay();
}

function changePage(page) {
  currentPage = page;
  fetchUsers();
}

function editButtonClicked(id) {
  try {
    formTitle.innerHTML = "Update User";
    isEditing = true;
    form.classList.remove("was-validated");
    form.reset();

    if (addMethodSelector) addMethodSelector.style.display = "none";
    individualAddSection.style.display = "flex";
    bulkAddSection.style.display = "none";

    curr_data = users.find((u) => u.user_id == id);
    if (!curr_data) return;

    editIndex.value = curr_data.user_id;
    userName.value = curr_data.user_name;
    userEmail.value = curr_data.email;
    userRole.value = curr_data.role;

    // Fetch classes for dropdown if haven't already
    if (userClassSelect && allClasses.length === 0) {
      fetchClassesForFilter().then(() => {
        userClassSelect.value = curr_data.class_id || "";
      });
    } else {
      if (userClassSelect) userClassSelect.value = curr_data.class_id || "";
    }

    document.getElementById("user-modal").classList.remove("hidden");
    document.getElementById("management-div").classList.add("hidden");
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while click Edit Button. " + error,
    });
  }
}

// prefillClasses and previous mapping logic removed as we use single select now

async function updateUser() {
  showOverlay();
  try {
    let out = {
      function: "eus", // Fixed: eu -> eus
      user_id: curr_data.user_id,
      org_id: CURRENT_ORG_ID,
      user_name: userName.value,
      email: userEmail.value,
      role: userRole.value,
      staff_id: loggedInUser.user_id,
      class_id: getSelectedClass(),
    };
    let data = await postCall(adminEndPoint, JSON.stringify(out));

    if (data.success) {
      fetchUsers();
      closeMyModal();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while updating user: " + data.message,
      });
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error("Error fetching request: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while Submit data: " + error.message,
    });
  }
}

async function addNewUser() {
  showOverlay();
  try {
    let out = {
      function: "aus", // Fixed: au -> aus
      org_id: CURRENT_ORG_ID,
      user_name: userName.value,
      email: userEmail.value,
      role: userRole.value,
      staff_id: loggedInUser.user_id,
      class_id: getSelectedClass(),
    };

    let data = await postCall(adminEndPoint, JSON.stringify(out));

    if (data.success) {
      fetchUsers();
      closeMyModal();
      Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while adding user: " + data.message,
      });
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error("Error fetching request: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while Submit data: " + error.message,
    });
  }
}

async function processBulkAdd(file) {
  try {
    let reader = new FileReader();
    reader.onload = async function (e) {
      let data = new Uint8Array(e.target.result);
      let workbook = XLSX.read(data, { type: "array" });

      let sheetName = workbook.SheetNames[0];
      let sheet = workbook.Sheets[sheetName];

      let json = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) {
        return Swal.fire({
          icon: "warning",
          title: "Empty File",
          text: "Excel file is empty.",
        });
      }
      let formattedUsers = json
        .map((row) => ({
          user_name:
            row.name || row.Name || row["User Name"] || row["user_name"],
          email: row.email || row.Email || row["Email"],
          role: "TestTaker",
        }))
        .filter((u) => u.email !== "");
      for (let u of formattedUsers) {
        if (!u.user_name || !u.email) {
          return Swal.fire({
            icon: "error",
            title: "Row Error",
            text: "Name and Email fields can't be empty in your spreadsheet.",
          });
        }
      }

      if (formattedUsers.length === 0) {
        return Swal.fire({
          icon: "error",
          title: "Format Error",
          text: "Could not parse any valid users. Check your column headers (name and email)!",
        });
      }

      let out = {
        function: "baus",
        org_id: CURRENT_ORG_ID,
        users: formattedUsers,
        staff_id: loggedInUser.user_id,
        class_id: getSelectedClass(),
      };
      showOverlay();
      let response = await postCall(adminEndPoint, JSON.stringify(out));

      if (response.success) {
        fetchUsers();
        closeMyModal();
        Swal.fire({
          icon: "success",
          title: "Upload Complete",
          text:
            response.message ||
            `Successfully added ${formattedUsers.length} users!`,
        });
        hideOverlay();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "An error occurred during upload: " + response.message,
        });
        hideOverlay();
      }
    };
    reader.readAsArrayBuffer(file);
  } catch (error) {
    hideOverlay();
    console.error("Bulk upload error: ", error);
    Swal.fire({
      icon: "error",
      title: "Parse Error",
      text: "An error occurred parsing the file: " + error.message,
    });
  }
}

async function toggleUserStatus(userId, isActive) {
  let u = users.find((x) => x.user_id == userId);
  if (!u) return;

  showOverlay();
  try {
    let out = {
      function: "uus",
      user_id: userId,
      active: isActive ? 1 : 0,
      staff_id: loggedInUser.user_id,
    };

    let data = await postCall(adminEndPoint, JSON.stringify(out));

    if (data.success) {
      u.active = isActive ? 1 : 0;
      fetchUsers();
    } else {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update status: " + data.message,
      });
      fetchUsers();
    }
    hideOverlay();
  } catch (error) {
    console.error("Status toggle error:", error);
    fetchUsers();
    hideOverlay();
  }
}

async function deleteUser(userId) {
  const result = await Swal.fire({
    title: "Delete User?",
    text: "Are you sure you want to delete this user? This will deactivate their account.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  try {
    let out = {
      function: "dus",
      user_id: userId,
      org_id: CURRENT_ORG_ID,
      modified_by: loggedInUser.user_id,
    };

    let data = await apiPost(out);

    if (data.success) {
      fetchUsers();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: data.message,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Error deleting user: " + data.message,
      });
    }
  } catch (error) {
    console.error("Delete error:", error);
    Swal.fire({ icon: "error", title: "Error", text: "An error occurred." });
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
  window.changePage = changePage;
  window.editButtonClicked = editButtonClicked;
  window.toggleUserStatus = toggleUserStatus;
  window.deleteUser = deleteUser;
  if (filterRole) {
    filterRole.addEventListener("change", applyFilters);
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", applyFilters);
  }

  fetchUsers();
}
