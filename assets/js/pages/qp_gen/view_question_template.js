let fetchingDataSection = document.getElementById("fetching_data");
let resultDivSection = document.getElementById("result_div");

let allTemplates = [];
let btlLevel = [];

var table = $("#template_table").DataTable({
  info: false,
  ordering: false,
  paging: false,
  columns: [
    {
      data: "id",
      render: (d, t, f, m) => m.row + 1,
    },
    {
      data: "name",
    },
    {
      data: "created_time",
    },
    {
      data: "id",
      render: function (data, type, full) {
        let questions = JSON.parse(full.template);
        let text = "";

        for (let ques of questions) {
          text += `Part ${ques.part_name}<br>
          ${ques.subject} : ${ques.max_marks} marks`;
        }
        return text;
      },
    },
    {
      data: "total_marks",
      render: function (data, type, full) {
        return full.total_marks;
      },
    },
    {
      data: "id",
      render: function (data) {
        return `<button type="button" class="btn btn-primary" data-bs-toggle='modal' data-bs-target='#exampleModalCenter' onclick="viewTemplate('${data}')">View Template</button>`;
      },
    },
  ],
  columnDefs: [
    {
      width: "50%",
      targets: 3,
    },
  ],
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
    hideOverlay();
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

  let templateData = allTemplates.find((t) => t.id == id);
  let questions = JSON.parse(templateData.template);

  $("#exampleModalCenterTitle").text(templateData.name);
  $("#sectionsContainer").empty();

  $("#sectionsContainer").append(`<div class="questions-container"></div>`);
  let questionContainer = $("#sectionsContainer").find(".questions-container");

  let questionCounter = 1;

  questions.forEach((part) => {
    let html = `<h5 class="mb-3">Part ${part.part_name}</h5>`;

    part.questions.forEach((q) => {
      if (q.type === "single") {
        html += buildQuestionRow(q, questionCounter);
        questionCounter += q.no_of_questions;
      } else if (q.type === "either_or") {
        html += buildEitherOrQuestionRow(q.questions, questionCounter);
        questionCounter++;
      }
    });

    questionContainer.append(html);
  });

  $("#fetching_question").hide();
}

function buildQuestionRow(ques, qNumberStart) {
  let html = "";

  for (let i = 0; i < ques.no_of_questions; i++) {
    html += `
      <div class="mb-3">
        <strong>Q${qNumberStart + i}.</strong>
        <div class="border p-3 mt-2">
          <div class="row mb-2">
            <div class="col">
              <label>Section</label>
              <input type="text" class="form-control" value="${
                ques.section
              }" disabled/>
            </div>
            <div class="col">
              <label>Topic</label>
              <input type="text" class="form-control" value="${
                ques.topic
              }" disabled/>
            </div>
            <div class="col">
              <label>BTL</label>
              <input type="text" class="form-control" value="${
                ques.btl_level
              }" disabled/>
            </div>
            <div class="col">
              <label>Marks</label>
              <input type="text" class="form-control" value="${
                ques.marks_per_question
              }" disabled/>
            </div>
          </div>
        </div>
      </div>`;
  }

  return html;
}

function buildEitherOrQuestionRow(options, qNumber) {
  let html = `<div class="mb-3"><strong>Q${qNumber}.</strong></div>`;

  options.forEach((opt, i) => {
    for (let j = 0; j < opt.no_of_questions; j++) {
      html += `
        <div class="border p-3 mb-2">
          <div class="row mb-2">
            <div class="col">
              <label>Section</label>
              <input type="text" class="form-control" value="${opt.section}" disabled>
            </div>
            <div class="col">
              <label>Topic</label>
              <input type="text" class="form-control" value="${opt.topic}" disabled>
            </div>
            <div class="col">
              <label>BTL</label>
              <input type="text" class="form-control" value="${opt.btl_level}" disabled>
            </div>
            <div class="col">
              <label>Marks</label>
              <input type="text" class="form-control" value="${opt.marks_per_question}" disabled>
            </div>
          </div>
        </div>
      `;

      if (j < opt.no_of_questions - 1) {
        html += `<div class="text-center fw-bold mb-2">OR</div>`;
      }
    }

    if (i < options.length - 1) {
      html += `<div class="text-center fw-bold mb-2">OR</div>`;
    }
  });

  return html;
}

function getTemplate() {
  showFecthingDataSection("Fetching data");
  showOverlay();
  allTemplates = [];
  var out = {};
  out.function = "gnmt";
  out.org_id = loggedInUser.college_code;
  out.is_mcq = null;

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
