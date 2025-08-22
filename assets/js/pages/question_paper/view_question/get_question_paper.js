function getQuestionPapers() {
  if (
    subject.value == null ||
    subject.value == undefined ||
    subject.value == ""
  ) {
    alert("Subject code must be selected");
    return;
  }

  let out = {};
  out.function = "gqpfs";
  out.sub_code = subject.value;

  $("#fetching_data").show();
  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    $("#fetching_data").hide();
    if (response.status == 200) {
      questions_papers = response.result.questions_papers;
      displayResult();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
function downloadQuestionPaper(id) {
  let out = {};
  out.function = "gqp";
  out.subject_question_paper_id = id;

  $("#fetching_data").show();
  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    $("#fetching_data").hide();
    if (response.status == 200) {
      questions_paper = response.result.questions_paper;
      showQuestionPaper();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
