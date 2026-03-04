const newTicketBtn = document.getElementById("newTicket");
const closeForm = document.getElementById("closeBtn");
const formPopUp = document.getElementById("popupForm");
const form = document.getElementById("ticketForm");
const ticketList = document.querySelector(".ticket-list");
const paginationCon = document.getElementById("pagination");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const totalCount = document.getElementById("totalCount");
const openCount = document.getElementById("openCount");
const progressCount = document.getElementById("progressCount");
const resolvedCount = document.getElementById("resolvedCount");
const filterPriority = document.getElementById("filterByPriority");
const searchInput = document.getElementById("search-input");

let ticketItems = JSON.parse(localStorage.getItem("ticketItems")) || [];
let editMode = false;
let editId = null;
let pendingDeleteId = null;
let currentPage = 1;
const ticketPerPage = 4;

renderTicketItems();
updateDashboardStats();

/* ── Delete modal ── */
function openDeleteModal(id) {
  pendingDeleteId = id;
  deleteModal.classList.add("active");
}

function closeDeleteModal() {
  pendingDeleteId = null;
  deleteModal.classList.remove("active");
}

confirmDeleteBtn.addEventListener("click", () => {
  if (pendingDeleteId !== null) deleteTicket(pendingDeleteId);
  closeDeleteModal();
});

cancelDeleteBtn.addEventListener("click", closeDeleteModal);

deleteModal.addEventListener("click", (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDeleteModal();
    formPopUp.classList.remove("active");
  }
});

/* ── Ticket form ── */
newTicketBtn.addEventListener("click", () => {
  resetForm();
  formPopUp.classList.add("active");
});

closeForm.addEventListener("click", () => {
  formPopUp.classList.remove("active");
  resetForm();
});

formPopUp.addEventListener("click", (e) => {
  if (e.target === formPopUp) {
    formPopUp.classList.remove("active");
    resetForm();
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const priority = document.getElementById("priority").value;
  const email = document.getElementById("email").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title || !priority || !email || !description) {
    alert("Please fill all fields.");
    return;
  }

  if (editMode) {
    const ticket = ticketItems.find((t) => t.id === editId);
    ticket.title = title;
    ticket.priority = priority;
    ticket.email = email;
    ticket.description = description;
  } else {
    ticketItems.unshift({
      id: Date.now(),
      title,
      priority,
      email,
      description,
      status: "open",
      date: new Date().toISOString().split("T")[0],
    });
  }

  saveToLocalStorage();
  currentPage = 1;
  renderTicketItems();
  updateDashboardStats();
  form.reset();
  formPopUp.classList.remove("active");
  editMode = false;
});

/* ── Render ── */
function renderTicketItems() {
  ticketList.innerHTML = "";

  const priorityValue = filterPriority?.value || "";
  const searchValue = searchInput?.value.toLowerCase() || "";

  const filtered = ticketItems.filter((ticket) => {
    const matchesPriority = !priorityValue || ticket.priority === priorityValue;
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchValue) ||
      ticket.email.toLowerCase().includes(searchValue) ||
      ticket.description.toLowerCase().includes(searchValue);
    return matchesPriority && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / ticketPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * ticketPerPage;
  const paginated = filtered.slice(start, start + ticketPerPage);

  paginated.forEach((ticket) => {
    const tr = document.createElement("tr");
    tr.classList.add("main-row");

    tr.innerHTML = `
            <td>${ticket.date}</td>
            <td>${ticket.title}</td>
            <td><span class="ticket-priority ${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="status ${ticket.status}" data-id="${ticket.id}">${ticket.status}</span></td>
            <td>${ticket.email}</td>
            <td class="active-cell">
              <button class="edit-btn"   data-id="${ticket.id}" title="Edit"><span class="material-icons">edit</span></button>
              <button class="delete-btn" data-id="${ticket.id}" title="Delete"><span class="material-icons">delete</span></button>
            </td>
          `;

    const descRow = document.createElement("tr");
    descRow.classList.add("description-row");
    descRow.style.display = "none";
    descRow.innerHTML = `<td colspan="6" class="description-cell"><strong>Description:</strong> ${ticket.description}</td>`;

    tr.addEventListener("click", (e) => {
      if (
        e.target.closest(".edit-btn") ||
        e.target.closest(".delete-btn") ||
        e.target.closest(".status")
      )
        return;
      descRow.style.display =
        descRow.style.display === "none" ? "table-row" : "none";
    });

    ticketList.appendChild(tr);
    ticketList.appendChild(descRow);
  });

  renderPagination(totalPages);
  attachEventListeners();
}

/* ── Pagination ── */
function renderPagination(totalPages) {
  paginationCon.innerHTML = "";

  if (totalPages <= 1) {
    paginationCon.style.display = "none";
    return;
  }
  paginationCon.style.display = "flex";

  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = `<span class="material-icons">chevron_left</span>`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTicketItems();
    }
  });

  const pageInfo = document.createElement("span");
  pageInfo.classList.add("page-info");
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = `<span class="material-icons">chevron_right</span>`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTicketItems();
    }
  });

  paginationCon.appendChild(prevBtn);
  paginationCon.appendChild(pageInfo);
  paginationCon.appendChild(nextBtn);
}

/* ── Event listeners per render ── */
function attachEventListeners() {
  document.querySelectorAll(".status").forEach((el) => {
    el.addEventListener("click", () => changeStatus(Number(el.dataset.id)));
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      openDeleteModal(Number(btn.dataset.id)),
    );
  });
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => editTicket(Number(btn.dataset.id)));
  });
}

/* ── Actions ── */
function changeStatus(id) {
  const ticket = ticketItems.find((t) => t.id === id);
  if (ticket.status === "open") ticket.status = "in-progress";
  else if (ticket.status === "in-progress") ticket.status = "resolved";
  else ticket.status = "open";
  saveToLocalStorage();
  renderTicketItems();
  updateDashboardStats();
}

function deleteTicket(id) {
  ticketItems = ticketItems.filter((t) => t.id !== id);
  saveToLocalStorage();
  renderTicketItems();
  updateDashboardStats();
}

function editTicket(id) {
  const ticket = ticketItems.find((t) => t.id === id);
  if (!ticket) return;
  document.getElementById("title").value = ticket.title;
  document.getElementById("priority").value = ticket.priority;
  document.getElementById("email").value = ticket.email;
  document.getElementById("description").value = ticket.description;
  editMode = true;
  editId = id;
  document.getElementById("update-header").textContent =
    "Update Support Ticket";
  document.getElementById("update-btn").textContent = "Update Ticket";
  formPopUp.classList.add("active");
}

function resetForm() {
  form.reset();
  editMode = false;
  editId = null;
  document.getElementById("update-header").textContent =
    "Create Support Ticket";
  document.getElementById("update-btn").textContent = "Create Ticket";
}

function updateDashboardStats() {
  totalCount.textContent = ticketItems.length;
  openCount.textContent = ticketItems.filter((t) => t.status === "open").length;
  progressCount.textContent = ticketItems.filter(
    (t) => t.status === "in-progress",
  ).length;
  resolvedCount.textContent = ticketItems.filter(
    (t) => t.status === "resolved",
  ).length;
}

filterPriority?.addEventListener("change", () => {
  currentPage = 1;
  renderTicketItems();
});
searchInput?.addEventListener("input", () => {
  currentPage = 1;
  renderTicketItems();
});

function saveToLocalStorage() {
  localStorage.setItem("ticketItems", JSON.stringify(ticketItems));
}
