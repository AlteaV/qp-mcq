var cachedBtl = JSON.parse(sessionStorage.getItem("btl_levels"));

async function fetchBtl() {
  if (cachedBtl == null) {
    const response = await postCall(
      "/student",
      JSON.stringify({
        function: "gbl",
        org_id: loggedInUser.college_code,
      }),
    );

    if (response.status == 200) {
      sessionStorage.setItem(
        "btl_levels",
        JSON.stringify(response.result.btl_level),
      );
    } else {
      alert("Error occurred while fetching class.");
      return false;
    }
    return true;
  } else {
    return true;
  }
}
