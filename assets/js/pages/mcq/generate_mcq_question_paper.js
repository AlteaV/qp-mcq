let generatedQuestions = [];
let swapSelections = [];
let currentTemplateId = null;

function generateQuestionPaper(questions, templateId) {
  currentTemplateId = templateId;
  generatedQuestions = questions.map((q, i) => {
    return {
      number: i + 1,
      id: q.question_id,
      topic_id: q.topic_id,
      question: q.question,
      choices: q.choices,
      btl: q.btl_level,
      marks: q.mark,
    };
  });

  createQuestions();
}

function showSwapQuestions(swapQuestion, index) {
  if (swapQuestion.choices) {
    try {
      let parsed = JSON.parse(swapQuestion.choices);
      choicesInline = Object.keys(parsed)
        .map((key) => `${key}) ${parsed[key]}`)
        .join(" &nbsp;&nbsp; ");
    } catch {
      choicesInline = swapQuestion.choices;
    }
  }

  generatedQuestions[index] = {
    number: generatedQuestions[index].number,
    id: swapQuestion.question_id,
    topic_id: swapQuestion.topic_id || generatedQuestions[index].topic_id,
    question: swapQuestion.question,
    choices: swapQuestion.choices,
    btl: swapQuestion.btl_level || generatedQuestions[index].btl,
    marks: swapQuestion.mark,
  };

  createQuestions();
}

function createQuestions() {
  let html = `
    <button id="selectparameter" class="btn btn-primary">Change Subject</button>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Question & Choices</th>
          <th>BTL Level</th>
          <th>Marks</th>
          <th>Swap</th>
        </tr>
      </thead>
      <tbody>
  `;

  generatedQuestions.forEach((q) => {
    let choicesInline = "";
    if (q.choices && typeof q.choices === "string") {
      try {
        let parsed = JSON.parse(q.choices);
        choicesInline = Object.keys(parsed)
          .map((key) => `${key})${parsed[key]}`)
          .join(" &nbsp;&nbsp; ");
      } catch {
        choicesInline = q.choices;
      }
    } else if (q.choices && typeof q.choices === "object") {
      choicesInline = Object.keys(q.choices)
        .map((key) => `${key}) ${q.choices[key]}`)
        .join(" &nbsp;&nbsp; ");
    }

    html += `
      <tr>
        <td>${q.number}</td>
        <td style="text-align: left;">
          <p class="latex">${q.question}</p>
          <p class="latex">${choicesInline}</p>
        </td>
        <td>${q.btl}</td>
        <td>${q.marks}</td>
       <td>
          <button 
            class="btn btn-sm btn-primary swap-btn"
            data-id="${q.id}"
            data-topic_id="${q.topic_id}"
            data-btl="${q.btl}"
            data-mark="${q.marks}"
          >
            Swap
          </button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <div class="row">
      <div class="col mt-3 d-flex justify-content-end gap-2">
          <button id="questionupload" class="btn btn-primary">Upload Question Paper</button>
      </div>
    </div>
  `;

  $("#questions_div").html(html);

  $(".swap-btn")
    .off("click")
    .on("click", function () {
      let index = $(this).closest("tr").index();
      let topicId = parseInt($(this).data("topic_id"));
      let btlLevel = parseInt($(this).data("btl"));
      let mark = parseInt($(this).data("mark"));

      let questionIds = generatedQuestions
        .filter((q) => q.topic_id == topicId)
        .map((q) => q.id);

      let swapData = {
        question_id: questionIds,
        topic_id: topicId,
        btl_level: btlLevel,
        mark: mark,
      };

      getSwapQuestion(swapData, index);
    });

  function mcqQuestioPaper() {
    const question_rows = generatedQuestions.map((q) => {
      return {
        btl: q.btl,
        marks: q.marks,
        topic_id: [q.topic_id],
        question_ids: [q.id],
        no_of_questions: 1,
        question_number: q.number,
      };
    });

    uploadMcqQuestioPaper(question_rows);
    return { question_rows };
  }

  $("#selectparameter")
    .off("click")
    .on("click", function () {
      $("#questions_div").hide();
      showInputfield(currentTemplateId);
    });

  $("#questionupload")
    .off("click")
    .on("click", function () {
      mcqQuestioPaper();
    });
  MathJax.typeset();
}
