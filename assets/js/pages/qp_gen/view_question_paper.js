let fetchingData = document.getElementById("fetching_data");
let resultDiv = document.getElementById("result_div");
let resultTable = document.getElementById("result_table");
let qpTable = document.getElementById("qp_table");

let qpId = document.getElementById("qp_id");
let group = document.getElementById("group");
let startDate_time = document.getElementById("start_date_time");
let endDate_time = document.getElementById("end_date_time");
let shuffleQuestions = document.getElementById("shuffle_yes");
let maxAttempts = document.getElementById("max_attempts");
let testType = document.getElementById("test_type");

let vqpModalLabel = document.getElementById("vqp_modal_label");
let vqpBody = document.getElementById("vqp_body");

let assignQpForm = document.getElementById("form_id");
let formSubmit = document.getElementById("form_submit");

formSubmit.addEventListener("click", function (e) {
  assignQpForm.classList.add("was-validated");
  if (assignQpForm.checkValidity()) {
    if (startDate_time.value >= endDate_time.value) {
      alert("End date time must be greater than start date time");
      return;
    }
    e.preventDefault();
    assignQpToGroup();
  }
});

let questions = [];
let groups = [];
let questionPapers = [];
async function getQuestionPapers() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "mncqp",
      org_id: loggedInUser.college_code,
      type: "non_mcq",
    });
    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      questions = response.result.qp;

      renderQuestionPapers();
      hideOverlay();
    } else {
      alert(response.message);
      hideOverlay();
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching question papers");
    hideOverlay();
  }
}

function renderQuestionPapers() {
  if (questions.length === 0) {
    fetchingData.innerHTML = "No Question Papers Found";
    fetchingData.style.display = "block";
    resultDiv.style.display = "none";
    return;
  }

  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.No"),
        new TableStructure("Question Paper Name"),
        new TableStructure("Action", 2),
      ],
    ],
    tableBody: [],
  };

  questions.forEach((qp, index) => {
    let temp = [
      new TableStructure(index + 1),
      new TableStructure(qp.name),
      new TableStructure(
        '<button class="btn btn-sm btn-primary view-btn" data-id="' +
          qp.sqp_id +
          '">View Question Paper</button>'
      ),
    ];

    tableData.tableBody.push(temp);
  });

  displayResult(tableData, resultTable);
  hideOverlay();
  resultDiv.style.display = "block";

  fetchingData.style.display = "none";
  resultDiv.style.display = "block";

  $(".view-btn")
    .off("click")
    .on("click", function () {
      let qp_id = $(this).data("id");
      displayQP(qp_id);
    });
}

async function getGroups(qp_id) {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "gap",
      org_id: loggedInUser.college_code,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      groups = response.result.groups;
      hideOverlay();
      if (groups.length == 0) {
        alert("No groups found. Please create groups first.");
        return;
      }
      displayGroups(qp_id);
    } else {
      alert(response.message);
      hideOverlay();
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching groups");
    hideOverlay();
  }
}

function displayGroups(qp_id) {
  if (groups.length == 0) {
    getGroups(qp_id);
    return;
  }
  group.innerHTML = "";
  let defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.text = "Select Group";
  group.appendChild(defaultOption);
  groups.forEach((grp) => {
    let option = document.createElement("option");
    option.value = grp.group_id;
    option.text = grp.group_name + " (" + grp.group_members_count + " members)";
    group.appendChild(option);
  });
  qpId.value = qp_id;

  $("#groups_modal").modal("show");
}

async function assignQpToGroup() {
  let selectedGroup = group.value;
  let startDT = startDate_time.value;
  let endDT = endDate_time.value;
  let shuffle = shuffleQuestions.checked ? 1 : 0;
  let attempts = maxAttempts.value;
  let type = testType.value;
  let selectedQp = qpId.value;

  try {
    let payload = JSON.stringify({
      function: "amqp",
      group_id: selectedGroup,
      question_paper_id: selectedQp,
      start_date_time: startDT,
      end_date_time: endDT,
      shuffle_questions: shuffle,
      max_attempts: attempts,
      test_type: type,
      staff_id: loggedInUser.staff_id,
    });
    showOverlay();
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      alert(response.message);
      assignQpForm.classList.remove("was-validated");
      assignQpForm.reset();
      $("#groups_modal").modal("hide");
      hideOverlay();
    } else {
      throw new Error(response.message || "Failed to assign question paper");
    }
  } catch (e) {
    console.error(e);
    hideOverlay();
    alert("An error occurred. Please try again.");
    return;
  }
}

async function getQuestionPaperDetails(qp_id) {
  try {
    showOverlay();

    let payload = {
      function: "vnqp",
      subject_question_paper_id: qp_id,
    };

    let response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify(payload)
    );

    if (response.success) {
      let selectQp = questions.find((qp) => qp.sqp_id === qp_id);
      let question = response.result.questions;
      let totalMarks = response.result.questions.total_marks;
      let temp = {
        qp_id: qp_id,
        questions: question,
        name: selectQp ? selectQp.name : "Unknown",
        total_marks: totalMarks,
      };
      questionPapers.push(temp);

      displayQP(qp_id);
      hideOverlay();
    } else {
      alert(response.message);
      hideOverlay();
      return [];
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching question paper details");
    hideOverlay();
    return [];
  }
}

async function displayQP(qp_id) {
  if (questionPapers.length === 0) {
    getQuestionPaperDetails(qp_id);
    return;
  }

  let qp = questionPapers.find((item) => item.qp_id == qp_id);

  if (!qp) {
    getQuestionPaperDetails(qp_id);
    return;
  }

  vqpModalLabel.style.display = "flex";
  vqpModalLabel.style.justifyContent = "space-between";
  vqpModalLabel.style.width = "100%";
  vqpModalLabel.style.alignItems = "center";

  vqpModalLabel.innerHTML = `
    <span><strong>Question Paper: ${qp.name}</strong></span>
    <span style="text-align:right;"><strong>Total Marks: ${qp.total_marks}</strong></span>
`;

  let data = qp.questions.questions;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse questions JSON:", error);
      data = [];
    }
  }

  let tableData = {
    tableHeader: [
      [
        new TableStructure("S.No"),
        new TableStructure("Questions"),
        new TableStructure("Mark"),
      ],
    ],
    tableBody: [],
  };

  data.forEach((record, index) => {
    if (record.type === "single") {
      let questionHTML = `
            <div>
                <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                    ${record.question}
                </p>
            </div>
        `;

      tableData.tableBody.push([
        new TableStructure(index + 1),
        new TableStructure(questionHTML),
        new TableStructure(record.mark || "-"),
      ]);
    } else if (record.type === "either_or") {
      let q1 = record.questions[0];
      tableData.tableBody.push([
        new TableStructure(index + 1, "", record.questions.length + 1),
        new TableStructure(`
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                        <b>(a)</b> ${q1.question}
                    </p>
                `),
        new TableStructure(q1.mark || "-"),
      ]);

      tableData.tableBody.push([
        new TableStructure(
          `<div style="text-align:center;"><strong>OR</strong></div>`,
          2
        ),
      ]);

      let q2 = record.questions[1];
      tableData.tableBody.push([
        new TableStructure(`
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                        <b>(b)</b> ${q2.question}
                    </p>
                `),
        new TableStructure(q2.mark || "-"),
      ]);
    }
  });

  displayResult(tableData, qpTable);

  $("#view_qp_modal").modal("show");

  try {
    if (window.MathJax) {
      if (typeof MathJax.typesetPromise === "function") {
        await MathJax.typesetPromise();
      } else if (typeof MathJax.typeset === "function") {
        MathJax.typeset();
      }
    }
  } catch (error) {
    console.error("MathJax typeset error:", error);
    alert("Error rendering mathematical expressions.");
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

async function initializePage() {
  getQuestionPapers();
}
