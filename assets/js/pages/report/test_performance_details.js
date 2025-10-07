let individualPerformanceDiv = document.getElementById(
  "individual_performance_div"
);
let backToReportBtn = document.getElementById("back_to_report_btn");
let individualPerformanceTable = document.getElementById(
  "individual_performance_table"
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

function showIndividualPerformanceSection(data) {
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
    let isCorrect = row.is_correct ? "Yes" : "No";

    let choices = row.choices;
    if (typeof choices === "string") {
      try {
        choices = JSON.parse(choices);
      } catch {
        choices = row.choices;
      }
    }
    let choiceHTML = `<div style="display: flex; flex-direction: column; gap: 8px; font-size: 120%; font-family: 'Times New Roman', Times, serif;">`;
    for (let key in choices) {
      let inputId = `choices_${row.question_id}`;
      choiceHTML += `
                    <label  style="display: flex; align-items: left; gap: 5px;  border-radius: 6px;">
                        <input 
                            type="radio" 
                            id="${inputId}" 
                            name="question_${row.question_id}"  
                            value="${key}" 
                            disabled
                        />
                        <span class="latex" style="font-size: 100%; font-family: 'Times New Roman', Times, serif;">
                            ${choices[key]}
                        </span>
                    </label>`;
    }

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
  MathJax.typeset();
  individualPerformanceDiv.style.display = "block";
  hideOverlay();
}
