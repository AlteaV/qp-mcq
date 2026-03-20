const menuItems = [
  {
    text: "Reports",
    icon: "fas fa-tachometer-alt",
    dropdown: true,
    items: [
      {
        href: "/report_leaderboard.html",
        text: "Leaderboard",
      },
      {
        href: "/report_test_performance.html",
        text: "Test Report",
      },
      {
        href: "/report_subject_wise_performance.html",
        text: "Subject Wise Report",
      },
      {
        href: "/student_report.html",
        text: "Test Analysis",
      },
      {
        href: "/report_by_class.html",
        text: "Group Wise Report",
      },
      {
        href: "/report_question_wise_performance.html",
        text: "Question Wise Report",
      },
    ],
  },
  {
    text: "Dashboard",
    icon: "fas fa-chart-line",
    dropdown: true,
    items: [
      {
        href: "/user_dashboard.html",
        text: "Dashboard",
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
      },
      {
        href: "/bulk_upload.html",
        text: "Bulk Upload Users",
      },
      {
        href: "/group_management.html",
        text: "Group Management",
      },
      {
        href: "/class_management.html",
        text: "Class Management",
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
      },
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
      },
      {
        href: "/mcq_question_upload.html?type=upload",
        text: "MCQ Question Upload",
      },
      {
        href: "/mcq_question_upload.html?type=generate",
        text: "MCQ Question Generate",
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
      },
      {
        href: "/mcq_view_template.html",
        text: "View McQ Template",
      },
      {
        href: "/create_ui_template.html",
        text: "Manage UI Templates",
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
      },
      {
        href: "/mcq_show_question_paper.html",
        text: "Assign MCQ Question Paper",
      },
      {
        href: "/mcq_view_assigned_qp.html",
        text: "View Assigned MCQ Question Paper",
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
      },
      {
        href: "/qp_excel_upload.html",
        text: "Question Upload (Excel)",
      },
      {
        href: "/qp_create_question_template.html",
        text: "Create Question Template",
      },
      {
        href: "/qp_view_question_template.html",
        text: "View Question Template",
      },
      {
        href: "/qp_generate_question_paper.html",
        text: "Generate Question Paper",
      },
      {
        href: "/qp_view_question_paper.html",
        text: "View Question Paper",
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
      },
      {
        href: "/self_learning.html",
        text: "Self Learning",
      },
    ],
  },
];
