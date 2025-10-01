let templateName = document.getElementById("template_name");
let btlLevel = [];

function addQuestionRow() {
  var questionContainer = $("#questionsContainer");
  var questionRows = questionContainer.find(".question-row");
  var questionNumber = questionRows.length + 1;

  if (!validateQuestions(questionContainer)) {
    alert("Please fill in all details for existing questions.");
    return;
  }

  let usedBTLs = [];
  questionRows.find(".btl").each(function () {
    let val = $(this).val();
    if (val) {
      usedBTLs.push(val);
    }
  });

  var questionHtml = `
    <div class="question-row mb-4">
      <div class="row">
        <div class="col-auto" style="align-self: center;">
          <i class="fas fa-trash" onclick="deleteQuestionRow(this)" style="color: red; cursor: pointer;"></i>
        </div>
        <div class="col-auto" style="align-self: center;">
          <h5 class="question_number">${questionNumber}</h5>
        </div>
        <div class="col">
          ${getQuestionRow(usedBTLs)}
        </div>
      </div>
    </div>`;

  questionContainer.append(questionHtml);
  $("#save_template_div").show();
}

function getQuestionRow(usedBTLs = []) {
  let questionRow = `
    <div class="row question">
      <div class="col mt-3">
        <label class="required">No of Questions</label>
        <input type="number" class="num-questions form-control" required />
      </div>
      <div class="col mt-3">
        <label class="required">BTL:</label>
        <select class="btl form-select" required>`;
  btlLevel.forEach((level) => {
    if (!usedBTLs.includes(level)) {
      questionRow += `<option value="${level.level}">${level.level_name}</option>`;
    }
  });

  questionRow += `</select>
      </div>
      <div class="col mt-3">
        <label class="required">Mark</label>
        <input type="number" class="mark form-control" value="1" required />
      </div>
    </div>`;
  return questionRow;
}

function deleteQuestionRow(deleteIcon) {
  var questionRow = $(deleteIcon).closest(".question-row");
  var questionContainer = $(questionRow).closest("#questionsContainer");
  questionRow.remove();

  let questionNumbers = $(questionContainer).find(".question_number");
  questionNumbers.each(function (index, element) {
    $(element).text(index + 1);
  });
}

function validateQuestions(container) {
  var questionRows = container.find(".question-row");
  var isValid = true;

  questionRows.each(function (_, element) {
    let questions = $(element).find(".question");
    questions.each(function (_, qElement) {
      var numQuestions = $(qElement).find(".num-questions").val();
      var btl = $(qElement).find(".btl").val();
      var mark = $(qElement).find(".mark").val();

      if (!numQuestions || !btl || !mark) {
        isValid = false;
        return false;
      }
    });
  });

  return isValid;
}

function validateTemplate() {
  var container = $("#questionsContainer");

  if (!validateQuestions(container)) {
    alert("Please fill in all details for existing questions.");
    return;
  }

  var allData = [];
  var questionRows = container.find(".question-row");
  var totalMarks = 0;

  questionRows.each(function (index, element) {
    let questions = $(element).find(".question");
    questions.each(function (qIndex, qElement) {
      var numQuestions = parseInt($(qElement).find(".num-questions").val());
      var btl = $(qElement).find(".btl").val();
      var marks = parseInt($(qElement).find(".mark").val());

      var questionData = {};

      questionData.no_of_questions = numQuestions;
      questionData.btl = btl;
      questionData.marks = marks;
      questionData.question_number = index + 1;
      allData.push(questionData);

      totalMarks += numQuestions * marks;
    });
  });

  if (templateName.value == "") {
    alert("Enter template name");
    return;
  }

  let expectedTotalMark = parseInt(document.getElementById("totalMarks").value);
  if (totalMarks !== expectedTotalMark) {
    alert(
      "Total marks should be exactly " +
        expectedTotalMark +
        ". Current total = " +
        totalMarks
    );
    return;
  }
  showOverlay();
  uploadTemplate(allData, loggedInUser.staff_id);
}

function uploadSuccess() {
  hideOverlay();
  $("#questionsContainer").empty();
  $("#save_template_div").hide();
}

async function getBtllevel() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "gbl",
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      btlLevel = response.result.btl_level;
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching BTL levels");
  } finally {
    hideOverlay();
  }
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    showOverlay();

    if (!window.isCheckAuthLoaded) {
      const checkInterval = setInterval(() => {
        if (window.isCheckAuthLoaded) {
          clearInterval(checkInterval);
          init();
        }
      }, 100);
      return;
    } else {
      init();
    }
  }
});

async function init() {
  await getBtllevel();
}
