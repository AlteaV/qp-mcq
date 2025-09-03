// get mcq questions

async function getMcqQuestions(templateID, topicID) {
  $("#fetching_question").show();
  var out = {};
  out.function = "gmqput";
  out.template_id = templateID;
  out.topic_id = topicID;

  postCall(QuestionUploadEndPoint, JSON.stringify(out)).then((response) => {
    if (response.success) {
      let quetionPaper = response.result.question_paper;
      if (quetionPaper && quetionPaper.length > 0) {
        generateQuestionPaper(quetionPaper, templateID);
      } else {
        $("#questions_div").hide();
        Swal.fire({
          icon: "info",
          title: "No Questions Found",
          text: "No questions are available for this subject. Please choose another subject or upload questions for this subject before generating.",
        }).then(() => {
          showInputfield(templateID);
        });
      }
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

//  get template

function getTemplate() {
  showFecthingDataSection("Fetching data");
  allTemplates = [];
  var out = {};
  out.function = "gtemp";

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      allTemplates = response.result.template;
      displayTemplateTable();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

// upload question paper

function uploadMcqQuestioPaper(questionPaper) {
  var out = {};
  out.function = "umcqqp";
  out.sub_code = "";
  out.name = "Aptitude";
  out.question = questionPaper;
  out.created_by = 99875;

  postCall(QuestionUploadEndPoint, JSON.stringify(out)).then((response) => {
    if (response.success) {
      const questionId = response.result.id;
      if (questionId) {
        showGeneratedQuestionID(questionId);
        alert(response.message);
      } else {
        alert(response.success);
      }
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

// Swap Questions

function getSwapQuestion(swapQuestions, index) {
  var out = {};
  out.function = "smq";
  out.topic_id = swapQuestions.topic_id;
  out.question_id = swapQuestions.question_id;
  out.mark = swapQuestions.mark;
  out.btl_level = swapQuestions.btl_level;

  postCall(QuestionUploadEndPoint, JSON.stringify(out)).then((response) => {
    if (response.success) {
      let swapquetion = response.result.question;
      if (swapquetion !== null) {
        showSwapQuestions(swapquetion, index);
      } else {
        alert("there is no alter question for this topic");
      }
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

// get subject

let subjectMap = [];
async function getSubjects() {
  try {
    showOverlay();
    let payload = JSON.stringify({
      function: "gss",
    });
    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      subjectMap = response.result.subject;
      hideOverlay();
      return subjectMap;
    } else {
      alert(response.message);
      hideOverlay();
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching subjects");
    hideOverlay();
  }
}

// get section
let sectionData = {};

async function getSection(subjectID) {
  try {
    showOverlay();

    if (sectionData[subjectID]) {
      hideOverlay();
      return sectionData[subjectID];
    }

    let payload = JSON.stringify({
      function: "gs",
      subject_id: subjectID,
    });

    let response = await postCall(QuestionUploadEndPoint, payload);

    if (response.success) {
      sectionData[subjectID] = response.result.section;
      hideOverlay();
      return sectionData[subjectID];
    }
    hideOverlay();
  } catch (err) {
    console.error("Error fetching topics", err);
  }
}

// get topic
let topicsdata = {};

async function getTopics(sectionID) {
  try {
    showOverlay();

    if (topicsdata[sectionID]) {
      hideOverlay();
      return topicsdata[sectionID];
    }

    const payload = JSON.stringify({
      function: "gt",
      section_id: sectionID,
    });
    const response = await postCall(mainEndPoint, payload);

    if (response.success) {
      topicsdata[sectionID] = response.result.topic;
      hideOverlay();
      return topicsdata[sectionID];
    }
    hideOverlay();
  } catch (err) {
    console.error("Error fetching topics", err);
  }
}
