import Autocomplete from "https://cdn.jsdelivr.net/gh/lekoala/bootstrap5-autocomplete@master/autocomplete.js";

const subject = document.getElementById("subject");

const fileInput = document.getElementById("file_input");
const fileUplaodButton = document.getElementById("submit_excel");
const saveQuestions = document.getElementById("save_question");
const fetchingData = document.getElementById("fetching_data");
const resultDiv = document.getElementById("result_div");
const resultTable = document.getElementById("result_table");

let questionsFormat = [];

const sectionFields = [];
const topicFields = [];
let btlLevel = [];
const sectionIdMap = {};

async function subjectSelection() {
  const subjectName = subject.value.trim();
  const matchedSubject = subjectMap.find((s) => s.subject == subjectName);

  if (matchedSubject) {
    getSection(matchedSubject.id).then(() => {
      sectionFields.forEach((field, index) => {
        setAutoComplete(field, sectionData);
        field.value = "";
        const topicField = topicFields[index];
        if (topicField) {
          topicField.value = "";
          setAutoComplete(topicField, []);
        }
      });
    });
  } else {
    sectionMap = [];
    sectionData = [];
    sectionFields.forEach((field, index) => {
      field.value = "";
      const topicField = topicFields[index];
      if (topicField) {
        topicField.value = "";
        setAutoComplete(topicField, []);
      }
    });
  }
}

async function sectionSelection() {
  const index = field.id.split("_").pop();
  const topicField = topicFields[index];
  const sectionValue = field.value.trim();

  if (!sectionValue) {
    setAutoComplete(field, sectionData);
    topicField.value = "";
    setAutoComplete(topicField, []);
    return;
  }

  const matchedSection = sectionMap.find((s) => s.section == sectionValue);
  if (matchedSection) {
    sectionIdMap[index] = matchedSection.id;
    await getTopics(matchedSection.id, topicField);
  } else {
    topicField.value = "";
    setAutoComplete(topicField, []);
  }
}

subject.addEventListener("input", subjectSelection);

async function init() {
  await getSubjects();
}

// btl level
async function getBtllevel() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "gbl",
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    console.log("response", response);
    if (response.success) {
      btlLevel = response.result.btl_level;
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching BTL levels");
  } finally {
    hideOverlay();
  }
}

// get subject
let subjectMap = [];

async function getSubjects() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "gss",
    });
    let response = await postCall(QuestionUploadEndPoint, payload);
    if (response.success) {
      subjectMap = response.result.subject;
      const subjectNames = subjectMap.map((s) => s.subject);
      setAutoComplete(subject, subjectNames);
    }
    hideOverlay();
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching subjects");
  }
}

// get section
let sectionData = [];
let sectionMap = [];

async function getSection(subjectID) {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "gs",
      subject_id: subjectID,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      sectionMap = response.result.section;
      sectionData = sectionMap.map((s) => s.section);
    }
    hideOverlay();
  } catch (err) {
    console.error("Error fetching topics", err);
  }
}

// get topic
let topicMap = [];

async function getTopics(sectionID, topicField) {
  try {
    showOverlay();
    const payload = JSON.stringify({
      function: "gt",
      section_id: sectionID,
    });
    const response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      topicMap = response.result.topic;
      const topicNames = topicMap.map((t) => t.topic);
      topicField.value = "";
      setAutoComplete(topicField, topicNames);
    }
    hideOverlay();
  } catch (err) {
    console.error("Error fetching topics", err);
  }
}

function setAutoComplete(field, data) {
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
      if (field.id == "subject") {
        subjectSelection();
      } else if (field.name == "sections") {
        sectionSelection(field);
      }
    },
  });
}

async function previewQuestions() {
  try {
    showOverlay();
    const file = fileInput.files[0];

    const base64 = await convertToBase64(file);

    const payload = JSON.stringify({
      function: "pvq",
      filedata: base64,
    });

    const response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      const questions = response.result.questions;
      let sub = subject.value;
      const matchedSubject = subjectMap.find((s) => s.subject == sub);
      if (matchedSubject) {
        await getSection(matchedSubject.id);
      }
      await getBtllevel();
      await showReportSection(questions);
    }
    hideOverlay();
  } catch (error) {
    console.error("previewQuestions Error:", error);
    alert("Error processing PDF.");
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
      const btlName = selectedOption.textContent.trim();
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
          btl_level:
            btlLevel.find((b) => b.level_name == q.btl_level)?.level || 1,
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

      topic.questions.push({
        question: q.question,
        img: "",
        choices: q.choices,
        correct_answer: q.correct_answer,
        mark: q.marks,
      });
    });

    const response = await postCall(staffEndPoint, JSON.stringify(out));

    if (response.success) {
      alert("Questions submitted successfully!");
      resultTable.innerHTML = "";
      fileInput.value = "";
    } else {
      alert("Submission failed.");
    }
  } catch (error) {
    console.error("submitQuestion Error:", error);
    alert("Error submitting questions.");
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
        new TableStructure("Section", "", "", "width: 10%;"),
        new TableStructure("Topic", "", "", "width: 10%;"),
        new TableStructure("BTL", "", "", "width: 5%;"),
        new TableStructure("Mark", "", "", "width: 10%;"),
      ],
    ],
    tableBody: [],
  };

  questionsFormat = [];

  data.forEach((record, index) => {
    const choices = record.choices || {};
    const questionHTML = `<p class="latex" style="font-size: 125%; font-family: 'Times New Roman', Times, serif; text-align: left; margin-bottom: 10px;">${record.question}</p>`;

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
          style="width: 60px;" 
        />`;

    let sectionField = `
         <input type="text" 
          id="section_input_${index}" class="form-control section-field" 
          name = "sections"
          value="${record.section || ""}" 
          data-index="${index}" 
      />`;

    let topicField = `
         <input type="text" 
         id="topic_input_${index}" 
         class="form-control topic-field" 
         name = "topics"
         value="${record.topic || ""}" 
        data-index="${index}" 
      />`;

    let btlField = `
         <select id="btl_input_${index}" class="form-control btl-field" 
         data-index="${index}">${btlLevel
      .map(
        (level) =>
          `<option value="${level.level}" ${
            record.btl_level == level.level_name ? "selected" : ""
          }>${level.level_name}</option>`
      )
      .join("")}</select>`;

    const questionAndChoicesHTML = questionHTML + choiceHTML;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(questionAndChoicesHTML),
      new TableStructure(sectionField),
      new TableStructure(topicField),
      new TableStructure(btlField),
      new TableStructure(marksField),
    ]);

    questionsFormat.push({
      question_no: index + 1,
      question: record.question,
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

    const sectionField = document.getElementById(`section_input_${index}`);
    const topicField = document.getElementById(`topic_input_${index}`);

    if (sectionField && topicField) {
      sectionFields[index] = sectionField;
      topicFields[index] = topicField;

      setAutoComplete(sectionField, sectionData);

      sectionField.addEventListener("input", async (e) => {
        await sectionSelection(e.target);
      });

      setAutoComplete(topicField, []);

      if (record.section) {
        const matchedSection = sectionMap.find(
          (s) => s.section == record.section
        );
        if (matchedSection) {
          await getTopics(matchedSection.id, topicField);
          topicField.value = record.topic || "";
        }
      }
    }
  }
}

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

saveQuestions.addEventListener("click", async () => {
  await submitQuestion();
});

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
