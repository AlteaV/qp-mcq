let fetchingData = document.getElementById("fetching_data");
let resultDiv = document.getElementById("result_div");
let resultTable = document.getElementById("result_table");
let qpTable = document.getElementById("qp_table");
let uitemplate = document.getElementById("template");

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
let template = [];
async function getQuestionPapers() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "mcqp",
      org_id: loggedInUser.college_code,
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
        new TableStructure("Topics & Marks"),
        new TableStructure("Total Marks"),
        new TableStructure("Action", 2),
      ],
    ],
    tableBody: [],
  };

  questions.forEach((qp, index) => {
    let topicMarks = JSON.parse(qp.topic_marks);
    let totalMarks = topicMarks.reduce((sum, item) => sum + item.marks, 0);
    let temp = [
      new TableStructure(index + 1),
      new TableStructure(qp.name),
      new TableStructure(
        topicMarks.map((item) => `${item.topic} (${item.marks})`).join("<br>")
      ),
      new TableStructure(totalMarks),
      new TableStructure(
        '<button class="btn btn-sm btn-primary view-btn" data-id="' +
          qp.sqp_id +
          '">View</button>'
      ),
      new TableStructure(
        '<button class="btn btn-sm btn-primary assign-btn" data-id="' +
          qp.sqp_id +
          '">Assign</button>'
      ),
    ];

    tableData.tableBody.push(temp);
  });

  displayResult(tableData, resultTable);
  hideOverlay();
  resultDiv.style.display = "block";

  fetchingData.style.display = "none";
  resultDiv.style.display = "block";

  $(".assign-btn")
    .off("click")
    .on("click", function () {
      let qp_id = $(this).data("id");
      displayGroups(qp_id);
    });

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

async function getUiTemplate(qp_id) {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "guitn",
      org_id: loggedInUser.college_code,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      template = response.result.template || [];
      hideOverlay();
      if (template.length === 0) {
        alert("No UI template found. Please create UI template first.");
        return;
      }
      displayGroups(qp_id);
    } else {
      alert(response.message);
      hideOverlay();
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching UI templates");
    hideOverlay();
  }
}

function displayGroups(qp_id) {
  if (groups.length == 0) {
    getGroups(qp_id);
    return;
  }
  if (template.length == 0) {
    getUiTemplate(qp_id);
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
  uitemplate.innerHTML = "";
  let templateDefault = document.createElement("option");
  templateDefault.value = "";
  templateDefault.text = "Select UI Template";
  uitemplate.appendChild(templateDefault);
  template.forEach((tem) => {
    let option = document.createElement("option");
    option.value = tem.template_id;
    option.text = tem.template_name;
    if (tem.is_default == "Y") {
      option.selected = true;
    }
    uitemplate.appendChild(option);
  });
  qpId.value = qp_id;

  $("#groups_modal").modal("show");
}

async function assignQpToGroup() {
  let selectedGroup = group.value;
  let template = uitemplate.value;
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
      ui_template_id: template,
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
    alert(e.message || "An error occurred. Please try again.");
    return;
  }
}

async function getQuestionPaperDetails(qp_id) {
  try {
    showOverlay();
    let payload = {
      function: "vqp",
      subject_question_paper_id: qp_id,
    };

    let response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify(payload)
    );
    if (response.success) {
      let selectQp = questions.find((qp) => qp.sqp_id === qp_id);
      let question = response.result.questions;
      let temp = {
        qp_id: qp_id,
        questions: question,
        name: selectQp.name,
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
  if (questionPapers.length == 0) {
    getQuestionPaperDetails(qp_id);
    return;
  }

  let qp = questionPapers.find((item) => item.qp_id == qp_id);

  if (!qp) {
    getQuestionPaperDetails(qp_id);
    return;
  }
  vqpModalLabel.innerText = "Question Paper: " + qp.name;

  let data = JSON.parse(qp.questions.questions);

  let tableData = {
    tableHeader: [
      [new TableStructure("S.No"), new TableStructure("Questions & Options")],
    ],
    tableBody: [],
  };

  data.forEach((record, index) => {
    let choices = record.choices;

    let choiceHTML = `<div style="display: flex; flex-direction: column; gap: 8px; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;

    for (let key in choices) {
      const inputId = `choices_${record.question_id}`;

      choiceHTML += `
                    <label for="${inputId}" style="display: flex; align-items: left; gap: 5px;">
                        <input 
                            type="radio" 
                            id="${inputId}" 
                            name="question_${record.question_id}"  
                            value="${key}" 
                        />
                        <span class="latex" style="font-size: 100%; font-family: 'Times New Roman', Times, serif;">
                            ${choices[key]}
                        </span>
                    </label>`;
    }

    choiceHTML += `</div>`;

    let questionHTML = `
                <div>
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                         ${record.question}
                    </p>
                    ${choiceHTML}
                </div>
            `;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(questionHTML),
    ]);
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
