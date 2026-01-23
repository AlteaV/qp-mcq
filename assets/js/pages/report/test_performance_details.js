let individualPerformanceDiv = document.getElementById(
  "individual_performance_div",
);
let backToReportBtn = document.getElementById("back_to_report_btn");
let individualPerformanceTable = document.getElementById(
  "individual_performance_table",
);
let filterDiv = document.getElementById("filters_div");
let studentInfo = document.getElementById("student_info");
resultDiv = document.getElementById("result_div");

backToReportBtn.addEventListener("click", () => {
  selectedStudent = null;
  if (loggedInUser.type != "Student") {
    filterDiv.style.display = "flex";
  }
  individualPerformanceDiv.style.display = "none";
  resultDiv.style.display = "block";
});

async function getIndividualPerformance(attempt_id, selectedStudent) {
  showOverlay();
  try {
    let payload = JSON.stringify({
      function: "gad",
      attempt_id: attempt_id,
    });
    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      showIndividualPerformanceSection(response.result.report);
      if (selectedStudent != null && loggedInUser.type != "Student") {
        studentInfo.innerHTML = `<b>Student Name: ${selectedStudent.user_name}<br><br>User ID: ${selectedStudent.user_id}</b>`;
      } else {
        studentInfo.innerHTML = ``;
      }
    }
  } catch (error) {
    hideOverlay();
    console.error(error);
    alert("An error occurred while fetching individual performance");
  }
}

async function showIndividualPerformanceSection(data) {
  filterDiv.style.display = "none";
  resultDiv.style.display = "none";
  individualPerformanceDiv.style.display = "block";

  let tableData = {
    tableHeader: [
      [
        new TableStructure("Q.NO"),
        new TableStructure("Question"),
        new TableStructure("Is Correct"),
        new TableStructure("Time Taken"),
      ],
    ],
    tableBody: [],
  };
  data.forEach((row, index) => {
    let isCorrect;
    if (row.is_correct) {
      isCorrect = "Yes";
    } else if (row.is_correct == null) {
      isCorrect = "Unattended";
    } else {
      isCorrect = "No";
    }

    let choices = row.choices;
    if (typeof choices === "string") {
      try {
        choices = JSON.parse(choices);
      } catch {
        choices = {};
      }
    }

    let choiceHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 120%; font-family: 'Times New Roman', Times, serif;">
    `;
    if (row.question_type === "Numerical") {
      let selected = "";
      let backgroundColor = "";
      let fontWeight = "bold";
      let padding = "5px";
      let borderRadius = "6px";

      if (row.is_correct === 1) {
        backgroundColor = "#87b97cff";
      } else {
        backgroundColor = "#f1e08aff";
      }
      choiceHTML += `
        <label style="
          display: flex;
          align-items: left;
          gap: 5px;
          background-color: ${backgroundColor};
          font-weight: ${fontWeight};
          padding: ${padding};
          border-radius: ${borderRadius};
        ">
          <input 
            type="text"
            name="question_${index}"
            value="${row.correct_answer}"
            style="width: 100%;"
            disabled
          />
        </label>
      `;
    } else if (row.question_type === "Mcq") {
      for (let key in choices) {
        let selected = "";
        let backgroundColor = "";
        let fontWeight = "normal";
        let padding = "5px";
        let borderRadius = "6px";

        if (key === row.correct_answer) {
          selected = "checked";
        }

        if (row.is_correct === 1 && key === row.correct_answer) {
          backgroundColor = "#87b97cff";
          fontWeight = "bold";
        }

        if (
          (row.is_correct === 0 || row.is_correct == null) &&
          key === row.correct_answer
        ) {
          backgroundColor = "#f1e08aff";
          fontWeight = "bold";
        }

        let inputId = `choices_${index}_${key}`;

        choiceHTML += `
        <label style="
          display: flex;
          align-items: left;
          gap: 5px;
          background-color: ${backgroundColor};
          font-weight: ${fontWeight};
          padding: ${padding};
          border-radius: ${borderRadius};
        ">
          <input 
            type="radio"
            id="${inputId}"
            name="question_${index}"
            value="${key}"
            ${selected}
            disabled
          />
          <span class="latex" style="font-size: 100%; font-family: 'Times New Roman', Times, serif;">
            ${choices[key]}
          </span>
        </label>
      `;
      }
    }

    choiceHTML += `</div>`;

    let questionHTML = `
                <div style="margin-bottom: 20px;">
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                    ${row.question}
                    </p>
                    ${choiceHTML}
                </div>
            `;

    tableData.tableBody.push([
      new TableStructure(index + 1),
      new TableStructure(questionHTML),
      new TableStructure(isCorrect),
      new TableStructure(row.time_taken),
    ]);
  });
  displayResult(tableData, individualPerformanceTable);
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
  individualPerformanceDiv.style.display = "block";
  hideOverlay();
}
