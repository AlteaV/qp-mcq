const subject = document.getElementById("subject");

const fileInput = document.getElementById("file_input");
const fileUplaodButton = document.getElementById("submit_excel");
const saveQuestionsButton = document.getElementById("save_question");
const existingTable = document.getElementById("existing_table");
const existMessage = document.getElementById("duplicate_msg");
const fetchingData = document.getElementById("fetching_data");
const resultDiv = document.getElementById("result_div");
const resultTable = document.getElementById("result_table");
const downloadButton = document.getElementById("download_excel");

let questionForm = document.getElementById("question_form");
let questionInput = document.getElementById("question");
let optionAInput = document.getElementById("option_a");
let optionBInput = document.getElementById("option_b");
let optionCInput = document.getElementById("option_c");
let optionDInput = document.getElementById("option_d");
let optionEInput = document.getElementById("option_e");
let btlLevelDropDown = document.getElementById("btl_level");
let imageInput = document.getElementById("image");
let correctOptionDropDown = document.getElementById("correct_option");
let saveButton = document.getElementById("form_submit");

fileInput.addEventListener("click", () => {
    resultDiv.style.display = "none";
    fileInput.value = "";
});

subject.addEventListener("change", () => {
    const selectedSubjectId = subject.value;
    let sectionTopicData = getSectionTopic(selectedSubjectId);
    resultDiv.style.display = "none";
});

downloadButton.addEventListener("click", () =>
    downloadSampleExcel()
);

let questionsFormat = [];

const sectionFields = [];
let sectionTopics = [];
let btlLevel = [];
const sectionIdMap = {};
let questions = [];

// subject.addEventListener("input", subjectSelection);

async function init() {
    await getBtllevel();
    await getSubjects();
    const selectedSubjectId = subject.value;
    getSectionTopic(selectedSubjectId);
}

// btl level
async function getBtllevel() {
    if (btlLevel.length > 0) {
        return;
    }
    try {
        showOverlay();
        let payload = JSON.stringify({
            function: "gbl",
        });
        let response = await postCall(QuestionUploadEndPoint, payload);
        if (response.success) {
            btlLevel = response.result.btl_level;
        }
        hideOverlay();
    } catch (error) {
        console.error(error);
        alert("An error occurred while fetching BTL levels");
    } finally {
        hideOverlay();
    }
}

function renderSubject(sub) {
    let subj = sub.map((subject) => {
        return {
            html: subject.subject,
            value: subject.id
        };
    });
    setDropDown(subj, subject)
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

            renderSubject(subjectMap)
        }
        hideOverlay();
    } catch (error) {
        console.error(error);
        alert("An error occurred while fetching subjects");
    }
}

let sectopicbysubID = [];
let sectionTopic = [];

async function getSectionTopic(subjectID) {
    try {
        showOverlay();

        const secTopicData = sectopicbysubID.find((item) => item.subject === subjectID);
        if (secTopicData) {
            sectionTopic = secTopicData.section;
            hideOverlay();
            return;
        }

        const payload = JSON.stringify({
            function: "gstbs",
            org_id: 8107,
            subject_id: subjectID,
        });

        const response = await postCall(QuestionUploadEndPoint, payload);

        if (response.success) {
            sectionTopic = response.result.secTopic;
            sectopicbysubID.push({
                subject: subjectID,
                section: sectionTopic
            });
        }
        hideOverlay();
    } catch (err) {
        console.error("Error fetching section-topic data", err);
        hideOverlay();
    }
}

function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, {
            type: "binary"
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1
        });

        const expectedHeaders = ["Question", "Mark", "BTL"];

        const headers = rows[0];
        if (
            !headers ||
            headers.length !== expectedHeaders.length ||
            !expectedHeaders.every((header, index) => header === headers[index])
        ) {
            alert("Invalid Excel format. Expected: Question | Mark | BTL");
            this.view.fileInput.value = "";
            this.view.resultTable.innerHTML = "";
            return;
        }

        const questionData = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[0]) continue;

            questionData.push({
                question: row[0],
                mark: row[1],
                btl: row[2]
            });
        }

        showReportSection(questionData);
    };

    reader.readAsBinaryString(file);
}

async function submitQuestion() {
    try {
        showOverlay();

        document.querySelectorAll(".topic-field").forEach((select, index) => {
            questionsFormat[index].topic_id = select.value;
        });

        document.querySelectorAll(".btl-field").forEach((select, index) => {
            questionsFormat[index].btl_level = select.value.trim();
        });

        document.querySelectorAll(".marks-field").forEach((input, index) => {
            questionsFormat[index].marks = parseInt(input.value.trim(), 10) || null;
        });

        const topicError = questionsFormat.find(q => !q.topic_id);
        if (topicError) {
            alert(`Please select a topic for: "${topicError.question}"`);
            hideOverlay();
            return;
        }

        const btlError = questionsFormat.find(q => !q.btl_level);
        if (btlError) {
            alert(`Please select a BTL level for: "${btlError.question}"`);
            hideOverlay();
            return;
        }

        const markError = questionsFormat.find(q => !q.marks || q.marks <= 0);
        if (markError) {
            alert(`Please enter valid marks for: "${markError.question}"`);
            hideOverlay();
            return;
        }

        const out = {
            function: "qbue",
            created_by: loggedInUser.staff_id,
            questions: []
        };

        questionsFormat.forEach((q) => {
            let img = [];
            if (q.images && q.images.length > 0) {
                img = q.images.map((imgObj) => ({
                    img_id: imgObj.id || "",
                    img_base: imgObj.image_base64 || ""
                }));
            }

            out.questions.push({
                topic_id: parseInt(q.topic_id),
                question: q.question,
                img: img,
                mark: parseInt(q.mark),
                btl_level: parseInt(q.btl_level)
            });
        });

        const response = await postCall(QuestionUploadEndPoint, JSON.stringify(out));

        if (response.success) {
            alert("Questions submitted successfully!");
            resultTable.innerHTML = "";
            fileInput.value = "";
            resultDiv.style.display = "none";
        } else {
            if (response.status === 409) {

                console.log("response", response)

                Swal.fire({
                    title: "Duplicate Questions Found",
                    text: "Some questions already exist in the system. Please remove the duplicates and upload again.",
                    icon: "warning",
                    confirmButtonText: "Show Duplicates"
                }).then(() => {
                    const tableFormattedData = response.result.duplicate_questions.map((item, index) => ({
                        question_no: index + 1,
                        question: item.question,
                        images: [],
                        choices: {},
                        correct_answer: null,
                        section: null,
                        topic: item.topic_id,
                        btl_level: item.btl_level,
                        mark: item.mark
                    }));

                    console.log("table", tableFormattedData)
                    showExistingQuestion(tableFormattedData);
                });
            } else {
                Swal.fire({
                    title: "Message",
                    text: response.message,
                    icon: "info",
                    confirmButtonText: "OK"
                });
            }
        }
        hideOverlay();
    } catch (error) {
        console.error("submitQuestion Error:", error);
        alert("Error submitting questions.");
        hideOverlay();
    }
}


async function showExistingQuestion(data) {
    fetchingData.style.display = "none";
    resultTable.style.display = "none";
    existMessage.style.display = "block";

    if (data.length === 0) {
        fetchingData.innerHTML = "<p>There is no data</p>";
        fetchingData.style.display = "block";
        resultDiv.style.display = "none";
        hideOverlay();
        return;
    }

    let topics = [];

    if (sectionTopic.length > 0) {
        sectionTopic.forEach(sec => {
            if (sec.topics) {
                topics.push(...JSON.parse(sec.topics));
            }
        });
    }

    const tableData = {
        tableHeader: [
            [
                new TableStructure("S.No", "", "", "width: 5%;"),
                new TableStructure("Questions", "", "", "width: 28%;"),
                new TableStructure("Topic", "", "", "min-width: 200px;"),
                new TableStructure("BTL", "", "", "min-width: 100px;"),
                new TableStructure("Mark", "", "", "width: 10%;"),
            ],
        ],
        tableBody: [],
    };

    questionsFormat = [];
    data.forEach((record, index) => {

        const matchedBTL = btlLevel.find(b => b.level == record.btl_level);
  
        const matchedTopic = topics.find(t => t.topic_id == record.topic);
  
        tableData.tableBody.push([
            new TableStructure(index + 1),
            new TableStructure(record.question),
            new TableStructure(matchedTopic.topic),
            new TableStructure(matchedBTL.level_name),
            new TableStructure(record.mark)
        ]);
    });

    displayResult(tableData, existingTable);
    resultDiv.style.display = "block";
    resultTable.style.display = "none";
    saveQuestionsButton.style.display = "none";

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
}

async function showReportSection(data) {
    fetchingData.style.display = "none";

    if (data.length === 0) {
        fetchingData.innerHTML = "<p>There is no data</p>";
        fetchingData.style.display = "block";
        resultDiv.style.display = "none";
        hideOverlay();
        return;
    }

    const tableData = {
        tableHeader: [
            [
                new TableStructure("S.No", "", "", "width: 5%;"),
                new TableStructure("Questions", "", "", "width: 28%;"),
                new TableStructure("Section", "", "", "min-width: 200px"),
                new TableStructure("Topic", "", "", "min-width: 200px;"),
                new TableStructure("BTL", "", "", "min-width: 100px;"),
                new TableStructure("Mark", "", "", "width: 10%;"),
                new TableStructure("Action", "", "", "width: 1%;"),
            ],
        ],
        tableBody: [],
    };

    questionsFormat = [];

    data.forEach((record, index) => {
        const choices = record.choices || {};
        let questionHTML = `<p class="latex" style="font-size: 125%; font-family: 'Times New Roman', Times, serif; text-align: left; margin-bottom: 10px;">${record.question}</p>`;

        if (record.images && record.images.length > 0) {
            record.images.forEach((imgObj) => {
                if (imgObj.image_base64) {
                    questionHTML += `
        <div style="text-align: center; margin: 10px 0;">
          <img src="${imgObj.image_base64}" 
               alt="Question Image" 
               style="max-width: 300px; border: 1px solid #ccc; border-radius: 8px;         padding: 5px;" />
        </div>`;
                }
            });
        }

        const marksFieldId = `marks_input_${index}`;
        const marksField = `
        <input 
          type="number" 
          id="${marksFieldId}" 
          class="form-control marks-field" 
          value="${record.mark}" 
          min="1" 
          style="min-width: 200px"
        />`;

        let sectionOptions = sectionTopic.map(sec => {
            return `<option value="${sec.section_id}">${sec.section}</option>`;
        }).join("");

        let sectionField = `
        <select id="section_input_${index}" 
                class="form-control section-field" 
                data-index="${index}" 
                style="min-width: 200px;">
            <option value="">Select Section</option>
            ${sectionOptions}
        </select>`;

        let topicField = `
        <select id="topic_input_${index}" 
        class="form-control topic-field" 
        data-index="${index}" 
        style="min-width: 200px;">
        <option value="">Select Topic</option>
        </select>`;

        let btlField = `
        <select id="btl_input_${index}" 
                class="form-control btl-field" 
                style="min-width: 100px" 
                data-index="${index}">
        <option value="">Select BTL</option>
        ${btlLevel.map(level => {
            return `<option value="${level.level}" ${record.btl == level.level ? "selected" : ""}>
                ${level.level_name}
            </option>`;
        }).join("")}
        </select>`;

        let editButton = createButton({
                question: record,
                index: index,
            },
            "",
            "edit-button",
            "fas fa-pencil-alt"
        );

        let deleteButton = createButton({
                question: record,
                index: index,
            },
            "",
            "delete-button btn-danger",
            "fas fa-trash-alt"
        );

        tableData.tableBody.push([
            new TableStructure(index + 1),
            new TableStructure(record.question),
            new TableStructure(sectionField),
            new TableStructure(topicField),
            new TableStructure(btlField),
            new TableStructure(marksField),
            // new TableStructure(editButton),
            new TableStructure(deleteButton),
        ]);

        questionsFormat.push({
            question_no: index + 1,
            question: record.question,
            images: record.images || [],
            choices,
            correct_answer: record.correct_answer,
            section: record.section,
            topic: record.topic,
            btl_level: record.btl_level,
            mark: record.mark,
        });
    });

    displayResult(tableData, resultTable);
    resultDiv.style.display = "block";

    $("#result_table")
        .off("click", ".edit-button")
        .on("click", ".edit-button", (event) => {
            const $button = $(event.currentTarget);
            const fullData = JSON.parse(
                decodeURIComponent($button.attr("data-full"))
            );
            editQuestion(fullData);
        });

    $("#result_table")
        .off("click", ".delete-button")
        .on("click", ".delete-button", (event) => {
            const $button = $(event.currentTarget);
            const fullData = JSON.parse(
                decodeURIComponent($button.attr("data-full"))
            );
            deleteQuestion(fullData);
        });

    for (let index = 0; index < questionsFormat.length; index++) {
        const record = questionsFormat[index];
        const marksInput = document.getElementById(`marks_input_${index}`);
        if (marksInput) {
            marksInput.addEventListener("change", (e) => {
                questionsFormat[index].marks = parseInt(e.target.value, 10) || 1;
            });
        }

        const choices = record.choices;
        for (let key in choices) {
            const radioId = `answer_${index}_${key}`;
            const radioInput = document.getElementById(radioId);
            if (radioInput) {
                radioInput.addEventListener("change", (e) => {
                    questionsFormat[index].correct_answer = e.target.value;
                });
            }
        }
        const sectionDropdown = document.getElementById(`section_input_${index}`);
        const topicDropdown = document.getElementById(`topic_input_${index}`);

        sectionDropdown.addEventListener("change", () => {
            topicDropdown.innerHTML = `<option value="">Select Topic</option>`;
            const selectedSectionId = sectionDropdown.value;

            const matchedSection = sectionTopic.find(s => s.section_id == selectedSectionId);

            if (matchedSection && matchedSection.topics) {
                const topicsArray = JSON.parse(matchedSection.topics);

                topicsArray.forEach(topic => {
                    if (topic.topic) {
                        topicDropdown.innerHTML += `<option value="${topic.topic_id}">
                    ${topic.topic}
                </option>`;
                    }
                });
            }

            questionsFormat[index].section_id = selectedSectionId;
            questionsFormat[index].topic_id = "";
        });
    }
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
}


// function renderTableFromMarkdown(markdown) {
//     if (!markdown) return "";

//     const converter = new showdown.Converter({
//         tables: true,
//     });

//     const htmlContent = converter.makeHtml(markdown);

//     return `
//     <div class="question-table">
//       <style>
//         .question-table table {
//           width: 100%;
//           border-collapse: collapse;
//         }
//         .question-table th,
//         .question-table td {
//           border: 1px solid #333;
//           padding: 8px;
//           text-align: center;
//         }
//         .question-table th {
//           background-color: #f2f2f2;
//         }
//       </style>
//       ${htmlContent}
//     </div>
//   `;
// }


// function editQuestion(data) {
//     const index = data.index;
//     const questionData = data.question;

//     questionInput.value = questionData.question || "";

//     imageInput.value = "";

//     $("#modal").modal("show");

//     $("#modal")
//         .off("click", "#form_submit")
//         .on("click", "#form_submit", async (event) => {
//             event.preventDefault();
//             questionForm.classList.add("was-validated");

//             if (!questionForm.checkValidity()) return;

//             let updatedImages = questionsFormat[index].images || [];
//             if (imageInput.files.length > 0) {
//                 updatedImages = await getBase64Images(imageInput.files);
//             }

//             const sectionDropdown = document.getElementById(`section_input_${index}`);
//             const topicDropdown = document.getElementById(`topic_input_${index}`);
//             const btlDropdown = document.getElementById(`btl_input_${index}`);
//             const marksInput = document.getElementById(`marks_input_${index}`);

//             questionsFormat[index].question = questionInput.value;
//             questionsFormat[index].images = updatedImages;
//             questionsFormat[index].section_id = sectionDropdown ? sectionDropdown.value : questionsFormat[index].section_id;
//             questionsFormat[index].topic_id = topicDropdown ? topicDropdown.value : questionsFormat[index].topic_id;
//             questionsFormat[index].btl_level = btlDropdown ? btlDropdown.value : questionsFormat[index].btl_level;
//             questionsFormat[index].marks = marksInput ? parseInt(marksInput.value, 10) || 1 : questionsFormat[index].marks;

//             showReportSection(questionsFormat);


//             $("#modal").modal("hide");
//         });
// }


// async function getBase64Images(files) {
//     const base64Images = [];
//     for (const file of files) {
//         const base64 = await toBase64(file);
//         base64Images.push({
//             image_base64: base64
//         });
//     }
//     return base64Images;
// }

// function toBase64(file) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(reader.result);
//         reader.onerror = reject;
//         reader.readAsDataURL(file);
//     });
// }


function deleteQuestion(data) {
    let index = data.index;
    questionsFormat.splice(index, 1);
    showReportSection(questionsFormat);
}


fileUplaodButton.addEventListener("click", async () => {
    if (subject.value.trim() == "") {
        alert("Please select a subject before uploading the question.");
        return;
    }
    if (!fileInput.files || fileInput.files.length == 0) {
        alert("Please upload a file!.");
        return;
    }
    handleFileUpload();
});

saveQuestionsButton.addEventListener("click", async () => {
    await submitQuestion();
});

function downloadSampleExcel() {
    try {
        const sampleData = [
            ["Question", "Mark", "BTL"],
            ["Classify the types of tests on stones ", "2", "1"],
            ["What is meant by dressing of stones?  ", "2", "1"],
            ["Discuss the role of equipment like cranes, scaffolding, and derricks in ensuring safety and efficiency during the erection process.", "16", "3"],
            ["Discuss the importance of thermal insulation and fire protection in buildings and Explain the different types of insulation materials.  ", "16", "1"],
        ];

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

        worksheet['!cols'] = [{
                wch: 80
            },
            {
                wch: 10
            },
            {
                wch: 10
            }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");

        const xlsFile = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array"
        });
        const blob = new Blob([xlsFile], {
            type: "application/octet-stream"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "questions.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error downloading sample Excel:", error);
    }
}

document.addEventListener("readystatechange", async () => {
    if (document.readyState === "complete") {
        showOverlay();

        if (!window.isCheckAuthLoaded) {
            const checkInterval = setInterval(() => {
                if (window.isCheckAuthLoaded) {
                    clearInterval(checkInterval);
                    init();
                }
            }, 100);
            return;
        } else {
            init();
        }
    }
});