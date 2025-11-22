let generatedQuestions = [];
let swapSelections = [];
let currentTemplateId = null;

function generateQuestionPaper(questions, templateId) {
  currentTemplateId = templateId;

  generatedQuestions = questions.map((q, i) => {
    if (q.type === "single") {
      return {
        number: i + 1,
        type: "single",
        id: q.question_id,
        topic_id: q.topic_id,
        question: q.question,
        choices: q.choices || null,
        btl: q.btl_level,
        marks: q.mark,
      };
    }

    if (q.type === "either_or") {
      return {
        number: i + 1,
        type: "either_or",
        options: q.questions.map((opt) => ({
          id: opt.question_id,
          topic_id: opt.topic_id,
          question: opt.question,
          choices: opt.choices || null,
          btl: opt.btl_level,
          marks: opt.mark,
        })),
      };
    }
  });

  createQuestions();
}

function showSwapQuestions(swapResponse, index) {
  let q = generatedQuestions[index];


  if (q.type === "single") {
    const swapQuestion = swapResponse;
    generatedQuestions[index] = {
      ...q,
      id: swapQuestion.question_id,
      topic_id: swapQuestion.topic_id,
      question: swapQuestion.question,
      choices: swapQuestion.choices || null,
      btl: swapQuestion.btl_level,
      marks: swapQuestion.mark,
    };
  }

  if (q.type === "either_or") {
    if (!Array.isArray(swapResponse) || swapResponse.length < 2) {
      alert("Swap API must return two questions for either-or.");
      return;
    }

    generatedQuestions[index].options = swapResponse.map((s) => ({
      id: s.question_id,
      topic_id: s.topic_id,
      question: s.question,
      choices: s.choices || null,
      btl: s.btl_level,
      marks: s.mark,
    }));
  }

  createQuestions();
}

async function createQuestions() {
  let html = `
    <button id="selectparameter" class="btn btn-primary">Change Template</button>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Question / Choices</th>
          <th>BTL</th>
          <th>Marks</th>
          <th>Swap</th>
        </tr>
      </thead>
      <tbody>
  `;

  generatedQuestions.forEach((q, index) => {

    if (q.type === "single") {
      let choicesInline = "";

      if (q.choices) {
        try {
          let parsed = JSON.parse(q.choices);
          choicesInline = Object.keys(parsed)
            .map((key) => `${key}) ${parsed[key]}`)
            .join("&nbsp;&nbsp;");
        } catch {
          choicesInline = q.choices;
        }
      }

      html += `
        <tr>
          <td>${q.number}</td>
          <td style="text-align:left;">
            <p class="latex">${q.question}</p>
            <p class="latex">${choicesInline}</p>
          </td>
          <td>${q.btl}</td>
          <td>${q.marks}</td>
          <td>
            <button 
              class="btn btn-sm btn-primary swap-btn"
              data-index="${index}"
              data-type="single"
              data-topic_id="${q.topic_id}"
              data-btl="${q.btl}"
              data-mark="${q.marks}"
            >Swap</button>
          </td>
        </tr>
      `;
    }

    if (q.type === "either_or") {
      html += `
    <tr>
      <td>${q.number}</td>

      <td style="text-align:left;">
        <b>(a)</b> ${q.options[0].question}
        <br><center><b>OR</b></center>
        <b>(b)</b> ${q.options[1].question}
      </td>

      <td>${q.options[0].btl} 
      <br>
      <hr>
      ${q.options[1].btl}</td>
      <td>${q.options[0].marks}
      <br>
      <hr>
      ${q.options[1].marks}
      </td>

      <td>
        <button 
          class="btn btn-sm btn-primary swap-btn"
          data-index="${index}"
          data-type="either_or"
          data-option="a"
          data-topic_id="${q.options[0].topic_id}"
          data-btl="${q.options[0].btl}"
          data-mark="${q.options[0].marks}"
        >Swap</button>
        <br>
        <hr>
        <button 
          class="btn btn-sm btn-primary swap-btn"
          data-index="${index}"
          data-type="either_or"
          data-option="b"
          data-topic_id="${q.options[1].topic_id}"
          data-btl="${q.options[1].btl}"
          data-mark="${q.options[1].marks}"
        >Swap </button>
      </td>
    </tr>
  `;
    }
  });

  html += `
      </tbody>
    </table>

    <div class="row">
      <div class="col mt-3 d-flex justify-content-end gap-2">
        <input type="text" id="qp_name" class="form-control" placeholder="Enter Question Paper Name" style="max-width:300px;" />
        <button id="questionupload" class="btn btn-primary">Save Question Paper</button>
      </div>
    </div>
  `;

  $("#questions_div").html(html);

  $(".swap-btn")
    .off("click")
    .on("click", function () {
      let index = parseInt($(this).data("index"));
      let type = $(this).data("type");

      if (type === "single") {
        let topicId = $(this).data("topic_id");
        let btl = $(this).data("btl");
        let mark = $(this).data("mark");

        let questionIds = generatedQuestions
          .filter((q) => q.type === "single" && q.topic_id == topicId)
          .map((q) => q.id);

        getSwapQuestion({
            type: "single",
            topic_id: topicId,
            btl_level: btl,
            mark: mark,
            question_id: questionIds,
          },
          index
        );
      }

      if (type === "either_or") {
        let topicId = $(this).data("topic_id");
        let btl = $(this).data("btl");
        let mark = $(this).data("mark");

        let questionIds = [];
        generatedQuestions.forEach((q) => {
          if (q.type === "either_or") {
            questionIds.push(q.options[0].id, q.options[1].id);
          }
        });

        getSwapQuestion({
            type: "either_or",
            topic_id: topicId,
            btl_level: btl,
            mark: mark,
            question_id: questionIds,
          },
          index
        );
      }
    });

  function mcqQuestioPaper() {
    let questionPaperName = $("#qp_name").val().trim();
    if (!questionPaperName) {
      alert("Please enter a valid name.");
      return;
    }

    const question_rows = generatedQuestions.map((q) => {

      if (q.type === "single") {
        return {
          type: "single",
          btl: q.btl,
          marks: q.marks,
          topic_id: [q.topic_id],
          question_ids: [q.id],
          no_of_questions: 1,
          question_number: q.number,
        };
      }
      if (q.type === "either_or") {
        return {
          type: "either_or",
          questions: q.options.map((opt) => ({
            marks: opt.marks,
            topic_id: [opt.topic_id],
            question_ids: [opt.id],
            no_of_questions: 1,
            question_number: q.number,
          }))
        };
      }
    });

    uploadMcqQuestioPaper(question_rows, questionPaperName);
  }

  $("#selectparameter").off("click").on("click", () => changeTemplate());
  $("#questionupload").off("click").on("click", () => mcqQuestioPaper());


  try {
    if (window.MathJax) {
      if (MathJax.typesetPromise) await MathJax.typesetPromise();
      else if (MathJax.typeset) MathJax.typeset();
    }
  } catch (err) {
    console.error("MathJax error:", err);
  }
}