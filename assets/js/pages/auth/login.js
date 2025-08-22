var adminId = document.getElementById("admin_id");
var adminPassword = document.getElementById("admin_password");

adminPassword.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    logIn();
  }
});

function logIn() {
  if (adminId.value == "") {
    alert("ID can't be empty");
    return;
  }

  if (adminPassword.value == "") {
    alert("Password can't be empty");
    return;
  }

  let raw = JSON.stringify({
    password: adminPassword.value,
    staff_id: adminId.value,
    function: "sln",
  });

  postCall(authEndPoint, raw).then((response) => {
    if (!response["result"]["loginSuccess"]) {
      alert(response["result"]["message"]);
      return;
    }

    if (response["result"]["resetPassword"]) {
      sessionStorage.setItem("password_reset_type", "staff");
      window.location.href = "password_reset.html";
      return;
    }

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

    window.location.href = "index.html";
  });
}
