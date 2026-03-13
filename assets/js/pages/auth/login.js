let overlay = document.getElementById("overlay");
async function getToken() {
  overlay.style.display = "flex";
  let url = new URLSearchParams(window.location.search);
  let code = url.get("code");
  if (code == null) {
    alert("Invalid URL");
    return;
  }

  try {
    let payload = JSON.stringify({
      function: "cog_login",
      code: code,
    });

    let response = await postCall(cognitoEndPoint, payload);

    let id_token = response.id_token;
    let access_token = response.access_token;
    let user_email = response.user_email;

    sessionStorage.setItem("id_token", id_token);
    sessionStorage.setItem("access_token", access_token);
    sessionStorage.setItem("user_email", user_email);

    if (access_token) {
      await login(user_email, access_token);
    } else {
      overlay.style.display = "none";
      throw new Error(response.message);
    }
  } catch (error) {
    console.error(error.message);
    overlay.style.display = "none";
    alert(error.message ?? "Error while authenticating");
  }
}

async function login(email, access_token) {
  overlay.style.display = "flex";
  try {
    let endPoint = cognitoEndPoint;

    let out = {
      function: "abe",
      email: email,
      access_token: access_token,
    };

    let response = await postCall(endPoint, JSON.stringify(out));

    if (response.success) {
      if (!response.result.user) {
        alert("User details not found. Contact administrator.");
        return;
      }
      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify(response.result.user),
      );
      redirectPage(response.result.user);
    } else {
      overlay.style.display = "none";
      alert(response.message ?? "Login failed");
    }
  } catch (error) {
    overlay.style.display = "none";
    alert("An error occurred while login: " + error.message);
  }
}

function redirectPage(loggedInUser) {
  if (loggedInUser) {
    let permissions = loggedInUser.permissions;
    let firstPage = permissions[0];
    for (let i = 0; i < menuItems.length; i++) {
      let menuItem = menuItems[i];
      if (menuItem.dropdown) {
        let found = menuItem.items.find((item) =>
          permissions.includes(item.text),
        );
        if (found) {
          firstPage = found.href;
          break;
        }
      } else {
        if (permissions.includes(menuItem.text)) {
          firstPage = menuItem.href;
          break;
        }
      }
    }
    window.location.href = firstPage;
  }
}
document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    let loggedInUser = sessionStorage.getItem("loggedInUser");
    if (loggedInUser) {
      redirectPage(JSON.parse(loggedInUser));
    } else {
      await getToken();
    }
  }
});
