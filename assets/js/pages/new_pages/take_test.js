let questions = [];
let submit = document.getElementById("submit");

document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    submit.addEventListener("click", handleSubmit);
    queMcqQuestions();
  }
});

async function queMcqQuestions() {
  try {
    let payload = JSON.stringify({
      function: "gmq",
    });

    let response = await postCall(examCellEndPoint, payload);
    questions = response.result.questions;
    renderMCQs(response.result.questions);
  } catch (error) {
    console.error(error);
  }
}

function renderMCQs() {
  let container = document.getElementById("mcq-container");

  questions.forEach((item, index) => {
    let choices = JSON.parse(item.choices);
    let qBox = document.createElement("div");
    qBox.className = "question-box";

    let questionRow = document.createElement("div");
    questionRow.className = "question-header";

    let questionText = document.createElement("div");
    questionText.innerHTML = `<strong>Q${index + 1}:</strong> ${item.question}`;

    let metadata = document.createElement("div");
    metadata.innerHTML = `<em>(Marks: ${item.marks}, BTL: ${item.btl}, CO: ${item.co})</em>`;
    metadata.style.fontSize = "0.9em";
    metadata.style.color = "gray";

    questionRow.appendChild(questionText);
    questionRow.appendChild(metadata);
    qBox.appendChild(questionRow);

    for (let key in choices) {
      let label = document.createElement("label");
      let input = document.createElement("input");
      input.type = "radio";
      input.name = `question_${item.question_id}`;
      input.value = key;
      input.dataset.questionId = item.question_id;

      label.appendChild(input);
      label.append(` ${key}. ${choices[key]}`);
      label.style.display = "block";
      qBox.appendChild(label);
    }

    container.appendChild(qBox);
  });
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
      sub_qp_id: 27,
      answer: results,
    });

    let response = await postCall(examCellEndPoint, payload);
    alert(response.message);
  } catch (error) {
    console.error(error);
  }
}
