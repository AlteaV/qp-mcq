const loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

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

// const roles = {
//   COE: examCellPermission,
// };

// var path = window.location.pathname;
// const current_page = path.split("/").pop();

// const permission = roles[loggedInUser["type"]];

// if (permission == undefined) {
//   sessionStorage.clear();
//   document.location.href = "/login.html";
// }

// const currentPagePermission = permission.find(
//   (a) => a.page.url == current_page
// );

// if (currentPagePermission == undefined) {
//   if (permission.length == 0) {
//     alert("Not autorised");
//     logout();
//   } else {
//     window.location.href = permission[0]["page"]["url"];
//   }
// }

// function createNavMenu() {
//   let menuGroup = groupObject(permission, (v) => v.page.navTitle);

//   let menuItems = "";

//   Object.entries(menuGroup).forEach((element) => {
//     const [key, value] = element;

//     if (value.length == 1) {
//       let isActive = value[0].page.url == current_page ? "active" : "";
//       menuItems +=
//         '<a href="' +
//         value[0].page.url +
//         '" class="nav-item nav-link ' +
//         isActive +
//         '">' +
//         value[0].page.navLink +
//         "</a>";
//     } else {
//       let isActiveIndex = value.findIndex((x) => x.page.url == current_page);
//       let linkActive = isActiveIndex != -1 ? "active" : "";
//       menuItems += '<div class="nav-item dropdown">';
//       menuItems +=
//         '<a href="#" class="nav-link dropdown-toggle ' +
//         linkActive +
//         '"  data-bs-toggle="dropdown" >' +
//         value[0].page.navTitle +
//         "</a>";
//       menuItems += '<div class="dropdown-menu">';

//       for (let i = 0; i < value.length; i++) {
//         const menuItem = value[i];
//         let itemActive = menuItem.page.url == current_page ? "active" : "";
//         menuItems +=
//           '<a href="' +
//           menuItem.page.url +
//           '" class="dropdown-item ' +
//           itemActive +
//           '">' +
//           menuItem.page.navLink +
//           "</a>";
//       }

//       menuItems += "</div>";
//       menuItems += "</div>";
//     }
//   });

//   document.getElementById("nav-body").innerHTML = menuItems;
//   changeLogo();
// }

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

const menuItems = [
  {
    text: "MCQ Staff",
    icon: "fas fa-pager",
    dropdown: true,
    items: [
      {
        href: "/manage_subject.html",
        text: "Manage Subjects",
      },
      {
        href: "/manage_section.html",
        text: "Manage Sections",
      },
      {
        href: "/manage_topic.html",
        text: "Manage Topics",
      },
      {
        href: "/mcq_question_upload.html",
        text: "MCQ Question Upload",
      },
      {
        href: "/mcq_create_template.html",
        text: "Create McQ Template",
      },
      {
        href: "/mcq_view_template.html",
        text: "View McQ Template",
      },
      {
        href: "/generate_mcq_question_paper.html",
        text: "Generate McQ Question Paper",
      },
      {
        href: "/report_by_class.html",
        text: "Test Performance Analysis By Class",
      },
    ],
  },
  {
    text: "MCQ Student",
    icon: "fas fa-pager",
    dropdown: true,
    items: [
      {
        href: "/take_mcq_test.html?id=35",
        text: "Take McQ Test",
      },
      {
        href: "/student_report.html",
        text: "Test Performance Analysis",
      },
    ],
  },
];
let allowedActions = [];

if (loggedInUser.type == "Student") {
  allowedActions.push({
    text: "MCQ Student",
    items: [
      { text: "Test Performance Analysis", action: "view" },
      { text: "Take McQ Test", action: "view" },
    ],
    action: "view",
    asDropdown: false,
  });
} else {
  allowedActions.push({
    text: "MCQ Staff",
    items: [
      { text: "Manage Subjects", action: "view" },
      { text: "Manage Sections", action: "view" },
      { text: "Manage Topics", action: "view" },
      { text: "MCQ Question Upload", action: "view" },
      { text: "Create McQ Template", action: "view" },
      { text: "View McQ Template", action: "view" },
      { text: "Generate McQ Question Paper", action: "view" },
      { text: "Test Performance Analysis By Class", action: "view" },
    ],
    action: "view",
    asDropdown: false,
  });
  allowedActions.push({
    text: "MCQ Student",
    items: [{ text: "Test Performance Analysis", action: "view" }],
    action: "view",
    asDropdown: false,
  });
}

const allowedUrls = [];
const currentPageUrl = window.location.pathname;

var currentPageAccessType = actions.view;
allowedActions.forEach((allowedItem) => {
  let menuItemConfig = menuItems.find((item) => item.text === allowedItem.text);

  if (menuItemConfig) {
    if (
      menuItemConfig.dropdown &&
      allowedItem.items &&
      allowedItem.items.includes("all")
    ) {
      // Add all dropdown items
      menuItemConfig.items.forEach((subItemConfig) => {
        if (currentPageUrl == subItemConfig.href) {
          currentPageAccessType = allowedItem.action;
        }
        allowedUrls.push(subItemConfig.href.split("?")[0]);
      });
    } else if (allowedItem.items) {
      // Add specific dropdown items
      allowedItem.items.forEach((subItemText) => {
        const subItemConfig = menuItemConfig.items.find(
          (item) => item.text == subItemText.text
        );
        if (subItemConfig) {
          if (currentPageUrl == subItemConfig.href) {
            currentPageAccessType = subItemText.action;
          }
          allowedUrls.push(subItemConfig.href.split("?")[0]);
        }
      });
    } else {
      allowedUrls.push(menuItemConfig.href.split("?")[0]);
    }
  }
});

if (allowedUrls.length == 0) {
  sessionStorage.clear();
  alert("You don't have permission to access the CRM");
  document.location.href = "/login.html";
}

var path = window.location.pathname;
const current_page = path.split("/").pop();

if (!allowedUrls.includes(currentPageUrl)) {
  window.location.href = allowedUrls[0];
}
function buildMenuItem(itemConfig, navList) {
  const { href, text, icon } = itemConfig;
  const menuItem = document.createElement("a");
  menuItem.href = href;
  menuItem.classList.add("dashboard-nav-item", "nav-item");
  menuItem.innerHTML = `<i class="${icon}"></i> ${text}`;
  navList.appendChild(menuItem);
}

function buildDropdownMenuItem(itemConfig, navList) {
  const { text, icon, items } = itemConfig;
  const dropdown = document.createElement("div");
  dropdown.classList.add("dashboard-nav-dropdown");

  const dropdownToggle = document.createElement("a");
  dropdownToggle.href = "#!";
  dropdownToggle.classList.add(
    "dashboard-nav-item",
    "dashboard-nav-dropdown-toggle"
  );
  dropdownToggle.innerHTML = `<i class="${icon}"></i> ${text}`;
  dropdown.appendChild(dropdownToggle);

  const dropdownMenu = document.createElement("div");
  dropdownMenu.classList.add("dashboard-nav-dropdown-menu");

  items.forEach((subItemConfig) => {
    const subMenuItem = document.createElement("a");
    subMenuItem.href = subItemConfig.href;
    subMenuItem.classList.add("dashboard-nav-dropdown-item", "nav-item");
    subMenuItem.textContent = subItemConfig.text;
    dropdownMenu.appendChild(subMenuItem);
  });

  dropdown.appendChild(dropdownMenu);
  navList.appendChild(dropdown);
}

function buildNavigation() {
  const navList = document.querySelector(".dashboard-nav-list");

  allowedActions.forEach((allowedItem) => {
    let menuItemConfig = menuItems.find(
      (item) => item.text == allowedItem.text
    );

    if (!menuItemConfig) return; // Skip if menu item not found

    if (menuItemConfig.dropdown && allowedItem.asDropdown) {
      // Build dropdown menu
      const dropdownConfig = {
        text: menuItemConfig.text,
        icon: menuItemConfig.icon,
        items: [],
      };

      if (allowedItem.items[0] === "all") {
        dropdownConfig.items = menuItemConfig.items;
      } else {
        allowedItem.items.forEach((item) => {
          const subMenuItem = menuItemConfig.items.find(
            (m) => m.text === item.text
          );
          if (subMenuItem) dropdownConfig.items.push(subMenuItem);
        });
      }

      buildDropdownMenuItem(dropdownConfig, navList);
    } else {
      // Build regular menu item
      if (menuItemConfig.dropdown) {
        const dropdownItems =
          allowedItem.items[0] === "all"
            ? menuItemConfig.items
            : allowedItem.items;
        dropdownItems.forEach((item) => {
          const subMenuItem = menuItemConfig.items.find(
            (m) => m.text === item.text
          );
          if (subMenuItem) buildMenuItem(subMenuItem, navList);
        });
      } else {
        buildMenuItem(menuItemConfig, navList);
      }
    }
  });

  $(document).ready(function () {
    $(".dashboard-nav-dropdown-toggle").click(function () {
      $(this)
        .closest(".dashboard-nav-dropdown")
        .toggleClass("show")
        .find(".dashboard-nav-dropdown")
        .removeClass("show");
      $(this).parent().siblings().removeClass("show");
    });

    var dropdownElementList = [].slice.call(
      document.querySelectorAll(".dropdown-toggle")
    );
    var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl);
    });
  });

  setActiveNavItem();
  // changeLogo();
  setUserName();
}

function setUserName() {
  let userName = document.getElementById("user_name");

  if (loggedInUser["type"] == "Student") {
    userName.innerHTML = loggedInUser.name;
  } else {
    userName.innerHTML = loggedInUser.staff_name;
  }
}

function setActiveNavItem() {
  var navItems = document.querySelectorAll(".nav-item");

  navItems.forEach(function (navItem) {
    if (navItem.href.includes(current_page)) {
      let url = new URLSearchParams(window.location.search);
      if (url.size != 0) {
        let firstKey = url.keys().next().value;
        let currentPageWithParams =
          current_page + `?${firstKey}=${url.get(firstKey)}`;
        if (navItem.href.includes(currentPageWithParams)) {
          navItem.classList.add("active");
        }
      } else {
        navItem.classList.add("active");
      }

      if (
        navItem.parentElement.classList.contains("dashboard-nav-dropdown-menu")
      ) {
        var dropdownToggle = navItem
          .closest(".dashboard-nav-dropdown")
          .querySelector(".dashboard-nav-dropdown-toggle");
        if (dropdownToggle) {
          dropdownToggle.classList.add("active");

          var dropdownMenu = dropdownToggle.closest(".dashboard-nav-dropdown");
          dropdownMenu.classList.add("active");
          dropdownMenu.classList.add("show");
        }
      } else {
        navItem.classList.add("fw-bold");
      }
    }
  });
}

buildNavigation();
