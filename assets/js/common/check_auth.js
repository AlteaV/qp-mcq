let loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

if (loggedInUser == null) {
  document.location.href = "/login.html";
}

function logout() {
  sessionStorage.clear();
  document.location.href = "/";
}

const actions = {
  edit: "edit",
  view: "view",
};

const pages = {
  index: {
    url: "index.html",
    navTitle: "Questions",
    navLink: "Manage Questions",
  },
  questions_bulk_upload: {
    url: "questions_bulk_upload.html",
    navTitle: "Questions",
    navLink: "Bulk Uploads",
  },
  quill_add_quetion: {
    url: "quill_add_quetion.html",
    navTitle: "Questions",
    navLink: "Quill Add Quetion",
  },
  template_generator: {
    url: "template_generator.html",
    navTitle: "Template",
    navLink: "New Template",
  },
  generate_using_template: {
    url: "generate_using_template.html",
    navTitle: "Question Paper",
    navLink: "Generate Question Paper",
  },
  view_template: {
    url: "view_template.html",
    navTitle: "Template",
    navLink: "View Template",
  },
  view_qp: {
    url: "view_qp.html",
    navTitle: "Question Paper",
    navLink: "Download Question Paper",
  },
  upload_question: {
    url: "mcq_question_upload.html",
    navTitle: "Question Paper",
    navLink: "Question Upload",
  },
};

const examCellPermission = [
  {
    page: pages.index,
    action: actions.edit,
  },
  {
    page: pages.questions_bulk_upload,
    action: actions.edit,
  },
  {
    page: pages.template_generator,
    action: actions.edit,
  },
  {
    page: pages.upload_question,
    action: actions.edit,
  },
  {
    page: pages.generate_using_template,
    action: actions.edit,
  },
  {
    page: pages.view_template,
    action: actions.edit,
  },
  {
    page: pages.view_qp,
    action: actions.edit,
  },
];

const roles = {
  COE: examCellPermission,
};

var path = window.location.pathname;
const current_page = path.split("/").pop();

const permission = roles[loggedInUser["type"]];

if (permission == undefined) {
  sessionStorage.clear();
  document.location.href = "/login.html";
}

const currentPagePermission = permission.find(
  (a) => a.page.url == current_page
);

if (currentPagePermission == undefined) {
  if (permission.length == 0) {
    alert("Not autorised");
    logout();
  } else {
    window.location.href = permission[0]["page"]["url"];
  }
}

function createNavMenu() {
  let menuGroup = groupObject(permission, (v) => v.page.navTitle);

  let menuItems = "";

  Object.entries(menuGroup).forEach((element) => {
    const [key, value] = element;

    if (value.length == 1) {
      let isActive = value[0].page.url == current_page ? "active" : "";
      menuItems +=
        '<a href="' +
        value[0].page.url +
        '" class="nav-item nav-link ' +
        isActive +
        '">' +
        value[0].page.navLink +
        "</a>";
    } else {
      let isActiveIndex = value.findIndex((x) => x.page.url == current_page);
      let linkActive = isActiveIndex != -1 ? "active" : "";
      menuItems += '<div class="nav-item dropdown">';
      menuItems +=
        '<a href="#" class="nav-link dropdown-toggle ' +
        linkActive +
        '"  data-bs-toggle="dropdown" >' +
        value[0].page.navTitle +
        "</a>";
      menuItems += '<div class="dropdown-menu">';

      for (let i = 0; i < value.length; i++) {
        const menuItem = value[i];
        let itemActive = menuItem.page.url == current_page ? "active" : "";
        menuItems +=
          '<a href="' +
          menuItem.page.url +
          '" class="dropdown-item ' +
          itemActive +
          '">' +
          menuItem.page.navLink +
          "</a>";
      }

      menuItems += "</div>";
      menuItems += "</div>";
    }
  });

  document.getElementById("nav-body").innerHTML = menuItems;
  changeLogo();
}

function changeLogo() {
  let imageSrc = "";
  let prefix = "";
  if (loggedInUser["institution"] == "CARE College of Engineering") {
    imageSrc = "assets/img/engineering.png";
  } else if (loggedInUser["institution"] == "CARE College of Arts & Science") {
    imageSrc = "assets/img/arts.jpg";
  } else if (loggedInUser["institution"] == "C.A.R.E School of Atchitecture") {
    imageSrc = "assets/img/arch.png";
  } else {
    imageSrc = "assets/img/care-logo.png";
  }

  document.getElementById("logo").src = prefix + imageSrc;
}

var groupObject = (x, f) =>
  x.reduce((a, b, i) => ((a[f(b, i, x)] ||= []).push(b), a), {});

// createNavMenu();

document.addEventListener("readystatechange", () => {
  if (document.readyState == "complete") createNavMenu();
});
