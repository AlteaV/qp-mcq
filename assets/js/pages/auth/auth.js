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

    let response = await postCall(deleteLaterEndPoint, payload);

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

  if (!response.success) {
    alert(response["message"]);
    hideOverlay();
    return;
  }

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
    deleteLaterEndPoint,
    JSON.stringify({
      function: "gup",
      type: type,
      org_id: org_id,
    }),
  );

  if (type === "Student") {
    let studentDetails = response["result"]["studentDetails"];
    if (!studentDetails.student_email) {
      alert(
        "You are not allowed to login using this page. Contact administrator.",
      );
      hideOverlay();
      return;
    }
    let endPoint = cognitoEndPoint;
    let out = {
      function: "abe",
      email: studentDetails.student_email,
      access_token: "access_token",
    };

    let rsp = await postCall(endPoint, JSON.stringify(out));

    if (rsp.success) {
      if (!rsp.result.user) {
        alert("User details not found. Contact administrator.");
        hideOverlay();
        return;
      }
      sessionStorage.setItem("loggedInUser", JSON.stringify(rsp.result.user));
      window.location.href = "student_report.html";
    } else {
      overlay.style.display = "none";
      alert(rsp.message ?? "Login failed");
    }
    window.location.href = "student_report.html";
  } else {
    let staffDetails = response["result"]["staffDetails"];
    let name =
      "name" in staffDetails ? staffDetails.name : staffDetails.staff_name;
    let userDetails = {
      user_id: staffDetails.staff_id,
      name: name,
      type: staffDetails.type,
      org_id: staffDetails.college_code,
      permissions: permission.result.permissions.permissions,
    };
    sessionStorage.setItem("loggedInUser", JSON.stringify(userDetails));
    window.location.href = "report_leaderboard.html";
  }
}
