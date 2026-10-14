const STORAGE_KEY = "clinic-flow-board";
const DEFAULT_PATIENTS = [
  { id: crypto.randomUUID(), name: "Ava Thompson", doctor: "Dr. Patel", visitType: "Check-up", priority: "Urgent", status: "waiting" },
  { id: crypto.randomUUID(), name: "Marco Silva", doctor: "Dr. Chen", visitType: "Follow-up", priority: "Routine", status: "in-consultation" },
  { id: crypto.randomUUID(), name: "Priya Nair", doctor: "Dr. Ramirez", visitType: "Consultation", priority: "Routine", status: "completed" },
  { id: crypto.randomUUID(), name: "Daniel Kim", doctor: "Dr. Hassan", visitType: "Lab review", priority: "Urgent", status: "waiting" }
];

const statusLabels = {
  waiting: "Waiting",
  "in-consultation": "In consult",
  completed: "Completed"
};

const form = document.querySelector("#patient-form");
const patientNameInput = document.querySelector("#patient-name");
const doctorSelect = document.querySelector("#doctor-select");
const visitSelect = document.querySelector("#visit-select");
const prioritySelect = document.querySelector("#priority-select");
const list = document.querySelector("#patient-list");
const waitingCount = document.querySelector("#waiting-count");
const consultCount = document.querySelector("#consult-count");
const completedCount = document.querySelector("#completed-count");
const totalCount = document.querySelector("#total-count");
const filterButtons = document.querySelectorAll("[data-filter]");
const resetDemoButton = document.querySelector("#reset-demo");

let patients = loadPatients();
let currentFilter = "all";

function loadPatients() {
  try {
    const savedPatients = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(savedPatients) && savedPatients.length > 0) {
      return savedPatients;
    }
  } catch (error) {
    console.warn("Could not load patients from storage.", error);
  }

  return structuredClone(DEFAULT_PATIENTS);
}

function savePatients() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

function visiblePatients() {
  if (currentFilter === "all") return patients;
  return patients.filter((patient) => patient.status === currentFilter);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createPatientCard(patient) {
  const article = document.createElement("article");
  article.className = `patient-card ${patient.status}`;
  article.dataset.id = patient.id;

  const nextAction = patient.status === "waiting"
    ? "Start consult"
    : patient.status === "in-consultation"
      ? "Complete"
      : "Reviewed";

  article.innerHTML = `
    <div class="patient-head">
      <div>
        <span class="priority-badge priority-${patient.priority.toLowerCase()}">${escapeHtml(patient.priority)}</span>
        <h3>${escapeHtml(patient.name)}</h3>
      </div>
      <span class="status-chip status-${patient.status}">${statusLabels[patient.status]}</span>
    </div>

    <dl class="patient-meta">
      <div>
        <dt>Doctor</dt>
        <dd>${escapeHtml(patient.doctor)}</dd>
      </div>
      <div>
        <dt>Visit</dt>
        <dd>${escapeHtml(patient.visitType)}</dd>
      </div>
    </dl>

    <div class="card-actions">
      <button type="button" class="action-button" data-action="advance" data-id="${patient.id}">${nextAction}</button>
      <button type="button" class="ghost-button" data-action="remove" data-id="${patient.id}">Remove</button>
    </div>
  `;

  return article;
}

function render() {
  const filteredPatients = visiblePatients();
  list.replaceChildren();

  if (filteredPatients.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = currentFilter === "all" ? "No patients queued yet." : `No ${statusLabels[currentFilter].toLowerCase()} patients.`;
    list.append(emptyState);
  } else {
    filteredPatients.forEach((patient) => {
      list.append(createPatientCard(patient));
    });
  }

  const waiting = patients.filter((patient) => patient.status === "waiting").length;
  const inConsultation = patients.filter((patient) => patient.status === "in-consultation").length;
  const completed = patients.filter((patient) => patient.status === "completed").length;

  waitingCount.textContent = waiting;
  consultCount.textContent = inConsultation;
  completedCount.textContent = completed;
  totalCount.textContent = patients.length;
}

function addPatient(patient) {
  patients.unshift({
    id: crypto.randomUUID(),
    name: patient.name,
    doctor: patient.doctor,
    visitType: patient.visitType,
    priority: patient.priority,
    status: "waiting"
  });

  savePatients();
  render();
}

function advancePatient(id) {
  patients = patients.map((patient) => {
    if (patient.id !== id) return patient;

    if (patient.status === "waiting") {
      return { ...patient, status: "in-consultation" };
    }

    if (patient.status === "in-consultation") {
      return { ...patient, status: "completed" };
    }

    return patient;
  });

  savePatients();
  render();
}

function removePatient(id) {
  patients = patients.filter((patient) => patient.id !== id);
  savePatients();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = patientNameInput.value.trim();
  const doctor = doctorSelect.value;
  const visitType = visitSelect.value;
  const priority = prioritySelect.value;

  if (!name) {
    patientNameInput.focus();
    return;
  }

  addPatient({ name, doctor, visitType, priority });
  form.reset();
  patientNameInput.focus();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === "advance") {
    advancePatient(id);
  }

  if (action === "remove") {
    removePatient(id);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton === button);
    });
    render();
  });
});

resetDemoButton.addEventListener("click", () => {
  patients = structuredClone(DEFAULT_PATIENTS);
  currentFilter = "all";
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
  savePatients();
  render();
});

render();