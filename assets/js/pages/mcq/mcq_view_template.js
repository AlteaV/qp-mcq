let fetchingDataSection = document.getElementById("fetching_data");
let resultDivSection = document.getElementById("result_div");

let allTemplates = [];
let btlLevel = [];

var table = $("#template_table").DataTable({
  info: false,
  ordering: false,
  paging: false,
  columns: [
    { data: "id", render: (d, t, f, m) => m.row + 1 },
    { data: "name" },
    { data: "created_time" },
    {
      data: "id",
      render: function (data, type, full) {
        let questions = JSON.parse(full.template);
        let text = "";
        let btlCounts = {};

        questions.forEach((row) => {
          if (!btlCounts[row.btl]) {
            btlCounts[row.btl] = 0;
          }
          btlCounts[row.btl] += row.no_of_questions;
        });

        for (let btl in btlCounts) {
          text += `${btl} → ${btlCounts[btl]} questions<br>`;
        }
        return text;
      },
    },
    {
      data: "id",
      render: function (data) {
        return `<button type="button" class="btn btn-primary" data-bs-toggle='modal' data-bs-target='#exampleModalCenter' onclick="viewTemplate('${data}')">View Template</button>`;
      },
    },
  ],
  columnDefs: [{ width: "50%", targets: 3 }],
  searching: false,
  destroy: true,
});

function showFecthingDataSection(data) {
  $("#details").hide();
  fetchingDataSection.innerHTML = "<p>" + data + "</p>";
  $("#fetching_data").show();
}

function displayTemplateTable() {
  $("#fetching_data").hide();
  if (allTemplates.length == 0) {
    showFecthingDataSection("There is no data");
    return;
  }
  table.clear();
  table.rows.add(allTemplates);
  table.draw();
  $("#details").show();
  hideOverlay();
}

let selectedTemplatdId = "";
function viewTemplate(id) {
  selectedTemplatdId = id;
  let questions = JSON.parse(
    allTemplates.find((temp) => temp.id == id).template
  );

  $("#exampleModalCenterTitle").text(
    allTemplates.find((temp) => temp.id == id).name
  );
  $("#sectionsContainer").empty();

  $("#sectionsContainer").append(`<div class="questions-container"></div>`);
  let questionContainer = $("#sectionsContainer").find(".questions-container");

  let groupedQuestions = questions.reduce((acc, row) => {
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

  $("#fetching_question").hide();
}

function createQuestion(questionGroup) {
  let questionHtml = `<div class="question-row mb-5">
                        <div class="row">
                          <div class="col-auto" style="align-self: center;">
                            <h5 class="question_number">${questionGroup[0].question_number}</h5>
                          </div>
                          <div class="col">`;
  questionGroup.forEach((ques) => {
    questionHtml += buildQuestionRow(
      ques.no_of_questions,
      ques.btl,
      ques.marks
    );
  });

  questionHtml += `</div></div></div>`;
  return questionHtml;
}

function buildQuestionRow(noOfQuestions, btl, marks) {
  let row = `<div class="row question mb-2">
              <div class="col">
                <label>No of questions</label>
                <input type="number" class="form-control" value="${noOfQuestions}" disabled/>
              </div>
              <div class="col">
                <label>BTL</label>
                <select class="form-select" disabled>`;

  btlLevel.forEach((level) => {
    let isSelected = btl == level.level ? "selected" : "";
    row += `<option value="${level.level}" ${isSelected}>${level.level_name}</option>`;
  });

  // for (let i = 1; i <= 7; i++) {
  //   let isSelected = btl === `K${i}` ? "selected" : "";
  //   row += `<option value="K${i}" ${isSelected}>K${i}</option>`;
  // }

  row += `</select>
              </div>
              <div class="col">
                <label>Marks</label>
                <input type="number" class="form-control" value="${marks}" disabled/>
              </div>
            </div>`;

  return row;
}

function getTemplate() {
  showFecthingDataSection("Fetching data");
  showOverlay();
  allTemplates = [];
  var out = {};
  out.function = "gmt";
  out.org_id = loggedInUser.college_code;

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

async function initializePage() {
  await getBtllevel();
  getTemplate();
}
