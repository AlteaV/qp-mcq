function getTemplate() {
  showFecthingDataSection("Fetching data");
  showOverlay();
  allTemplates = [];
  var out = {};
  out.function = "gmt";
  out.org_id = loggedInUser.college_code;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      allTemplates = response.result.template;
      displayTemplateTable();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
