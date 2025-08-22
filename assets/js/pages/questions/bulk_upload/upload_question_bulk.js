function uploadQuestionBulk() {
  if (XL_row_object.length == 0) {
    alert("There is no data");
    return;
  }
  var out = {};
  out.function = "aq";
  out.questions = XL_row_object;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      alert(response.message);
      fileInput.value = "";
      table.innerHTML = "";
      $("#chooseFileLabel").text("Choose file");
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
