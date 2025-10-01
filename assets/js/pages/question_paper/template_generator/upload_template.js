function uploadTemplate(data, staff_id = null) {
  var out = {};
  out.function = "amt";
  out.name = templateName.value;
  out.org_id = loggedInUser.college_code;
  out.template = data;
  if (staff_id == null) {
    out.created_by = loggedInUser["staff_id"];
  } else {
    out.created_by = staff_id;
  }

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      alert(response.message);
      uploadSuccess();
    } else if (response.status == 409) {
      hideOverlay();
      alert(response.message);
    } else {
      hideOverlay();
      alert("Network error");
    }
  });
}
