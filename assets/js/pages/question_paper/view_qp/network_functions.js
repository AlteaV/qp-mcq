function getQuestionPapers() {
  showFecthingDataSection("Fetching data");

  questions_papers = [];

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

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      questions_papers = response.result.questions_papers;
      displayQuestionPapers();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

function getQuestions(questionPaperId, autoDownload) {
  $("#fetching_question").show();
  let out = {};
  out.function = "gqpbt";
  out.id = questionPaperId;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      questions = response.result.questions;
      generateQuestionPaper(autoDownload);
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
