var programType = document.getElementById("program_type");
var branchCode = document.getElementById("branch_code");
let semester = document.getElementById("semester");
let regulation = document.getElementById("regulation");
let subject = document.getElementById("sub_code");

let fetchingDataSection = document.getElementById("fetching_data");
let templateDivSection = document.getElementById("template_selection_div");
let questionsDivSection = document.getElementById("questions_div");
let resultDivSection = document.getElementById("result_div");

let twoMarkNoOfQuestion = document.getElementById("2_marks_no_of_question");

let questionPaperName = document.getElementById("question_paper_name");

programType.addEventListener("change", function () {
  setDepartment(branchCode, programType.value);
});

branchCode.addEventListener("change", function () {
  setSemester(semester, branchCode.value);
});

semester.addEventListener("change", function () {
  setRegulation(regulation, branchCode.value, semester.value);
});

regulation.addEventListener("change", function () {
  setSubject(subject, branchCode.value, semester.value, regulation.value);
});

setProgramType(programType);

generatePartB();

let partBQuestions = [];
let out = {};
function generateQuestionPaper() {
  partBQuestions = [];
  out = {};
  let checkboxes = document.querySelectorAll("[name='2_marks_unit']:checked");

  let selected2MarkUnits = Array.from(checkboxes).map(
    (checkbox) => checkbox.value
  );

  if (selected2MarkUnits.length == 0) {
    alert("Part A should have minimum one unit");
    return;
  }

  out["two_marks"] = {
    units: selected2MarkUnits,
    marks: 2,
    no_of_questions: parseInt(twoMarkNoOfQuestion.value),
  };

  if (partBQuestionType.value == "Either Or") {
    for (let i = 11; i <= 15; i++) {
      if (!addQuestion("A", i)) {
        return;
      }
      if (!addQuestion("B", i)) {
        return;
      }
    }
  } else {
    for (let i = 11; i <= 15; i++) {
      if (!addQuestion("A", i)) {
        return;
      }
    }
  }

  let transformedData = {
    "8marks": [],
    "16marks": [],
  };

  partBQuestions.forEach((item) => {
    const key = `${item.marksSelected}marks`;
    const units = item.units.map((u) => parseInt(u));

    units.forEach((unit) => {
      const existingUnitIndex = transformedData[key].findIndex((entry) =>
        entry.units.includes(unit)
      );

      if (existingUnitIndex !== -1) {
        transformedData[key][existingUnitIndex].no_of_questions =
          transformedData[key][existingUnitIndex].no_of_questions +
          parseInt(item.noOfQestions);
      } else {
        transformedData[key].push({
          units: [unit],
          marks: parseInt(item.marksSelected),
          no_of_questions: parseInt(item.noOfQestions),
        });
      }
    });
  });

  out["eight_marks"] = transformedData["8marks"];
  out["sixteen_marks"] = transformedData["16marks"];
  out["function"] = "gnqp";
  out["sub_code"] = subject.value;

  getQuestions(out);
}

function addQuestion(identifier, questionNumber) {
  let marksSelected = document.getElementById(
    "mark_" + identifier + "_" + questionNumber
  ).value;

  let noOfQestions = document.getElementById(
    "question_count_" + identifier + "_" + questionNumber
  ).value;

  let unitName = `unit_selected_${identifier}_${questionNumber}`;
  let unitsCheckBox = document.querySelectorAll(
    "[name='" + unitName + "']:checked"
  );

  let selectedUnits = Array.from(unitsCheckBox).map(
    (checkbox) => checkbox.value
  );

  if (selectedUnits.length == 0) {
    partBQuestions = [];
    alert(`Part B - Question ${questionNumber} should have minimum one unit`);
    return false;
  }

  partBQuestions.push({
    questionNumber: questionNumber,
    noOfQestions: noOfQestions,
    marksSelected: marksSelected,
    units: selectedUnits,
    part: identifier,
  });
  return true;
}

function showTemplateDiv() {
  $("#fetching_data").hide();
  $("#questions_div").hide();
  $("#template_selection_div").show();
}
