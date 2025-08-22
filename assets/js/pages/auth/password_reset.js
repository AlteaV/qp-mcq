var loginId = document.getElementById("login_id");
var oldPassword = document.getElementById("password_old");
var newPassword = document.getElementById("password_new");
var confirmPassword = document.getElementById("password_confirm");

confirmPassword.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    changePassword();
  }
});

function changePassword() {
  if (!validateForm()) {
    return;
  }

  let raw = {
    old_password: oldPassword.value,
    new_password: newPassword.value,
  };

  raw.staff_id = loginId.value;
  raw.function = "rps";

  postCall(authEndPoint, JSON.stringify(raw)).then((response) => {
    if (!response["result"]["passwordChanged"]) {
      alert(response["result"]["message"]);
      return;
    }

    alert("Password updated successfully.");

    window.location.href = "/login.html";
  });
}

function validateForm() {
  validate = true;
  var validate_inputs = document.querySelectorAll(".password-reset-form *");
  document.getElementById("errormsg").style.display = "none";
  validate_inputs.forEach(function (vaildate_input) {
    vaildate_input.classList.remove("warning");
    if (vaildate_input.hasAttribute("required")) {
      if (vaildate_input.value.length == 0) {
        validate = false;
        vaildate_input.classList.add("warning");
      }
      if (vaildate_input.name == "password_new") {
        if (!checkPassword(vaildate_input.value)) {
          validate = false;
          vaildate_input.classList.add("warning");

          document.getElementById("errormsg").innerHTML =
            "Password should be minimum 8 characters <br> Should have atleast one symbol <br>" +
            "Should have one upper case letter <br> Should have a lower case letter <br>" +
            "Should have one number";
          document.getElementById("errormsg").style.display = "inline";

          return validate;
        }
      }
      if (vaildate_input.name == "password_confirm") {
        if (vaildate_input.value != newPassword.value) {
          validate = false;
          vaildate_input.classList.add("warning");

          document.getElementById("errormsg").innerHTML =
            "Passwords don't match";
          document.getElementById("errormsg").style.display = "inline";

          return validate;
        }
      }
    }
  });
  return validate;
}

function checkPassword(str) {
  var re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return re.test(str);
}
