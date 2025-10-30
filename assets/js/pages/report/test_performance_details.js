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
    let isCorrect = row.is_correct ? "Yes" : "No";
    let questionHTML = `
                <div style="margin-bottom: 20px;">
                    <p class="latex" style="font-size: 130%; font-family: 'Times New Roman', Times, serif; text-align: left;">
                    ${row.question}
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
