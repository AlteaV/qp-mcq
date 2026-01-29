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
      block_id: q.block_id,
      question_type: q.question_type,
      table: q.table_data,
      images: q.images,
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
    topic_id: swapQuestion.topic_id,
    question: swapQuestion.question,
    choices: swapQuestion.choices,
    btl: swapQuestion.btl_level,
    marks: swapQuestion.mark,
    block_id: swapQuestion.block_id,
    question_type: swapQuestion.question_type,
  };

  createQuestions();
}

async function createQuestions() {
  let html = `
    <button id="selectparameter" class="btn btn-primary">Change Template</button>
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
    if (q.question_type == "Mcq") {
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
    }

    let tableHtml = q.table ? `<p>${renderTableFromMarkdown(q.table)}</p>` : "";
    let imageHtml = "";
    if (q.images && q.images.length > 0) {
      q.images.forEach((imgObj) => {
        if (imgObj.image_base64) {
          imageHtml += ` 
        <div style="text-align: center; margin: 10px 0;">
          <img src="${imgObj.image_base64}" 
               alt="Question Image" 
               style="max-width: 300px; border: 1px solid #ccc; border-radius: 8px; padding: 5px;" />
        </div>`;
        }
      });
    }

    html += `
      <tr>
        <td>${q.number}</td>
        <td style="text-align: left;">
          <p class="latex">${q.question}</p>
          <p class="latex">${choicesInline}</p>
          ${tableHtml}
          ${imageHtml}
        </td>
        <td>${q.btl}</td>
        <td>${q.marks}</td>
       <td>
          <button 
            class="btn btn-sm btn-primary swap-btn"
            data-block_id="${q.block_id}"
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
      <input type="text" id="qp_name" class="form-control" placeholder="Enter Question Paper Name" style="max-width: 300px;" />
          <button id="questionupload" class="btn btn-primary">Save Question Paper</button>
      </div>
    </div>
  `;

  $("#questions_div").html(html);

  $(".swap-btn")
    .off("click")
    .on("click", function () {
      let index = $(this).closest("tr").index();
      let block_id = $(this).data("block_id");

      let questionIds = generatedQuestions.map((q) => q.id);
      let swapData = {
        template_id: currentTemplateId,
        block_id: block_id,
        question_id: questionIds,
      };
      getSwapQuestion(swapData, index);
    });

  function mcqQuestioPaper() {
    let questionPaperName = $("#qp_name").val().trim();

    if (!questionPaperName) {
      alert("Please enter a name for the question paper.");
      return;
    }
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

    uploadMcqQuestioPaper(question_rows, questionPaperName);
    return {
      question_rows,
    };
  }

  $("#selectparameter")
    .off("click")
    .on("click", function () {
      changeTemplate();
    });

  $("#questionupload")
    .off("click")
    .on("click", function () {
      mcqQuestioPaper();
    });
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
