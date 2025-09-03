// import { getSubjects } from "./network_function_mcq.js";

let fetchingDataSection = document.getElementById("fetching_data");
let templateDivSection = document.getElementById("template_selection_div");
let questionsDivSection = document.getElementById("questions_div");
let resultDivSection = document.getElementById("result_div");

let allTemplates = [];

let table;

function initTable() {
  table = $("#template_table").DataTable({
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

          // Count questions per BTL
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
        render: function (data, type, full, meta) {
          return `<button type="button" class="btn btn-primary" onclick=showInputfield('${data}')>Generate Question Paper</button>`;
        },
      },
    ],
    columnDefs: [{ width: "50%", targets: 3 }],
    searching: false,
    destroy: true,
  });
}

async function showInputfield(templateId, prevSelections = null) {
  $("#template_table").hide();
  $("#result_div").hide();

  let formHtml = `
    <button id="changeTemplate" class="btn btn-secondary" >Change Template</button>
    <div id="generateForm" class="mb-3" 
       style="border:2px solid #ccc; border-radius:8px; padding:15px; margin-top:10px;">
      <div id="sectionsContainer"></div>
         
      <div class="mb-3 mt-3">
        <button id="addSection" type="button" class="btn btn-primary">Add Topics</button> 
        <button id="submitGenerate" class="btn btn-primary" >Generate Question Paper</button>
      </div>
    </div>
  `;

  $("#questions_div").html(formHtml).show();
  addSectionRow();

  if (prevSelections) {
    addSectionRow(prevSelections);
    $("#submitGenerate").show();
    $("#changeTemplate").show();
  }

  $("#addSection").on("click", function () {
    addSectionRow();
    $("#changeTemplate").show();
    $("#submitGenerate").show();
  });

  $(document).on("click", "#submitGenerate", async function () {
    let selectedTopicIds = [];
    let selections = [];
    try {
      $("#sectionsContainer .section-row").each(function () {
        let topicId = $(this).find(".topic-input").val().trim();
        if (topicId) {
          selectedTopicIds.push(topicId);
        }
        let subjectId = $(this).find(".subject-input").val().trim();
        let sectionId = $(this).find(".section-input").val().trim();

        if (subjectId && sectionId && topicId) {
          selections.push({
            subject_id: subjectId,
            section_id: sectionId,
            topic_id: topicId,
          });
        } else {
          throw "Please fill all the fields in each section.";
        }
      });

      await getMcqQuestions(templateId, selectedTopicIds, selections);

      $("#template_selection_div").hide();
      $("#questions_div").show();
      $("#generateForm").hide();
    } catch (error) {
      alert(error);
      console.error("Error generating question paper:", error);
    }
  });
  $(document).on("click", "#changeTemplate", function () {
    $("#questions_div").hide();
    $("#template_table").show();
  });
}

async function addSectionRow(prevSelections = null) {
  let container = $("#sectionsContainer");

  if (!validateSections(container)) {
    alert("Please fill in all fields in each section before adding a new one!");
    return;
  }

  let subjects = await getSubjects();

  let optionsHtml = subjects
    .map((s) => `<option value="${s.id}">${s.subject}</option>`)
    .join("");

  let sectionHtml = $(`
    <div class="section-row mb-3">
      <div class="row">
        <div class="col-auto" style="align-self: center;">
          <i class="fas fa-trash" onclick="deleteSectionRow(this)" style="color: red; cursor: pointer;"></i>
        </div>
        <div class="col">
          <label>Subject</label>
          <select class="form-control subject-input">
            <option value="">Select Subject</option>
            ${optionsHtml}
          </select>
        </div>
        <div class="col">
          <label>Section</label>
          <select class="form-control section-input">
            <option value="">Select Section</option>
          </select>
        </div>
        <div class="col">
          <label>Topic</label>
          <select class="form-control topic-input">
            <option value="">Select Topic</option>
          </select>
        </div>
      </div>
    </div>
  `);

  $("#sectionsContainer").append(sectionHtml);

  if (prevSelections) {
    sectionHtml.find(".subjectSelect").val(prevSelections.subject_id);
    sectionHtml.find(".sectionSelect").val(prevSelections.section_id);
    sectionHtml.find(".topicSelect").val(prevSelections.topic_id);
  }
}

function validateSections(container) {
  var sectionRows = container.find(".section-row");
  var isValid = true;

  sectionRows.each(function (_, element) {
    let subject = $(element).find(".subject-input").val();
    let section = $(element).find(".section-input").val();
    let topic = $(element).find(".topic-input").val();

    if (!subject || !section || !topic) {
      isValid = false;
      return false;
    }
  });

  return isValid;
}

// section inputs

$(document).on("change", ".subject-input", async function () {
  let subjectID = $(this).val();
  let $sectionSelect = $(this).closest(".row").find(".section-input");

  let sections = await getSection(subjectID);

  let sectionOptions = sections
    .map((sec) => `<option value="${sec.id}">${sec.section}</option>`)
    .join("");

  $sectionSelect.html(
    `<option value="">Select Section</option>${sectionOptions}`
  );
});

// topic inputs

$(document).on("change", ".section-input", async function () {
  let sectionID = $(this).val();
  let $topicSelect = $(this).closest(".row").find(".topic-input");

  let topics = await getTopics(sectionID);
  let topicOptions = topics
    .map((top) => `<option value="${top.id}">${top.topic}</option>`)
    .join("");

  $topicSelect.html(`${topicOptions}`);
});

function deleteSectionRow(deleteIcon) {
  var sectionRow = $(deleteIcon).closest(".section-row");
  sectionRow.remove();
  if ($("#sectionsContainer .section-row").length === 0) {
    $("#submitGenerate").hide();
  }
}

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

function setTemplate(id) {
  let selectedTemplate = allTemplates.find((t) => t.id == id);
  template = JSON.parse(selectedTemplate.template);

  let groupedData = template.reduce((acc, section) => {
    let rows = section.question_rows || [section];

    rows.forEach((row) => {
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
}

function showGeneratedQuestionID(questionId) {
  const messageHtml = `
      <div class="text-center mt-4">
        <h4 class="text-success">Question Paper Generated Successfully!</h4>
        <p class="mt-3">Your Question ID: <strong>${questionId}</strong></p>
        <p class="mt-3"><strong>Use this ID to take the test for this Question Paper.</strong></p>
         <a href="/take_mcq_test.html?id=${questionId}" class="btn btn-primary mt-3">
          Take Test Now
        </a>
      </div>
    
    `;

  $("#questions_div").html(messageHtml);
  $("#questions_div").show();
  $("#questionupload").hide();
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
  initTable();
  getTemplate();
  // getMcqQuestions(22, [1]);
}
