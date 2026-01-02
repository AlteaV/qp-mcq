var form = document.getElementById("form_id");
var modelLabel = document.getElementById("modalLabel");
var fetchingDataSection = document.getElementById("fetching_data");
var resultTableCount = document.getElementById("result_table_count");
var resultDiv = document.getElementById("result_div");
var resultTable = document.getElementById("result_table");
var submitBtn = document.getElementById("submit_btn");

var templateName = document.getElementById("template_name");
var totalDuration = document.getElementById("total_duration");
var showTimer = document.getElementById("show_timer");
var questionsPerPage = document.getElementById("questions_per_page");
var addUiTemplateBtn = document.getElementById("new_ui_template_button");

// Question Layout Radio
var questionLayoutYes = document.getElementById("question_layout_yes");
var questionLayoutNo = document.getElementById("question_layout_no");

// Review/Skip Container
const reviewSkipBox = document.getElementById("review_skip_box");

// Can Review Radio
var canReviewYes = document.getElementById("can_review_yes");
var canReviewNo = document.getElementById("can_review_no");

// Can Skip Radio
var canSkipYes = document.getElementById("can_skip_yes");
var canSkipNo = document.getElementById("can_skip_no");

// Full Screen Radio
var fullScreenYes = document.getElementById("full_screen_yes");
var fullScreenNo = document.getElementById("full_screen_no");

// Disable Right Click Radio
var disableRightClickYes = document.getElementById("disable_right_click_yes");
var disableRightClickNo = document.getElementById("disable_right_click_no");

// Is Default Radio
var isDefaultYes = document.getElementById("is_default_yes");
var isDefaultNo = document.getElementById("is_default_no");

let templateId = null;
let allTemplates = [];

addUiTemplateBtn.addEventListener("click", function () {
  modelLabel.innerHTML = "New Template";
  templateId = null;
  resetForm();
});

questionsPerPage.addEventListener("input", function () {
  this.value = questionsPerPage.value;
  if (this.value < 0) {
    alert("Count of Question Should Postive");
    questionsPerPage.value = "";
  }
});

submitBtn.addEventListener("click", function (event) {
  event.preventDefault();
  managUiTemplate();
});

questionLayoutYes.addEventListener("change", function () {
  if (this.checked) {
    canReviewYes.disabled = false;
    canReviewNo.disabled = false;
    canSkipYes.disabled = false;
    canSkipNo.disabled = false;
  }
});

questionLayoutNo.addEventListener("change", function () {
  if (this.checked) {
    canReviewYes.disabled = true;
    canReviewNo.disabled = true;
    canSkipYes.disabled = true;
    canSkipNo.disabled = true;

    canReviewYes.checked = false;
    canReviewNo.checked = false;
    canSkipYes.checked = false;
    canSkipNo.checked = false;
  }
});

function getRadioValue(name) {
  if (name === "question_layout") {
    if (questionLayoutYes.checked) return "Y";
    if (questionLayoutNo.checked) return "N";
    return null;
  } else if (name === "can_review") {
    if (canReviewYes.checked) return "Y";
    if (canReviewNo.checked) return "N";
    return null;
  } else if (name === "can_skip") {
    if (canSkipYes.checked) return "Y";
    if (canSkipNo.checked) return "N";
    return null;
  } else if (name === "full_screen") {
    if (fullScreenYes.checked) return "Y";
    if (fullScreenNo.checked) return "N";
    return null;
  } else if (name === "disable_right_click") {
    if (disableRightClickYes.checked) return "Y";
    if (disableRightClickNo.checked) return "N";
    return null;
  } else if (name === "is_default") {
    if (isDefaultYes.checked) return "Y";
    if (isDefaultNo.checked) return "N";
    return null;
  }
  return null;
}

function setRadioValue(name, value) {
  if (name === "question_layout") {
    questionLayoutYes.checked = value === "Y";
    questionLayoutNo.checked = value === "N";

    if (value === "Y") {
      canReviewYes.disabled = false;
      canReviewNo.disabled = false;
      canSkipYes.disabled = false;
      canSkipNo.disabled = false;
    } else {
      canReviewYes.disabled = true;
      canReviewNo.disabled = true;
      canSkipYes.disabled = true;
      canSkipNo.disabled = true;
    }
  } else if (name === "can_review") {
    canReviewYes.checked = value === "Y";
    canReviewNo.checked = value === "N";
    if (value === null) {
      canReviewYes.checked = false;
      canReviewNo.checked = false;
    }
  } else if (name === "can_skip") {
    canSkipYes.checked = value === "Y";
    canSkipNo.checked = value === "N";
    if (value === null) {
      canSkipYes.checked = false;
      canSkipNo.checked = false;
    }
  } else if (name === "full_screen") {
    fullScreenYes.checked = value === "Y";
    fullScreenNo.checked = value === "N";
  } else if (name === "disable_right_click") {
    disableRightClickYes.checked = value === "Y";
    disableRightClickNo.checked = value === "N";
  } else if (name === "is_default") {
    isDefaultYes.checked = value === "Y";
    isDefaultNo.checked = value === "N";
  }
}

function showResult(data) {
  try {
    fetchingDataSection.style.display = "none";
    if (data.length === 0) {
      fetchingDataSection.innerHTML = "<p>There is no data</p>";
      fetchingDataSection.style.display = "block";
      resultDiv.style.display = "none";
      hideOverlay();
      return;
    }

    let tableData = {
      tableHeader: [
        [
          new TableStructure("#"),
          new TableStructure("UI Template Name"),
          new TableStructure("Default Template"),
          new TableStructure("Action"),
        ],
      ],
      tableBody: [],
    };

    data.forEach((sub, index) => {
      tableData.tableBody.push([
        new TableStructure(index + 1),
        new TableStructure(sub.template_name),
        new TableStructure(sub.is_default === "Y" ? "Default" : ""),
        new TableStructure(createEditButton(sub)),
      ]);
    });

    displayResult(tableData, resultTable);
    resultDiv.style.display = "block";

    $("#result_table").on("click", ".edit-button", (event) => {
      modelLabel.innerHTML = "Update Template";
      let $button = $(event.currentTarget);
      data = JSON.parse(decodeURIComponent($button.attr("data-full")));

      templateId = data.template_id;

      templateName.value = data.template_name;
      totalDuration.value = data.total_duration_mins;
      showTimer.value = data.show_timer;

      setRadioValue("question_layout", data.question_layout);
      questionsPerPage.value = data.questions_per_page;
      setRadioValue("can_review", data.can_review);
      setRadioValue("can_skip", data.can_skip);
      setRadioValue("full_screen", data.full_screen);
      setRadioValue("disable_right_click", data.disable_right_click);
      setRadioValue("is_default", data.is_default);

      form.classList.remove("was-validated");

      $("#modal").modal("show");
    });
    hideOverlay();
  } catch (error) {
    alert("An error occurred while displaying the report: " + error.message);
  }
}

function getUiTemplateEditData(template) {}

function resetForm() {
  form.reset();
  form.classList.remove("was-validated");

  templateId = null;
  questionLayoutYes.checked = false;
  questionLayoutNo.checked = true;
  canReviewYes.checked = false;
  canReviewNo.checked = false;
  canSkipYes.checked = false;
  canSkipNo.checked = false;
  canReviewYes.disabled = true;
  canReviewNo.disabled = true;
  canSkipYes.disabled = true;
  canSkipNo.disabled = true;
}

async function getUiTemplate() {
  try {
    let payload = JSON.stringify({
      function: "guit",
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      let templates = response.result.template;
      allTemplates = templates;
      showResult(templates);
    } else {
      alert(
        "An error occurred while fetching UI Templates: " + response.message
      );
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching data: " + error.message);
  }
}

function checkExistingDefaultTemplate() {
  return allTemplates.find(
    (template) =>
      template.is_default === "Y" && template.template_id !== templateId
  );
}

async function managUiTemplate() {
  form.classList.add("was-validated");
  if (!form.checkValidity()) {
    return;
  }

  try {
    const questionLayoutValue = getRadioValue("question_layout");
    const isDefaultValue = getRadioValue("is_default");

    let existingDefaultTemplateId = null;

    if (isDefaultValue === "Y") {
      const existingDefault = checkExistingDefaultTemplate();

      if (existingDefault) {
        const result = await Swal.fire({
          title: "Default Template Already Exists",
          html: `
                        <p>
                            <strong>${existingDefault.template_name}</strong> is currently set as the default template.
                        </p>
                        <p>
                            If you continue, <strong>${existingDefault.template_name}</strong> will no longer be the default,
                            and the template you are currently editing will be set as the new default template.
                        </p>
                        <p>
                            Click <b>Yes, Update</b> to confirm this change, or <b>Cancel</b> to keep the current default template.
                        </p>
                    `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, Update",
          cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        existingDefaultTemplateId = existingDefault.template_id;
      }
    }

    const payload = {
      function: "uuit",
      staff_id: loggedInUser.staff_id,
      org_id: loggedInUser.college_code,
      template_name: templateName.value.trim(),
      total_duration_mins: Number(totalDuration.value),
      show_timer: showTimer.value,
      question_layout: questionLayoutValue,
      can_review:
        questionLayoutValue === "N" ? null : getRadioValue("can_review"),
      questions_per_page: questionsPerPage.value,
      can_skip: questionLayoutValue === "N" ? null : getRadioValue("can_skip"),
      full_screen: getRadioValue("full_screen"),
      disable_right_click: getRadioValue("disable_right_click"),
      is_default: isDefaultValue,
    };

    if (templateId !== null) {
      payload.template_id = templateId;
    }

    if (existingDefaultTemplateId) {
      payload.existing_default_template_id = existingDefaultTemplateId;
    }

    let response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify(payload)
    );

    if (response.success) {
      await Swal.fire({
        title: "Success!",
        text: response.message,
        icon: "success",
      });

      if (templateId !== null) {
        allTemplates.forEach((template) => {
          if (template.template_id == templateId) {
            template.template_name = templateName.value.trim();
            template.is_default = isDefaultValue;
            template.total_duration_mins = Number(totalDuration.value);
            template.show_timer = showTimer.value;
            template.question_layout = questionLayoutValue;
            template.questions_per_page = questionsPerPage.value;
            template.full_screen = getRadioValue("full_screen");
            template.disable_right_click = getRadioValue("disable_right_click");
            template.can_review =
              questionLayoutValue === "N" ? null : getRadioValue("can_review");
            template.can_skip =
              questionLayoutValue === "N" ? null : getRadioValue("can_skip");
          }
        });
      } else {
        templateId = response.result.template_id;
        allTemplates.push({
          template_id: templateId,
          org_id: loggedInUser.college_code,
          template_name: templateName.value.trim(),
          total_duration_mins: Number(totalDuration.value),
          show_timer: showTimer.value,
          question_layout: questionLayoutValue,
          can_review:
            questionLayoutValue === "N" ? null : getRadioValue("can_review"),
          questions_per_page: questionsPerPage.value,
          can_skip:
            questionLayoutValue === "N" ? null : getRadioValue("can_skip"),
          full_screen: getRadioValue("full_screen"),
          disable_right_click: getRadioValue("disable_right_click"),
          is_default: isDefaultValue,
        });
      }

      allTemplates.forEach((template) => {
        if (isDefaultValue == "Y" && template.template_id != templateId) {
          template.is_default = "N";
        }
      });
      showResult(allTemplates);
      $("#modal").modal("hide");
    }
  } catch (error) {
    console.error(error);
    await Swal.fire({
      title: "Error!",
      text: error.message,
      icon: "error",
    });
  }
}

async function init() {
  await getUiTemplate();
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

function initializePage() {
  init();
}
