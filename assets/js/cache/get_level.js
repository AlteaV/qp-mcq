var cachedLevel = JSON.parse(sessionStorage.getItem("levels"));

async function fetchLevel() {
  if (cachedLevel == null) {
    const response = await postCall(
      "/student",
      JSON.stringify({
        function: "gl",
        org_id: loggedInUser.college_code,
      }),
    );

    if (response.status == 200) {
      sessionStorage.setItem("levels", JSON.stringify(response.result.levels));
    } else {
      alert("Error occurred while fetching level.");
      return false;
    }
    return true;
  } else {
    return true;
  }
}
