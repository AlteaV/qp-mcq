window.MathJax = {
  tex: {
    inlineMath: {
      "[+]": [
        ["$", "$"],
        ["\\(", "\\)"],
      ],
    },
  },
  svg: {
    fontCache: "global",
  },
};

(function () {
  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js";
  script.defer = true;
  script.onload = function () {
    MathJax.typeset();
  };
  document.head.appendChild(script);
})();
