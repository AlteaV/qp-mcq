import Autocomplete from "https://cdn.jsdelivr.net/gh/lekoala/bootstrap5-autocomplete@master/autocomplete.js";

// variable declarations
let btlLevel = [];
let subjects = [];
let sectionTopics = [];
let questions = [];
let questionsFormat = [];
let scanId = "";

// DOM element references
const levelDropDown = document.getElementById("level");
let subjectDropDown = document.getElementById("subject");
let scanQuestionButton = document.getElementById("scan_question");
let fileInput = document.getElementById("file_input");
let fetchingData = document.getElementById("fetching_data");
let resultTable = document.getElementById("result_table");
let resultDiv = document.getElementById("result_div");
let saveQuestionsButton = document.getElementById("save_question");
const statusDiv = document.getElementById("status_div");
const statusTable = document.getElementById("status_table");
const scanQuestionInputDiv = document.getElementById("scan_question_input_div");

// event listeners
scanQuestionButton.addEventListener("click", scanQuestionPaper);

levelDropDown.addEventListener("change", () => {
  resultDiv.style.display = "none";
  setSubjects();
});

saveQuestionsButton.addEventListener("click", async () => {
  await submitQuestion();
});

async function getSubjects() {
  try {
    showOverlay();
    if (
      sessionStorage.getItem("subjects") &&
      sessionStorage.getItem("subjects") != "undefined"
    ) {
      let subjectMap = JSON.parse(sessionStorage.getItem("subjects"));
      subjects = subjectMap;
      selLevel();
      hideOverlay();
      return;
    }
    let payload = JSON.stringify({
      function: "gss",
      org_id: loggedInUser.college_code,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      subjects = response.result.subject;

      subjects.sort((a, b) => a.subject.localeCompare(b.subject));
      sessionStorage.setItem("subjects", JSON.stringify(subjects));
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
}

function setSubjects() {
  subjectDropDown.value = "";
  let level = levelDropDown.value;
  let subjectNames = [];
  subjects.forEach((s) => {
    if (s.level == level) {
      subjectNames.push(s.subject);
    }
  });

  setAutoComplete(subjectDropDown, subjectNames);
  subjectDropDown.disabled = false;
}

async function scanQuestionPaper() {
  try {
    showOverlay();
    let file = fileInput.files[0];
    let subjectName = subjectDropDown.value;
    let matchedSubject = subjects.find((s) => s.subject == subjectName);

    if (!matchedSubject) {
      alert("Please select a valid subject.");
      hideOverlay();
      return;
    }

    const subjectId = matchedSubject.id;
    const base64 = await convertToBase64(file);

    let out = {
      function: "sqg",
      subject: subjectName,
      filedata: base64,
      org_id: loggedInUser.college_code,
      created_by: loggedInUser.staff_id,
      subject_id: subjectId,
    };
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
          (q) => q.question_type == "Mcq" || q.question_type == "Fib",
        );
        sectionTopics = retryResponse.result.data.section_topic;
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
      scanQuestionInputDiv.style.display = "none";
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
                 record.btl_level == level.level_name ? "selected" : ""
               }>${level.level_name}</option>`,
           )
           .join("")}</select>`;

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
          choiceText = choiceText.replace(/^<p>|<\/p>$/g, "");
        }

        choiceHTML += `
      <label for="${inputId}" style="display: flex; align-items: left; gap: 5px;">
        <input type="radio" id="${inputId}" name="answer_${index}" value="${key}" ${isChecked} />
        <span class="latex">${choiceText}</span>
      </label>`;
      }
      choiceHTML += `</div>`;
    }

    const questionAndChoicesHTML = questionHTML + choiceHTML;
    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(questionAndChoicesHTML),
      new TableStructure(sectionField),
      new TableStructure(topicField),
      new TableStructure(btlField),
      new TableStructure(marksField),
      new TableStructure(deleteButton),
    ]);

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

  displayResult(tableData, resultTable);
  resultDiv.style.display = "block";
  scanQuestionInputDiv.style.display = "flex";
  statusDiv.style.display = "none";

  $("#result_table")
    .off("click", ".delete-button")
    .on("click", ".delete-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full")),
      );
      deleteQuestion(fullData);
    });

  document.querySelectorAll(".fib-answer input").forEach((inputField) => {
    inputField.addEventListener("input", function () {
      this.value = this.value
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");
    });
  });

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

  levelDropDown.disabled = true;
  subjectDropDown.disabled = true;

  let selectedLevel = subjects.find((s) => s.subject == subject.value)?.level;
  levelDropDown.value = selectedLevel || "";

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

function setTopic(index, label, clear = true) {
  let topicField = document.getElementById(`topic_input_${index}`);
  let topicData = sectionTopics.find((s) => s.section == label)?.topics || [];

  if (typeof topicData === "string") {
    topicData = JSON.parse(topicData);
  }
  topicData = topicData.sort((a, b) => a.localeCompare(b));
  if (clear) {
    topicField.value = "";
  }

  setAutoComplete(topicField, Array.isArray(topicData) ? topicData : []);
}

function deleteQuestion(data) {
  let index = data.index;
  questions.splice(index, 1);
  showReportSection(questions);
}

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
        if (field.id.includes("section_input_")) {
          let index = field.id.split("_")[2];
          setTopic(index, label);
        }
      },
    });
  } catch (err) {
    console.error("Autocomplete Error:", err);
    alert("An error occurred while setting up autocomplete.");
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

    document
      .querySelectorAll("input[type='radio']:checked")
      .forEach((radio) => {
        const index = parseInt(radio.name.split("_")[1], 10);
        if (questionsFormat[index].question_type == "Mcq") {
          questionsFormat[index].correct_answer = radio.value;
        }
      });

    document.querySelectorAll(".fib-answer").forEach((input) => {
      const index = parseInt(input.dataset.index, 10);
      if (questionsFormat[index].question_type == "Fib") {
        questionsFormat[index].correct_answer = input.value.trim();
        questionsFormat[index].choices = null;
      }
    });

    let subjectName = document.getElementById("subject").value;
    let matchedSubject = subjects.find((s) => s.subject == subjectName);
    if (!matchedSubject) {
      alert("Please select a valid subject.");
      hideOverlay();
      return;
    }

    let subjectId = matchedSubject.id;

    const out = {
      function: "ss",
      subject_id: subjectId,
      scan_id: scanId,
      created_by: loggedInUser.staff_id,
      sections: [],
    };

    for (let index = 0; index < questionsFormat.length; index++) {
      let q = questionsFormat[index];

      let isExistingSection = sectionTopics.some((s) => s.section == q.section);
      if (!isExistingSection) {
        alert(
          `Section "${q.section}" for question ${index + 1} does not exist in the system. Please select an existing section or add it to the system before submitting.`,
        );
        hideOverlay();
        return;
      }

      let section = out.sections.find((s) => s.section == q.section);
      if (q.section == null || q.section == "") {
        alert(`Please enter a valid section for ${index + 1} question`);
        hideOverlay();
        return;
      }
      if (!section) {
        section = {
          section: q.section,
          topics: [],
        };
        out.sections.push(section);
      }

      if (q.topic == null || q.topic == "") {
        alert("Please enter a valid topic for " + (index + 1) + " question");
        hideOverlay();
        return;
      }
      let isExistingTopic = sectionTopics.some(
        (s) => s.section == q.section && s.topics.includes(q.topic),
      );

      if (!isExistingTopic) {
        alert(
          `Topic "${q.topic}" for question ${index + 1} does not exist in the system under section "${q.section}". Please select an existing topic or add it to the system before submitting.`,
        );
        hideOverlay();
        return;
      }
      let topic = section.topics.find((t) => t.topic == q.topic);
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
      };

      if (q.question_type == "Mcq") {
        temp.choices = q.choices;
      } else if (q.question_type == "Fib") {
        temp.choices = null;
      }

      if (q.table) {
        temp.table = q.table;
      }

      if (
        q.question_type == "Mcq" &&
        (q.correct_answer == null || q.correct_answer == "")
      ) {
        alert(`Please choose a valid answer for question ${index + 1}`);
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
      levelDropDown.disabled = false;
      levelDropDown.value = "";
      subjectDropDown.value = "";
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

async function checkExistingScan() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "cqss",
      org_id: loggedInUser.college_code,
      user_id:
        loggedInUser.register_num ||
        loggedInUser.user_id ||
        loggedInUser.staff_id,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      let status = response.result.status;
      handleExistingScan(status);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching subjects");
    hideOverlay();
  }
}

function handleExistingScan(data) {
  if (data) {
    let button = "";
    if (data.type == "QpGen") {
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
    } else {
      button = "There is a pending scan in MCQ";
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
          (q) => q.question_type == "Mcq" || q.question_type == "Fib",
        );
        sectionTopics = retryResponse.result.data.section_topic;
        let selectedSubject = subjects.find(
          (s) => s.id == retryResponse.result.data.subject_id,
        );

        subject.value = selectedSubject.subject;
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
    scanQuestionInputDiv.style.display = "none";
    return;
  }
  hideOverlay();
  scanQuestionInputDiv.style.display = "flex";
}

// page load event listener
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

//  initialization function
async function init() {
  await fetchBtl();
  btlLevel = getBtlLevels();
  await getSubjects();
  await checkExistingScan();
}
