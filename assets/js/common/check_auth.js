if (loggedInUser == undefined || loggedInUser == null || loggedInUser == "") {
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

let allowedActions = [];

let permissionList = loggedInUser.permissions;
// check if permissionlist is array as string
if (typeof permissionList === "string") {
  try {
    permissionList = JSON.parse(permissionList);
  } catch (e) {
    console.error("Failed to parse permissions:", e);
    permissionList = [];
  }
}

permissionList.forEach((permission) => {
  for (let i = 0; i < menuItems.length; i++) {
    let menuItemConfig = menuItems[i];
    if (menuItemConfig.dropdown) {
      let subItem = menuItemConfig.items.find(
        (item) => item.text === permission,
      );
      if (subItem) {
        let allowedItem = allowedActions.find(
          (item) => item.text === menuItemConfig.text,
        );
        if (allowedItem) {
          // already exists, add to items
          allowedItem.items.push({ text: permission, action: actions.view });
        } else {
          // create new entry
          allowedActions.push({
            text: menuItemConfig.text,
            items: [{ text: permission, action: actions.view }],
            action: actions.view,
            asDropdown: true,
          });
        }
        break;
      }
    } else {
      if (menuItemConfig.text === permission) {
        allowedActions.push({
          text: menuItemConfig.text,
          action: actions.view,
          asDropdown: false,
        });
        break;
      }
    }
  }
});

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
          (item) => item.text == subItemText.text,
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

if (loggedInUser.type == "Student") {
  allowedUrls.push("/view_ui_template.html");
}

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
    "dashboard-nav-dropdown-toggle",
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
      (item) => item.text == allowedItem.text,
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
            (m) => m.text === item.text,
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
            (m) => m.text === item.text,
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
      document.querySelectorAll(".dropdown-toggle"),
    );
    var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl);
    });
  });

  setActiveNavItem();
  setUserName();
}

function setUserName() {
  let userName = document.getElementById("user_name");

  if (loggedInUser["type"] == "Student") {
    userName.innerHTML = loggedInUser.name || loggedInUser.staff_name;
  } else {
    userName.innerHTML = loggedInUser.name || loggedInUser.staff_name;
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

if (current_page != "view_ui_template.html") {
  buildNavigation();
}
