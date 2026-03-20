import Autocomplete from "https://cdn.jsdelivr.net/gh/lekoala/bootstrap5-autocomplete@master/autocomplete.js";

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

// Add table support to Turndown
turndownService.addRule("table", {
  filter: "table",
  replacement: function (content, node) {
    const rows = Array.from(node.querySelectorAll("tr"));
    if (rows.length === 0) return "";

    let markdown = "\n";
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll("th, td"));
      markdown +=
        "| " +
        cells.map((cell) => cell.textContent.trim()).join(" | ") +
        " |\n";

      if (rowIndex === 0) {
        markdown += "| " + cells.map(() => "---").join(" | ") + " |\n";
      }
    });

    return markdown + "\n";
  },
});

// Keep images as-is in markdown
turndownService.addRule("images", {
  filter: "img",
  replacement: function (content, node) {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    return "![" + alt + "](" + src + ")";
  },
});

let examCategory = {
  NEET: ["UG", "PG"],
  JEE: ["Main", "Advanced"],
};

const levelDropDown = document.getElementById("level");
const subject = document.getElementById("subject");

const fileInput = document.getElementById("file_input");
const fileUplaodButton = document.getElementById("network_button");
const saveQuestionsButton = document.getElementById("save_question");
const fetchingData = document.getElementById("fetching_data");
const resultDiv = document.getElementById("result_div");
const resultTable = document.getElementById("result_table");
const optionRow = document.getElementById("option_row");
const answerGroup = document.getElementById("answer_group");
const crtOptionColumn = document.getElementById("correct_option_group");
const statusDiv = document.getElementById("status_div");
const statusTable = document.getElementById("status_table");

let questionForm = document.getElementById("question_form");
let questionInput = document.getElementById("question");
let optionAInput = document.getElementById("option_a");
let optionBInput = document.getElementById("option_b");
let optionCInput = document.getElementById("option_c");
let optionDInput = document.getElementById("option_d");
let optionEInput = document.getElementById("option_e");
let answerInput = document.getElementById("answer");
let btlLevelDropDown = document.getElementById("btl_level");

let filterBtl = document.getElementById("filter_btl");
let filterSection = document.getElementById("filter_section");
let filterTopic = document.getElementById("filter_topic");
let btlDiv = document.getElementById("btl_div");
let sectionDiv = document.getElementById("section_div");
let topicDiv = document.getElementById("topic_div");
let pageType = document.getElementById("page_type");
let pageTypeDiv = document.getElementById("page_type_div");
let fileInputDiv = document.getElementById("file_input_div");
let levelDiv = document.getElementById("level_div");

let cancelButton = document.getElementById("cancel_button");

let onlyQuestionsRadio = document.getElementById("only_questions");
let questionsAndQPRadio = document.getElementById("questions_and_qp");

let qpPreviousYearRadio = document.getElementById("qp_previous_year");
let qpCustomRadio = document.getElementById("qp_custom");

let uploadTypeRow = document.getElementById("upload_type_row");
let uploadTypeDiv = document.getElementById("upload_type_div");
let filterDiv = document.getElementById("filter_div");
let subjectDiv = document.getElementById("subject_div");
let pageTypeRow = document.getElementById("page_type_row");
let categoryDiv = document.getElementById("category_div");
let category = document.getElementById("category");
let examMonthDiv = document.getElementById("exam_month_div");
let examMonth = document.getElementById("exam_month");
let examYearDiv = document.getElementById("exam_year_div");
let examYear = document.getElementById("exam_year");
let nameInputDiv = document.getElementById("name_input_div");
let qpName = document.getElementById("qp_name");

let correctOptionDropDown = document.getElementById("correct_option");
let saveButton = document.getElementById("form_submit");
let title = document.getElementById("title");
var type = null;
let selectedSection = null;
let selectedTopic = null;
let qpType = "Mcq";

// event listener
questionsAndQPRadio.addEventListener("change", () => {
  changeUploadType();
});
onlyQuestionsRadio.addEventListener("change", () => {
  changeUploadType();
});
qpPreviousYearRadio.addEventListener("change", () => {
  changeQpType();
});
qpCustomRadio.addEventListener("change", () => {
  changeQpType();
});

levelDropDown.addEventListener("change", () => {
  resultDiv.style.display = "none";
  fileUplaodButton.style.display = "block";
  if (type === "generate") {
    setSubjects();
  } else {
    setSubjects();
    renderCategoryOptions();
    renderExamMonth();
    renderExamYear();
  }
});

fileInput.addEventListener("click", () => {
  resultDiv.style.display = "none";
  fileUplaodButton.style.display = "block";
  fileInput.value = "";
});

subject.addEventListener("input", () => {
  resultDiv.style.display = "none";
  fileUplaodButton.style.display = "block";
});

filterSection.addEventListener("input", () => {
  resultDiv.style.display = "none";
  fileUplaodButton.style.display = "block";
});
filterTopic.addEventListener("input", () => {
  resultDiv.style.display = "none";
  fileUplaodButton.style.display = "block";
});
filterBtl.addEventListener("change", () => {
  resultDiv.style.display = "none";
  fileUplaodButton.style.display = "block";
});
cancelButton.addEventListener("click", async () => {
  await deleteScannedData();
});

pageType.addEventListener("change", () => {
  if (pageType.value === "Using Sample Question Paper") {
    topicDiv.style.display = "none";
    sectionDiv.style.display = "none";
    btlDiv.style.display = "none";
    fileInputDiv.style.display = "block";
    fileUplaodButton.value = "Generate Questions";
  } else {
    topicDiv.style.display = "block";
    sectionDiv.style.display = "block";
    btlDiv.style.display = "block";
    fileInputDiv.style.display = "none";
    fileUplaodButton.value = "Generate Questions";
  }
});

fileUplaodButton.addEventListener("click", async () => {
  if (pageType.value === "Using Sample Question Paper") {
    if (subject.value.trim() == "") {
      alert("Please select a subject before uploading the question.");
      return;
    }
    if (!fileInput.files || fileInput.files.length == 0) {
      alert("Please upload a file!.");
      return;
    }
  } else {
    let matchedSubject = subjects.find(
      (s) => s.subject == subject.value && s.level == levelDropDown.value,
    );
    if (!matchedSubject) {
      alert("Please select a valid subject.");
      return;
    }
    let sectionName = filterSection.value;
    let matchedSection = sections.find(
      (s) => s.section == sectionName && s.subject_id == matchedSubject.id,
    );
    if (!matchedSection) {
      alert("Please select a valid section.");
      return;
    }
    let topicName = filterTopic.value;
    let matchedTopic = topics.find(
      (t) => t.topic == topicName && t.section_id == matchedSection.id,
    );
    if (!matchedTopic) {
      alert("Please select a valid topic.");
      return;
    }
  }
  await previewQuestions();
});

saveQuestionsButton.addEventListener("click", async () => {
  await submitQuestion();
});

function changeUploadType() {
  if (questionsAndQPRadio.checked) {
    pageTypeRow.style.display = "none";
    uploadTypeDiv.style.display = "block";
    uploadTypeRow.style.display = "block";
  } else if (onlyQuestionsRadio.checked) {
    uploadTypeDiv.style.display = "none";
    uploadTypeRow.style.display = "block";
    subjectDiv.style.display = "block";
    pageTypeRow.style.display = "flex";
    nameInputDiv.style.display = "none";
    nameInputDiv.value = "";
  }
  qpPreviousYearRadio.checked = false;
  qpCustomRadio.checked = false;
  filterDiv.style.display = "block";
}

function changeQpType() {
  if (qpPreviousYearRadio.checked) {
    categoryDiv.style.display = "block";
    examMonthDiv.style.display = "block";
    examYearDiv.style.display = "block";
    nameInputDiv.style.display = "none";
    nameInputDiv.value = "";
  } else if (qpCustomRadio.checked) {
    categoryDiv.style.display = "none";
    examMonthDiv.style.display = "none";
    examYearDiv.style.display = "none";
    nameInputDiv.style.display = "block";
  }
  subjectDiv.style.display = "block";
  pageTypeRow.style.display = "flex";
}

function renderCategoryOptions() {
  let level = levelDropDown.value;
  category.innerHTML = `<option value="" disabled selected>Select Category</option>`;
  if (examCategory[level]) {
    examCategory[level].forEach((categoryName) => {
      let option = document.createElement("option");
      option.value = categoryName;
      option.textContent = categoryName;
      category.appendChild(option);
    });
  }
  let option = document.createElement("option");
  option.value = "Other";
  option.textContent = "Other";
  category.appendChild(option);
}

function renderExamMonth() {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  examMonth.innerHTML = `<option value="" disabled selected>Select Month</option>`;
  monthNames.forEach((month, index) => {
    let option = document.createElement("option");
    option.value = index + 1;
    option.textContent = month;
    examMonth.appendChild(option);
  });
}

function renderExamYear() {
  let currentYear = new Date().getFullYear();
  examYear.innerHTML = `<option value="" disabled selected>Select Year</option>`;
  for (let i = 0; i < 20; i++) {
    let option = document.createElement("option");
    option.value = currentYear - i;
    option.textContent = currentYear - i;
    examYear.appendChild(option);
  }
}

async function initializeTinyMCE() {
  tinymce.init({
    selector: "#question",
    license_key: "gpl",
    branding: false,
    promotion: false,
    height: 300,
    plugins: "image table",
    toolbar: "undo redo | table image",
    menubar: "edit insert format table",
    menu: {
      format: {
        title: "Format",
        items: [
          "superscript subscript",
          "|",
          "formats",
          "blocks",
          "fontformats",
          "fontsizes",
          "|",
          "align",
          "lineheight",
          "|",
          "forecolor backcolor",
          "|",
          "removeformat",
        ].join(" "),
      },
    },
    image_dimensions: false,
    image_advtab: false,
    image_title: false,
    object_resizing: "img",
    images_upload_handler: function (blobInfo) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject("Image upload failed");
        reader.readAsDataURL(blobInfo.blob());
      });
    },
  });
}

let subjects = [];
let sectionTopics = [];
let btlLevel = [];
let questions = [];
let questionsFormat = [];
let scanId = "";
var sections = null;
var topics = null;

function setAutoComplete(field, data) {
  try {
    let nextSibling = field.nextElementSibling;
    while (nextSibling) {
      let toRemove = nextSibling;
      nextSibling = nextSibling.nextElementSibling;
      toRemove.remove();
    }

    new Autocomplete(field, {
      items: data,
      valueField: "id",
      labelField: "title",
      highlightTyped: true,
      suggestionsThreshold: 0,
      onSelectItem: ({ label, value }) => {
        field.value = label;
        if (field.id.includes("subject_input_")) {
          let index = field.id.split("_")[2];
          setSection(index, label);
        }
        if (field.id.includes("section_input_")) {
          let index = field.id.split("_")[2];
          setTopic(index, label);
        }
        if (field.id == "subject") {
          setFilterSection();
        }
        if (field.id == "filter_section") {
          setFilterTopic();
        }
      },
    });
  } catch (err) {
    console.error("Autocomplete Error:", err);
    alert("An error occurred while setting up autocomplete.");
    hideOverlay();
  }
}

async function checkExistingScan() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "cqss",
      org_id: loggedInUser.org_id,
      user_id: loggedInUser.user_id,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      let status = response.result.status;
      handleExistingScan(status);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while checking scan details");
    hideOverlay();
  }
}

function handleExistingScan(data) {
  if (data) {
    uploadTypeRow.style.display = "none";
    let button = "";
    if (data.type == "Mcq" && type == "upload") {
      if (data.status == "Completed") {
        button = createButton(
          data.id,
          "",
          "view-button",
          "View Scanned Questions",
          true,
        );
      } else {
        button = createButton(
          data.id,
          "",
          "reload-button",
          "Check Status",
          true,
        );
      }
    } else if (
      (data.type == "GeneratedWithQp" || data.type == "GeneratedWithTopic") &&
      type == "generate"
    ) {
      if (data.status == "Completed") {
        button = createButton(
          data.id,
          "",
          "view-button",
          "View Scanned Questions",
          true,
        );
      } else {
        button = createButton(
          data.id,
          "",
          "reload-button",
          "Check Status",
          true,
        );
      }
    } else if (type == "QpGen") {
      button = "There is a pending scan in Question Paper Generator";
    } else if (data.type == "Mcq") {
      button = "There is a pending scan in MCQ Question Upload";
    } else if (
      data.type == "GeneratedWithQp" ||
      data.type == "GeneratedWithTopic"
    ) {
      button = "There is a pending scan in MCQ Question Generate";
    }
    const tableData = {
      tableHeader: [
        [
          new TableStructure("Subject"),
          new TableStructure("Scan Date Time"),
          new TableStructure("Status"),
          new TableStructure("Action"),
        ],
      ],
      tableBody: [
        [
          new TableStructure(data.subject),
          new TableStructure(data.scan_time),
          new TableStructure(data.status),
          new TableStructure(button),
        ],
      ],
    };
    displayResult(tableData, statusTable);
    statusDiv.style.display = "block";

    $("#status_table").off("click", ".view-button");
    $("#status_table").on("click", ".view-button", async (event) => {
      showOverlay();
      scanId = JSON.parse(
        decodeURIComponent(event.currentTarget.getAttribute("data-full")),
      );

      let retryResponse = await getScannedQuestions(scanId);

      if (retryResponse.message === "Completed") {
        questions = retryResponse.result.data.questions;
        questions = questions.filter(
          (q) => q.question_type == "Mcq" || q.question_type == "Numerical",
        );

        if (retryResponse.result.type == "Mcq") {
          if (typeof retryResponse.result.data.subject == "string") {
            sectionTopics = JSON.parse(retryResponse.result.data.subject);
          } else {
            sectionTopics = retryResponse.result.data.subject;
          }
        } else {
          sectionTopics = retryResponse.result.data.section_topic;
          let selectedSubject = subjects.find(
            (s) => s.id == retryResponse.result.data.subject_id,
          );
          if (selectedSubject) {
            subject.value = selectedSubject.subject;
            levelDropDown.value = selectedSubject.level;
          }
        }

        if (retryResponse.result.type == "GeneratedWithTopic") {
          changePageType();
        }

        let event = new Event("change");
        onlyQuestionsRadio.checked =
          retryResponse.result.data.only_questions == 1;
        questionsAndQPRadio.checked =
          retryResponse.result.data.also_generate_qp == 1;
        onlyQuestionsRadio.dispatchEvent(event);
        qpPreviousYearRadio.checked =
          retryResponse.result.data.previous_year_qp == 1;
        qpCustomRadio.checked = retryResponse.result.data.custom_qp == 1;
        qpPreviousYearRadio.dispatchEvent(event);
        qpType = retryResponse.result.type;
        levelDropDown.value = retryResponse.result.data.level;
        if (retryResponse.result.data.category) {
          renderCategoryOptions();
          renderExamMonth();
          renderExamYear();
          category.value = retryResponse.result.data.category;
          examMonth.value = retryResponse.result.data.exam_month;
          examYear.value = retryResponse.result.data.exam_year;
        }

        if (retryResponse.result.data.subject_id) {
          let selectedSubject = subjects.find(
            (s) => s.id == retryResponse.result.data.subject_id,
          );
          if (selectedSubject) {
            subject.value = selectedSubject.subject;
            levelDropDown.value = selectedSubject.level;
          }
        } else {
          subject.value = "All Subjects";
        }

        qpName.value = retryResponse.result.data.qp_name;
        await showReportSection(questions);
        return;
      }

      if (
        retryResponse.message != "Processing" &&
        retryResponse.message != "Completed"
      ) {
        alert(retryResponse.message);
        await checkExistingScan();
        hideOverlay();
        return;
      }
    });
    $("#status_table").off("click", ".reload-button");
    $("#status_table").on("click", ".reload-button", async (event) => {
      showOverlay();
      checkExistingScan();
    });

    hideOverlay();
    return;
  }

  hideOverlay();
  if (type == "generate") {
    filterDiv.style.display = "block";
  } else {
    uploadTypeRow.style.display = "block";
  }

  statusDiv.style.display = "none";
}

function changePageType() {
  pageType.value = "By Topic";
  var event = new Event("change");
  pageType.dispatchEvent(event);
  subject.value = questions[0].subject;
  filterSection.value = questions[0].section;
  filterTopic.value = questions[0].topic;
  filterBtl.value = questions[0].btl_level;
  fileUplaodButton.style.display = "none";
}

async function getSubjects() {
  try {
    showOverlay();
    if (
      sessionStorage.getItem("subjects") &&
      sessionStorage.getItem("subjects") != "undefined" &&
      sessionStorage.getItem("sections") &&
      sessionStorage.getItem("sections") != "undefined" &&
      sessionStorage.getItem("topics") &&
      sessionStorage.getItem("topics") != "undefined"
    ) {
      let subjectMap = JSON.parse(sessionStorage.getItem("subjects"));
      subjects = subjectMap;
      let sectionMap = JSON.parse(sessionStorage.getItem("sections"));
      sections = sectionMap;
      let topicMap = JSON.parse(sessionStorage.getItem("topics"));
      topics = topicMap;
      selLevel();
      hideOverlay();
      return;
    }
    let payload = JSON.stringify({
      function: "gsst",
      org_id: loggedInUser.org_id,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      subjects = response.result.subjects;
      sections = response.result.sections;
      topics = response.result.topics;
      subjects.sort((a, b) => a.subject.localeCompare(b.subjects));
      sessionStorage.setItem("subjects", JSON.stringify(subjects));
      sessionStorage.setItem("sections", JSON.stringify(sections));
      sessionStorage.setItem("topics", JSON.stringify(topics));
      selLevel();
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching subjects");
  }
}

function selLevel() {
  let levels = [];

  levelDropDown.innerHTML =
    "<option value='' disabled selected>Select Level</option>";

  subjects.forEach((s) => {
    if (!levels.includes(s.level)) {
      let option = document.createElement("option");
      option.value = s.level;
      option.text = s.level;
      levelDropDown.appendChild(option);
      levels.push(s.level);
    }
  });
  subject.value = "Choose a Level";
  subject.disabled = true;
  setFilterBtl();
}

function setFilterBtl() {
  filterBtl.innerHTML = btlLevel
    .map(
      (level) => `<option value="${level.level}" >${level.level_name}</option>`,
    )
    .join("");
}

function setSubjects() {
  subject.value = "";
  let level = levelDropDown.value;
  let subjectNames = [];
  subjects.forEach((s) => {
    if (s.level == level) {
      subjectNames.push(s.subject);
    }
  });

  if (type === "upload") {
    subjectNames.unshift("All Subjects");
  }

  setAutoComplete(subject, subjectNames);
  subject.disabled = false;
  filterSection.value = "";
  filterTopic.value = "";
  removeAutoComplete(filterSection);
  removeAutoComplete(filterTopic);

  filterSection.innerHTML = "";
  filterTopic.innerHTML = "";
}

function removeAutoComplete(field) {
  let nextSibling = field.nextElementSibling;
  while (nextSibling) {
    if (nextSibling.classList.contains("autocomplete-menu")) {
      nextSibling.remove();
      break;
    }
    nextSibling = nextSibling.nextElementSibling;
  }
}

function setFilterSection() {
  let level = levelDropDown.value;
  let subjectName = subject.value;
  let matchedSubject = subjects.find(
    (s) => s.subject == subjectName && s.level == level,
  );
  if (matchedSubject) {
    let sectionsValues = [];
    sections.forEach((s) => {
      if (s.subject_id == matchedSubject.id) {
        sectionsValues.push(s.section);
      }
    });
    setAutoComplete(filterSection, sectionsValues);
    filterSection.disabled = false;
  }
}

function setFilterTopic() {
  let level = levelDropDown.value;
  let subjectName = subject.value;
  let matchedSubject = subjects.find(
    (s) => s.subject == subjectName && s.level == level,
  );
  let sectionName = filterSection.value;
  let matchedSection = sections.find(
    (s) => s.section == sectionName && s.subject_id == matchedSubject.id,
  );
  if (matchedSubject && matchedSection) {
    let topicsValues = [];
    topics.forEach((t) => {
      if (t.section_id == matchedSection.id) {
        topicsValues.push(t.topic);
      }
    });
    setAutoComplete(filterTopic, topicsValues);
    filterTopic.disabled = false;
  }
}
async function previewQuestions() {
  try {
    showOverlay();
    let matchedSubject;
    let level = levelDropDown.value;
    let subjectName = document.getElementById("subject").value;
    if (subjectName.trim() == "") {
      alert("Please select a subject.");
      hideOverlay();
      return;
    }

    matchedSubject = subjects.find(
      (s) => s.subject == subjectName && s.level == level,
    );

    if (!matchedSubject && subjectName != "All Subjects") {
      alert("Please select a valid subject.");
      hideOverlay();
      return;
    }

    let qpType = "Mcq";

    if (type == "generate" && pageType.value == "Using Sample Question Paper") {
      qpType = "GeneratedWithQp";
    } else if (type == "generate" && pageType.value == "By Topic") {
      qpType = "GeneratedWithTopic";
    }

    let out = {
      org_id: loggedInUser.org_id,
      created_by: loggedInUser.user_id,
      level: level,
      type: qpType,
      generate_using_ai: type === "generate" ? 1 : 0,
      only_questions: onlyQuestionsRadio.checked ? 1 : 0,
      also_generate_qp: questionsAndQPRadio.checked ? 1 : 0,
      previous_year_qp: qpPreviousYearRadio.checked ? 1 : 0,
      custom_qp: qpCustomRadio.checked ? 1 : 0,
      name: qpName.value || null,
      exam_month: examMonth.value || null,
      exam_year: examYear.value || null,
      category: category.value || null,
      qp_name: qpName.value || null,
    };

    if (
      questionsAndQPRadio.checked &&
      qpCustomRadio.checked &&
      (!qpName.value.trim() || qpName.value.trim() == "")
    ) {
      alert("Please enter a valid name for the question paper.");
      hideOverlay();
      return;
    }

    if (subjectName != "All Subjects") {
      out.subject_id = matchedSubject.id;
    } else {
      out.subject_id = null;
    }

    if (pageType.value === "Using Sample Question Paper") {
      let file = fileInput.files[0];
      const base64 = await convertToBase64(file);
      out.function = "ecg";
      out.filedata = base64;
    } else {
      let sectionName = filterSection.value;
      let matchedSection = sections.find(
        (s) => s.section == sectionName && s.subject_id == matchedSubject.id,
      );
      if (!matchedSection) {
        alert("Please select a valid section.");
        hideOverlay();
        return;
      }

      let topicName = filterTopic.value;
      let matchedTopic = topics.find(
        (t) => t.topic == topicName && t.section_id == matchedSection.id,
      );
      if (!matchedTopic) {
        alert("Please select a valid topic.");
        hideOverlay();
        return;
      }
      out.subject = matchedSubject.subject;
      out.section = matchedSection.section;
      out.topic = matchedTopic.topic;
      out.btl_level = filterBtl.value;
      out.filedata = null;
      out.function = "ecg";
    }

    const payload = JSON.stringify(out);

    let response = await postCall(QuestionUploadEndPoint, payload);

    let retryCount = 0;
    let maxRetries = 10;
    scanId = response.result.id;

    while (retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 10000));

      let retryResponse = await getScannedQuestions(response.result.id);

      if (retryResponse.message === "Completed") {
        questions = retryResponse.result.data.questions;
        questions = questions.filter(
          (q) => q.question_type == "Mcq" || q.question_type == "Numerical",
        );

        if (retryResponse.result.type == "Mcq") {
          sectionTopics = JSON.parse(retryResponse.result.data.subject);
        } else {
          sectionTopics = retryResponse.result.data.section_topic;
        }
        if (retryResponse.result.type == "GeneratedWithTopic") {
          changePageType();
        }
        let event = new Event("change");
        onlyQuestionsRadio.checked =
          retryResponse.result.data.only_questions == 1;
        questionsAndQPRadio.checked =
          retryResponse.result.data.also_generate_qp == 1;
        onlyQuestionsRadio.dispatchEvent(event);
        qpPreviousYearRadio.checked =
          retryResponse.result.data.previous_year_qp == 1;
        qpCustomRadio.checked = retryResponse.result.data.custom_qp == 1;
        qpPreviousYearRadio.dispatchEvent(event);
        qpType = retryResponse.result.type;
        levelDropDown.value = retryResponse.result.data.level;
        qpName.value = retryResponse.result.data.qp_name;

        if (retryResponse.result.data.subject_id) {
          let selectedSubject = subjects.find(
            (s) => s.id == retryResponse.result.data.subject_id,
          );
          if (selectedSubject) {
            subject.value = selectedSubject.subject;
            levelDropDown.value = selectedSubject.level;
          }
        } else {
          subject.value = "All Subjects";
        }

        await showReportSection(questions);
        return;
      }

      if (
        retryResponse.message != "Processing" &&
        retryResponse.message != "Completed"
      ) {
        alert(retryResponse.message);
        hideOverlay();
        return;
      }
      retryCount++;
    }
    if (retryCount === maxRetries) {
      alert("Processing is taking longer than expected. Please wait.");
      filterDiv.style.display = "none";
      checkExistingScan();
    }
  } catch (error) {
    console.error("previewQuestions Error:", error);
    alert("Error processing PDF.");
  }
}

async function getScannedQuestions(id) {
  let getScannedDataPayload = JSON.stringify({
    function: "gstd",
    id: id,
  });

  return await postCall(QuestionUploadEndPoint, getScannedDataPayload);
}

async function showReportSection(data) {
  fetchingData.style.display = "none";
  if (data.length === 0) {
    fetchingData.innerHTML = "<p>There is no data</p>";
    fetchingData.style.display = "block";
    resultDiv.style.display = "none";
    hideOverlay();
    return;
  }

  const tableData = {
    tableHeader: [
      [
        new TableStructure("S.No", "", "", "width: 5%;"),
        new TableStructure("Question & Choices", "", "", "width: 28%;"),
        new TableStructure("Subject", "", "", "min-width: 200px"),
        new TableStructure("Section", "", "", "min-width: 200px"),
        new TableStructure("Topic", "", "", "min-width: 200px;"),
        new TableStructure("BTL", "", "", "min-width: 100px;"),
        new TableStructure("Mark", "", "", "width: 10%;"),
        new TableStructure("Action", 2, "", "width: 1%;"),
      ],
    ],
    tableBody: [],
  };

  questionsFormat = [];
  data.forEach((record, index) => {
    const choices = record.choices || {};

    // Convert question markdown to HTML for display
    let questionText = record.question;
    if (typeof showdown !== "undefined") {
      const converter = new showdown.Converter();
      questionText = converter.makeHtml(record.question);
    }

    let questionHTML = `<div class="latex" style="font-size: 125%; font-family: 'Times New Roman', Times, serif; text-align: left; margin-bottom: 10px;">${questionText}</div>`;

    if (record.images && record.images.length > 0) {
      record.images.forEach((imgObj) => {
        if (imgObj.image_base64) {
          questionHTML += `
        <div style="text-align: center; margin: 10px 0;">
          <img src="${imgObj.image_base64}" 
               alt="Question Image" 
               style="max-width: 300px; border: 1px solid #ccc; border-radius: 8px;         padding: 5px;" />
        </div>`;
        }
      });
    }

    if (record.table) {
      questionHTML += renderTableFromMarkdown(record.table);
    }
    let editButton = createButton(
      {
        question: record,
        index: index,
      },
      "",
      "edit-button",
      "fas fa-pencil-alt",
    );
    let deleteButton = createButton(
      {
        question: record,
        index: index,
      },
      "",
      "delete-button btn-danger",
      "fas fa-trash-alt",
    );
    let choiceHTML = "";
    const marksFieldId = `marks_input_${index}`;
    const marksField = `
        <input 
          type="number" 
          id="${marksFieldId}" 
          class="form-control marks-field" 
          value="${record.marks}" 
          min="1" 
          style="min-width: 200px"
        />`;

    let subjectField = `
         <input type="text" 
          id="subject_input_${index}" class="form-control subject-field" 
          name = "subjects"
          value="${record.subject || ""}" 
          data-index="${index}" 
          style="min-width: 200px"
      />`;

    let sectionField = `
         <input type="text" 
          id="section_input_${index}" class="form-control section-field" 
          name = "sections"
          value="${record.section || ""}" 
          data-index="${index}" 
          style="min-width: 200px"
      />`;

    let topicField = `
         <input type="text" 
         id="topic_input_${index}" 
         class="form-control topic-field" 
         name = "topics"
         value="${record.topic || ""}" 
         data-index="${index}" 
         style="min-width: 200px"
      />`;

    let btlField = `
         <select id="btl_input_${index}"
         style="min-width: 100px" class="form-control btl-field" 
         data-index="${index}">${btlLevel
           .map(
             (level) =>
               `<option value="${level.level}" ${
                 record.btl_level == level.level_name ||
                 record.btl_level == level.level
                   ? "selected"
                   : ""
               }>${level.level_name}</option>`,
           )
           .join("")}</select>`;

    if (record.question_type == "Numerical") {
      const answerId = `numerical_answer_${index}`;
      choiceHTML = `
                <div style="
                  margin-top: 10px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  max-width: 400px;
                ">
                  <label for="${answerId}" style="font-weight: bold; white-space: nowrap;">
                    Answer is 
                  </label>
                  <input 
                    type="number"
                    id="${answerId}"
                    class="form-control numerical-answer"
                    value="${record.correct_answer || ""}"
                    data-index="${index}"
                    style="max-width: 200px;"
                  />
                </div>`;
    }

    if (record.question_type == "Mcq") {
      choiceHTML = `<div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: left; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;

      for (let key in choices) {
        const inputId = `answer_${index}_${key}`;
        const isChecked = record.correct_answer == key ? "checked" : "";

        // Convert choice markdown to HTML for display
        let choiceText = choices[key];
        if (typeof showdown !== "undefined") {
          const converter = new showdown.Converter();
          choiceText = converter.makeHtml(choices[key]);
          if(choiceText !== null){
            choiceText = choiceText.replace(/^<p>|<\/p>$/g, "");
          }
        }

        choiceHTML += `
      <label for="${inputId}" style="display: flex; align-items: left; gap: 5px;">
        <input type="radio" class="mcq_answer" id="${inputId}" name="answer_${index}" value="${key}" ${isChecked} />
        <span class="latex">${choiceText}</span>
      </label>`;
      }
      choiceHTML += `</div>`;
    }

    const questionAndChoicesHTML = questionHTML + choiceHTML;
    let temp = [
      new TableStructure(index + 1),
      new TableStructure(questionAndChoicesHTML),
      new TableStructure(subjectField),
      new TableStructure(sectionField),
      new TableStructure(topicField),
      new TableStructure(btlField),
      new TableStructure(marksField),
      new TableStructure(editButton),
    ];
    if (!questionsAndQPRadio.checked) {
      temp.push(new TableStructure(deleteButton));
    }
    tableData.tableBody.push(temp);

    questionsFormat.push({
      question_no: index + 1,
      question: record.question,
      question_type: record.question_type,
      images: record.images || [],
      table: record.table || null,
      choices: record.choices || null,
      correct_answer: record.correct_answer,
      section: record.section,
      topic: record.topic,
      btl_level: record.btl_level,
      marks: record.marks,
    });
  });

  fileUplaodButton.style.display = "none";
  displayResult(tableData, resultTable);
  resultDiv.style.display = "block";
  statusDiv.style.display = "none";

  $("#result_table")
    .off("click", ".edit-button")
    .on("click", ".edit-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full")),
      );
      editQuestion(fullData);
    });

  $("#result_table")
    .off("click", ".delete-button")
    .on("click", ".delete-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full")),
      );
      deleteQuestion(fullData);
    });

  document.querySelectorAll(".numerical-answer input").forEach((inputField) => {
    inputField.addEventListener("input", function () {
      this.value = this.value
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");
    });
  });

  if (qpType != "Mcq") {
    let sectionData = sectionTopics.map((s) => s.section);
    sectionData = sectionData.sort((a, b) => a.localeCompare(b));

    for (let index = 0; index < questionsFormat.length; index++) {
      let sectionField = document.getElementById(`section_input_${index}`);
      setAutoComplete(sectionField, sectionData);
      const record = questionsFormat[index];
      setTopic(index, record.section || "", false);
      const marksInput = document.getElementById(`marks_input_${index}`);
      if (marksInput) {
        marksInput.addEventListener("change", (e) => {
          questionsFormat[index].marks = parseInt(e.target.value, 10) || 1;
        });
      }

      const choices = record.choices;
      for (let key in choices) {
        const radioId = `answer_${index}_${key}`;
        const radioInput = document.getElementById(radioId);
        if (radioInput) {
          radioInput.addEventListener("change", (e) => {
            questionsFormat[index].correct_answer = e.target.value;
          });
        }
      }
    }
  } else {
    let subjectData = sectionTopics.map((s) => s.subject);
    for (let index = 0; index < questionsFormat.length; index++) {
      let subjectField = document.getElementById(`subject_input_${index}`);
      setAutoComplete(subjectField, subjectData);
      let sectionField = document.getElementById(`section_input_${index}`);
      let matchedSubject = sectionTopics.find(
        (s) => s.subject == subjectField.value,
      );
      let sectionData = matchedSubject
        ? matchedSubject.sections.map((s) => s.section)
        : [];
      setAutoComplete(sectionField, sectionData);

      const record = questionsFormat[index];
      setTopic(index, record.section || "", false);
      const marksInput = document.getElementById(`marks_input_${index}`);
      if (marksInput) {
        marksInput.addEventListener("change", (e) => {
          questionsFormat[index].marks = parseInt(e.target.value, 10) || 1;
        });
      }

      const choices = record.choices;
      for (let key in choices) {
        const radioId = `answer_${index}_${key}`;
        const radioInput = document.getElementById(radioId);
        if (radioInput) {
          radioInput.addEventListener("change", (e) => {
            questionsFormat[index].correct_answer = e.target.value;
          });
        }
      }
    }
  }

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
  hideOverlay();
}

function setSection(index) {
  let sectionField = document.getElementById(`section_input_${index}`);
  let matchedSubject = sectionTopics.find(
    (s) => s.subject == subjectField.value,
  );
  let sectionData = matchedSubject
    ? matchedSubject.sections.map((s) => s.section)
    : [];
  setAutoComplete(sectionField, sectionData);

  const record = questionsFormat[index];
  setTopic(index, record.section || "", false);
}

function setTopic(index, label, clear = true) {
  let topicField = document.getElementById(`topic_input_${index}`);

  if (qpType != "Mcq") {
    let topicData = sectionTopics.find((s) => s.section == label)?.topics || [];

    if (typeof topicData === "string") {
      topicData = JSON.parse(topicData);
    }
    topicData = topicData.sort((a, b) => a.localeCompare(b));
    if (clear) {
      topicField.value = "";
    }
    setAutoComplete(topicField, Array.isArray(topicData) ? topicData : []);
  } else {
    let subjectField = document.getElementById(`subject_input_${index}`);
    let sectionField = document.getElementById(`section_input_${index}`);
    let matchedSubject = sectionTopics.find(
      (s) => s.subject == subjectField.value,
    );
    let matchedSection = matchedSubject?.sections.find(
      (s) => s.section == sectionField.value,
    );
    let topicData = matchedSection ? matchedSection.topics : [];
    if (clear) {
      topicField.value = "";
    }
    setAutoComplete(topicField, Array.isArray(topicData) ? topicData : []);
  }
}

function deleteQuestion(data) {
  let index = data.index;
  questions.splice(index, 1);
  showReportSection(questions);
}

function buildEditorContent(questionData) {
  // Convert question markdown to HTML for editor
  let html = questionData.question || "";

  if (typeof showdown !== "undefined") {
    const converter = new showdown.Converter();
    html = converter.makeHtml(questionData.question || "");
  }

  if (questionData.table) {
    const converter = new showdown.Converter({
      tables: true,
    });
    html += "<br>" + converter.makeHtml(questionData.table);
  }

  if (questionData.images && questionData.images.length > 0) {
    questionData.images.forEach((img) => {
      // Append images at the end of the question content in the editor
      html += `<br><img src="${img.image_base64}" alt="Question Image" style="max-width: 300px; border: 1px solid #ccc; border-radius: 8px; padding: 5px;" />`;
    });
  }

  return html;
}

async function editQuestion(data) {
  let questionData = data.question;
  let index = data.index;

  await initializeTinyMCE();

  const editor = tinymce.get("question");

  if (data.question.question_type == "Numerical") {
    optionRow.style.display = "none";
    answerGroup.style.display = "block";
    crtOptionColumn.style.display = "none";
    optionAInput.removeAttribute("required");
    optionBInput.removeAttribute("required");
    optionCInput.removeAttribute("required");
    optionDInput.removeAttribute("required");
    optionEInput.removeAttribute("required");
    correctOptionDropDown.removeAttribute("required");
    answerInput.setAttribute("required", "required");
    questionInput.value = questionData.question;
    answerInput.value = questionData.correct_answer || "";

    const editorContent = buildEditorContent(questionData);
    // Wait for editor to be fully initialized before setting content
    setTimeout(() => {
      const editor = tinymce.get("question");
      if (editor) {
        editor.setContent(editorContent);
      }
    }, 500);
  } else {
    optionRow.style.display = "flex";
    answerGroup.style.display = "none";
    crtOptionColumn.style.display = "block";
    answerInput.removeAttribute("required");
  }

  if (data.question.question_type == "Mcq") {
    const editorContent = buildEditorContent(questionData);
    // Wait for editor to be fully initialized before setting content
    setTimeout(() => {
      const editor = tinymce.get("question");
      if (editor) {
        editor.setContent(editorContent);
      }
    }, 500);

    questionInput.value = questionData.question;
    answerInput.removeAttribute("required");

    optionAInput.value = questionData.choices.A || "";
    optionBInput.value = questionData.choices.B || "";
    optionCInput.value = questionData.choices.C || "";
    optionDInput.value = questionData.choices.D || "";
    optionEInput.value = questionData.choices.E || "";
  }

  btlLevelDropDown.innerHTML = btlLevel
    .map(
      (level) =>
        `<option value="${level.level}" ${
          questionData.btl_level == level.level_name ? "selected" : ""
        }>${level.level_name}</option>`,
    )
    .join("");

  correctOptionDropDown.value = questionData.correct_answer || "";

  $("#modal")
    .off("click", "#form_submit")
    .on("click", "#form_submit", async (event) => {
      questionForm.classList.add("was-validated");
      if (!questionForm.checkValidity()) {
        return;
      }

      const questionType = questionsFormat[index].question_type;

      questionForm.classList.add("was-validated");
      if (!questionForm.checkValidity()) return;

      const editor = tinymce.get("question");

      if (!editor) {
        alert("Editor not initialized properly. Please try again.");
        return;
      }

      const editorHTML = editor.getContent();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editorHTML;

      let tableMarkdown = null;

      // Extract table and convert to markdown
      const tableEl = tempDiv.querySelector(
        "figure.table table, .mce-item-table table, table",
      );

      if (tableEl) {
        const rawTableHTML = tableEl.outerHTML;

        // Convert table HTML to markdown using turndownService
        tableMarkdown = turndownService.turndown(rawTableHTML);

        // Remove table from question HTML
        const wrapper =
          tableEl.closest("figure.table") ||
          tableEl.closest(".mce-item-table") ||
          tableEl;

        wrapper.remove();
      }

      // Extract images
      const images = [];
      const imgElements = tempDiv.querySelectorAll("img");
      imgElements.forEach((img) => {
        images.push({
          image_base64: img.src,
        });
        img.remove();
      });

      // Convert remaining question content (HTML) to markdown
      let questionMarkdown = turndownService.turndown(tempDiv.innerHTML.trim());

      // Update question content in markdown format
      questionsFormat[index].question = questionMarkdown;
      questionsFormat[index].table = tableMarkdown;
      questionsFormat[index].images = images;

      if (questionType == "Mcq") {
        if (
          correctOptionDropDown.value == "E" &&
          optionEInput.value.trim() == ""
        ) {
          questionForm.classList.remove("was-validated");
          alert(
            "Please provide option E text\nOr select a different correct option",
          );
          return;
        }

        questionsFormat[index].choices.A = optionAInput.value.trim();
        questionsFormat[index].choices.B = optionBInput.value.trim();
        questionsFormat[index].choices.C = optionCInput.value.trim();
        questionsFormat[index].choices.D = optionDInput.value.trim();
        if (
          questionsFormat[index].choices.E ||
          optionEInput.value.trim() != ""
        ) {
          questionsFormat[index].choices.E = optionEInput.value.trim();
        }

        let selectedBtlOption =
          btlLevelDropDown.options[btlLevelDropDown.selectedIndex];
        questionsFormat[index].btl_level = selectedBtlOption
          ? selectedBtlOption.text
          : questionData.btl_level;

        questionsFormat[index].correct_answer =
          correctOptionDropDown.value || questionData.correct_answer;
      } else if (questionType == "Numerical") {
        questionsFormat[index].correct_answer = answerInput.value.trim();
      }

      questions[index] = questionsFormat[index];

      showReportSection(questionsFormat);
      $("#modal").modal("hide");
    });

  $("#modal").modal("show");
}

async function deleteScannedData() {
  showOverlay();
  try {
    const out = {
      function: "dtsd",
      scan_id: scanId,
    };

    let data = await postCall(QuestionUploadEndPoint, JSON.stringify(out));

    if (data.success) {
      resultTable.innerHTML = "";
      fileInput.value = "";
      resultDiv.style.display = "none";
      fileUplaodButton.style.display = "block";
      hideOverlay();
    } else {
      alert("Failed to delete scanned data: " + data.message);
    }
    hideOverlay();
  } catch (error) {
    console.error("Failed to delete scanned data:", error);
    hideOverlay();
  }
}

async function submitQuestion() {
  try {
    showOverlay();
    document.querySelectorAll(".section-field").forEach((input, index) => {
      questionsFormat[index].section = input.value.trim();
    });

    document.querySelectorAll(".topic-field").forEach((input, index) => {
      questionsFormat[index].topic = input.value.trim();
    });

    document.querySelectorAll(".btl-field").forEach((select, index) => {
      const selectedOption = select.options[select.selectedIndex];
      const btlName = selectedOption.value;
      questionsFormat[index].btl_level = btlName;
    });

    document.querySelectorAll(".marks-field").forEach((input, index) => {
      questionsFormat[index].marks = parseInt(input.value.trim(), 10) || 1;
    });

    document.querySelectorAll(".mcq_answer:checked").forEach((radio) => {
      const index = parseInt(radio.name.split("_")[1], 10);
      if (questionsFormat[index].question_type == "Mcq") {
        questionsFormat[index].correct_answer = radio.value;
      }
    });

    document.querySelectorAll(".numerical-answer").forEach((input) => {
      const index = parseInt(input.dataset.index, 10);
      if (questionsFormat[index].question_type == "Numerical") {
        questionsFormat[index].correct_answer = input.value.trim();
        questionsFormat[index].choices = null;
      }
    });

    let subjectId = null;
    let subjectName = document.getElementById("subject").value;

    if (qpType != "Mcq") {
      let matchedSubject = subjects.find((s) => s.subject == subjectName);
      if (!matchedSubject) {
        alert("Please select a valid subject.");
        hideOverlay();
        return;
      }
      subjectId = matchedSubject.id;
    }

    if (subjectName != "All Subjects") {
      let matchedSubject = subjects.find((s) => s.subject == subjectName);
      if (!matchedSubject) {
        alert("Please select a valid subject.");
        hideOverlay();
        return;
      }
      subjectId = matchedSubject.id;
    }

    const out = {
      function: "ss",
      subject_id: subjectId,
      scan_id: scanId,
      created_by: loggedInUser.user_id,
      level: levelDropDown.value,
      save_qp: 0,
      previous_qp: 0,
      name: qpName.value || null,
      subjects: [],
      org_id: loggedInUser.org_id,
    };

    if (questionsAndQPRadio.checked) {
      out.save_qp = 1;
      if (qpPreviousYearRadio.checked) {
        out.previous_qp = 1;
        out.category = category.value || null;
        out.month = examMonth.value || null;
        out.year = examYear.value || null;
        out.name =
          `${levelDropDown.value} -  ${category.value || ""} - ${examMonth.value || ""} - ${examYear.value || ""}`.trim();
      } else {
        if (qpName.value.trim() === "") {
          alert("Please enter a name for the question paper.");
          hideOverlay();
          return;
        }
        out.name = qpName.value.trim();
      }
    }

    for (let index = 0; index < questionsFormat.length; index++) {
      let q = questionsFormat[index];
      let subject = document.getElementById(`subject_input_${index}`);

      if (!subject || subject.value.trim() === "") {
        alert(`Please enter a valid subject for question ${index + 1}`);
        hideOverlay();
        return;
      }

      let subjectObj = out.subjects.find(
        (s) => s.subject === subject.value.trim(),
      );
      if (!subjectObj) {
        subjectObj = {
          subject: subject.value.trim(),
          sections: [],
        };
        out.subjects.push(subjectObj);
      }

      if (!q.section || q.section === "") {
        alert(`Please enter a valid section for question ${index + 1}`);
        hideOverlay();
        return;
      }

      let section = subjectObj.sections.find((s) => s.section === q.section);
      if (!section) {
        section = {
          section: q.section,
          topics: [],
        };
        subjectObj.sections.push(section);
      }

      if (!q.topic || q.topic === "") {
        alert("Please enter a valid topic for question " + (index + 1));
        hideOverlay();
        return;
      }

      let topic = section.topics.find((t) => t.topic === q.topic);
      if (!topic) {
        topic = {
          topic: q.topic,
          questions: [],
        };
        section.topics.push(topic);
      }

      let img = [];
      if (q.images && q.images.length > 0) {
        img = q.images.map((imgObj) => ({
          img_id: imgObj.id || "",
          img_base: imgObj.image_base64 || "",
        }));
      }

      if (q.btl_level == null || q.btl_level == "") {
        alert(
          "Please enter a valid BTL Level for " + (index + 1) + " question",
        );
        hideOverlay();
        return;
      }
      if (q.marks == null || q.marks == "") {
        alert("Please enter a valid mark for " + (index + 1) + " question");
        hideOverlay();
        return;
      }
      let temp = {
        question: q.question,
        img: img,
        correct_answer: q.correct_answer,
        mark: q.marks,
        btl_level: q.btl_level,
        question_type: q.question_type,
        is_ai_generated: type === "generate" ? 1 : null,
      };

      if (q.question_type == "Mcq") {
        temp.choices = q.choices;
      } else if (q.question_type == "Numerical") {
        temp.choices = null;
      }

      if (q.table) {
        temp.table = q.table;
      }

      if (q.correct_answer == null || q.correct_answer == "") {
        if (q.question_type == "Mcq") {
          alert(`Please choose a valid answer for question ${index + 1}`);
        } else if (q.question_type == "Numerical") {
          alert(`Please input a valid answer for question ${index + 1}`);
        }
        hideOverlay();
        return;
      }
      topic.questions.push(temp);
    }

    const response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify(out),
    );

    if (response.success) {
      alert("Questions submitted successfully!");
      resultTable.innerHTML = "";
      fileInput.value = "";
      resultDiv.style.display = "none";
      fileUplaodButton.style.display = "block";
      hideOverlay();
    } else {
      alert(response.message);
      hideOverlay();
    }
    hideOverlay();
  } catch (error) {
    console.error("submitQuestion Error:", error);
    alert("Error submitting questions.");
    hideOverlay();
  }
}

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    showOverlay();
    if (!window.isCheckAuthLoaded) {
      const checkInterval = setInterval(() => {
        if (window.isCheckAuthLoaded) {
          clearInterval(checkInterval);
          init();
        }
      }, 100);
      return;
    } else {
      init();
    }
  }
});

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  type = urlParams.get("type");
  if (type === "generate") {
    title.innerHTML = `MCQ Question Generate`;
    const infoDiv = document.createElement("div");
    infoDiv.className = "info-container mt-2 mb-3";
    infoDiv.innerHTML = `
      AI will generate questions similar to the uploaded question paper. You can edit the generated questions before submitting.<br>
      Questions in Uploaded question paper will not be uploaded.<br>`;
    title.parentNode.insertBefore(infoDiv, title.nextSibling);
    pageTypeDiv.style.display = "block";
    topicDiv.style.display = "none";
    sectionDiv.style.display = "none";
    btlDiv.style.display = "none";
    fileInputDiv.style.display = "block";
    pageTypeRow.style.display = "flex";
    uploadTypeRow.style.display = "none";
    fileUplaodButton.value = "Generate Questions";
  } else {
    title.textContent = "MCQ Question Upload";
    pageTypeDiv.style.display = "none";
  }
  await fetchBtl();
  btlLevel = getBtlLevels();
  await getSubjects();
  await checkExistingScan();
}
