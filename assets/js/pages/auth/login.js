var organization = document.getElementById("organization");
var userId = document.getElementById("user_id");
var adminPassword = document.getElementById("admin_password");

let orgDetails = [];

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    await getOrganizationDetails();
  }
});

async function getOrganizationDetails() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "go",
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      organization.innerHTML = "";
      organization.appendChild(new Option("Select Organization", ""));
      orgDetails = response.result.organizations;
      if (orgDetails.length > 0) {
        orgDetails.forEach((org) => {
          let option = new Option(org.org_name, org.org_id);
          organization.appendChild(option);
        });
      }
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching organization details");
  }
}

adminPassword.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    logIn();
  }
});

async function logIn() {
  if (organization.value == "") {
    alert("Choose an Organization");
    return;
  }

  if (userId.value == "") {
    alert("ID can't be empty");
    return;
  }

  if (adminPassword.value == "") {
    alert("Password can't be empty");
    return;
  }

  let selectedOrg = orgDetails.find((org) => org.org_id == organization.value);
  if (!selectedOrg) {
    alert("Selected organization not found");
    return;
  }

  showOverlay();

  let selectedEndpoint;
  if (typeof selectedOrg.endpoint === "string") {
    selectedEndpoint = JSON.parse(selectedOrg.endpoint);
  }

  let out = {};

  if (userId.value.length >= 7) {
    out = {
      password: adminPassword.value,
      register_num: userId.value,
      function: "stul",
    };
    selectedEndpoint = selectedEndpoint["student"];
  } else {
    out = {
      password: adminPassword.value,
      staff_id: userId.value,
      function: "sln",
    };
    selectedEndpoint = selectedEndpoint["staff"];
  }

  let raw = JSON.stringify(out);

  let response = await postCall(authEndPoint, raw, selectedEndpoint);
  if (!response["result"]["loginSuccess"]) {
    alert(response["message"]);
    hideOverlay();
    return;
  }

  if (!response["result"]["loginSuccess"]) {
    alert(response["message"]);
    hideOverlay();
    return;
  }

  if (response["result"]["resetPassword"]) {
    hideOverlay();
    sessionStorage.setItem("password_reset_type", "staff");
    window.location.href = "password_reset.html";
    return;
  }

  let type = "Student";
  let org_id = "";

  // check if studentDetails is present in response and has values
  if (
    response["result"]["studentDetails"] &&
    Object.keys(response["result"]["studentDetails"]).length > 0
  ) {
    type = "Student";
    org_id = response["result"]["studentDetails"]["college_code"];
  } else if (
    response["result"]["staffDetails"] &&
    Object.keys(response["result"]["staffDetails"]).length > 0
  ) {
    type = "Staff";
    org_id = response["result"]["staffDetails"]["college_code"];
  }

  let permission = await postCall(
    authEndPoint,
    JSON.stringify({
      function: "gup",
      type: type,
      org_id: org_id,
    })
  );

  if (type === "Student") {
    let studentDetails = response["result"]["studentDetails"];
    let branchCode =
      "branch_code" in studentDetails ? studentDetails.branch_code : null;
    let currentYear =
      "current_year" in studentDetails ? studentDetails.current_year : "";
    let section = "section" in studentDetails ? studentDetails.section : "";
    let name = "name" in studentDetails ? studentDetails.name : "";
    let user_id =
      "register_num" in studentDetails
        ? studentDetails.register_num
        : studentDetails.staff_id;

    let storeUser = await postCall(
      authEndPoint,
      JSON.stringify({
        function: "iouud",
        user_id: user_id,
        org_id: studentDetails.college_code,
        user_name: studentDetails.name || "",
        branch: branchCode,
        std_year: currentYear,
        section: section,
      })
    );

    if (!storeUser.success) {
      hideOverlay();
      alert("Unable to process");
      return;
    }

    let userDetails = {
      user_id: user_id,
      staff_id: user_id,
      register_num: user_id,
      name: name,
      staff_name: name,
      branch_code: branchCode,
      current_year: currentYear,
      section: section,
      college_code: studentDetails.college_code,
      org_id: studentDetails.college_code,
      permissions: permission.result.permissions.permissions,
      type: "Student", // have to change this based on login
    };
    sessionStorage.setItem("loggedInUser", JSON.stringify(userDetails));
    window.location.href = "student_report.html";
  } else {
    let staffDetails = response["result"]["staffDetails"];
    let name =
      "name" in staffDetails ? staffDetails.name : staffDetails.staff_name;
    let userDetails = {
      user_id: staffDetails.staff_id,
      staff_id: staffDetails.staff_id,
      name: name,
      staff_name: name,
      type: staffDetails.type,
      college_code: staffDetails.college_code,
      org_id: staffDetails.college_code,
      permissions: permission.result.permissions.permissions,
    };
    sessionStorage.setItem("loggedInUser", JSON.stringify(userDetails));
    window.location.href = "mcq_question_upload.html";
  }
}
