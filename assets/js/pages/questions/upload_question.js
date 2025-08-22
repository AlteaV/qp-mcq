function addQuestion() {
  var out = {};
  out.function = "aq";

  let htmlContent = editor1.getHTMLCode();
  var tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  var imgElements = tempDiv.querySelectorAll("img");

  var srcList = [];

  imgElements.forEach(function (img) {
    var src = img.getAttribute("src");
    srcList.push(src);
  });

  let question = removeTags(editor1.getPlainText().trim());
  out.questions = [
    {
      sub_code: formSubCode.value,
      question: question,
      marks: formMarks.value,
      btl: formBtl.value,
      co: formCo.value,
      unit: formUnit.value,
      images: srcList,
    },
  ];

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      // questions.push({
      //   id: response.result.id,
      //   sub_code: formSubCode.value,
      //   question: question,
      //   marks: formMarks.value,
      //   btl: formBtl.value,
      //   co: formCo.value,
      //   unit: formUnit.value,
      //   images: srcList,
      // });
      success();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}

function updateQuestion() {
  var out = {};
  out.function = "uq";
  out.sub_code = formSubCode.value;
  out.question = formQuestion.value;
  out.marks = formMarks.value;
  out.btl = formBtl.value;
  out.co = formCo.value;
  out.unit = formUnit.value;
  out.id = formId.value;

  postCall(examCellEndPoint, JSON.stringify(out)).then((response) => {
    if (response.status == 200) {
      let questionIndex = questions.findIndex((q) => q.id == formId.value);

      questions[questionIndex].sub_code = formSubCode.value;
      questions[questionIndex].question = formQuestion.value;
      questions[questionIndex].marks = formMarks.value;
      questions[questionIndex].btl = formBtl.value;
      questions[questionIndex].co = formCo.value;
      questions[questionIndex].unit = formUnit.value;

      success();
    } else if (response.status == 409) {
      alert(response.message);
    } else {
      alert("Network error");
    }
  });
}
