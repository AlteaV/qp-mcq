class View {
  constructor(controller) {
    this.controller = controller;
    this.subject = document.getElementById("subject");
    this.getQuestionsButton = document.getElementById("take_test");
    this.submitTest = document.getElementById("submit_test");

    this.resultTable = document.getElementById("result_table");
    this.resultDiv = document.getElementById("result_div");

    this.getQuestionsButton.addEventListener("click", () => {
      if (this.controller) {
        this.controller.getQuestionForTakeTest();
      }
    });

    this.submitTest.addEventListener("click", () => {
      if (this.controller) {
        this.controller.submitTest();
      }
    });
  }

  renderProgramTypes(subcode) {
    setDropDown(subcode, this.subject);
    const defaultProgram = subcode.find((item) => item.value == "APT101");
    if (defaultProgram) {
      this.subject.value = defaultProgram.html;
    }
  }

  showReportSection(data) {
    if (data.length === 0) {
      this.fetchingDataSection.innerHTML = "<p>There is no data</p>";
      this.fetchingDataSection.style.display = "block";
      this.resultDiv.style.display = "none";
      hideOverlay();
      return;
    }

    let tableData = {
      tableHeader: [
        [new TableStructure("S.No"), new TableStructure("Questions & Options")],
      ],
      tableBody: [],
    };

    data.forEach((record, index) => {
      let choices = JSON.parse(record.choices);

      let choiceHTML = `<div style="display: flex; flex-direction: column; gap: 8px; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;

      for (let key in choices) {
        const inputId = `choices_${record.question_id}`;

        choiceHTML += `
                    <label for="${inputId}" style="display: flex; align-items: left; gap: 5px;">
                        <input 
                            type="radio" 
                            id="${inputId}" 
                            name="question_${record.question_id}"  
                            value="${key}" 
                        />
                        <span class="latex" style="font-size: 100%; font-family: 'Times New Roman', Times, serif;">
                            ${choices[key]}
                        </span>
                    </label>`;
      }

      choiceHTML += `</div>`;

      let questionHTML = `
                <div>
                    <p style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                         ${record.question}
                    </p>
                    ${choiceHTML}
                </div>
            `;

      tableData.tableBody.push([
        new TableStructure(index + 1),
        new TableStructure(questionHTML),
      ]);
    });

    displayResult(tableData, this.resultTable);

    hideOverlay();
    this.resultDiv.style.display = "block";
  }

  showResultValidation(questions) {
    let totalQuestions = questions.length;
    let correctCount = 0;

    questions.forEach((record, index) => {
      let correctAnswer = record.correct_answer;
      let selected = document.querySelector(
        `input[name="question_${record.question_id}"]:checked`
      );

      this.allOptions = document.querySelectorAll(
        `input[name="question_${record.question_id}"]`
      );

      this.allOptions.forEach((option) => {
        let label = option.parentElement;
        if (option.value == correctAnswer) {
          label.style.backgroundColor = "#87b97cff";
          label.style.fontWeight = "bold";
          label.style.padding = "5px";
          label.style.borderRadius = "6px";
        } else if (option.checked && option.value !== correctAnswer) {
          label.style.backgroundColor = "#df6e6eff";
          label.style.fontWeight = "bold";
          label.style.padding = "5px";
          label.style.borderRadius = "6px";
        }
        // else{
        //     label.style.backgroundColor = "#f0f0f0ff";
        //     label.style.fontWeight = "bold";
        // }
        option.disabled = true;
      });

      if (selected && selected.value == correctAnswer) {
        correctCount++;
      }
    });

    let scoreDiv = document.getElementById("score_div");
    if (!scoreDiv) {
      scoreDiv = document.createElement("div");
      scoreDiv.id = "score_div";
      scoreDiv.style.marginTop = "20px";
      scoreDiv.style.fontSize = "120%";
      scoreDiv.style.fontWeight = "bold";
      this.resultDiv.appendChild(scoreDiv);
    }
    scoreDiv.innerHTML = `Total Score: ${correctCount} / ${totalQuestions}`;
    this.submitTest.style.display = "none";
    // this.allOptions.disabled = true;
  }
}

class Controller {
  constructor(model) {
    this.model = model;
    this.view = null;
    this.questions = [];
  }
  setView(view) {
    this.view = view;
  }

  init() {
    const subCode = [{ html: "Aptitude Test Paper - 1", value: "APT101" }];
    this.view.renderProgramTypes(subCode);
  }

  async getQuestionForTakeTest() {
    showOverlay();
    try {
      let selectedSubject = this.view.subject.value;

      let payload = {
        function: "gqftt",
        subject_question_paper_id: 34,
      };

      let response = await postCall(examCellEndPoint, JSON.stringify(payload));

      if (response.success) {
        let question = response.result.questions;
        this.questions = question;
        this.view.showReportSection(question);
      }
    } catch (error) {
      console.error(error);
      hideOverlay();
      alert("An error occurred while fetching Questions");
    }
  }

  async submitTest() {
    showOverlay();
    try {
      let results = [];

      this.questions.forEach((item) => {
        let selected = document.querySelector(
          `input[name="question_${item.question_id}"]:checked`
        );
        let answer = selected ? selected.value : null;

        results.push({
          question_id: item.question_id,
          selected_option: answer,
        });
      });

      let payload = JSON.stringify({
        function: "iusa",
        user_id: 989437,
        sub_qp_id: 34,
        answers: results,
      });

      let response = await postCall(examCellEndPoint, payload);

      if (response.success) {
        this.questions = response.result.answers;
        this.view.showResultValidation(this.questions);
      }

      hideOverlay();
    } catch (error) {
      console.error(error);
      alert("An error occurred while submitting the test.");
    }
  }
}
document.addEventListener("readystatechange", async () => {
  if (document.readyState === "complete") {
    await Promise.all([]);
    let controller = new Controller();
    let view = new View(controller);
    controller.setView(view);
    controller.init();
  }
});
