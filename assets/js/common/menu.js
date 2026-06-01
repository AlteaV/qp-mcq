const menuItems = [
  {
    text: "Dashboard",
    icon: "fas fa-chart-line",
    dropdown: true,
    items: [
      {
        href: "/user_dashboard.html",
        text: "Dashboard",
        icon: "fas fa-th-large",
      },
      {
        href: "/admin_dashboard.html",
        text: "Admin Dashboard",
        icon: "fas fa-user-shield",
      },
    ],
  },
  {
    text: "Reports",
    icon: "fas fa-tachometer-alt",
    dropdown: true,
    items: [
      {
        href: "/report_leaderboard.html",
        text: "Leaderboard",
        icon: "fas fa-trophy",
      },
      {
        href: "/report_test_performance.html",
        text: "Test Report",
        icon: "fas fa-chart-bar",
      },
      {
        href: "/report_subject_wise_performance.html",
        text: "Subject Wise Report",
        icon: "fas fa-book-open",
      },
      {
        href: "/student_report.html",
        text: "Test Analysis",
        icon: "fas fa-file-medical-alt",
      },
      {
        href: "/report_by_class.html",
        text: "Group Wise Report",
        icon: "fas fa-users",
      },
      {
        href: "/report_question_wise_performance.html",
        text: "Question Wise Report",
        icon: "fas fa-list-ol",
      },
    ],
  },
  {
    text: "User Management",
    icon: "fas fa-chalkboard-teacher",
    dropdown: true,
    items: [
      {
        href: "/user_management.html",
        text: "User Management",
        icon: "fas fa-user",
      },
      {
        href: "/group_management.html",
        text: "Group Management",
        icon: "fas fa-users-cog",
      },
      {
        href: "/class_management.html",
        text: "Class Management",
        icon: "fas fa-chalkboard-teacher",
      },
    ],
  },
  {
    text: "Classification Management",
    icon: "fas fa-cubes",
    dropdown: true,
    items: [
      {
        href: "/manage_level.html",
        text: "Manage Levels",
        icon: "fas fa-layer-group",
      },
      {
        href: "/manage_subject.html",
        text: "Manage Subjects",
        icon: "fas fa-book",
      },
      {
        href: "/manage_section.html",
        text: "Manage Sections",
        icon: "fas fa-border-all",
      },
      {
        href: "/manage_topic.html",
        text: "Manage Topics",
        icon: "fas fa-tags",
      },
    ],
  },
  {
    text: "Questions Management",
    icon: "fas fa-book",
    dropdown: true,
    items: [
      {
        href: "/add_question.html",
        text: "Add Question",
        icon: "fas fa-plus-circle",
      },
      {
        href: "/mcq_question_upload.html?type=upload",
        text: "MCQ Question Upload",
        icon: "fas fa-file-upload",
      },
      {
        href: "/mcq_question_upload.html?type=generate",
        text: "MCQ Question Generate",
        icon: "fas fa-magic",
      },
    ],
  },
  {
    text: "Template Management",
    icon: "fab fa-figma",
    dropdown: true,
    items: [
      {
        href: "/mcq_create_template.html",
        text: "Create McQ Template",
        icon: "fas fa-file-signature",
      },
      {
        href: "/mcq_view_template.html",
        text: "View McQ Template",
        icon: "fas fa-eye",
      },
      {
        href: "/create_ui_template.html",
        text: "Manage UI Templates",
        icon: "fab fa-figma",
      },
    ],
  },
  {
    text: "Question Paper Management",
    icon: "fas fa-pen",
    dropdown: true,
    items: [
      {
        href: "/generate_mcq_question_paper.html",
        text: "Generate McQ Question Paper",
        icon: "fas fa-file-alt",
      },
      {
        href: "/mcq_show_question_paper.html",
        text: "Assign MCQ Question Paper",
        icon: "fas fa-user-check",
      },
      {
        href: "/mcq_view_assigned_qp.html",
        text: "View Assigned MCQ Question Paper",
        icon: "fas fa-folder-open",
      },
    ],
  },
  {
    text: "QP Generator",
    icon: "fas fa-pager",
    dropdown: true,
    items: [
      {
        href: "/qp_scan.html",
        text: "Question Upload (Scan)",
        icon: "fas fa-print",
      },
      {
        href: "/qp_excel_upload.html",
        text: "Question Upload (Excel)",
        icon: "fas fa-file-excel",
      },
      {
        href: "/qp_create_question_template.html",
        text: "Create Question Template",
        icon: "fas fa-paste",
      },
      {
        href: "/qp_view_question_template.html",
        text: "View Question Template",
        icon: "fas fa-copy",
      },
      {
        href: "/qp_generate_question_paper.html",
        text: "Generate Question Paper",
        icon: "fas fa-scroll",
      },
      {
        href: "/qp_view_question_paper.html",
        text: "View Question Paper",
        icon: "fas fa-receipt",
      },
    ],
  },
  {
    text: "Test",
    icon: "fas fa-pager",
    dropdown: true,
    items: [
      {
        href: "/take_mcq_test.html",
        text: "Take McQ Test",
        icon: "fas fa-pen-alt",
      },
      {
        href: "/self_learning.html",
        text: "Self Learning",
        icon: "fas fa-user-graduate",
      },
    ],
  },
];
