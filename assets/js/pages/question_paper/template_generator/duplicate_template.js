$(document).ready(function () {
  var url_string = window.location;
  var url = new URL(url_string);
  var type = url.searchParams.get("type");

  if (type == "duplicate") {
    let templateDetails = JSON.parse(localStorage.getItem("template"));
    let template = JSON.parse(templateDetails.template);

    let marks = 0;

    template.forEach((section) => {
      marks += section.section_marks;
      allSectionNames.push(section.section_name);
      var sectionHtml = `<div class="section" data-section-name="${section.section_name}" data-section-marks="${section.section_marks}" style="padding: 15px; margin-top: 15px; border: 1px dotted rgb(204, 204, 204);">
                            <div class="d-flex justify-content-between">
                                <h3>Section ${section.section_name}</h3>
                                <button onclick="deleteSection(this)" style="background-color: rgb(245, 197, 203); color: rgb(101, 32, 39); border: none; padding: 8px 12px; cursor: pointer;">Delete Section</button>
                            </div>
                            <h6>Marks ${section.section_marks}</h6>
                            <div class="questions-container"></div>
                            <div class="row">
                                <div class="col">
                                    <label>Question Type:</label>
                                    <select class="divisionType form-select">
                                        <option value="single" selected>Single</option><
                                        <option value="eitherOr">Either Or</option>
                                    </select>
                                </div>
                                <div class="col align-self-end">
                                    <input type="button" value="Add to Section" onclick="addQuestionRow(this)" class="btn btn-primary">
                                </div>
                            </div>
                        </div>`;
      $("#sectionsContainer").append(sectionHtml);

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
      var sectionDiv = $(
        '.section[data-section-name="' + section.section_name + '"]'
      );
      var questionContainer = sectionDiv.find(".questions-container");
      groupedQuestions.forEach((questionGroup) => {
        let divisionType = "single";
        if (questionGroup.length > 1) {
          divisionType = "eitherOr";
        }
        var questionHtml = `<div class="question-row mb-5"  data-division-type="${divisionType}">
                              <row-div class="row">
                                  <div class="col-auto" style="align-self: center;">
                                      <i class="fas fa-trash" onclick="deleteQuestionRow(this)" style="color: red;"></i>
                                  </div>
                                  <div class="col-auto" style="align-self: center;">
                                      <h5 class="question_number">${questionGroup[0].question_number}</h5>
                                  </div>
                                  <div class="col">`;

        let q = questionGroup[0];
        questionHtml += buildRow(
          q.part,
          q.marks,
          q.no_of_questions,
          q.btl,
          q.units
        );
        if (questionGroup.length > 1) {
          questionHtml += `<p class="mb-2 mt-2 text-center text-uppercase fw-bold or-entry">OR</p>`;
          q = questionGroup[1];
          questionHtml += buildRow(
            q.part,
            q.marks,
            q.no_of_questions,
            q.btl,
            q.units
          );
        }

        questionHtml += `       </div>
                              </row-div>
                          </div>`;

        questionContainer.append(questionHtml);
        questionGroup.forEach((ques, index) => {});
      });
    });
    totalMarks.value = marks;
    $("#save_template_div").show();
  }

  function buildRow(part, marks, noOfQuestions, btl, units) {
    let questionRow = `<row-div class="row question">
                          <div class="col-auto" style="align-self: center;">
                              <h5>${part}</h5>
                          </div>
                          <div class="col">
                              <label class="required">Marks</label>
                              <input type="number" class="question-marks form-control" required="true" value="${marks}" />
                          </div>
                          <div class="col">
                              <label class="required">No of questions</label>
                              <input type="number" class="num-questions form-control" required="true" value="${noOfQuestions}" />
                          </div>
                          <div class="col">
                              <label class="required">BTL:</label>
                              <select class="btl form-select" required="true" >`;

    for (let i = 1; i <= 7; i++) {
      let isSelected = btl === `K${i}` ? "selected" : "";
      questionRow += `<option value="K${i}" ${isSelected}>K${i}</option>`;
    }

    questionRow += `</select>
                          </div>
                          <div class="col">
                          <label class="required">Unit</label>
                              <br>`;

    for (let i = 1; i <= 5; i++) {
      let isChecked = units.includes(i) ? "checked" : "";
      questionRow += `<div class="form-check form-check-inline">
                      <input class="unit form-check-input" type="checkbox" value="${i}" ${isChecked}>
                      <label>${i}</label>
                    </div>`;
    }
    questionRow += `</div>
                </row-div>`;

    return questionRow;
  }
});
