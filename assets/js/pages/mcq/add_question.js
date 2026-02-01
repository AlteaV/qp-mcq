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

// Keep images as-is in markdown (preserve base64)
turndownService.addRule("images", {
  filter: "img",
  replacement: function (content, node) {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    return "![" + alt + "](" + src + ")";
  },
});

async function initializeTinyMCE() {
  tinymce.init({
    selector: "#question_editor",
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

let subjectDropDown = document.getElementById("subject");
var sectionDiv = document.getElementById("section_div");
let sectionDropDown = document.getElementById("section");
var topicDiv = document.getElementById("topic_div");
let topicDropDown = document.getElementById("topic");

let addQuestionBtn = document.getElementById("add_question_btn");

let filterForm = document.getElementById("filter_form");
let questionForm = document.getElementById("question_form");

let questionInput = document.getElementById("question");
let optionAInput = document.getElementById("option_a");
let optionBInput = document.getElementById("option_b");
let optionCInput = document.getElementById("option_c");
let optionDInput = document.getElementById("option_d");
let optionEInput = document.getElementById("option_e");
let markInput = document.getElementById("mark");
let btlLevelDropDown = document.getElementById("btl_level");
let imageInput = document.getElementById("image");
let correctOptionDropDown = document.getElementById("correct_option");
let questionTypeDiv = document.getElementById("question_type_div");
let questionTypeDropDown = document.getElementById("question_type");
let numericalAnswerDiv = document.getElementById("numerical_answer_div");
let numericalAnswerInput = document.getElementById("numerical_answer");
let editor;

var resultDiv = document.getElementById("result_div");

let subjects = [];
let btlLevels = [];

markInput.addEventListener("input", function () {
  this.value = this.value.replace(/[^0-9]/g, "");
});

addQuestionBtn.addEventListener("click", async () => {
  filterForm.classList.add("was-validated");
  if (!filterForm.checkValidity()) {
    return;
  }

  questionForm.classList.add("was-validated");
  if (!questionForm.checkValidity()) {
    return;
  }
  if (correctOptionDropDown.value == "E" && optionEInput.value.trim() == "") {
    questionForm.classList.remove("was-validated");
    alert("Please provide option E text\nOr select a different correct option");
    return;
  }
  if (questionTypeDropDown.value === "Numerical") {
    if (!isValidNumerical(numericalAnswerInput.value)) {
      alert("Please provide valid Numerical input");
      return;
    }
  }
  function isValidNumerical(value) {
    const regex = /^-?(\d+|\d+\/\d+)(i)?$/;
    return regex.test(value.trim());
  }
  uploadQuestion();
});

async function init() {
  await initializeTinyMCE();
  await getSubjectsSectionsTopics();
  await fetchBtl();

  btlLevels = getBtlLevels();
  hideOverlay();
  renderSubjects(subjects);
  renderBtlLevels(btlLevels);
}

subjectDropDown.addEventListener("change", () => {
  if (subjectDropDown.value) {
    sectionDiv.classList.remove("d-none");
  }
  let id = subjectDropDown.value;
  let new_sections = [];
  let subject = subjects.find((sub) => sub.subject_id == id);

  const data = JSON.parse(subject.sections);
  for (let s in data) {
    new_sections.push(data[s]);
  }
  renderSections(new_sections);

  topicDropDown.innerHTML = "";
  topicDiv.classList.add("d-none");

  questionTypeDropDown.value = "";
  questionTypeDropDown.disabled = true;
  questionTypeDiv.classList.add("d-none");

  resultDiv.style.display = "none";
});

sectionDropDown.addEventListener("change", () => {
  if (sectionDropDown.value) {
    topicDiv.classList.remove("d-none");
  }
  // Populate topics
  let sectionId = sectionDropDown.value;
  let subjectId = subjectDropDown.value;

  let subject = subjects.find((sub) => sub.subject_id == subjectId);
  let sections = JSON.parse(subject.sections);
  let section = sections.find((sec) => sec.section_id == sectionId);
  let topics = section.topics;
  let new_topics = [];
  for (let t in topics) {
    new_topics.push(topics[t]);
  }
  renderTopics(new_topics);
  questionTypeDropDown.value = "";
  questionTypeDropDown.disabled = true;
  questionTypeDiv.classList.add("d-none");
  resultDiv.style.display = "none";
});

topicDropDown.addEventListener("change", () => {
  if (topicDropDown.value) {
    questionTypeDiv.classList.remove("d-none");
    questionTypeDropDown.disabled = false;
    renderQuestionTypes();
  } else {
    questionTypeDropDown.disabled = true;
    questionTypeDropDown.value = "";
    questionTypeDiv.classList.add("d-none");
  }
  resultDiv.style.display = "none";
});

function renderSubjects(subjects) {
  let sub = subjects.map((subject) => {
    return {
      html: subject["subject_name"],
      value: subject["subject_id"],
    };
  });
  sub.unshift({
    html: "Please select the subject",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(sub, subjectDropDown);
}

function renderSections(sections) {
  let new_sections = sections.map((s) => {
    return {
      html: s["section_name"],
      value: s["section_id"],
    };
  });
  new_sections.unshift({
    html: "Please select the subject",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_sections, sectionDropDown);
}

function renderTopics(topics) {
  let new_topics = topics.map((t) => {
    return {
      html: t["topic_name"],
      value: t["topic_id"],
    };
  });
  new_topics.unshift({
    html: "Please select the topic",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_topics, topicDropDown);
}

function renderQuestionTypes() {
  const questionTypes = [
    {
      html: "Mcq",
      value: "Mcq",
    },
    {
      html: "Numerical",
      value: "Numerical",
    },
  ];

  questionTypes.unshift({
    html: "Please select the question type",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(questionTypes, questionTypeDropDown);
}

function renderBtlLevels(btlLevels) {
  let new_btl_levels = btlLevels.map((btl) => {
    return {
      html: btl["level_name"],
      value: btl["level"],
    };
  });
  new_btl_levels.unshift({
    html: "Please select the BTL level",
    value: "",
    selected: true,
    disabled: true,
  });
  setDropDown(new_btl_levels, btlLevelDropDown);
}

async function getSubjectsSectionsTopics() {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gst",
      org_id: loggedInUser.college_code,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      subjects = response.result.subjects;
    }
    hideOverlay();
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching subjects, sections and topics");
  }
}

questionTypeDropDown.addEventListener("change", () => {
  const isMCQ = questionTypeDropDown.value === "Mcq";
  const isNUM = questionTypeDropDown.value === "Numerical";
  resultDiv.style.display = questionTypeDropDown.value ? "block" : "none";
  document
    .querySelectorAll("#option_a, #option_b, #option_c, #option_d, #option_e")
    .forEach((input) => {
      const col = input.closest(".col");
      col.classList.toggle("d-none", isNUM);
      if (input.id != "option_e") {
        input.required = isMCQ;
      }
    });

  const correctCol = correctOptionDropDown.closest(".col");
  correctCol.classList.toggle("d-none", isNUM);
  correctOptionDropDown.required = isMCQ;

  numericalAnswerDiv.classList.toggle("d-none", isMCQ);
  numericalAnswerInput.required = isNUM;
});

function extractEditorContent() {
  const editorInstance = tinymce.get("question_editor");

  if (!editorInstance) {
    console.error("Editor instance not found");
    return null;
  }

  const editorHTML = editorInstance.getContent();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = editorHTML;

  const result = {
    question: "",
    images: [],
    table: null,
  };

  // Extract table and convert to markdown
  const tableEl = tempDiv.querySelector("table");
  if (tableEl) {
    result.table = turndownService.turndown(tableEl.outerHTML);
    tableEl.remove();
  }

  // Extract images
  tempDiv.querySelectorAll("img").forEach((img) => {
    result.images.push({
      image_base64: img.src,
    });
    img.remove();
  });

  // Convert remaining content to markdown
  result.question = turndownService.turndown(tempDiv.innerHTML.trim());
  return result;
}

async function uploadQuestion() {
  let out = {};
  out["function"] = "isq";

  let question = {};

  const editorContent = extractEditorContent();

  // Store question in markdown format
  question.question = editorContent.question;

  // Store images array
  question.img = editorContent.images.map((imgObj) => ({
    img_id: "",
    img_base: imgObj.image_base64,
  }));

  // Store table in markdown format
  if (editorContent.table) {
    question.table = editorContent.table;
  }

  if (
    question.question == "" &&
    question.img.length == 0 &&
    question.table == null
  ) {
    alert("Please enter a valid question");
    hideOverlay();
    return;
  }

  const questionType = questionTypeDropDown.value;
  question.question_type = questionType;

  if (questionType === "Mcq") {
    question.choices = {
      A: sanitizeInput(optionAInput.value),
      B: sanitizeInput(optionBInput.value),
      C: sanitizeInput(optionCInput.value),
      D: sanitizeInput(optionDInput.value),
    };
    if (optionEInput.value.trim() != "") {
      question.choices["E"] = sanitizeInput(optionEInput.value);
    }
    question.correct_answer = correctOptionDropDown.value;
  }

  if (questionType === "Numerical") {
    question.correct_answer = numericalAnswerInput.value.trim();
    question.choices = null;
  }

  question.topic_id = topicDropDown.value;
  question.btl_level = btlLevelDropDown.value;
  question.mark = markInput.value;
  out.staff_id = loggedInUser.user_id;
  out.questions = [question];

  showOverlay();
  try {
    let payload = JSON.stringify(out);
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      alert(response.message);
      questionForm.reset();
      questionForm.classList.remove("was-validated");
      filterForm.classList.remove("was-validated");
      hideOverlay();
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert(error.message || "An error occurred while uploading question");
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

function initializePage() {
  init();
  resultDiv.style.display = "none";
  questionTypeDiv.classList.add("d-none");
  questionTypeDropDown.disabled = true;
}
