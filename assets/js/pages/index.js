document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  const mobileToggle = document.querySelector(".mobile-menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("active");
      const isExpanded = mobileNav.classList.contains("active");
      mobileToggle.setAttribute("aria-expanded", isExpanded);

      const icon = mobileToggle.querySelector("i");
      if (icon) {
        if (isExpanded) {
          icon.setAttribute("data-lucide", "x");
        } else {
          icon.setAttribute("data-lucide", "menu");
        }
        lucide.createIcons();
      }
    });

    const mobileLinks = mobileNav.querySelectorAll("a");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("active");
        const icon = mobileToggle.querySelector("i");
        if (icon) {
          icon.setAttribute("data-lucide", "menu");
          lucide.createIcons();
        }
      });
    });
  }

  const tabBtns = document.querySelectorAll(".tab-btn");
  const dashboardMock = document.querySelector(".browser-mockup");

  const dashboardData = {
    student: {
      headerTitle: "Student Overview",
      headerSub: "Personal progress and recent test metrics",
      badgeText:
        'Active Streak: <strong class="streak-count">12 Days 🔥</strong>',

      stat1: {
        label: "Quizzes Taken",
        val: "45",
        sub: '<i data-lucide="arrow-up-right"></i> +3 this week',
        subClass: "text-green",
      },
      stat2: {
        label: "Average Score",
        val: "84.2%",
        sub: '<i data-lucide="arrow-up-right"></i> +2.1% net increase',
        subClass: "text-green",
      },
      stat3: {
        label: "MCQs Answered",
        val: "3,420",
        sub: '<i data-lucide="arrow-up-right"></i> 89% answered correctly',
        subClass: "text-green",
      },
      stat4: {
        label: "Total Time Spent",
        val: "48.5h",
        sub: '<i data-lucide="arrow-up-right"></i> +4.2h this week',
        subClass: "text-green",
      },

      leftCardHeading: "Subject Performance",
      leftCardContent: `
        <div class="bar-group">
          <div class="bar-labels">
            <span>Physics</span>
            <strong>88%</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 88%"></div>
          </div>
        </div>
        <div class="bar-group">
          <div class="bar-labels">
            <span>Chemistry</span>
            <strong>75%</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 75%"></div>
          </div>
        </div>
        <div class="bar-group">
          <div class="bar-labels">
            <span>Biology</span>
            <strong>92%</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 92%"></div>
          </div>
        </div>
      `,

      rightCardHeading: "Recent Achievements",
      rightCardContent: `
        <li>
          <div class="score-info">
            <strong class="score-title">Physics Prodigy</strong>
            <span class="score-meta">Scored 95%+ in 3 mock tests</span>
          </div>
          <span class="score-val badge-yellow">🏆</span>
        </li>
        <li>
          <div class="score-info">
            <strong class="score-title">Consistent Learner</strong>
            <span class="score-meta">7 day active streak</span>
          </div>
          <span class="score-val badge-green">🔥</span>
        </li>
      `,

      tableHeading: "Recent Quizzes",
      tableHead: `
        <tr>
          <th>Quiz Name</th>
          <th>Subject</th>
          <th>Score</th>
          <th>Time Taken</th>
          <th>Action</th>
        </tr>
      `,
      tableBody: `
        <tr>
          <td><strong>NEET Mock Test 5</strong></td>
          <td>Full Syllabus</td>
          <td><span class="accent-font text-green">650/720</span></td>
          <td><span class="status-pill green">2h 45m</span></td>
          <td><button class="table-btn-action">View Analysis</button></td>
        </tr>
        <tr>
          <td><strong>Organic Chemistry Drill</strong></td>
          <td>Chemistry</td>
          <td><span class="accent-font text-yellow">82%</span></td>
          <td><span class="status-pill yellow">45m</span></td>
          <td><button class="table-btn-action">Review Mistakes</button></td>
        </tr>
      `,
    },
    admin: {
      headerTitle: "Organization Overview",
      headerSub: "Platform-wide performance and engagement metrics",
      badgeText: "",

      stat1: {
        label: "Active Users",
        val: "15,420",
        sub: '<i data-lucide="users"></i> +1,240 this month',
        subClass: "text-green",
      },
      stat2: {
        label: "Total Questions",
        val: "5,00,000+",
        sub: '<i data-lucide="database"></i> Across all subjects',
        subClass: "text-green",
      },
      stat3: {
        label: "Avg Org Score",
        val: "78.5%",
        sub: '<i data-lucide="arrow-up-right"></i> +1.2% this week',
        subClass: "text-green",
      },
      stat4: {
        label: "Avg Quiz Time",
        val: "22m 45s",
        sub: '<i data-lucide="timer"></i> Optimal engagement',
        subClass: "text-green",
      },

      leftCardHeading: "Hardest Topics",
      leftCardContent: `
        <div class="bar-group">
          <div class="bar-labels">
            <span>Rotational Dynamics</span>
            <strong>42% Avg</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 42%; background: var(--error-color);"></div>
          </div>
        </div>
        <div class="bar-group">
          <div class="bar-labels">
            <span>Organic Chemistry</span>
            <strong>48% Avg</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 48%; background: var(--warning-color);"></div>
          </div>
        </div>
        <div class="bar-group">
          <div class="bar-labels">
            <span>Genetics</span>
            <strong>51% Avg</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 51%; background: var(--warning-color);"></div>
          </div>
        </div>
      `,

      rightCardHeading: "Easiest Topics",
      rightCardContent: `
        <li>
          <div class="score-info">
            <strong class="score-title">Basic Algebra</strong>
            <span class="score-meta">Math • 12,000+ attempts</span>
          </div>
          <span class="score-val badge-green">94%</span>
        </li>
        <li>
          <div class="score-info">
            <strong class="score-title">Kinematics</strong>
            <span class="score-meta">Physics • 8,500+ attempts</span>
          </div>
          <span class="score-val badge-green">89%</span>
        </li>
      `,

      tableHeading: "Recent Quiz Attempts Feed",
      tableHead: `
        <tr>
          <th>User</th>
          <th>Quiz Taken</th>
          <th>Score</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      `,
      tableBody: `
        <tr>
          <td><strong>Rahul Sharma</strong></td>
          <td>Physics Grand Mock</td>
          <td><span class="accent-font text-green">92%</span></td>
          <td><span class="status-pill green">Completed</span></td>
          <td><button class="table-btn-action">View Log</button></td>
        </tr>
        <tr>
          <td><strong>Priya Patel</strong></td>
          <td>Botany Basics</td>
          <td><span class="accent-font text-yellow">74%</span></td>
          <td><span class="status-pill yellow">Needs Review</span></td>
          <td><button class="table-btn-action">View Log</button></td>
        </tr>
        <tr>
          <td><strong>Amit Kumar</strong></td>
          <td>Calculus 101</td>
          <td><span class="accent-font text-red">45%</span></td>
          <td><span class="status-pill red">Failed</span></td>
          <td><button class="table-btn-action highlight">Alert User</button></td>
        </tr>
      `,
    },
  };

  if (tabBtns.length > 0 && dashboardMock) {
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const stream = btn.getAttribute("data-tab");

        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const mainPanel = dashboardMock.querySelector(".mock-main");
        if (mainPanel) {
          const data = dashboardData[stream];

          const headerTitle = dashboardMock.querySelector("#mock-header-title");
          const headerSub = dashboardMock.querySelector("#mock-header-sub");
          const headerBadge = dashboardMock.querySelector("#mock-header-badge");
          if (headerTitle) headerTitle.innerHTML = data.headerTitle;
          if (headerSub) headerSub.innerHTML = data.headerSub;
          if (headerBadge) {
            if (data.badgeText) {
              headerBadge.style.display = "";
              headerBadge.innerHTML = data.badgeText;
            } else {
              headerBadge.style.display = "none";
            }
          }

          for (let i = 1; i <= 4; i++) {
            const label = dashboardMock.querySelector(`#mock-stat-${i}-label`);
            const val = dashboardMock.querySelector(`#mock-stat-${i}-val`);
            const sub = dashboardMock.querySelector(`#mock-stat-${i}-sub`);
            if (label) label.innerHTML = data[`stat${i}`].label;
            if (val) val.innerHTML = data[`stat${i}`].val;
            if (sub) {
              sub.innerHTML = data[`stat${i}`].sub;
              sub.className = `mock-stat-sub ${data[`stat${i}`].subClass}`;
            }
          }

          const leftCardHeading =
            dashboardMock.querySelector("#left-card-heading");
          const leftCardContent =
            dashboardMock.querySelector("#left-card-content");
          if (leftCardHeading) leftCardHeading.innerHTML = data.leftCardHeading;
          if (leftCardContent) leftCardContent.innerHTML = data.leftCardContent;

          const rightCardHeading = dashboardMock.querySelector(
            "#right-card-heading",
          );
          const rightCardContent = dashboardMock.querySelector(
            "#right-card-content",
          );
          if (rightCardHeading)
            rightCardHeading.innerHTML = data.rightCardHeading;
          if (rightCardContent)
            rightCardContent.innerHTML = data.rightCardContent;

          const tableHeading = dashboardMock.querySelector("#table-heading");
          const tableHead = dashboardMock.querySelector("#table-head");
          const tableBody = dashboardMock.querySelector("#table-body");
          if (tableHeading) tableHeading.innerHTML = data.tableHeading;
          if (tableHead) tableHead.innerHTML = data.tableHead;
          if (tableBody) tableBody.innerHTML = data.tableBody;

          lucide.createIcons();
        }
      });
    });
  }

  const themeToggleBtns = document.querySelectorAll(".theme-toggle-btn");

  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const initialDarkActive =
    savedTheme === "dark" || (!savedTheme && systemPrefersDark);

  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");

      updateToggleIcons("sun");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");

      updateToggleIcons("moon");
    }
  }

  function updateToggleIcons(iconName) {
    themeToggleBtns.forEach((btn) => {
      const icon = btn.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", iconName);
      }
    });

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  setTheme(initialDarkActive);

  themeToggleBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isDarkActive = document.body.classList.contains("dark-theme");
      setTheme(!isDarkActive);
    });
  });
});
