const STORAGE_KEY = "employee-dashboard-data";
const THEME_KEY = "employee-dashboard-theme";
const DEPARTMENTS = ["Engineering", "HR", "Sales", "Marketing", "Finance"];
const ROWS_PER_PAGE = 5;

const initialEmployees = [
  { id: 1, name: "Aman Sharma", email: "aman@example.com", department: "Engineering", role: "Frontend Developer", salary: 85000 },
  { id: 2, name: "Riya Patel", email: "riya@example.com", department: "HR", role: "HR Manager", salary: 72000 },
  { id: 3, name: "Daniel Kim", email: "daniel@example.com", department: "Sales", role: "Sales Lead", salary: 91000 },
  { id: 4, name: "Neha Rao", email: "neha@example.com", department: "Marketing", role: "Brand Strategist", salary: 78000 },
  { id: 5, name: "Omar Khan", email: "omar@example.com", department: "Finance", role: "Accountant", salary: 69000 },
  { id: 6, name: "Meera Joshi", email: "meera@example.com", department: "Engineering", role: "Backend Engineer", salary: 95000 },
];

let employees = loadEmployees();
let currentPage = 1;
let searchTerm = "";
let selectedDepartment = "All Departments";
let sortValue = "name-asc";
let editingId = null;
let darkMode = localStorage.getItem(THEME_KEY) === "dark";

const form = document.getElementById("employeeForm");
const formTitle = document.getElementById("formTitle");
const employeeIdInput = document.getElementById("employeeId");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const departmentSelect = document.getElementById("department");
const roleInput = document.getElementById("role");
const salaryInput = document.getElementById("salary");
const searchInput = document.getElementById("searchInput");
const deptFilter = document.getElementById("deptFilter");
const sortSelect = document.getElementById("sortSelect");
const tableBody = document.getElementById("employeeTableBody");
const pagination = document.getElementById("pagination");
const employeeCount = document.getElementById("employeeCount");
const pageInfo = document.getElementById("pageInfo");
const resetFormBtn = document.getElementById("resetFormBtn");
const themeToggle = document.getElementById("themeToggle");

function loadEmployees() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialEmployees;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : initialEmployees;
  } catch (error) {
    console.error("Unable to load employees:", error);
    return initialEmployees;
  }
}

function saveEmployees() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function populateDepartmentOptions() {
  const options = ["Engineering", "HR", "Sales", "Marketing", "Finance"];
  const allOptions = ["All Departments", ...options];

  [departmentSelect, deptFilter].forEach((select) => {
    if (!select) return;
    select.innerHTML = "";
    allOptions.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
  });

  departmentSelect.value = "Engineering";
  deptFilter.value = "All Departments";
}

function setTheme() {
  document.body.classList.toggle("dark", darkMode);
  themeToggle.textContent = darkMode ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
}

function resetForm() {
  form.reset();
  employeeIdInput.value = "";
  editingId = null;
  formTitle.textContent = "Add Employee";
  departmentSelect.value = "Engineering";
}

function formatSalary(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getFilteredEmployees() {
  const filtered = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm) ||
      employee.email.toLowerCase().includes(searchTerm);
    const matchesDepartment =
      selectedDepartment === "All Departments" || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  filtered.sort((a, b) => {
    switch (sortValue) {
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "salary-asc":
        return a.salary - b.salary;
      case "salary-desc":
        return b.salary - a.salary;
      case "name-asc":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return filtered;
}

function renderTable() {
  const filteredEmployees = getFilteredEmployees();
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ROWS_PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const visibleEmployees = filteredEmployees.slice(start, start + ROWS_PER_PAGE);

  if (!visibleEmployees.length) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No employees match your current filters.</td></tr>`;
    employeeCount.textContent = `${filteredEmployees.length} employees`;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pagination.innerHTML = "";
    return;
  }

  tableBody.innerHTML = visibleEmployees
    .map(
      (employee) => `
        <tr>
          <td>
            <strong>${employee.name}</strong><br />
            <small>${employee.email}</small>
          </td>
          <td>${employee.department}</td>
          <td>${employee.role}</td>
          <td>${formatSalary(employee.salary)}</td>
          <td>
            <div class="action-group">
              <button class="action-btn" type="button" data-action="edit" data-id="${employee.id}">Edit</button>
              <button class="action-delete" type="button" data-action="delete" data-id="${employee.id}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  employeeCount.textContent = `${filteredEmployees.length} employees`;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  pagination.innerHTML = "";
  if (totalPages <= 1) return;

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement("button");
    button.className = `page-btn ${page === currentPage ? "active" : ""}`;
    button.type = "button";
    button.textContent = page;
    button.addEventListener("click", () => {
      currentPage = page;
      renderTable();
    });
    pagination.appendChild(button);
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const employeeData = {
    id: editingId || Date.now(),
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    department: departmentSelect.value,
    role: roleInput.value.trim(),
    salary: Number(salaryInput.value),
  };

  if (!employeeData.name || !employeeData.email || !employeeData.role || !employeeData.salary) {
    return;
  }

  if (editingId) {
    employees = employees.map((employee) => (employee.id === editingId ? employeeData : employee));
  } else {
    employees = [employeeData, ...employees];
  }

  saveEmployees();
  resetForm();
  currentPage = 1;
  renderTable();
}

function handleTableClick(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;
  const employeeId = Number(id);

  if (action === "edit") {
    const employeeToEdit = employees.find((employee) => employee.id === employeeId);
    if (!employeeToEdit) return;

    editingId = employeeId;
    employeeIdInput.value = employeeId;
    nameInput.value = employeeToEdit.name;
    emailInput.value = employeeToEdit.email;
    departmentSelect.value = employeeToEdit.department;
    roleInput.value = employeeToEdit.role;
    salaryInput.value = employeeToEdit.salary;
    formTitle.textContent = "Edit Employee";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "delete") {
    employees = employees.filter((employee) => employee.id !== employeeId);
    saveEmployees();
    if (editingId === employeeId) {
      resetForm();
    }
    renderTable();
  }
}

function bindEvents() {
  form.addEventListener("submit", handleFormSubmit);
  resetFormBtn.addEventListener("click", resetForm);
  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    currentPage = 1;
    renderTable();
  });
  deptFilter.addEventListener("change", (event) => {
    selectedDepartment = event.target.value;
    currentPage = 1;
    renderTable();
  });
  sortSelect.addEventListener("change", (event) => {
    sortValue = event.target.value;
    renderTable();
  });
  tableBody.addEventListener("click", handleTableClick);
  themeToggle.addEventListener("click", () => {
    darkMode = !darkMode;
    setTheme();
  });
}

function init() {
  populateDepartmentOptions();
  setTheme();
  bindEvents();
  resetForm();
  renderTable();
}

init();
