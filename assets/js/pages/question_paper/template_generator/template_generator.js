let sectionsContainer = document.getElementById("sectionsContainer");
let totalMarks = document.getElementById("totalMarks");
let sectionName = document.getElementById("section_name");
let sectionMarks = document.getElementById("section_marks");
let templateName = document.getElementById("template_name");

var allSectionNames = [];

function addSection() {
  var name = sectionName.value;
  var marks = parseInt(sectionMarks.value);

  if (totalMarks.value == "") {
    alert("Total marks can't be empty");
    return;
  }

  if (!name || !marks) {
    alert("Please enter both Section Name and Marks.");
    return;
  }

  if (allSectionNames.includes(name)) {
    alert(
      "Error: Section name '" +
        name +
        "' already exists. Choose a different name."
    );
    return;
  }

  for (var i = 0; i < allSectionNames.length; i++) {
    var currentSectionName = allSectionNames[i];
    let marks = calculateSectionMarks(currentSectionName);
    let eitherRowsEqual = areEitherOrRowsEqual(currentSectionName);

    if (!eitherRowsEqual) {
      alert(
        "The either or question for section '" +
          currentSectionName +
          "' does not have same marks."
      );
      return;
    }

    if (marks != "equal") {
      alert(
        "Error: The sum of marks for section '" +
          currentSectionName +
          "' does not equal the specified section marks."
      );
      return;
    }
  }

  let marksSoFar = getSectionMarks();
  marksSoFar += marks;
  if (marksSoFar > totalMarks.value) {
    alert("Section marks can't exceed total marks");
    return;
  }
  allSectionNames.push(name);

  var sectionHtml = `<div class="section" data-section-name="${name}" data-section-marks="${marks}" style="padding: 15px; margin-top: 15px; border: 1px dotted rgb(204, 204, 204);">
                            <div class="d-flex justify-content-between">
                                <h3>Section ${name}</h3>
                                <button onclick="deleteSection(this)" style="background-color: rgb(245, 197, 203); color: rgb(101, 32, 39); border: none; padding: 8px 12px; cursor: pointer;">Delete Section</button>
                            </div>
                            <h6>Marks ${marks}</h6>
                            <div class="questions-container"></div>
                            <div class="row">
                                <div class="col">
                                    <label>Question Type:</label>
                                    <select class="divisionType form-select">
                                        <option value="single" selected>Single</option><
                                        <option value="eitherOr">Either Or</option>
                                    </select>
                                </div>
                                <div class="col align-self-end">
                                    <input type="button" value="Add to Section" onclick="addQuestionRow(this)" class="btn btn-primary">
                                </div>
                            </div>
                        </div>`;
  $("#sectionsContainer").append(sectionHtml);
  $("#save_template_div").show();
  sectionName.value = "";
  sectionMarks.value = "";
}

function addQuestionRow(btn) {
  var sectionDiv = $(btn).closest(".section");
  var sectionName = sectionDiv.data("section-name");
  var sectionMarks = parseInt(sectionDiv.data("section-marks"));
  var divisionType = sectionDiv.find(".divisionType").val();
  var questionContainer = sectionDiv.find(".questions-container");
  var questionRows = questionContainer.find(".question-row");
  var questionNumber = questionRows.length + 1;

  if (!validateQuestions(sectionDiv)) {
    alert("Please fill in all details for existing questions.");
    return;
  }

  if (!validateUnitSelection(sectionDiv)) {
    alert(
      "Please select at least one unit for each question, and the number of units should be less than or equal to the number of questions."
    );
    return;
  }

  if (!areEitherOrRowsEqual(sectionName)) {
    alert(
      "The either or question for section '" +
        sectionName +
        "' does not have same marks."
    );
    return;
  }
  var existingSectionMarks = calculateSectionMarks(sectionName);

  if (existingSectionMarks == "lower") {
    var questionHtml = `<div class="question-row mb-5"  data-division-type="${divisionType}">
                            <row-div class="row">
                                <div class="col-auto" style="align-self: center;">
                                    <i class="fas fa-trash" onclick="deleteQuestionRow(this)" style="color: red;"></i>
                                </div>
                                <div class="col-auto" style="align-self: center;">
                                    <h5 class="question_number">${questionNumber}</h5>
                                </div>
                                <div class="col">`;
    if (divisionType == "single") {
      questionHtml += getQuestionRow("");
    } else {
      questionHtml += getQuestionRow("A");
      questionHtml += `<p class="mb-2 mt-2 text-center text-uppercase fw-bold or-entry">OR</p>`;
      questionHtml += getQuestionRow("B");
    }
    questionHtml += `       </div>
                        </row-div>
                    </div>`;

    questionContainer.append(questionHtml);
  } else if (existingSectionMarks == "higher") {
    alert(
      "Cannot add question. Total marks for questions in this section exceed the specified section marks."
    );
  } else {
    alert("Questions selected for specified marks.");
  }
}

function getQuestionRow(part) {
  let questionRow = `<row-div class="row question">
                        <div class="col-auto" style="align-self: center;">
                            <h5>${part}</h5>
                        </div>
                        <div class="col">
                            <label class="required">Marks</label>
                            <input type="number" class="question-marks form-control" required="true"/>
                        </div>
                        <div class="col">
                            <label class="required">No of questions</label>
                            <input type="number" class="num-questions form-control" required="true"/>
                        </div>
                        <div class="col">
                            <label class="required">BTL:</label>
                            <select class="btl form-select" required="true" >`;

  for (let i = 1; i <= 7; i++) {
    questionRow += `<option value="K${i}">K${i}</option>`;
  }

  questionRow += `</select>
                        </div>
                        <div class="col">
                        <label class="required">Unit</label>
                            <br>
                            <div class="form-check form-check-inline">
                                <input class="unit form-check-input" type="checkbox" value="1">
                                <label>1</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="unit form-check-input" type="checkbox" value="2">
                                <label>2</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="unit form-check-input" type="checkbox" value="3">
                                <label>3</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="unit form-check-input" type="checkbox" value="4">
                                <label>4</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="unit form-check-input" type="checkbox" value="5">
                                <label>5</label>
                            </div>
                        </div>
                    </row-div>`;
  return questionRow;
}

function deleteSection(button) {
  var section = $(button).closest(".section");
  var sectionName = section.data("section-name");
  section.remove();
  var index = allSectionNames.indexOf(sectionName);
  if (index !== -1) {
    allSectionNames.splice(index, 1);
  }

  if (allSectionNames.length == 0) {
    $("#save_template_div").hide();
  }
}

function calculateSectionMarks(sectionName) {
  var totalMarks = 0;
  var eitherOrA = 0;

  var questionRowsEitherOr = $(
    '.section[data-section-name="' +
      sectionName +
      '"] .question-row[data-division-type="eitherOr"]'
  );

  questionRowsEitherOr.each(function (index, element) {
    let questions = $(element).find(".question");
    questions.each(function (qIndex, qElemet) {
      var marks = parseInt($(qElemet).find(".question-marks").val());
      var numQuestions = parseInt($(qElemet).find(".num-questions").val());
      if (qIndex % 2 === 0) {
        eitherOrA += marks * numQuestions;
      }
    });
  });

  var questionRowsNotEitherOr = $(
    '.section[data-section-name="' +
      sectionName +
      '"] .question-row[data-division-type!="eitherOr"]:not(:contains("OR"))'
  );

  questionRowsNotEitherOr.each(function (index, element) {
    var marks = parseInt($(element).find(".question-marks").val());
    var numQuestions = parseInt($(element).find(".num-questions").val());
    totalMarks += marks * numQuestions;
  });

  var sectionMarks = $(
    '.section[data-section-name="' + sectionName + '"]'
  ).data("section-marks");

  if (totalMarks + eitherOrA === sectionMarks) {
    return "equal";
  } else if (totalMarks + eitherOrA < sectionMarks) {
    return "lower";
  } else {
    return "higher";
  }
}

function areEitherOrRowsEqual(sectionName) {
  var questionRowsEitherOr = $(
    '.section[data-section-name="' +
      sectionName +
      '"] .question-row[data-division-type="eitherOr"]'
  );
  var totalMarksA = 0;
  var totalMarksB = 0;

  var isSame = true;

  questionRowsEitherOr.each(function (index, element) {
    if (isSame) {
      let questions = $(element).find(".question");
      questions.each(function (qIndex, qElemet) {
        var marks = parseInt($(qElemet).find(".question-marks").val());
        var numQuestions = parseInt($(qElemet).find(".num-questions").val());

        if (qIndex % 2 === 0) {
          totalMarksA += marks * numQuestions;
        } else {
          totalMarksB += marks * numQuestions;
        }
      });
      isSame = totalMarksA === totalMarksB;
    }
  });

  return isSame;
}

function validateQuestions(sectionDiv) {
  var questionRows = sectionDiv.find(".question-row");
  var isValid = true;

  questionRows.each(function (index, element) {
    let questions = $(element).find(".question");
    questions.each(function (qIndex, qElemet) {
      var questionMarks = $(qElemet).find(".question-marks").val();
      var numQuestions = $(qElemet).find(".num-questions").val();
      var btl = $(qElemet).find(".btl").val();

      if (!questionMarks || !numQuestions || !btl) {
        isValid = false;
        return false;
      }
    });
  });

  return isValid;
}

function validateUnitSelection(sectionDiv) {
  var questionRows = sectionDiv.find(".question-row");
  var isValid = true;

  questionRows.each(function (index, element) {
    let questions = $(element).find(".question");

    questions.each(function (qIndex, qElemet) {
      var selectedUnits = $(qElemet).find(".unit:checked");
      var numQuestions = parseInt($(qElemet).find(".num-questions").val());

      if (selectedUnits.length === 0 || selectedUnits.length > numQuestions) {
        isValid = false;
        return false;
      }
    });
  });

  return isValid;
}

function deleteQuestionRow(deleteIcon) {
  var questionRow = $(deleteIcon).closest(".question-row");
  var questionContainer = $(questionRow).closest(".questions-container");
  questionRow.remove();

  let questionNumbers = $(questionContainer).find(".question_number");

  questionNumbers.each(function (index, element) {
    $(element).text(index + 1);
  });
}

function getSectionMarks() {
  var totalPreviousSectionMarks = 0;
  $(".section").each(function (index, element) {
    totalPreviousSectionMarks +=
      parseInt($(element).data("section-marks")) || 0;
  });
  return totalPreviousSectionMarks;
}

function validateTemplate() {
  for (var i = 0; i < allSectionNames.length; i++) {
    var currentSectionName = allSectionNames[i];
    let marks = calculateSectionMarks(currentSectionName);
    let eitherRowsEqual = areEitherOrRowsEqual(currentSectionName);

    if (!eitherRowsEqual) {
      alert(
        "The either or question for section '" +
          currentSectionName +
          "' does not have same marks."
      );
      return;
    }

    if (marks != "equal") {
      alert(
        "Error: The sum of marks for section '" +
          currentSectionName +
          "' does not equal the specified section marks."
      );
      return;
    }

    var sectionDiv = $(
      '.section[data-section-name="' + currentSectionName + '"]'
    );

    if (!validateQuestions(sectionDiv)) {
      alert("Please fill in all details for existing questions.");
      return;
    }

    if (!validateUnitSelection(sectionDiv)) {
      alert(
        "Please select at least one unit for each question, and the number of units should be less than or equal to the number of questions."
      );
      return;
    }
  }

  let marksSoFar = getSectionMarks();
  if (marksSoFar != totalMarks.value) {
    alert("Section marks is not equal to total marks");
    return;
  }

  var allData = [];

  for (var i = 0; i < allSectionNames.length; i++) {
    var sectionName = allSectionNames[i];

    var questionRowsData = [];
    var questionRows = $(
      '.section[data-section-name="' + sectionName + '"] .question-row'
    );
    var currentQuestionNumber = 0;

    let eitherOrDiv = [];
    questionRows.each(function (index, element) {
      let questions = $(element).find(".question");

      questions.each(function (qIndex, qElement) {
        var questionData = { units: [] };
        questionData.no_of_questions = parseInt(
          $(qElement).find(".num-questions").val()
        );
        questionData.marks = parseInt(
          $(qElement).find(".question-marks").val()
        );
        questionData.btl = $(qElement).find(".btl").val();
        $(qElement)
          .find(".unit:checked")
          .each(function () {
            questionData.units.push(parseInt($(this).val()));
          });
        questionData.question_number = index + 1;

        if (questions.length > 1) {
          if (qIndex < questions.length - 1) {
            questionData.part = "A";
          } else {
            questionData.part = "B";
          }
        } else {
          questionData.part = "";
        }
        questionRowsData.push(questionData);
      });
    });

    var sectionMarks = $(
      '.section[data-section-name="' + sectionName + '"]'
    ).data("section-marks");

    var sectionData = {
      section_name: sectionName,
      question_rows: questionRowsData,
      section_marks: sectionMarks,
    };
    allData.push(sectionData);
  }

  if (templateName.value == "") {
    alert("Enter template name");
    return;
  }
  uploadTemplate(allData);
}

function uploadSuccess() {
  $("#sectionsContainer").empty();
  allSectionNames = [];
  $("#save_template_div").hide();
}
