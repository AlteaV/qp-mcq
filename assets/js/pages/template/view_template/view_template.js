let fetchingDataSection = document.getElementById("fetching_data");
let resultDivSection = document.getElementById("result_div");

let allTemplates = [];

let table = $("#template_table").DataTable({
  info: false,
  ordering: false,
  paging: false,
  columns: [
    {
      data: "id",
      render: function (data, type, full, meta) {
        return meta.row + meta.settings._iDisplayStart + 1;
      },
    },
    { data: "name" },
    { data: "created_time" },
    {
      data: "id",
      render: function (data, type, full, meta) {
        let template = JSON.parse(full.template);
        let totalMarks = 0;
        let text = "";
        template.forEach((element) => {
          text += "Section - " + element.section_name;
          text += "&emsp;Marks - " + element.section_marks;
          text += "<br>";
          totalMarks += parseInt(element.section_marks);
        });

        text += "<br>";
        text += "<b>";
        text += "Total Marks - " + totalMarks;
        text += "</b>";
        return text;
      },
    },
    {
      data: "id",
      render: function (data, type, full, meta) {
        return `<button type="button" class="btn btn-primary" data-bs-toggle='modal' data-bs-target='#exampleModalCenter' onclick=viewTemplate('${data}')>View Template</button>`;
      },
    },
    {
      data: "id",
      render: function (data, type, full, meta) {
        return `<button type="button" class="btn btn-primary" onclick=duplicateTemplate('${data}')>Duplicate Template</button>`;
      },
    },
  ],
  columnDefs: [{ width: "50%", targets: 3 }],
  orderCellsTop: true,
  fixedHeader: true,
  searching: false,
  destroy: true,
});

getTemplate();

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
}

function modalSubmit() {
  duplicateTemplate(selectedTemplatdId);
}

function duplicateTemplate(id) {
  let template = allTemplates.find((temp) => temp.id == id);

  localStorage.setItem("template", JSON.stringify(template));

  window.location.href = "template_generator.html?type=duplicate";
}

let selectedTemplatdId = "";
function viewTemplate(id) {
  selectedTemplatdId = id;
  let template = JSON.parse(
    allTemplates.find((temp) => temp.id == id).template
  );

  $("#exampleModalCenterTitle").text(
    allTemplates.find((temp) => temp.id == id).name
  );
  $("#sectionsContainer").empty();
  template.forEach((section) => {
    $("#sectionsContainer").append(
      generateSection(section.section_name, section.section_marks)
    );
    var sectionDiv = $(
      '.section[data-section-name="' + section.section_name + '"]'
    );
    let questionContainer = sectionDiv.find(".questions-container");

    let groupedQuestions = section.question_rows.reduce((acc, row) => {
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
  });
  $("#fetching_question").hide();
}

function generateSection(name, marks) {
  var sectionHtml = `<div class="section" data-section-name="${name}" data-section-marks="${marks}" style="padding: 15px; margin-top: 15px; border: 1px dotted rgb(204, 204, 204);">
                              <div class="d-flex justify-content-between">
                                  <h3>Section ${name}</h3>
                              </div>
                              <h6>Marks ${marks}</h6>
                              <div class="questions-container">
                              </div>
                          </div>`;

  return sectionHtml;
}

function createQuestion(questionGroup) {
  var questionHtml = `<div class="question-row mb-5">
                              <row-div class="row">
                                  <div class="col-auto" style="align-self: center;">
                                      <h5 class="question_number">${questionGroup[0].question_number}</h5>
                                  </div>
                                  <div class="col">`;
  questionGroup.forEach((ques, index) => {
    questionHtml += buildQuestionRow(
      ques.part,
      ques.marks,
      ques.no_of_questions,
      ques.btl,
      ques.units
    );
    if (ques.part == "A") {
      questionHtml += `<p class="mb-2 mt-2 text-center text-uppercase fw-bold or-entry">OR</p>`;
    }
  });
  questionHtml += `       </div>
                          </row-div>
                      </div>`;

  return questionHtml;
}

function buildQuestionRow(part, marks, noOfQuestions, btl, units) {
  let questionRow = `<row-div class="row question">
                          <div class="col-auto" style="align-self: center;">
                              <h5>${part}</h5>
                          </div>
                          <div class="col">
                              <label class="required">Marks</label>
                              <input type="number" class="question-marks form-control" required="true" value="${marks}" disabled/>
                          </div>
                          <div class="col">
                              <label class="required">No of questions</label>
                              <input type="number" class="num-questions form-control" required="true" value="${noOfQuestions}" disabled/>
                          </div>
                          <div class="col">
                              <label class="required">BTL:</label>
                              <select class="btl form-select" required="true" disabled>`;

  for (let i = 1; i <= 7; i++) {
    let isSelected = btl === `K${i}` ? "selected" : "";
    questionRow += `<option value="K${i}" ${isSelected}>K${i}</option>`;
  }

  questionRow += `</select>
                          </div>
                          <div class="col">
                          <label class="required">Unit</label>
                              <br>`;

  for (let i = 1; i <= 5; i++) {
    let isChecked = units.includes(i) ? "checked" : "";
    questionRow += `<div class="form-check form-check-inline">
                      <input class="unit form-check-input" type="checkbox" value="${i}" ${isChecked} disabled>
                      <label>${i}</label>
                    </div>`;
  }

  questionRow += `</div>
                </row-div>`;

  return questionRow;
}

function romanize(num) {
  var lookup = {
      m: 1000,
      cm: 900,
      d: 500,
      cd: 400,
      c: 100,
      xc: 90,
      l: 50,
      xl: 40,
      x: 10,
      ix: 9,
      v: 5,
      iv: 4,
      i: 1,
    },
    roman = "",
    i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman + ") ";
}
