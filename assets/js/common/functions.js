var cachedDepartment = JSON.parse(sessionStorage.getItem("program_details"));

const difficultyColors = {
  Easy: "#2ec4b6",
  Medium: "#ffd166",
  Hard: "#ff9f1c",
  "Very Hard": "#e71d36",
};

function validateForm() {
  validate = true;
  var validate_inputs = document.querySelectorAll("#exampleModalCenter *");
  validate_inputs.forEach(function (vaildate_input) {
    vaildate_input.classList.remove("warning");
    if (vaildate_input.hasAttribute("required")) {
      if (vaildate_input.value.length == 0) {
        validate = false;
        vaildate_input.classList.add("warning");
      }
      if (
        vaildate_input.name == "student_email" &&
        vaildate_input.value.length > 0
      ) {
        if (!validateEmail(vaildate_input.value)) {
          validate = false;
          vaildate_input.classList.add("warning");
        }
      }
    }
  });
  return validate;
}

if (typeof window.TableStructure === "undefined") {
  window.TableStructure = class TableStructure {
    constructor(data, colSpan, rowSpan, classes, style, attributes) {
      this.data = data;
      this.colSpan = colSpan ?? "";
      this.rowSpan = rowSpan ?? "";
      this.classes = classes ?? "";
      this.style = style ?? "";
      this.attributes = attributes ?? "";
    }
  };
}

function displayResult(tableData, element) {
  element.innerHTML = "";
  let thead = document.createElement("thead");
  tableData.tableHeader.forEach((row) => {
    let tr = document.createElement("tr");
    row.forEach((cell) => {
      let th = document.createElement("th");
      if (cell.rowSpan !== "") {
        th.rowSpan = cell.rowSpan;
      }
      if (cell.colSpan !== "") {
        th.colSpan = cell.colSpan;
      }
      th.innerHTML = cell.data;
      th.className = cell.classes;
      th.style.cssText = cell.style;
      th.attributes = cell.attributes;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  });

  let tbody = document.createElement("tbody");
  tableData.tableBody.forEach((row) => {
    let tr = document.createElement("tr");
    row.forEach((cell) => {
      let td = document.createElement("td");
      if (cell.rowSpan !== "") {
        td.rowSpan = cell.rowSpan;
      }
      if (cell.colSpan !== "") {
        td.colSpan = cell.colSpan;
      }
      td.innerHTML = cell.data;
      td.className = cell.classes;
      td.style.cssText = cell.style;
      td.attributes = cell.attributes;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  element.appendChild(thead);
  element.appendChild(tbody);
}

function displayMultipleTables({ data: data, tableElement: table }) {
  table.innerHTML = "";
  data.forEach((tableData) => {
    let tbl = document.createElement("table");
    tbl.classList.add("table", "table-bordered");
    tbl.style.width = "100%";
    displayResult(tableData, tbl);
    table.appendChild(tbl);
  });
}

function showOverlay() {
  var isOverlayExists = document.getElementById("overlay");
  if (isOverlayExists) {
    isOverlayExists.parentNode.removeChild(isOverlayExists);
  }

  var overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.classList.add("overlay");

  var spinner = document.createElement("div");
  spinner.classList.add("spinner");

  var loadingText = document.createElement("h4");
  loadingText.classList.add("loading-text");
  loadingText.textContent = "Fetching Data. Please Wait.";

  overlay.appendChild(spinner);
  overlay.appendChild(loadingText);

  var dashboardContent = document.querySelector(".dashboard-content");
  dashboardContent.appendChild(overlay);
  overlay.style.display = "block";
}

function hideOverlay() {
  var overlay = document.getElementById("overlay");
  if (overlay) overlay.parentNode.removeChild(overlay);
}

function resetResult(fetchingDataSection, resultSection) {
  if (fetchingDataSection) {
    fetchingDataSection.style.display = "none";
    resultSection.style.display = "none";
  }
}

function setDropDown(options, element) {
  element.innerHTML = "";
  options.forEach((option) => {
    var opt = document.createElement("option");
    opt.value = option.value;
    opt.innerHTML = option.html;
    if (option["selected"] !== undefined) {
      opt.selected = true;
    }
    if (option["disabled"] !== undefined) {
      opt.disabled = option.disabled;
    }
    element.appendChild(opt);
  });
}

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

function createEditButton(data, attributes) {
  return (
    '<button class="btn btn-primary edit-button" ' +
    attributes +
    " data-full=" +
    encodeURIComponent(JSON.stringify(data)) +
    '><i class="fas fa-pencil-alt"></i></button>'
  );
}

function createButton(
  data,
  attributes,
  buttonClass,
  icon,
  isTextButton = false,
) {
  if (!isTextButton) {
    return (
      '<button class="btn btn-primary ' +
      buttonClass +
      '" ' +
      attributes +
      " data-full=" +
      encodeURIComponent(JSON.stringify(data)) +
      '><i class="' +
      icon +
      '"></i></button>'
    );
  } else {
    return (
      '<button class="btn btn-primary ' +
      buttonClass +
      '" ' +
      attributes +
      " data-full=" +
      encodeURIComponent(JSON.stringify(data)) +
      ">" +
      icon +
      "</button>"
    );
  }
}

function sanitizeInput(input) {
  let regex = /[&<>"'/]/g;

  let sanitizedInput = input.replace(regex, function (match) {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#x27;";
      case "/":
        return "&#x2F;";
      default:
        return match;
    }
  });

  return sanitizedInput.trim();
}

function getBtlLevels() {
  let btlLevels = sessionStorage.getItem("btl_levels");
  if (btlLevels) {
    return JSON.parse(btlLevels);
  }
  return [];
}

function renderTableFromMarkdown(markdown) {
  if (!markdown) return "";

  // const converter = new showdown.Converter({
  //   tables: true,
  // });

  // const htmlContent = converter.makeHtml(markdown);
  let htmlContent = renderQuestionText(markdown);

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

function getDifficultyBadge(difficulty) {
  return `<span class="badge" style="background:${difficultyColors[difficulty] || "#ccc"}">${difficulty || "Unknown"}</span>`;
}

function cleanUnicodeSubscripts(text) {
  if (!text) return "";

  // 1. Fix the Unicode subscripts (e.g., \u2081 -> _{1})
  // This handles both single and double escaped versions
  const literalSubscriptRegex = /(\\+u208\d)+/g;
  let cleaned = text.replace(literalSubscriptRegex, (match) => {
    const digits = match
      .split(/\\+u208/)
      .filter(Boolean)
      .join("");
    return `_{${digits}}`;
  });

  // 2. The "Power Wash" for ldots
  // This regex looks for:
  // - ldots (no slash)
  // - \ldots (single slash)
  // - \\ldots (double slash)
  // And forces them all to be exactly \ldots
  cleaned = cleaned.replace(/\\*ldots/g, "\\ldots");

  // 3. Optional: Fix other common symbols if they break
  const commonSymbols = ["alpha", "beta", "gamma", "sum", "prod"];
  commonSymbols.forEach((sym) => {
    const reg = new RegExp(`\\\\*${sym}`, "g");
    cleaned = cleaned.replace(reg, `\\${sym}`);
  });

  return cleaned;
}

function parseChoices(choices) {
  if (!choices || typeof choices !== "string") return choices || {};

  const raw = choices.trim();
  if (raw === "" || raw === "None") return {};

  try {
    return JSON.parse(raw);
  } catch (e) {}

  try {
    let sanitized = raw;

    // Convert single-quoted keys to double-quoted keys    // This regex looks for patterns like 'key': and replaces them with "key":
    sanitized = sanitized.replace(/'([^']+?)'\s*:/g, '"$1":');

    // Convert single-quoted string values to double-quoted values
    // while preserving apostrophes inside already double-quoted strings
    sanitized = sanitized.replace(/:\s*'([^']*)'/g, ': "$1"');

    // Also handle comma-separated single-quoted values
    sanitized = sanitized.replace(/,\s*'([^']*)'/g, ', "$1"');

    return JSON.parse(sanitized);
  } catch (err) {
    console.error("Failed to parse choices:", err, choices);
    return {};
  }
}

function renderQuestionText(question) {
  const converter =
    typeof showdown !== "undefined"
      ? new showdown.Converter({
          tables: true,
          simplifiedAutoLink: true,
          strikethrough: true,
          tasklists: true,
        })
      : null;

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeAcademicLatex(text) {
    let t = String(text || "");

    t = t.replace(/\\\\/g, "\\");
    t = t.replace(/\\mathrm\{H\}_2\\mathrm\{SO\}_4/g, "\\mathrm{H_2SO_4}");
    t = t.replace(/\\mathrm\{BF\}_3/g, "\\mathrm{BF_3}");
    t = t.replace(/\\mathrm\{NH\}_3/g, "\\mathrm{NH_3}");
    t = t.replace(/\\mathrm\{PF\}_3/g, "\\mathrm{PF_3}");
    t = t.replace(/\\mathrm\{I\}_3\^-/g, "\\mathrm{I_3^-}");
    t = t.replace(/\\mathrm\{kJ\\ mol\}\^\{-1\}/g, "\\mathrm{kJ\\,mol^{-1}}");

    return t;
  }

  function protectMath(text) {
    const mathBlocks = [];

    const protectedText = text.replace(
      /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g,
      (match) => {
        const token = `MATHBLOCKTOKEN${mathBlocks.length}END`;
        mathBlocks.push(match);
        return token;
      },
    );

    return { protectedText, mathBlocks };
  }

  function restoreMath(text, mathBlocks) {
    let restored = text;

    mathBlocks.forEach((math, i) => {
      const token = `MATHBLOCKTOKEN${i}END`;
      restored = restored.replaceAll(token, math);
    });

    return restored;
  }

  let output = normalizeAcademicLatex(question || "");

  if (converter) {
    const { protectedText, mathBlocks } = protectMath(output);
    output = converter.makeHtml(protectedText);
    output = output.replace(/^<p>|<\/p>$/g, "");
    output = restoreMath(output, mathBlocks);
  } else {
    output = escapeHtml(output);
  }

  return output;
}

function removeTableFromQuestion(question, table) {
  if (!question) return "";

  let q = String(question);

  // normalize escaped newlines into real newlines
  q = q.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

  // if a specific table string is provided, try removing it after normalization
  if (table) {
    let t = String(table).replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();

    if (t) {
      const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      q = q.replace(new RegExp(escaped, "g"), "");
    }
  }

  // fallback: remove any markdown table block
  q = q.replace(/\n?\|.+\|\n\|(?:\s*:?-+:?\s*\|)+\n(?:\|.*\|\n?)*/g, "\n");

  // cleanup extra blank lines
  q = q.replace(/\n{3,}/g, "\n\n").trim();

  return q;
}
