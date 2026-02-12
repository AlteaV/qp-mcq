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
        for (let ques of questions) {
          text += `Part ${ques.part_name}  : ${ques.level} - ${ques.subject}`;
          text += `  :  ${ques.mark} marks<br>`;
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
    allTemplates.find((temp) => temp.id == id).template,
  );

  $("#exampleModalCenterTitle").text(
    allTemplates.find((temp) => temp.id == id).name,
  );
  $("#sectionsContainer").empty();

  $("#sectionsContainer").append(`<div class="questions-container"></div>`);
  let questionContainer = $("#sectionsContainer").find(".questions-container");

  let groupedQuestions = questions.reduce((acc, row) => {
    let key = row.part_name;
    let existingGroupIndex = acc.findIndex(
      (group) => group[0].part_name === key,
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
                            <h5 class="question_number">Part ${questionGroup[0].part_name}</h5>
                          </div>
                          <div class="col">`;
  questionGroup.forEach((ques) => {
    questionHtml += buildQuestionRow(ques);
  });

  questionHtml += `</div></div></div>`;
  return questionHtml;
}

function buildQuestionRow(ques) {
  let row = `<div class="row question mb-2">
              <div class="col">
                <label>Level</label>
                <input type="text" class="form-control" value="${ques.level}" disabled/>
              </div>
              <div class="col">
                <label>Subject</label>
                <input type="text" class="form-control" value="${ques.subject}" disabled/>
              </div>
              <div class="col">
                <label>Section</label>
                <input type="text" class="form-control" value="${ques.section}" disabled/>
              </div>
              <div class="col">
                <label>Topic</label>
                <input type="text" class="form-control" value="${ques.topic}" disabled/>
              </div>
              <div class="col">
                <label>Question Type</label>
                <input type="text" class="form-control" value="${ques.question_type}" disabled/>
              </div>
              <div class="col">
                <label>BTL level</label>
                <input type="text" class="form-control" value="${ques.btl_level}" disabled/>
              </div>
              <div class="col">
                <label>Marks</label>
                <input type="text" class="form-control" value="${ques.mark}" disabled/>
              </div>
            </div>`;

  return row;
}

async function getTemplate() {
  showFecthingDataSection("Fetching data");
  showOverlay();
  allTemplates = [];
  var out = {};
  out.function = "gmt";
  out.org_id = loggedInUser.college_code;
  out.is_mcq = 1;
  let response = await postCall(examCellEndPoint, JSON.stringify(out));
  if (response.status == 200) {
    allTemplates = response.result.template;
    displayTemplateTable();
  } else if (response.status == 409) {
    alert(response.message);
  } else {
    alert("Network error");
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
  await fetchBtl();
  btlLevel = getBtlLevels();
  getTemplate();
}
