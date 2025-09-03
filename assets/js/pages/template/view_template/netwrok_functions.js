function getTemplate() {
  showFecthingDataSection("Fetching data");
  allTemplates = [];
  var out = {};
  out.function = "gtemp";

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
