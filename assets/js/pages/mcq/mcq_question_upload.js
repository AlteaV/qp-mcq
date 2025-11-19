import Autocomplete from "https://cdn.jsdelivr.net/gh/lekoala/bootstrap5-autocomplete@master/autocomplete.js";

const subject = document.getElementById("subject");

const fileInput = document.getElementById("file_input");
const fileUplaodButton = document.getElementById("submit_excel");
const saveQuestionsButton = document.getElementById("save_question");
const fetchingData = document.getElementById("fetching_data");
const resultDiv = document.getElementById("result_div");
const resultTable = document.getElementById("result_table");

let questionForm = document.getElementById("question_form");
let questionInput = document.getElementById("question");
let optionAInput = document.getElementById("option_a");
let optionBInput = document.getElementById("option_b");
let optionCInput = document.getElementById("option_c");
let optionDInput = document.getElementById("option_d");
let optionEInput = document.getElementById("option_e");
let btlLevelDropDown = document.getElementById("btl_level");
let imageInput = document.getElementById("image");
let correctOptionDropDown = document.getElementById("correct_option");
let saveButton = document.getElementById("form_submit");

fileInput.addEventListener("click", () => {
  resultDiv.style.display = "none";
  fileInput.value = "";
});

subject.addEventListener("input", () => {
  resultDiv.style.display = "none";
});

fileUplaodButton.addEventListener("click", async () => {
  if (subject.value.trim() == "") {
    alert("Please select a subject before uploading the question.");
    return;
  }
  if (!fileInput.files || fileInput.files.length == 0) {
    alert("Please upload a file!.");
    return;
  }
  await previewQuestions();
});

saveQuestionsButton.addEventListener("click", async () => {
  await submitQuestion();
});

let subjects = [];
let sectionTopics = [];
let btlLevel = [];
let questions = [];
let questionsFormat = [];

async function init() {
  await getBtllevel();
  await getSubjects();
  if (sessionStorage.getItem("sections_topics")) {
    sectionTopics = JSON.parse(sessionStorage.getItem("sections_topics"));
  }
}

async function getBtllevel() {
  if (btlLevel.length > 0) {
    return;
  }
  if (sessionStorage.getItem("btl_levels")) {
    btlLevel = JSON.parse(sessionStorage.getItem("btl_levels"));
    return;
  }
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "gbl",
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      btlLevel = response.result.btl_level;
      sessionStorage.setItem("btl_levels", JSON.stringify(btlLevel));
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching BTL levels");
  } finally {
    hideOverlay();
  }
}

async function getSubjects() {
  try {
    showOverlay();
    if (
      sessionStorage.getItem("subjects") &&
      sessionStorage.getItem("subjects") != "undefined"
    ) {
      let subjectMap = JSON.parse(sessionStorage.getItem("subjects"));
      subjects = subjectMap;
      setSubjects();
      hideOverlay();
      return;
    }
    let payload = JSON.stringify({
      function: "gss",
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      subjects = response.result.subject;

      subjects.sort((a, b) => a.subject.localeCompare(b.subject));
      sessionStorage.setItem("subjects", JSON.stringify(subjects));
      setSubjects();
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching subjects");
  }
}

function setSubjects() {
  const subjectNames = subjects.map((s) => s.subject);
  setAutoComplete(subject, subjectNames);
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

function setTopic(index, label) {
  let topicField = document.getElementById(`topic_input_${index}`);

  let matchedSubject = subjects.find(
    (s) => s.subject == "Quantitative Aptitude"
  );
  let subjectId = matchedSubject.id;
  let sectionTopicMap = getSectionTopic(subjectId);

  let matchedSection = sectionTopicMap.find((st) => st.section == label);
  if (matchedSection) {
    topicField.value = "";
    setAutoComplete(topicField, matchedSection.topics);
  } else {
    topicField.value = "";
    setAutoComplete(topicField, []);
  }
}

function getSectionTopic(subjectID) {
  if (sectionTopics.length == 0) {
    return [];
  }
  let matched = sectionTopics.find((st) => st.subject_id == subjectID);

  if (matched) {
    let sectionMap = [];
    for (let section of matched.sections) {
      if (typeof section.topics === "string") {
        section.topics = JSON.parse(section.topics);
      }

      let temp = {
        section: section.section,
        topics: section.topics.map((t) => t.topic),
      };
      sectionMap.push(temp);
    }
    return sectionMap;
  } else {
    return [];
  }
}

async function previewQuestions() {
  try {
    showOverlay();
    let file = fileInput.files[0];
    let subjectName = document.getElementById("subject").value;
    let matchedSubject = subjects.find((s) => s.subject == subjectName);

    if (!matchedSubject) {
      alert("Please select a valid subject.");
      hideOverlay();
      return;
    }

    const subjectId = matchedSubject.id;
    let sectionTopics = getSectionTopic(subjectId);
    const base64 = await convertToBase64(file);

    let out = {
      function: "ecg",
      subject: subjectName,
      section_topic: sectionTopics,
      filedata: base64,
      org_id: loggedInUser.college_code,
      subject_id: subjectId,
    };

    const payload = JSON.stringify(out);

    let response = await postCall(QuestionUploadEndPoint, payload);

    let retryCount = 0;
    let maxRetries = 10;

    while (retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 10000));

      let getScannedDataPayload = JSON.stringify({
        function: "gstd",
        id: response.result.id,
      });

      let retryResponse = await postCall(
        QuestionUploadEndPoint,
        getScannedDataPayload
      );

      if (retryResponse.message === "Completed") {
        questions = retryResponse.result.data.questions;
        if (retryResponse.result.data.section_topic !== undefined) {
          let temp = {
            subject_id: subjectId,
            sections: retryResponse.result.data.section_topic,
          };
          let sectionsStoredData = [];
          if (sessionStorage.getItem("sections_topics")) {
            sectionsStoredData = JSON.parse(
              sessionStorage.getItem("sections_topics")
            );
            let existingIndex = sectionsStoredData.findIndex(
              (st) => st.subject_id == subjectId
            );
            if (existingIndex != -1) {
              sectionsStoredData[existingIndex] = temp;
            } else {
              sectionsStoredData.push(temp);
            }
          } else {
            sectionsStoredData.push(temp);
          }
          sessionStorage.setItem(
            "sections_topics",
            JSON.stringify(sectionsStoredData)
          );
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
      alert(
        "Processing is taking longer than expected. Please try again later."
      );
      hideOverlay();
    }
  } catch (error) {
    console.error("previewQuestions Error:", error);
    alert("Error processing PDF.");
  }
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
    let questionHTML = `<p class="latex" style="font-size: 125%; font-family: 'Times New Roman', Times, serif; text-align: left; margin-bottom: 10px;">${record.question}</p>`;

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

    let choiceHTML = `<div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: left; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;

    for (let key in choices) {
      const inputId = `answer_${index}_${key}`;
      const isChecked = record.correct_answer == key ? "checked" : "";

      choiceHTML += `
        <label for="${inputId}" style="display: flex; align-items: left ; gap: 5px;">
          <input type="radio" id="${inputId}" name="answer_${index}" value="${key}" ${isChecked} />
          <span class="latex" style="font-size: 120%; font-family: 'Times New Roman', Times, serif;">${choices[key]}</span>
        </label>`;
    }

    choiceHTML += `</div>`;

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
          }>${level.level_name}</option>`
      )
      .join("")}</select>`;

    let editButton = createButton(
      {
        question: record,
        index: index,
      },
      "",
      "edit-button",
      "fas fa-pencil-alt"
    );

    let deleteButton = createButton(
      {
        question: record,
        index: index,
      },
      "",
      "delete-button btn-danger",
      "fas fa-trash-alt"
    );

    const questionAndChoicesHTML = questionHTML + choiceHTML;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(questionAndChoicesHTML),
      new TableStructure(sectionField),
      new TableStructure(topicField),
      new TableStructure(btlField),
      new TableStructure(marksField),
      new TableStructure(editButton),
      new TableStructure(deleteButton),
    ]);

    questionsFormat.push({
      question_no: index + 1,
      question: record.question,
      images: record.images || [],
      choices,
      correct_answer: record.correct_answer,
      section: record.section,
      topic: record.topic,
      btl_level: record.btl_level,
      marks: record.marks,
    });
  });

  displayResult(tableData, resultTable);
  resultDiv.style.display = "block";

  $("#result_table")
    .off("click", ".edit-button")
    .on("click", ".edit-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full"))
      );
      editQuestion(fullData);
    });

  $("#result_table")
    .off("click", ".delete-button")
    .on("click", ".delete-button", (event) => {
      const $button = $(event.currentTarget);
      const fullData = JSON.parse(
        decodeURIComponent($button.attr("data-full"))
      );
      deleteQuestion(fullData);
    });

  let subjectName = document.getElementById("subject").value;

  let matchedSubject = subjects.find((s) => s.subject == subjectName);
  let sectionTopic = getSectionTopic(matchedSubject.id);

  let sectionData = sectionTopic.map((s) => s.section);
  sectionData = sectionData.sort((a, b) => a.localeCompare(b));

  for (let index = 0; index < questionsFormat.length; index++) {
    const record = questionsFormat[index];
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

    let sectionField = document.getElementById(`section_input_${index}`);

    if (sectionField) {
      setAutoComplete(sectionField, sectionData);
      sectionField.addEventListener("input", async (e) => {
        setTopic(index, e.target.value);
      });
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

function renderTableFromMarkdown(markdown) {
  if (!markdown) return "";

  const converter = new showdown.Converter({
    tables: true,
  });

  const htmlContent = converter.makeHtml(markdown);

  return `
    <div class="question-table">
      <style>
        .question-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .question-table th,
        .question-table td {
          border: 1px solid #333;
          padding: 8px;
          text-align: center;
        }
        .question-table th {
          background-color: #f2f2f2;
        }
      </style>
      ${htmlContent}
    </div>
  `;
}

function deleteQuestion(data) {
  let index = data.index;
  questions.splice(index, 1);
  showReportSection(questions);
}

function editQuestion(data) {
  let questionData = data.question;
  let index = data.index;

  questionInput.value = questionData.question;
  optionAInput.value = questionData.choices.A || "";
  optionBInput.value = questionData.choices.B || "";
  optionCInput.value = questionData.choices.C || "";
  optionDInput.value = questionData.choices.D || "";
  optionEInput.value = questionData.choices.E || "";

  btlLevelDropDown.innerHTML = btlLevel
    .map(
      (level) =>
        `<option value="${level.level}" ${
          questionData.btl_level == level.level_name ? "selected" : ""
        }>${level.level_name}</option>`
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

      if (
        correctOptionDropDown.value == "E" &&
        optionEInput.value.trim() == ""
      ) {
        questionForm.classList.remove("was-validated");
        alert(
          "Please provide option E text\nOr select a different correct option"
        );
        return;
      }

      questions[index].question = questionInput.value;
      questions[index].choices.A = optionAInput.value;
      questions[index].choices.B = optionBInput.value;
      questions[index].choices.C = optionCInput.value;
      questions[index].choices.D = optionDInput.value;
      if (questions[index].choices.E || optionEInput.value.trim() != "") {
        questions[index].choices.E = optionEInput.value;
      }

      let selectedBtlOption =
        btlLevelDropDown.options[btlLevelDropDown.selectedIndex];
      questions[index].btl_level = selectedBtlOption
        ? selectedBtlOption.text
        : questionData.btl_level;

      questions[index].correct_answer =
        correctOptionDropDown.value || questionData.correct_answer;

      showReportSection(questions);
      $("#modal").modal("hide");
    });

  $("#modal").modal("show");
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
        const name = radio.name;
        const index = parseInt(name.split("_")[1], 10);
        questionsFormat[index].correct_answer = radio.value;
      });

    const out = {
      function: "ss",
      subject: subject.value.trim(),
      created_by: loggedInUser.staff_id,
      sections: [],
    };

    questionsFormat.forEach((q) => {
      let section = out.sections.find((s) => s.section == q.section);
      if (!section) {
        section = {
          section: q.section,
          topics: [],
        };
        out.sections.push(section);
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

      let temp = {
        question: q.question,
        img: img,
        choices: q.choices,
        correct_answer: q.correct_answer,
        mark: q.marks,
        btl_level: q.btl_level,
      };
      for (let question of questions) {
        if (question.question.trim() == q.question.trim() && question.table) {
          temp.table = question.table;
        }
      }
      topic.questions.push(temp);
    });

    const response = await postCall(
      QuestionUploadEndPoint,
      JSON.stringify(out)
    );

    if (response.success) {
      alert("Questions submitted successfully!");
      resultTable.innerHTML = "";
      fileInput.value = "";
      resultDiv.style.display = "none";
      hideOverlay();
    } else {
      alert(response.message);
      hideOverlay();
    }
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
