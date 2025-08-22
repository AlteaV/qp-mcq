function getQuestions(template) {
  $("#fetching_question").show();
  var out = {};
  out.function = "gqput";
  out.sub_code = subject.value;
  out.questions_template = template;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      let mergedArray = response.result.questions_paper.reduce(
        (acc, currentArray) => acc.concat(currentArray),
        []
      );
      questions = mergedArray;
      questionsCopy = [...questions];
      generateQuestionPaper();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

function getTemplate() {
  showFecthingDataSection("Fetching data");
  allTemplates = [];
  var out = {};
  out.function = "gt";

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

function uploadQuestioPaper(questionPaperTemplate) {
  var out = {};
  out.function = "sqpgyt";
  out.sub_code = subject.value;
  out.question_paper_name = questionPaperName.value;
  out.question_paper_template = questionPaperTemplate;
  out.created_by = loggedInUser["staff_id"];

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
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

var swapCallMade = false;
function getSwapQuestion() {
  if (swapCallMade) {
    alert("Fetching question. Please wait.");
    return;
  }

  swapCallMade = true;

  var out = {};
  out.function = "sq";
  out.units = questionSwap.questionFilter.units;
  out.sub_code = subject.value;
  out.question_ids = questionSwap.existingIds;
  out.marks = questionSwap.questionFilter.marks;
  out.btl = questionSwap.questionFilter.btl;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    swapCallMade = false;
    if (response.status == 200) {
      swapQuestion(response.result.question);
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
