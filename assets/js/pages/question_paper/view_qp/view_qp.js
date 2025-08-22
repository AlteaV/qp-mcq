var programType = document.getElementById("program_type");
var branchCode = document.getElementById("branch_code");
let semester = document.getElementById("semester");
let regulation = document.getElementById("regulation");
let subject = document.getElementById("sub_code");

let fetchingDataSection = document.getElementById("fetching_data");

let questionsSection = document.getElementById("vsDetails");

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

setProgramType(programType);

let questions_papers = [];

let table = $("#question_papers_table").DataTable({
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
        let template = JSON.parse(full.question_paper);
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
        return `<button type="button" class="btn btn-primary" onclick=viewQuestionPaper('${data}')>View Question Paper</button>`;
      },
    },
    {
      data: "id",
      render: function (data, type, full, meta) {
        return `<button type="button" class="btn btn-primary" onclick=downloadQuestionPaper('${data}')>Download Question Paper</button>`;
      },
    },
  ],
  columnDefs: [{ width: "50%", targets: 3 }],
  orderCellsTop: true,
  fixedHeader: true,
  searching: false,
  destroy: true,
});

function showFecthingDataSection(data) {
  $("#details").hide();
  fetchingDataSection.innerHTML = "<p>" + data + "</p>";
  $("#fetching_data").show();
}

function displayQuestionPapers() {
  $("#fetching_data").hide();
  if (questions_papers.length == 0) {
    showFecthingDataSection("There is no data");
    return;
  }
  table.clear();
  table.rows.add(questions_papers);
  table.draw();
  $("#details").show();
}

let selectedQuestionPaper;
function viewQuestionPaper(questionPaperId) {
  selectedQuestionPaper = questions_papers.find(
    (qp) => qp.id == questionPaperId
  );

  template = JSON.parse(selectedQuestionPaper.question_paper);
  getQuestions(questionPaperId, false);
}

function downloadQuestionPaper(questionPaperId) {
  selectedQuestionPaper = questions_papers.find(
    (qp) => qp.id == questionPaperId
  );

  template = JSON.parse(selectedQuestionPaper.question_paper);
  getQuestions(questionPaperId, true);
}

function downloadQp() {
  const { jsPDF } = window.jspdf;

  let contentToDownload = document.getElementById("sectionsContainer");
  let options = {
    scale: 2,
  };

  html2canvas(contentToDownload, options).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      pdf.internal.pageSize.width,
      pdf.internal.pageSize.height
    );

    pdf.save("downloaded-document.pdf");
  });
}

function showTemplateDiv() {
  $("#fetching_data").hide();
  $("#questions_div").hide();
  $("#template_selection_div").show();
}
