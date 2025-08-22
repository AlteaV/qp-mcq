let template = [];

let questions = [];

let questionsCopy = [];

var allSectionNames = [];

function generateQuestionPaper() {
  allSectionNames = [];
  $("#sectionsContainer").empty();
  template.forEach((section) => {
    allSectionNames.push(section.section_name);
    $("#sectionsContainer").append(
      generateSection(section.section_name, section.section_marks)
    );
    var sectionDiv = $(
      '.section[data-section-name="' + section.section_name + '"]'
    );
    let questionContainer = sectionDiv.find(".questions-container");

    let groupedQuestions = section.question_rows.reduce((acc, row) => {
      let key = row.question_number;
      let existingGroupIndex = acc.findIndex(
        (group) => group[0].question_number === key
      );

      if (existingGroupIndex !== -1) {
        acc[existingGroupIndex].push(row);
      } else {
        acc.push([row]);
      }
      return acc;
    }, []);

    groupedQuestions.forEach((questionGroup) => {
      questionContainer.append(createQuestion(questionGroup));
    });
  });
  $("#fetching_question").hide();
}

function generateSection(name, marks) {
  var sectionHtml = `<div class="section" data-section-name="${name}" data-section-marks="${marks}" style="padding: 15px; margin-top: 15px; border: 1px dotted rgb(204, 204, 204);">
                            <div class="d-flex justify-content-between">
                                <h3>Section ${name}</h3>
                            </div>
                            <h6>Marks ${marks}</h6>
                            <div class="questions-container">
                            </div>
                        </div>`;

  return sectionHtml;
}

function createQuestion(questionGroup) {
  var questionHtml = `<div class="question-row mb-5">
                            <row-div class="row">
                                <div class="col-auto" style="align-self: center;">
                                    <h5 class="question_number">${questionGroup[0].question_number}</h5>
                                </div>
                                <div class="col">`;
  questionGroup.forEach((ques, index) => {
    if (ques.no_of_questions == 1) {
      let question1 = filterQuestion(ques.units[0], ques.marks, ques.btl);
      if (question1 != undefined) {
        questionHtml += buildQestionRow(
          ques.part,
          question1.question,
          question1.id
        );
      } else {
        questionHtml += `<row-div class="row question">Question not available</row-div>`;
      }
    } else {
      for (let i = 0; i < ques.no_of_questions; i++) {
        let unit = ques.units[i] ?? ques.units[0];
        let question1 = filterQuestion(unit, ques.marks, ques.btl);
        if (question1 != undefined) {
          questionHtml += buildQestionRow(
            questionGroup[index].part,
            romanize(i + 1) + question1.question,
            question1.id
          );
        } else {
          questionHtml += `<row-div class="row question">Question not available</row-div>`;
        }
      }
    }
    if (questionGroup.length > 1 && index < questionGroup.length - 1) {
      questionHtml += `<p class="mb-2 mt-2 text-center text-uppercase fw-bold or-entry">OR</p>`;
    }
  });
  questionHtml += `       </div>
                        </row-div>
                    </div>`;

  return questionHtml;
}

function buildQestionRow(part, question, questionId) {
  let questionRow = `<row-div class="row question">
                            <div class="col-auto" style="align-self: center;">
                                <h5>${part}</h5>
                            </div>
                            <div class="col-auto" style="align-self: center;">
                                <p class="col-auto" id="q">${question}</p>
                            </div>
                            <div class="col-auto"> <button class="btn btn-primary btn-sm" onclick=swapQuestionButton(this)>Swap Question</button></div>
                            <input type="hidden" value = "${questionId}" class="question_id"> 
                        </row-div>`;
  return questionRow;
}

function filterQuestion(unit, marks, btl) {
  let question = questionsCopy.find(
    (q) => q.marks == marks && q.unit == unit && q.btl == btl
  );
  if (question != undefined) {
    let index = questionsCopy.indexOf(question);

    let deletedQuestion = questionsCopy.splice(index, 1);
    return deletedQuestion[0];
  }
  return undefined;
}

var allQuestions = {};

function getQuestionId() {
  if (questionPaperName.value == "") {
    alert("Enter question paper name");
    return;
  }
  var emptyQuestions = $(".question-row:contains(Question not available)");
  if (emptyQuestions.length > 0) {
    alert("Can't upload: Question paper not complete");
    return;
  }
  allQuestions = {};

  for (var i = 0; i < allSectionNames.length; i++) {
    var sectionName = allSectionNames[i];

    var questionRowsData = [];

    var questionRows = $(
      '.section[data-section-name="' + sectionName + '"] .question-row'
    );

    questionRows.each(function (index, element) {
      let questionNum = $(element).find(".question_number").text();
      let question = {
        question_number: questionNum,
        question_ids: [],
      };
      let questions = $(element).find(".question");
      questions.each(function (qIndex, qElement) {
        let id = $(qElement).find(".question_id").val();
        question.question_ids.push(parseInt(id));
      });

      questionRowsData.push(question);
    });
    allQuestions[sectionName] = questionRowsData;
  }

  template.forEach((section) => {
    let sectionName = section.section_name;

    let sectionData = allQuestions[sectionName];

    section.question_rows.forEach((questionRow) => {
      let questionNumber = questionRow.question_number;

      let matchingQuestion = sectionData.find(
        (q) => q.question_number == questionNumber
      );

      if (matchingQuestion) {
        if (questionRow.part == "A") {
          questionRow.question_ids = matchingQuestion.question_ids.slice(
            0,
            questionRow.no_of_questions
          );
        } else if (questionRow.part == "B") {
          questionRow.question_ids = matchingQuestion.question_ids.slice(
            -questionRow.no_of_questions
          );
        } else {
          questionRow.question_ids = matchingQuestion.question_ids;
        }
      }
    });
  });
  uploadQuestioPaper(template);
}

let questionSwap = {};

function swapQuestionButton(swapButton) {
  var section = $(swapButton).closest(".section");

  var sectionName = section.data("section-name");

  var questionRow = $(swapButton).closest(".question-row");

  var questionNumber = questionRow.find(".question_number").text().trim();

  var question = $(swapButton).closest(".question");

  var questionId = question.find(".question_id").val();

  var existingIds = questions.map(function (item) {
    return item.id;
  });

  questionSwap.question = question;
  questionSwap.questionRow = questionRow;
  questionSwap.sectionName = sectionName;
  questionSwap.questionId = questionId;
  questionSwap.questionNumber = questionNumber;
  questionSwap.existingIds = existingIds;
  questionSwap.questionFilter = getQuestionBySectionAndNumber(
    sectionName,
    questionNumber
  );

  getSwapQuestion();
}

function swapQuestion(fetchedQuestion) {
  if (fetchedQuestion != null) {
    let totalRows = questionSwap.questionRow.find(".question");
    if (totalRows.length == 1) {
      questionSwap.question.find("#q").text(fetchedQuestion.question);
    } else {
      for (let i = 0; i < totalRows.length; i++) {
        let element = totalRows[i];
        if (element.isEqualNode(questionSwap.question[0])) {
          questionSwap.question
            .find("#q")
            .text(romanize(i + 1) + fetchedQuestion.question);

          let indexToRemove = questions.findIndex(
            (q) => q.id == questionSwap.questionId
          );

          questions.push(fetchedQuestion);

          questions.splice(indexToRemove, 1);

          break;
        }
      }
    }
    questionSwap.question.find(".question_id").val(fetchedQuestion.id);
  } else {
    let unitsString = questionSwap.questionFilter.units.join(", ");
    alert(
      `New question not available for \nUnit: ${unitsString} \nBTL: ${questionSwap.questionFilter.btl} \nMarks: ${questionSwap.questionFilter.marks}`
    );
  }
}

function getQuestionBySectionAndNumber(sectionName, questionNumber) {
  var section = template.find(function (item) {
    return item.section_name === sectionName;
  });

  var question = section.question_rows.find(function (item) {
    return item.question_number == questionNumber;
  });

  return question;
}

function romanize(num) {
  var lookup = {
      m: 1000,
      cm: 900,
      d: 500,
      cd: 400,
      c: 100,
      xc: 90,
      l: 50,
      xl: 40,
      x: 10,
      ix: 9,
      v: 5,
      iv: 4,
      i: 1,
    },
    roman = "",
    i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman + ") ";
}
