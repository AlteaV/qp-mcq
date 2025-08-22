function loadScriptsSequentially(scriptUrls, callback) {
  function loadNextScript(index) {
    if (index < scriptUrls.length) {
      var script = document.createElement("script");
      script.src = scriptUrls[index];

      if (
        scriptUrls[index].includes("common/models/") ||
        scriptUrls[index].includes("common/views/")
      ) {
        script.type = "module";
      }

      script.onload = function () {
        loadNextScript(index + 1);
      };

      script.onerror = function () {
        console.error(`Failed to load script: ${scriptUrls[index]}`);
        loadNextScript(index + 1); //this loads next script even if other script is not loaded
      };
      document.body.appendChild(script);
    } else if (callback && typeof callback === "function") {
      callback();
    }
  }

  loadNextScript(0);
}

var scriptUrls = [
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
  "/assets/js/common/functions.js",
  "/assets/js/common/network_call.js",
  "/assets/js/common/config.js",
  "/assets/js/packages/js/MathJax-4.0.0-rc.4/tex-mml-chtml.js",
  "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.3.0/js/bootstrap.bundle.min.js",
];

function scriptsLoadedCallback() {
  function includeHTML(fileName, containerId, callback) {
    fetch(fileName)
      .then((response) => response.text())
      .then((data) => {
        document
          .getElementById(containerId)
          .insertAdjacentHTML("afterbegin", data);
        if (callback && typeof callback === "function") {
          callback();
        }
      })
      .catch((error) => console.error("Error fetching included HTML:", error));
  }
  includeHTML("/partials/header.html", "header-placeholder");

  includeHTML("/partials/footer.html", "footer-placeholder", function () {
    $(document).ready(function () {
      var dropdownElementList = [].slice.call(
        document.querySelectorAll(".dropdown-toggle")
      );
      var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
      });
    });
  });
  includeHTML("/partials/nav_top_bar.html", "top-bar-placeholder", function () {
    const mobileScreen = window.matchMedia("(max-width: 990px )");
    $(".menu-toggle").click(function () {
      if (mobileScreen.matches) {
        $(".dashboard-nav").toggleClass("mobile-show");
        // to hide nav bar on mobile view
        $(".dashboard-nav").on("click", ".menu-toggle", function () {
          $(".dashboard-nav").removeClass("mobile-show");
        });
      } else {
        $(".dashboard").toggleClass("dashboard-compact");
      }
    });
  });
  includeHTML(
    "/partials/nav_side_bar.html",
    "side-bar-placeholder",
    function () {
      addCheckAuth();
    }
  );
}

function addCheckAuth() {
  window.isCheckAuthLoaded = true;
}

loadScriptsSequentially(scriptUrls, scriptsLoadedCallback);
