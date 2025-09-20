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

function logIn() {
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

  postCall(authEndPoint, raw, selectedEndpoint).then((response) => {
    if (!response["result"]["loginSuccess"]) {
      alert(response["result"]["message"]);
      hideOverlay();
      return;
    }

    if (response["result"]["resetPassword"]) {
      hideOverlay();
      sessionStorage.setItem("password_reset_type", "staff");
      window.location.href = "password_reset.html";
      return;
    }

    if (userId.value.length >= 7) {
      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify(response["result"]["studentDetails"])
      );
      window.location.href = "student_report.html";
    } else {
      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify(response["result"]["staffDetails"])
      );
      sessionStorage.setItem(
        "program_details",
        JSON.stringify(response["result"]["department"])
      );
      sessionStorage.setItem(
        "subjects",
        JSON.stringify(response["result"]["subjects"])
      );

      sessionStorage.setItem(
        "systemParams",
        JSON.stringify(response["result"]["systemParams"])
      );
      window.location.href = "mcq_question_upload.html";
    }
  });
}
