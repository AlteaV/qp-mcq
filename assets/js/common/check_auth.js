if (loggedInUser == undefined || loggedInUser == null || loggedInUser == "") {
  document.location.href = "/welcome.html";
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

if (loggedInUser.type == "TestTaker") {
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
// function buildMenuItem(itemConfig, navList) {
//   const { href, text, icon } = itemConfig;
//   const menuItem = document.createElement("a");
//   menuItem.href = href;
//   menuItem.classList.add("dashboard-nav-item", "nav-item");
//   menuItem.innerHTML = `<i class="${icon}"></i> ${text}`;
//   navList.appendChild(menuItem);
// }

// function buildDropdownMenuItem(itemConfig, navList) {
//   const { text, icon, items } = itemConfig;
//   const dropdown = document.createElement("div");
//   dropdown.classList.add("dashboard-nav-dropdown");

//   const dropdownToggle = document.createElement("a");
//   dropdownToggle.href = "#!";
//   dropdownToggle.classList.add(
//     "dashboard-nav-item",
//     "dashboard-nav-dropdown-toggle",
//   );
//   dropdownToggle.innerHTML = `<i class="${icon}"></i> ${text}`;
//   dropdown.appendChild(dropdownToggle);

//   const dropdownMenu = document.createElement("div");
//   dropdownMenu.classList.add("dashboard-nav-dropdown-menu");

//   items.forEach((subItemConfig) => {
//     const subMenuItem = document.createElement("a");
//     subMenuItem.href = subItemConfig.href;
//     subMenuItem.classList.add("dashboard-nav-dropdown-item", "nav-item");
//     subMenuItem.textContent = subItemConfig.text;
//     dropdownMenu.appendChild(subMenuItem);
//   });

//   dropdown.appendChild(dropdownMenu);
//   navList.appendChild(dropdown);
// }

// function buildNavigation() {
//   const navList = document.querySelector(".dashboard-nav-list");

//   allowedActions.forEach((allowedItem) => {
//     let menuItemConfig = menuItems.find(
//       (item) => item.text == allowedItem.text,
//     );

//     if (!menuItemConfig) return; // Skip if menu item not found

//     if (menuItemConfig.dropdown && allowedItem.asDropdown) {
//       // Build dropdown menu
//       const dropdownConfig = {
//         text: menuItemConfig.text,
//         icon: menuItemConfig.icon,
//         items: [],
//       };

//       if (allowedItem.items[0] === "all") {
//         dropdownConfig.items = menuItemConfig.items;
//       } else {
//         allowedItem.items.forEach((item) => {
//           const subMenuItem = menuItemConfig.items.find(
//             (m) => m.text === item.text,
//           );
//           if (subMenuItem) dropdownConfig.items.push(subMenuItem);
//         });
//       }

//       buildDropdownMenuItem(dropdownConfig, navList);
//     } else {
//       // Build regular menu item
//       if (menuItemConfig.dropdown) {
//         const dropdownItems =
//           allowedItem.items[0] === "all"
//             ? menuItemConfig.items
//             : allowedItem.items;
//         dropdownItems.forEach((item) => {
//           const subMenuItem = menuItemConfig.items.find(
//             (m) => m.text === item.text,
//           );
//           if (subMenuItem) buildMenuItem(subMenuItem, navList);
//         });
//       } else {
//         buildMenuItem(menuItemConfig, navList);
//       }
//     }
//   });

//   $(document).ready(function () {
//     $(".dashboard-nav-dropdown-toggle").click(function () {
//       $(this)
//         .closest(".dashboard-nav-dropdown")
//         .toggleClass("show")
//         .find(".dashboard-nav-dropdown")
//         .removeClass("show");
//       $(this).parent().siblings().removeClass("show");
//     });

//     var dropdownElementList = [].slice.call(
//       document.querySelectorAll(".dropdown-toggle"),
//     );
//     var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
//       return new bootstrap.Dropdown(dropdownToggleEl);
//     });
//   });

//   setActiveNavItem();
//   setUserName();
// }

// 1. Builds individual links matching the new sidebar styling layout
function buildSidebarItem(itemConfig, navList) {
  const { href, text, icon } = itemConfig;
  const menuItem = document.createElement("a");
  menuItem.href = href;
  menuItem.classList.add("sidebar-item");
  menuItem.innerHTML = `<i class="${icon}"></i> ${text}`;

  // Automatically check and set active state based on current page URL path
  const currentPath = window.location.pathname;
  if (currentPath === href || currentPath.endsWith(href)) {
    menuItem.classList.add("active");
  }

  navList.appendChild(menuItem);
}

// 2. Builds the non-clickable, bold Category Headers
function buildSidebarCategory(text, navList) {
  const categoryHeader = document.createElement("div");
  categoryHeader.classList.add("sidebar-category");
  categoryHeader.textContent = text;
  navList.appendChild(categoryHeader);
}

// Main Navigation Builder
function buildNavigation() {
  // Update selection target to match your new container class names if modified
  const navList = document.querySelector(".sidebar-nav");
  if (!navList) return;

  navList.innerHTML = ""; // Clear loader elements smoothly

  allowedActions.forEach((allowedItem) => {
    let menuItemConfig = menuItems.find(
      (item) => item.text == allowedItem.text,
    );

    if (!menuItemConfig) return; // Skip if menu item structure is missing

    // If it has sub-items, convert the top parent text to a category title heading
    if (menuItemConfig.dropdown) {
      buildSidebarCategory(menuItemConfig.text, navList);

      let itemsToRender = [];
      if (allowedItem.items && allowedItem.items[0] === "all") {
        itemsToRender = menuItemConfig.items;
      } else if (allowedItem.items) {
        allowedItem.items.forEach((item) => {
          const subMenuItem = menuItemConfig.items.find(
            (m) => m.text === item.text,
          );
          if (subMenuItem) itemsToRender.push(subMenuItem);
        });
      }

      // Render all approved children items as flat adjacent links
      itemsToRender.forEach((subItem) => {
        buildSidebarItem(subItem, navList);
      });
    } else {
      // Handles standalone items that don't belong to a group structure
      buildSidebarItem(menuItemConfig, navList);
    }
  });

  // Note: jQuery toggle logic removed because dropdown links are now fully flat!

  setActiveNavItem();
  setUserName();
}
function setUserName() {
  let userName = document.getElementById("user_name");
  if (userName && loggedInUser && loggedInUser.name) {
    userName.textContent = loggedInUser.name;
    let initials = loggedInUser.name
      .split(" ") // Split string into ["John", "Fitzgerald", "Kennedy"]
      .map((word) => word[0]) // Get the first character of each word: ["J", "F", "K"]
      .join("") // Join them back into a single string: "JFK"
      .toUpperCase();
    let userInitials = document.getElementById("user_initial");
    if (userInitials) {
      userInitials.textContent = initials;
    }
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

function buildTopBarNavigation() {
  setUserName();
  let navDiv = document.getElementById("top_bar_nav_items");

  if (!navDiv) return;

  navDiv.innerHTML = "";

  allowedActions.forEach((allowedItem) => {
    let menuItemConfig = menuItems.find(
      (item) => item.text === allowedItem.text,
    );

    if (!menuItemConfig) return;

    let hasMultipleItems = allowedItem.items.length > 1;

    if (hasMultipleItems) {
      let navItem = document.createElement("a");

      navItem.href = menuItemConfig.href;
      navItem.classList.add("nav-pill", "nav-pill-inactive", "top-nav-item");

      navItem.textContent = allowedItem.text;

      navItem.addEventListener("click", function (e) {
        e.preventDefault();
        showSubMenu(allowedItem);
      });

      navDiv.appendChild(navItem);
    } else {
      let navItem = document.createElement("a");

      let matchedItem = menuItemConfig.items.find(
        (item) => item.text === allowedItem.items[0].text,
      );

      if (!matchedItem) return;

      navItem.href = matchedItem.href;

      navItem.classList.add("nav-pill", "nav-pill-inactive", "top-nav-item");

      navItem.textContent = matchedItem.text;

      navDiv.appendChild(navItem);
    }
  });

  setTopBarActiveItem();
}

function showSubMenu(allowedItem) {
  let dashboardSubmenu = document.getElementById("dashboardSubmenu");

  if (
    dashboardSubmenu.style.display === "flex" &&
    dashboardSubmenu.dataset.menu === allowedItem.text
  ) {
    dashboardSubmenu.style.display = "none";
    return;
  }
  dashboardSubmenu.dataset.menu = allowedItem.text;
  let topBarSubmenuItems = document.getElementById("topBarSubmenuItems");
  topBarSubmenuItems.innerHTML = "";

  let menuItemConfig = menuItems.find((item) => item.text === allowedItem.text);

  allowedItem.items.forEach((item) => {
    let subItemConfig = menuItemConfig.items.find((m) => m.text === item.text);

    if (!subItemConfig) return;

    let navItem = document.createElement("button");

    navItem.textContent = subItemConfig.text;
    navItem.classList.add("submenu-item");
    navItem.addEventListener("click", function () {
      window.location.href = subItemConfig.href;
    });

    topBarSubmenuItems.appendChild(navItem);
  });

  dashboardSubmenu.style.display = "flex";
  // setTopBarActiveItem();
}

function setTopBarActiveItem() {
  let navItems = document.querySelectorAll(".top-nav-item");

  let url = new URLSearchParams(window.location.search);

  let currentPageWithParams = current_page;

  if (url.size !== 0) {
    let firstKey = url.keys().next().value;

    currentPageWithParams = current_page + `?${firstKey}=${url.get(firstKey)}`;
  }

  navItems.forEach((navItem) => {
    let isActive = navItem.href.includes(currentPageWithParams);

    if (isActive) {
      navItem.classList.add("nav-pill-active");
      navItem.classList.remove("nav-pill-inactive");
    } else {
      navItem.classList.remove("nav-pill-active");
      navItem.classList.add("nav-pill-inactive");
    }
  });

  // Handle submenu active state
  allowedActions.forEach((allowedItem) => {
    if (allowedItem.items.length <= 1) return;

    let menuItemConfig = menuItems.find(
      (item) => item.text === allowedItem.text,
    );

    if (!menuItemConfig) return;

    let matchedSubItem = menuItemConfig.items.find((subItem) => {
      let subHref = subItem.href;

      return subHref.includes(currentPageWithParams);
    });

    if (!matchedSubItem) return;

    showSubMenu(allowedItem);

    // Activate main nav pill
    navItems.forEach((navItem) => {
      if (navItem.textContent.trim() === allowedItem.text) {
        navItem.classList.add("nav-pill-active");
        navItem.classList.remove("nav-pill-inactive");
      }
    });

    // If submenu is rendered, activate submenu item
    let submenuItems = document.querySelectorAll(".submenu-item");

    submenuItems.forEach((submenuItem) => {
      if (submenuItem.textContent.trim() === matchedSubItem.text) {
        submenuItem.classList.add("submenu-item-active");
        dashboardSubmenu.style.display = "flex";
      } else {
        submenuItem.classList.remove("submenu-item-active");
      }
    });
  });
}
if (current_page != "view_ui_template.html") {
  if (loggedInUser.type != "TestTaker") {
    buildNavigation();
  } else {
    buildTopBarNavigation();
  }
}
