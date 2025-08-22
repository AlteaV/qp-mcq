let questions = [];
let submit = document.getElementById("submit");
let testType = document.getElementById("test_type");
let sectionsContainer = document.getElementById("sectionsContainer");
let getButton = document.getElementById("get_button");
document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    submit.addEventListener("click", handleSubmit);
    getButton.addEventListener("click", queMcqQuestionsById);
    getTestTypes();
  }
});

async function getTestTypes() {
  try {
    let payload = JSON.stringify({
      function: "gaqp",
      sub_code: "AD3351",
    });

    let response = await postCall(examCellEndPoint, payload);
    let tests = response.result.qp;
    tests.forEach((test) => {
      let option = document.createElement("option");
      option.value = test.question_paper_id;
      option.text = test.test_type;
      testType.appendChild(option);
    });
  } catch (error) {
    console.error(error);
  }
}

async function queMcqQuestionsById() {
  if (testType.value == "" || !testType.value) {
    alert("Please select a valid test type");
    return;
  }
  try {
    let payload = JSON.stringify({
      function: "gqpu",
      id: testType.value,
    });

    let response = await postCall(examCellEndPoint, payload);
    questions = response.result.questions;
    renderMCQs(response.result.qp, response.result.questions);
  } catch (error) {
    console.error(error);
  }
}

function renderMCQs(qp, questions) {
  sectionsContainer.innerHTML = "";
  let allSectionNames = [];

  qp.forEach((section) => {
    let sectionName = section.section_name;
    allSectionNames.push(sectionName);

    $("#sectionsContainer").append(
      generateSection(sectionName, section.section_marks)
    );

    let sectionDiv = $(`.section[data-section-name="${sectionName}"]`);
    let questionContainer = sectionDiv.find(".questions-container");

    let groupedQuestions = section.question_rows.reduce((acc, row) => {
      let key = row.question_number;
      let existingGroupIndex = acc.findIndex(
        (group) => group[0].question_number === key
      );

      if (existingGroupIndex !== -1) {
        acc[existingGroupIndex].push(row);
      } else {
        acc.push([row]);
      }
      return acc;
    }, []);

    groupedQuestions.forEach((questionGroup) => {
      let questionNumber = questionGroup[0].question_number;
      let questionIds = questionGroup[0].question_ids;

      let matchedQuestions = questionIds
        .map((qid) => questions.find((q) => q.question_id === qid))
        .filter(Boolean);

      matchedQuestions.forEach((questionData) => {
        let questionBlock = $("<div>").addClass("question-box");

        let questionHeader = $(`
          <div class="question-header" style="display: flex; justify-content: space-between;">
            <div><strong>Q${questionNumber}:</strong> ${questionData.question}</div>
            <div style="font-size: 0.9em; color: gray;">
              (Marks: ${questionData.marks}, BTL: ${questionData.btl}, CO: ${questionData.co})
            </div>
          </div>
        `);
        questionBlock.append(questionHeader);

        let choices = JSON.parse(questionData.choices);
        for (let key in choices) {
          let choiceId = `q_${questionData.question_id}_${key}`;

          let choice = $(`
            <label style="display: block;">
              <input type="radio" 
                     name="question_${questionData.question_id}" 
                     value="${key}" 
                     data-question-id="${questionData.question_id}" 
                     id="${choiceId}">
              ${key}. ${choices[key]}
            </label>
          `);

          questionBlock.append(choice);
        }

        questionContainer.append(questionBlock);
      });
    });
  });
}

function generateSection(sectionName, marks) {
  return `
    <div class="section" data-section-name="${sectionName}">
      <h3>Section ${sectionName} (Total Marks: ${marks})</h3>
      <div class="questions-container"></div>
    </div>
  `;
}

async function handleSubmit() {
  let results = [];

  questions.forEach((item) => {
    let selected = document.querySelector(
      `input[name="question_${item.question_id}"]:checked`
    );
    let answer = selected ? selected.value : null;

    results.push({
      question_id: item.question_id,
      selected_option: answer,
    });
  });

  try {
    let payload = JSON.stringify({
      function: "iua",
      user_id: 987654,
      sub_qp_id: testType.value,
      answer: results,
    });

    let response = await postCall(examCellEndPoint, payload);
    alert(response.message);
  } catch (error) {
    console.error(error);
  }
}
