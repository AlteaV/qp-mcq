function getQuestions(out) {
  $("#fetching_data").show();
  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    $("#fetching_data").hide();
    if (response.status == 200) {
      fetchedQuestions = response.result.questions;
      displayResult();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

let questionPaperSubmitted = false;
function uploadQuestionPaper() {
  if (questionPaper.length == 0) {
    alert("There are no questions");
    return;
  }

  if (questionPaperSubmitted) {
    alert("Question paper sumbitted. Please wait.");
    return;
  }

  questionPaperSubmitted = true;

  let out = {};
  out.function = "usqp";
  out.questions = questionPaper;
  out.sub_code = subject.value;
  out.question_paper_name = questionPaperName.value;
  out.created_by = loggedInUser["staff_id"];
  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    questionPaperSubmitted = false;
    if (response.status == 200) {
      alert(response.message);
      showTemplateDiv();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
