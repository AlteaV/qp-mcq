let template = [];

let questions = [];

var allSectionNames = [];

function generateQuestionPaper(autoDownload) {
  allSectionNames = [];
  $("#sectionsContainer").empty();

  $("#sectionsContainer").append(
    createQuestionPaperName(
      $("#sub_code option:selected").text(),
      selectedQuestionPaper.name
    )
  );

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
  $("#template_selection_div").hide();
  $("#questions_div").show();

  if (autoDownload) {
    $("#fetching_data").hide();
    downloadQp();
    showTemplateDiv();
  }
}

function createQuestionPaperName(subject, questionPaperName) {
  var questionPaperTitle = `<div  style="padding: 15px; margin-top: 15px;" class="text-center">
                            <div >
                                <h3>${subject}</h3>
                            </div>
                            <h4>${questionPaperName}</h4>
                        </div>`;

  return questionPaperTitle;
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
      let question1 = filterQuestion(ques.question_ids[0]);
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
        let questionId = ques.question_ids[i] ?? ques.question_ids[0];
        let question1 = filterQuestion(questionId);
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

function buildQestionRow(part, question) {
  let questionRow = `<row-div class="row question">
                            <div class="col-auto" style="align-self: center;">
                                <h5>${part}</h5>
                            </div>
                            <div class="col-auto" style="align-self: center;">
                                <p class="col-auto" id="q">${question}</p>
                            </div>
                        </row-div>`;
  return questionRow;
}

function filterQuestion(questionId) {
  let question = questions.find((q) => q.id == questionId);
  if (question != undefined) {
    return question;
  }
  return undefined;
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
