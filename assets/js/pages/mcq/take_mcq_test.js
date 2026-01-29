let fetchingDataSection = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");

async function init() {
  await getQuestionPapers();
}

function showQuestionPapers(data) {
  if (data.length === 0) {
    fetchingDataSection.innerHTML = "<p>There is no data</p>";
    fetchingDataSection.style.display = "block";
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
        new TableStructure("Action"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((record, index) => {
    let buttonName = "";
    let allowTest = true;
    if (record.allow_test == "Resume") {
      buttonName = "Resume Test";
    } else if (record.allow_test == "Allow") {
      buttonName = "Take Test";
    } else {
      buttonName = "Test Completed";
      allowTest = false;
    }
    let actionBtn = `
      <button 
        class="btn btn-sm btn-primary take-test-btn" 
        data-qp_assignment_id="${record.qp_assignment_id}"
        data-start="${record.start_date_time}"
        data-end="${record.end_date_time}"
        data-template_id="${record.template_id}"
      >
        ${buttonName}
      </button>
    `;

    if (!allowTest) {
      actionBtn = `<button 
        class="btn btn-sm btn-secondary" 
        disabled
      >
        ${buttonName}
      </button>`;
    }

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(record.question_paper_name),
      new TableStructure(record.test_type),
      new TableStructure(record.start_date_time),
      new TableStructure(record.end_date_time),
      new TableStructure(actionBtn),
    ]);
  });

  displayResult(tableData, resultTable);
  fetchingDataSection.style.display = "none";
  resultTable.style.display = "table";

  $(".take-test-btn")
    .off("click")
    .on("click", function () {
      let qp_assignment_id = $(this).data("qp_assignment_id");
      let start = $(this).data("start");
      let end = $(this).data("end");
      let template_id = $(this).data("template_id");

      let currentTime = new Date();

      let dateTimeFormat = "DD-MM-YYYY hh:mm A";
      start = moment(start, dateTimeFormat).toDate();
      end = moment(end, dateTimeFormat).toDate();

      if (new Date(start) > currentTime) {
        alert("The test has not started yet.");
        return;
      }

      if (new Date(end) < currentTime) {
        alert("The test has already ended.");
        return;
      }

      // getQuestionPaperDetails(id, group_id, template_id);

      // window.location.href = 'view_ui_template.html';

      window.location.href =
        `view_ui_template.html?` +
        `&qp_assignment_id=${encodeURIComponent(qp_assignment_id)}` +
        `&template_id=${encodeURIComponent(template_id)}`;
    });

  hideOverlay();
}

async function getQuestionPapers() {
  showOverlay();
  var out = {
    function: "gaq",
    user_id:
      loggedInUser.register_num ||
      loggedInUser.user_id ||
      loggedInUser.staff_id,
  };
  try {
    let response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));
    if (response.success) {
      showQuestionPapers(response.result.question_papers);
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching question papers");
    hideOverlay();
    return;
  }
}

// async function getQuestionPaperDetails(id, group_id, template_id) {
//   let payload = {
//     function: "gqftt",
//     question_paper_id: id,
//     group_id: group_id,
//     template_id: template_id,
//   };

//   let response = await postCall(examCellEndPoint, JSON.stringify(payload));

//   if (response.success) {
//     questions = response.result.questions;
//     questions.questions = JSON.parse(questions.questions);
//     resultTable.style.display = "none";
//     testTitle.innerText = `Test: ${questions.question_paper_name}`;
//     submitButton.style.display = "inline-block";
//     testType = questions.test_type;
//     nextQuestion();
//   }
// }

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
