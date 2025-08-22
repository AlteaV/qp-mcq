function uploadTemplate(data) {
  var out = {};
  out.function = "at";
  out.name = templateName.value;
  out.template = data;
  out.created_by = loggedInUser["staff_id"];

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      alert(response.message);
      uploadSuccess();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
