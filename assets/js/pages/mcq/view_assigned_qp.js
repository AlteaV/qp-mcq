var fetchingDataSection = document.getElementById("fetching_data");
var resultTable = document.getElementById("result_table");
let resultDiv = document.getElementById("result_div");
let lockedOutStudentsTable = document.getElementById(
  "locked_out_students_table",
);

var type = document.getElementById("type");
var networkButton = document.getElementById("network_button");

let lockedOutUsers = [];

type.addEventListener("change", reset);

networkButton.addEventListener("click", async () => {
  resultDiv.style.display = "none";
  await getAssignedQp();
});

function reset() {
  resultDiv.style.display = "none";
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
          new TableStructure("Group Name"),
          new TableStructure("Question Paper Name"),
          new TableStructure("Start Date Time"),
          new TableStructure("End Date Time"),
          new TableStructure("Attended"),
          new TableStructure("Yet to Attend"),
          new TableStructure("Submitted"),
          new TableStructure("Total Members"),
        ],
      ],
      tableBody: [],
    };

    if (type.value == "On Going") {
      tableData.tableHeader[0].push(new TableStructure("Actions", 2));
    }

    data.forEach((sub, index) => {
      let temp = [
        new TableStructure(index + 1),
        new TableStructure(sub.group_name),
        new TableStructure(sub.name),
        new TableStructure(sub.start_date_time),
        new TableStructure(sub.end_date_time),
        new TableStructure(sub.attented),
        new TableStructure(
          parseInt(sub.total_members) - parseInt(sub.attented),
        ),
        new TableStructure(sub.submitted),
        new TableStructure(sub.total_members),
      ];

      let actionButton = "";
      if (type.value == "On Going") {
        actionButton = createButton(
          sub.id,
          "Manage Lockouts",
          "btn btn-sm btn-primary manage-lockout-button",
          "Manage Lockouts",
          true,
        );
        temp.push(new TableStructure(actionButton));
      }

      tableData.tableBody.push(temp);
    });

    displayResult(tableData, resultTable);
    hideOverlay();
    resultDiv.style.display = "block";

    $("#result_table").off("click", ".manage-lockout-button");
    $("#result_table").on("click", ".manage-lockout-button", (event) => {
      lockedOutStudentsTable.innerHTML = "";
      $("#modal").modal("show");
      let $button = $(event.currentTarget);
      let id = JSON.parse(decodeURIComponent($button.attr("data-full")));
      getStudentList(id);
    });
  } catch (error) {
    hideOverlay();
    alert("An error occurred while displaying the report: " + error.message);
  }
}

async function getStudentList(qpId) {
  qpId = 36;
  lockedOutUsers = [];
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "glsd",
      qp_assignment_id: qpId,
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      lockedOutUsers = response.result.students;
      displayLockedOutStudents();
      hideOverlay();
    } else {
      alert("An error occurred while fetching users list");
    }
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching data: " + error.message);
  }
}

function displayLockedOutStudents() {
  let data = lockedOutUsers;
  if (data.length === 0) {
    lockedOutStudentsTable.innerHTML = "No users locked out.";
    return;
  }

  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.No"),
        new TableStructure("User ID"),
        new TableStructure("Name"),
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };

  data.forEach((users, index) => {
    let actionButton = createButton(
      users.id,
      "Allow resume test",
      "btn btn-sm btn-primary unlock-user-button",
      "Allow resume test",
      true,
    );
    let temp = [
      new TableStructure(index + 1),
      new TableStructure(users.user_id),
      new TableStructure(users.user_name),
      new TableStructure(actionButton),
    ];
    tableData.tableBody.push(temp);
  });

  displayResult(tableData, lockedOutStudentsTable);

  $("#locked_out_students_table").off("click", ".unlock-user-button");
  $("#locked_out_students_table").on(
    "click",
    ".unlock-user-button",
    (event) => {
      let $button = $(event.currentTarget);
      let id = JSON.parse(decodeURIComponent($button.attr("data-full")));
      unlockUser(id);
    },
  );
}

async function unlockUser(id) {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "autr",
      id: id,
      user_id:
        loggedInUser.register_num ||
        loggedInUser.user_id ||
        loggedInUser.staff_id,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      alert(response.message);
      lockedOutUsers = lockedOutUsers.filter((user) => user.id != id);
      displayLockedOutStudents();
      hideOverlay();
    } else {
      alert("An error occurred while allowing the user to resume the test");
    }
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching data: " + error.message);
  }
}

async function init() {
  hideOverlay();
}

async function getAssignedQp() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gaqao",
      type: type.value,
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      showResult(response.result.qp);
    } else {
      alert("An error occurred while fetching assigned question papers");
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    hideOverlay();
    alert("An error occurred while fetching data: " + error.message);
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
