let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");

async function init() {
  await getQuestionPapers();
}

function showQuestionPapers(data) {
  if (data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
    resultDiv.style.display = "none";
    resultTable.style.display = "none";
    hideOverlay();
    return;
  }
  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.No"),
        new TableStructure("Question Paper Name"),
        new TableStructure("Type"),
        new TableStructure("Start Time"),
        new TableStructure("End Time"),
        new TableStructure("Attempts"),
        new TableStructure("Max Attempts"),
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((record, index) => {
    let actionBtn = `
      <button 
        class="btn btn-sm btn-primary take-test-btn" 
        data-id="${record.question_paper_id}"
        data-name="${record.question_paper_name}"
        data-start="${record.start_date_time}"
        data-end="${record.end_date_time}"
        data-attempts="${record.attempts}"
        data-max_attempts="${record.max_attempts}"
        data-group_id="${record.group_id}"
      >
        Take Test
      </button>
    `;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(record.question_paper_name),
      new TableStructure(record.test_type),
      new TableStructure(record.start_date_time),
      new TableStructure(record.end_date_time),
      new TableStructure(record.attempts ?? 0),
      new TableStructure(record.max_attempts),
      new TableStructure(actionBtn),
    ]);
  });

  displayResult(tableData, resultTable);
  fetchingDataSection.style.display = "none";
  resultTable.style.display = "table";

  $(".take-test-btn")
    .off("click")
    .on("click", function () {
      let id = $(this).data("id");
      let name = $(this).data("name");
      let start = $(this).data("start");
      let end = $(this).data("end");
      let attempts = $(this).data("attempts");
      let max_attempts = $(this).data("max_attempts");
      let group_id = $(this).data("group_id");

      let currentTime = new Date();

      if (new Date(start) > currentTime) {
        alert("The test has not started yet.");
        return;
      }

      if (new Date(end) < currentTime) {
        alert("The test has already ended.");
        return;
      }

      if (attempts >= max_attempts) {
        alert("You have reached the maximum number of attempts for this test.");
        return;
      }

      getQuestionPaperDetails(id, group_id);
    });

  hideOverlay();
}

async function getQuestionPapers() {
  showOverlay();
  var out = {
    function: "gaq",
    user_id: loggedInUser.register_num,
  };
  try {
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      showQuestionPapers(response.result.question_papers);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching question papers");
    hideOverlay();
    return;
  }
}

async function getQuestionPaperDetails(id, group_id) {
  let payload = {
    function: "gqftt",
    question_paper_id: id,
    group_id: group_id,
  };

  let response = await postCall(examCellEndPoint, JSON.stringify(payload));

  if (response.success) {
    questions = response.result.questions;
    questions.questions = JSON.parse(questions.questions);
    resultTable.style.display = "none";
    testTitle.innerText = `Test: ${questions.question_paper_name}`;
    submitButton.style.display = "inline-block";
    testType = questions.test_type;
    nextQuestion();
  }
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    showOverlay();

    if (!window.isCheckAuthLoaded) {
      const checkInterval = setInterval(() => {
        if (window.isCheckAuthLoaded) {
          clearInterval(checkInterval);
          initializePage();
        }
      }, 100);
      return;
    } else {
      initializePage();
    }
  }
});

function initializePage() {
  window.getQuestionPapers = getQuestionPapers;
  init();
}
