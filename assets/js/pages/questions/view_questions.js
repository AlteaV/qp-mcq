var programType = document.getElementById("program_type");
var branchCode = document.getElementById("branch_code");
let semester = document.getElementById("semester");
let regulation = document.getElementById("regulation");
let subject = document.getElementById("sub_code");

let fetchingDataSection = document.getElementById("fetching_data");

let markFilter = document.getElementById("mark_filter");
let btlFilter = document.getElementById("btl_filter");
let coFilter = document.getElementById("co_filter");
let unitFilter = document.getElementById("unit_filter");

let formSubject = document.getElementById("form_subject");
// let formQuestion = document.getElementById("form_question");
let formSemester = document.getElementById("form_semester");
let formMarks = document.getElementById("college_marks");
let formBtl = document.getElementById("college_btl");
let formCo = document.getElementById("college_co");
let formUnit = document.getElementById("college_unit");
let formType = document.getElementById("form_type");
let formId = document.getElementById("form_id");
let formSubCode = document.getElementById("form_sub_code");

let modalTitle = document.getElementById("exampleModalCenterTitle");

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

let questions = [];

let table = $("#questions_table").DataTable({
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
    { data: "question" },
    { data: "marks" },
    { data: "btl" },
    { data: "co" },
    { data: "unit" },
    {
      data: "images",
      render: function (data, type, full, meta) {
        if (data.length > 0) {
          let imgHtml = "";
          data.forEach((i) => {
            let image = i.image.substring(2);
            image = image.slice(0, -1);
            imgHtml += `<img id="smallImage" 
                        src="${image}" 
                        onclick=showLargeImage("${image}")
                        alt="Small Image" 
                        class="img-thumbnail" 
                        data-bs-toggle="modal" 
                        data-bs-target="#imageModal"
                        style="width:50px;height:50px;">`;
          });

          return imgHtml;
        }
        return "";
      },
    },
    // {
    //   data: "id",
    //   render: function (data, type, full, meta) {
    //     return (
    //       "<input class='btn btn-primary' type='button' data-bs-toggle='modal' data-bs-target='#exampleModalCenter' value='Edit'  onclick=editQuestion('" +
    //       data +
    //       "')>"
    //     );
    //   },
    // },
  ],
  columnDefs: [
    { targets: [1, 2, 3, 4] },
    { width: "40%", targets: [1] },
    { width: "10%", targets: [0, 2, 3, 4, 5] },
  ],
  orderCellsTop: true,
  fixedHeader: true,
  searching: false,
  destroy: true,
});

markFilter.addEventListener("change", function () {
  setTable();
});
btlFilter.addEventListener("change", setTable);
coFilter.addEventListener("change", setTable);
unitFilter.addEventListener("change", setTable);

setProgramType(programType);

function getQuestions() {
  let out = {};
  out.function = "gq";

  if (subject.value == "") {
    alert("Subject must be selected");
    return;
  }
  out.sub_code = subject.value;

  formSubCode.value = subject.value;
  formSubject.value = subject.options[subject.selectedIndex].text;
  formSemester.value = semester.value;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      questions = response.result.questions;
      showReportSection();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });

  showFecthingDataSection("Fetching data");
}

function showFecthingDataSection(data) {
  $("#details").hide();
  fetchingDataSection.innerHTML = "<p>" + data + "</p>";
  $("#fetching_data").show();
}

function showReportSection() {
  $("#fetching_data").hide();
  $("#add_question_button_div").show();
  if (questions.length == 0) {
    $("#add_question_button_div").show();
    showFecthingDataSection("There is no data");
    return;
  }
  setFilterData(markFilter, "marks");
  setFilterData(btlFilter, "btl");
  setFilterData(coFilter, "co");
  setFilterData(unitFilter, "unit");

  setTable();

  $("#details").show();
}

function setTable() {
  let filteredQUestions = questions;

  if (markFilter.value != "") {
    filteredQUestions = filteredQUestions.filter(
      (question) => question.marks == markFilter.value
    );
  }

  if (btlFilter.value != "") {
    filteredQUestions = filteredQUestions.filter(
      (question) => question.btl == btlFilter.value
    );
  }

  if (coFilter.value != "") {
    filteredQUestions = filteredQUestions.filter(
      (question) => question.co == coFilter.value
    );
  }

  if (unitFilter.value != "") {
    filteredQUestions = filteredQUestions.filter(
      (question) => question.unit == unitFilter.value
    );
  }

  table.clear();
  table.rows.add(filteredQUestions);
  table.draw();
}

function setFilterData(filterField, key) {
  var uniqueData = [];

  questions.forEach((question) => {
    if (!uniqueData.includes(question[key])) {
      uniqueData.push(question[key]);
    }
  });

  filterField.innerHTML = "";

  let filterOption = filterField.options;

  filterOption.add(new Option("All", ""));

  uniqueData.forEach((data) => {
    filterOption.add(new Option(data, data));
  });
}

function newQuestion() {
  formId.value = "";
  formType.value = "new";

  // formQuestion.value = "";
  formMarks.value = "";
  formBtl.value = "";
  formCo.value = "";
  formUnit.value = "";

  modalTitle.innerText = "New Question";
}

function editQuestion(id) {
  formId.value = id;
  formType.value = "edit";

  let selectedQuestion = questions.find((ques) => ques.id == id);

  // formQuestion.value = selectedQuestion.question;
  formMarks.value = selectedQuestion.marks;
  formBtl.value = selectedQuestion.btl;
  formCo.value = selectedQuestion.co;
  formUnit.value = selectedQuestion.unit;

  modalTitle.innerText = "Edit Question";
}

function parseMe(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formSubmit() {
  // //to get images as list
  // let htmlContent = editor1.getHTMLCode();
  // var tempDiv = document.createElement("div");
  // tempDiv.innerHTML = htmlContent;
  // var imgElements = tempDiv.querySelectorAll("img");

  // var srcList = [];

  // imgElements.forEach(function (img) {
  //   var src = img.getAttribute("src");
  //   srcList.push(src);
  // });

  // //to add image to editor
  // let imgHtml = `<br><div style="text-align: center;"><img style="max-width: 80%;" src=`;
  // imgHtml += srcList[0];
  // imgHtml += `></div>`;
  // editor1.insertHTML(imgHtml);

  if (!validateForm()) {
    return;
  }

  if (editor1.getPlainText().trim() == "") {
    alert("Question not added.");
    return;
  }

  if (formType.value == "new") {
    addQuestion();
  } else {
    updateQuestion();
  }
}

function removeWarning() {
  var validate_inputs = document.querySelectorAll("#exampleModalCenter *");
  validate_inputs.forEach(function (vaildate_input) {
    vaildate_input.classList.remove("warning");
  });
}

$(document).on("hide.bs.modal", "#exampleModalCenter", function () {
  removeWarning();
});

function success() {
  editor1.selectDoc();
  editor1.delete();
  editor1.setHTMLCode("");
  $("#exampleModalCenter").modal("hide");
  getQuestions();
  showReportSection();
}

// var editor1cfg = {};
// editor1cfg.toolbar = "basic";
// var editor1 = new RichTextEditor("#div_editor1", editor1cfg);

var editor1cfg = {};
editor1cfg.toolbar = "mytoolbar";
// editor1cfg.toolbar_mytoolbar =
//   "{bold,italic,underline,strike}|{insertimage,inserttable}" + "#{undo,redo}";
editor1cfg.toolbar_mytoolbar = "{insertimage}" + "#{undo,redo}";
var editor1 = new RichTextEditor("#div_editor1", editor1cfg);

function showLargeImage(data) {
  $("#large_img").attr("src", data);
}
