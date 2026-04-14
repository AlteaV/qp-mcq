// DOM elements
const form = document.getElementById("sign_up_form");

const orgName = document.getElementById("org_name");
const orgEmail = document.getElementById("org_email");
const contactNumber = document.getElementById("contact_number");
const numStudents = document.getElementById("num_students");
const numTeachers = document.getElementById("num_teachers");
const testSuite = document.getElementById("feature_test_suite");
const qpSuite = document.getElementById("feature_qp_suite");
const practice = document.getElementById("feature_practice");
const agentic = document.getElementById("feature_agentic");

const contactNumberError = document.getElementById("contact_number_error");
const subscriptionError = document.getElementById("subscription_error");
const forms = document.querySelectorAll(".needs-validation");

const streamError = document.getElementById("stream_error");
const streamValidator = document.getElementById("stream_validator");
const examStreamCheckboxes = document.querySelectorAll(".stream-option");

const orgTypeRadios = document.querySelectorAll('input[name="org_type"]');

// event listeners
examStreamCheckboxes.forEach((e) => {
  e.addEventListener("change", function (event) {
    changeStreamValidity();
  });
});

function changeStreamValidity() {
  const anyStreamChecked = Array.from(examStreamCheckboxes).some(
    (cb) => cb.checked,
  );

  if (anyStreamChecked) {
    streamValidator.checked = true;
    streamError.style.display = "none";
  } else {
    streamError.style.display = "block";
    streamValidator.checked = false;
  }
}

form.addEventListener("submit", function (event) {
  form.classList.add("was-validated");
  const anyStreamChecked = Array.from(examStreamCheckboxes).some(
    (cb) => cb.checked,
  );

  if (anyStreamChecked) {
    streamValidator.checked = true;
    streamValidator.setCustomValidity(""); // Valid state
  } else {
    streamError.style.display = "block";
    streamValidator.checked = false;
    streamValidator.setCustomValidity("invalid"); // This makes form.checkValidity() return false
  }
  const contactNumberValue = contactNumber.value.trim();
  if (contactNumberValue.length !== 10) {
    event.preventDefault();
    event.stopPropagation();
    contactNumberError.textContent = "Contact number should have 10 digits";
    contactNumberError.style.display = "block";
    contactNumber.classList.add("is-invalid");
    return;
  } else {
    contactNumberError.style.display = "none";
    contactNumber.classList.remove("is-invalid");
  }

  if (!form.checkValidity()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (!hasAtLeastOneFeature()) {
    event.preventDefault();
    event.stopPropagation();
    if (subscriptionError) {
      subscriptionError.style.display = "block";
    }
    return;
  } else if (subscriptionError) {
    subscriptionError.style.display = "none";
  }
  event.preventDefault();
  handleOrganizationSignup();
});

orgTypeRadios.forEach(function (radio) {
  radio.addEventListener("change", function () {
    document.querySelectorAll(".org-type-card").forEach(function (card) {
      card.classList.remove("active");
    });

    const label = document.querySelector('label[for="' + this.id + '"]');
    if (label) {
      label.classList.add("active");
    }
  });
});

// helper functions
function hasAtLeastOneFeature() {
  return (
    (testSuite && testSuite.checked) ||
    (qpSuite && qpSuite.checked) ||
    (practice && practice.checked)
  );
}

// rules:
(function () {
  "use strict";
  // when Agentic is turned on, ensure Practice + Test suite are on
  agentic.addEventListener("change", function () {
    if (this.checked) {
      if (!practice.checked) {
        practice.checked = true;
      }
      if (!testSuite.checked) {
        testSuite.checked = true;
      }
    }
  });

  // when Practice is turned on, ensure Test suite is on
  practice.addEventListener("change", function () {
    if (this.checked && !testSuite.checked) {
      testSuite.checked = true;
    }
    // if Practice is turned off, Agentic must also turn off
    if (!this.checked && agentic.checked) {
      agentic.checked = false;
    }
  });

  // when Test suite is turned off, also turn off Practice + Agentic
  testSuite.addEventListener("change", function () {
    if (!this.checked) {
      if (practice.checked) practice.checked = false;
      if (agentic.checked) agentic.checked = false;
    }
  });
})();

async function handleOrganizationSignup() {
  showOverlay();
  try {
    let selectedStreams = Array.from(examStreamCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value)
      .filter((val) => val !== "Others");

    const payload = {
      org_name: sanitizeInput(orgName.value.trim()),
      org_type:
        Array.from(orgTypeRadios).find((radio) => radio.checked)?.value || "",
      org_email: sanitizeInput(orgEmail.value.trim()),
      contact_number: sanitizeInput(contactNumber.value.trim()),
      num_students: Number(numStudents.value || 0),
      num_teachers: Number(numTeachers.value || 0),
      subscription: JSON.stringify({
        test_suite: !!(testSuite && testSuite.checked),
        qp_suite: !!(qpSuite && qpSuite.checked),
        practice: !!(practice && practice.checked),
        agentic_learning: !!(agentic && agentic.checked),
      }),
      function: "co",
      levels: selectedStreams,
    };

    let response = await postCall(autEndPoint, JSON.stringify(payload));
    if (response.success) {
      alert("Organization registered successfully!");
      window.location.href = "login.html";
      hideOverlay();
    } else {
      alert("Failed to register organization: " + response.message);
      hideOverlay();
    }
  } catch (error) {
    console.error("Error during organization signup:", error);
    alert("An error occurred while processing your signup. Please try again.");
    hideOverlay();
    return;
  }
}
