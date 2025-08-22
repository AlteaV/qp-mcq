var programType = document.getElementById("program_type");
var branchCode = document.getElementById("branch_code");
let semester = document.getElementById("semester");
let regulation = document.getElementById("regulation");
let subject = document.getElementById("sub_code");

let selectedSubject = document.getElementById("selected_subject");
let questionPaperName = document.getElementById("question_paper_name");

let fetchingDataSection = document.getElementById("fetching_data");
let templateDivSection = document.getElementById("template_selection_div");
let questionsDivSection = document.getElementById("questions_div");
let resultDivSection = document.getElementById("result_div");

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

subject.addEventListener("change", function () {
  selectedSubject.value = $("#sub_code option:selected").text();
});

setProgramType(programType);

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
        return `<button type="button" class="btn btn-primary" onclick=setTemplate('${data}')>Generate Question Paper</button>`;
      },
    },
  ],
  columnDefs: [{ width: "30%", targets: 3 }],
  fixedColumns: true,
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

function setTemplate(id) {
  let selectedTemplate = allTemplates.find((t) => t.id == id);
  template = JSON.parse(selectedTemplate.template);

  let groupedData = template.reduce((acc, section) => {
    section.question_rows.forEach((row) => {
      let key = row.marks;
      if (!acc[key]) {
        acc[key] = {
          marks: row.marks,
          data: [],
        };
      }

      let existingCombination = acc[key].data.find(
        (item) =>
          item.btl === row.btl &&
          item.units.every((unit) => row.units.includes(unit))
      );

      if (!existingCombination) {
        acc[key].data.push({
          btl: row.btl,
          units: [...new Set(row.units)],
          noOfQuestions: row.no_of_questions,
          marks: row.marks,
        });
      } else {
        existingCombination.noOfQuestions += row.no_of_questions;
      }
    });
    return acc;
  }, {});

  let newArray = [];

  for (let key in groupedData) {
    if (Object.hasOwnProperty.call(groupedData, key)) {
      let item = groupedData[key];

      item.data.forEach((dataItem) => {
        let newItem = {
          btl: dataItem.btl,
          units: dataItem.units,
          no_of_questions: dataItem.noOfQuestions,
          marks: item.marks,
        };

        newArray.push(newItem);
      });
    }
  }
  getQuestions(newArray);
  $("#template_selection_div").hide();
  $("#questions_div").show();
}

function showTemplateDiv() {
  questionPaperName.value = "";
  $("#fetching_data").hide();
  $("#questions_div").hide();
  $("#template_selection_div").show();
}
