const seed = {
  serviceTypes: [
    "01-INCENDIO", "02-RESCATE", "03-ESPECIALES", "04-DESASTRES",
    "05-COLABORACION", "06-GUARDIA", "07-COMANDO", "08-TECNICO",
    "09-CEREMONIAL", "10-MAT PEL", "11-INCENDIO FORESTAL"
  ],
  roles: ["D", "R", "CH", "G/P"],
  mobiles: ["Movil N° 1", "Movil N° 3", "Movil N° 5", "Movil N° 6", "Movil N° 8", "Movil N° 11", "Movil N° 12", "Movil N° 19", "Movil N° 24", "Movil N° 25", "Movil N° 26", "Movil N° 27"],
  people: [
    ["Morro, Marcos", "Oficial Principal"],
    ["Van Becelaere, David", "Oficial Inspector"],
    ["Puig, Ramiro", "Sub Comandante"],
    ["Cacciatore, Andrea Gisela", "Oficial Inspector"],
    ["Casenave, Eduardo", "Sub oficial Mayor"],
    ["Bustamante, Gustavo Matias", "Sub oficial Principal"],
    ["Cadierno, Lucas", "Sargento Primero"],
    ["Franco, Jose Luis", "Sargento Primero"],
    ["Churin, Luciano", "Sargento"],
    ["Ramirez, Maximiliano Miguel", "Sargento"],
    ["Puchulo, Claudio Alejandro", "Sargento"],
    ["Violante, Fernando", "Sargento"],
    ["Santoro, Juan Ignacio", "Cabo Primero"],
    ["Iglesias, Matias", "Cabo Primero"],
    ["Susenna, David", "Cabo Primero"],
    ["Santucho, Juan Manuel", "Cabo"],
    ["Perrotta, Lucio", "Cabo"],
    ["Gonzalez, Joaquin", "Cabo"],
    ["Ramos, Nicolas", "Bombero"],
    ["Pelourson, Ignacio Martin", "Bombero"],
    ["Echeverria, Luis Daniel", "Bombero"],
    ["Belardo, Agustin", "Bombero"],
    ["Re, German Jesus", "Bombero"],
    ["Otero, Vicente", "Bombero"],
    ["Jaimes, Jaquelin Romina", "Bombero"],
    ["Leide, Mario", "Bombero"],
    ["Ardis, Ricardo Ariel", "Bombero"],
    ["Trotta, Leonardo", "Bombero"],
    ["Bergonzi, Gabriel Enrique", "Bombero"],
    ["Gutierrez, Diego Sebastian", "Bombero"],
    ["Placeres, Pamela Mailen", "Bombero"],
    ["Cladera, Camila Celeste", "Bombero"],
    ["Bottini, Irina", "Bombero"],
    ["Chavero, Sebastian Javier", "Bombero"],
    ["Calzone, Francisco Samuel", "Bombero"],
    ["Panarisi, Leonardo Daniel", "Bombero"],
    ["Gradiche Alevatto Brisa T.", "Bombero"],
    ["Cogno, Ignacio Gabriel", "Bombero"],
    ["Ramirez, Miqueas Joel", "Bombero"],
    ["Taurelli, Ignacio Ezequiel", "Bombero"],
    ["Sainz, Mirna", "Bombero"],
    ["Ceccoli, Ignacio Jesus", "Bombero"],
    ["Juarez, Milagros", "Bombero"],
    ["Pica, Mariano Jose", "Bombero"],
    ["Cascardo, Erika Delfina", "Bombero"],
    ["Mordacci, Luis Ignacio", "Bombero"],
    ["Paura, Fernando Ariel", "Bombero"],
    ["Aviles Fernandez, Marcos H.", "Bombero"],
    ["Ordonez, Yamila Ayelen", "Bombero"],
    ["Seta, Francisco Ezequiel", "Bombero"],
    ["Mazzucco, Mirna Gisela", "Bombero"],
    ["Chavero, Fernanda Sabrina", "Bombero"],
    ["Gonzalez, Bernardo Agustin", "Bombero"],
    ["Ferreira, Lucrecia", "Bombero"],
    ["Longo, Yanina Natalia", "Bombero"],
    ["Ragone, Bernardo Ivan", "Bombero"],
    ["Mirad, Emanuel Adrian", "Bombero"],
    ["Milluzzo, Nahuel Martin", "Bombero"],
    ["Escudero, Sofia Yamile", "Bombero"],
    ["De Angelis, Ezequiel Dilan", "Bombero"],
    ["Frias, Estefania Fernanda", "Bombero"],
    ["Baronio, Lucia Belen", "Bombero"],
    ["Puchulo, Macarena Nahir", "Bombero"],
    ["Siezza, Ramiro", "Bombero"],
    ["Acosta, Marcos Gabriel", "Bombero"],
    ["Guevara, Luz Maria", "Bombero"],
    ["Broemser, Eduardo Ariel", "Bombero"],
    ["Diaz, Karen Ludmila", "Bombero"],
    ["Calderon, Angeles Maria", "Bombero"],
    ["Maldonado, Cesar Javier", "Bombero"],
    ["Abrigo, Matias Daniel", "Bombero"],
    ["Cocimano, Micaela", "Bombero"],
    ["Marcello, Ana Luz", "Bombero"],
    ["Buscalia, Franco", "Bombero"],
    ["Parra, Jeremias", "Bombero"],
    ["Ullua, Julieta", "Bombero"]
  ].map(([name, grade]) => ({ name, grade }))
};

const DB_NAME = "sbvp-partes-db";
const DB_VERSION = 1;
const PERSONAL_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1fkfiSwjaFuysUVHaTTaHziDee0Atmrpo-cbH_iqrCuw/gviz/tq?tqx=out:csv&sheet=PERSONAL";
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9TtL5TXjuNKsJbBALfVpPFysSsZZu_o8OMbYZbPy3BA94hsG3eomJNNH0GmRsZl7xvg/exec";
let db;
let editingId = null;
let directoryHandle = null;
let selectedPendingId = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("services", { keyPath: "id" });
      database.createObjectStore("settings", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function store(name, mode = "readonly") {
  return db.transaction(name, mode).objectStore(name);
}

function dbGetAll(name) {
  return new Promise((resolve, reject) => {
    const request = store(name).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbPut(name, value) {
  return new Promise((resolve, reject) => {
    const request = store(name, "readwrite").put(value);
    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
}

function dbClear(name) {
  return new Promise((resolve, reject) => {
    const request = store(name, "readwrite").clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function people() {
  const custom = localStorage.getItem("sbvpPeople");
  return custom ? JSON.parse(custom) : seed.people;
}

function refreshPeopleControls() {
  renderSelects();
  resetForm();
}

function optionList(values, selected = "") {
  return values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function personOptions(selected = "") {
  return `<option value="">Seleccionar</option>` + people().map(p => `<option value="${escapeHtml(p.name)}"${p.name === selected ? " selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function durationHours(service) {
  if (!service.fechaSalida || !service.horaSalida || !service.fechaRegreso || !service.horaRegreso) return 0;
  const start = new Date(`${service.fechaSalida}T${service.horaSalida}`);
  const end = new Date(`${service.fechaRegreso}T${service.horaRegreso}`);
  const diff = (end - start) / 36e5;
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

function generateId(acta) {
  const clean = (acta || "parte").replace(/[^\w-]+/g, "-");
  return `${clean}-${Date.now()}`;
}

function renderSelects() {
  $('[name="codigo"]').innerHTML = `<option value="">Seleccionar</option>${optionList(seed.serviceTypes)}`;
  $('[name="aCargo"]').innerHTML = personOptions();
  $('[name="operador"]').innerHTML = personOptions();
}

function renderCrewPanel(selectedCrew = []) {
  const selected = new Map(selectedCrew.map(item => [item.person, item.role]));
  $("#crewPanel").innerHTML = people().map(person => {
    const role = selected.get(person.name) || "";
    return `
      <div class="crew-person-card ${roleClass(role)}" data-person="${escapeHtml(person.name)}">
        <div>
          <strong>${escapeHtml(person.name)}</strong>
          <span>${escapeHtml(person.grade || "")}</span>
        </div>
        <select class="crew-role" aria-label="Rol ${escapeHtml(person.name)}">
          <option value=""${role === "" ? " selected" : ""}>-</option>
          <option value="D"${role === "D" ? " selected" : ""}>D</option>
          <option value="CH"${role === "CH" ? " selected" : ""}>CH</option>
          <option value="R"${role === "R" ? " selected" : ""}>R</option>
          <option value="G/P"${role === "G/P" ? " selected" : ""}>G/P</option>
        </select>
      </div>
    `;
  }).join("");
  $$(".crew-role", $("#crewPanel")).forEach(select => {
    select.addEventListener("change", event => {
      const card = event.target.closest(".crew-person-card");
      card.className = `crew-person-card ${roleClass(event.target.value)}`;
    });
  });
}

function roleClass(role) {
  if (role === "D" || role === "CH") return "role-duty";
  if (role === "R") return "role-standby";
  if (role === "G/P") return "role-paid";
  return "";
}

function addMobileRow(data = {}) {
  const node = $("#mobileTemplate").content.firstElementChild.cloneNode(true);
  $(".mobile-name", node).innerHTML = `<option value="">Movil</option>${optionList(seed.mobiles, data.name)}`;
  $(".mobile-driver", node).innerHTML = personOptions(data.driver);
  $(".remove", node).addEventListener("click", () => node.remove());
  $("#mobileRows").append(node);
}

function resetForm() {
  editingId = null;
  $("#serviceForm").reset();
  $('[name="parteAnio"]').value = "26";
  $('[name="fechaLlamada"]').value = today();
  $('[name="fechaSalida"]').value = today();
  $('[name="fechaRegreso"]').value = today();
  $('[name="horaLlamada"]').value = nowTime();
  $('[name="horaSalida"]').value = nowTime();
  $("#mobileRows").innerHTML = "";
  addMobileRow();
  renderCrewPanel();
}

function collectForm(status = "pending") {
  const form = new FormData($("#serviceForm"));
  const data = Object.fromEntries(form.entries());
  data.parteNumero = (data.parteNumero || "").trim();
  data.parteAnio = (data.parteAnio || "26").trim();
  data.acta = data.parteNumero && data.parteAnio ? `${data.parteNumero}/${data.parteAnio}` : data.parteNumero;
  const mobiles = $$(".mobile-row").map(row => ({
    name: $(".mobile-name", row).value,
    driver: $(".mobile-driver", row).value
  })).filter(item => item.name || item.driver);
  const crew = $$(".crew-person-card").map(card => ({
    person: card.dataset.person,
    role: $(".crew-role", card).value
  })).filter(item => item.person && item.role);
  return {
    id: editingId || generateId(data.acta),
    createdAt: editingId ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status,
    downloadedAt: null,
    ...data,
    mobiles,
    crew
  };
}

async function saveService(status = "pending") {
  const current = collectForm(status);
  const previous = editingId ? (await dbGetAll("services")).find(item => item.id === editingId) : null;
  const service = {
    ...previous,
    ...current,
    status: previous?.status === "complete" ? "complete" : current.status,
    downloadedAt: previous?.downloadedAt || current.downloadedAt,
    createdAt: previous?.createdAt || current.createdAt
  };
  await dbPut("services", service);
  await saveEditable(service);
  resetForm();
  await renderAll();
  showView("pendientes");
}

async function saveEditable(service) {
  const filename = `parte-${service.acta || service.id}.json`.replace(/[\\/:*?"<>|]/g, "-");
  const payload = JSON.stringify(service, null, 2);
  if (directoryHandle) {
    try {
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(payload);
      await writable.close();
      return;
    } catch (error) {
      console.warn("No se pudo guardar en carpeta", error);
    }
  }
}

async function sendToAppsScript(service) {
  const url = localStorage.getItem("appsScriptUrl") || DEFAULT_APPS_SCRIPT_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "guardarParte", parte: service })
    });
  } catch (error) {
    console.warn("No se pudo enviar a Apps Script", error);
  }
}

function serviceSummary(service) {
  const hours = durationHours(service);
  return `${service.fechaSalida || "Sin fecha"} | ${service.codigo || "Sin codigo"} | ${service.ubicacion || "Sin ubicacion"} | ${hours.toFixed(1)} hs`;
}

function statusText(service) {
  if (service.status === "ready_print") return "Para imprimir";
  if (service.status === "complete") return "Completo";
  return "Para completar";
}

function renderServiceCard(service, actions = "") {
  const statusClass = service.status === "complete" ? "status complete" : "status";
  return `
    <article class="service-item" data-service-id="${service.id}">
      <div>
        <h3>${escapeHtml(service.aCargo || "Sin persona a cargo")} - Parte ${escapeHtml(service.acta || "S/N")} <span class="${statusClass}">${statusText(service)}</span></h3>
        <p>${escapeHtml(serviceSummary(service))}</p>
      </div>
      ${actions ? `<div class="item-actions">${actions}</div>` : ""}
    </article>
  `;
}

function renderPendingCard(service) {
  const card = renderServiceCard(service, `
    <button class="primary" data-action="open-complete" data-id="${service.id}">Seleccionar</button>
    <button class="ghost" data-action="edit" data-id="${service.id}">Editar</button>
  `);
  return selectedPendingId && selectedPendingId !== service.id ? card.replace('class="service-item"', 'class="service-item hidden-while-zoom"') : card;
}

function renderPrintCard(service) {
  const frontState = service.printedFrontAt ? "Frente impreso" : "Frente pendiente";
  const crewState = service.printedCrewAt ? "Dotacion impresa" : "Dotacion pendiente";
  return renderServiceCard(service, `
    <button class="secondary" data-action="print-front" data-id="${service.id}">Imprimir frente</button>
    <button class="secondary" data-action="print-crew" data-id="${service.id}">Imprimir dotacion</button>
  `).replace("</p>", ` | ${frontState} | ${crewState}</p>`);
}

function renderHistoryCard(service) {
  return renderServiceCard(service, `
    <button class="ghost" data-action="print-front" data-id="${service.id}">Frente</button>
    <button class="ghost" data-action="print-crew" data-id="${service.id}">Dotacion</button>
  `);
}

function renderCompletionEditor(service) {
  if (!service) {
    $("#completionEditor").innerHTML = `<p class="muted completion-empty">Selecciona una tarjeta para completar el parte.</p>`;
    return;
  }
  const escapeAttr = value => escapeHtml(value).replace(/"/g, "&quot;");
  $("#completionEditor").innerHTML = `
    <div class="completion-panel" data-service-id="${service.id}">
      <div class="panel-title">
        <div>
          <h2>${escapeHtml(service.aCargo || "Sin persona a cargo")} - Parte ${escapeHtml(service.acta || "S/N")}</h2>
          <p>${escapeHtml(serviceSummary(service))}</p>
        </div>
      </div>
      <div class="completion-fields">
        <label>Reconocimiento<textarea data-field="reconocimiento" rows="5">${escapeHtml(service.reconocimiento || "")}</textarea></label>
        <label>Disposiciones<textarea data-field="disposiciones" rows="5">${escapeHtml(service.disposiciones || "")}</textarea></label>
        <label>Perdidas<textarea data-field="perdidas" rows="5">${escapeHtml(service.perdidas || "")}</textarea></label>
      </div>
      <div class="form-block">
        <h3>Propietarios y seguros</h3>
        <div class="grid four">
          <label>Propietario 1<input data-field="propietario1" value="${escapeAttr(service.propietario1 || "N/A")}"></label>
          <label>DNI Propietario 1<input data-field="dniPropietario1" value="${escapeAttr(service.dniPropietario1 || "N/A")}"></label>
          <label>Compania 1<input data-field="compania1" value="${escapeAttr(service.compania1 || "N/A")}"></label>
          <label>Nro de poliza 1<input data-field="poliza1" value="${escapeAttr(service.poliza1 || "N/A")}"></label>
          <label>Propietario 2<input data-field="propietario2" value="${escapeAttr(service.propietario2 || "N/A")}"></label>
          <label>DNI Propietario 2<input data-field="dniPropietario2" value="${escapeAttr(service.dniPropietario2 || "N/A")}"></label>
          <label>Compania 2<input data-field="compania2" value="${escapeAttr(service.compania2 || "N/A")}"></label>
          <label>Nro de poliza 2<input data-field="poliza2" value="${escapeAttr(service.poliza2 || "N/A")}"></label>
        </div>
      </div>
      <div class="actions">
        <button class="ghost" data-action="close-complete" data-id="${service.id}">Cerrar</button>
        <button class="primary" data-action="complete" data-id="${service.id}">Completar y enviar a imprimir</button>
      </div>
    </div>
  `;
}

async function renderAll() {
  const services = await dbGetAll("services");
  services.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const last = services[0];
  $("#lastService").textContent = last ? `Parte ${last.acta || "S/N"}` : "Sin partes";
  const pending = services.filter(s => !s.status || s.status === "pending");
  pending.sort((a, b) => (a.aCargo || "").localeCompare(b.aCargo || "") || new Date(b.createdAt) - new Date(a.createdAt));
  const printQueue = services.filter(s => s.status === "ready_print" || (s.status === "complete" && (!s.printedFrontAt || !s.printedCrewAt)));
  printQueue.sort((a, b) => (a.aCargo || "").localeCompare(b.aCargo || "") || (a.acta || "").localeCompare(b.acta || ""));
  $("#pendingBadge").textContent = pending.length;
  $("#printBadge").textContent = printQueue.length;
  $("#pendingList").innerHTML = pending.length ? pending.map(s => renderPendingCard(s)).join("") : `<p class="muted">No hay partes para completar.</p>`;
  $("#printList").innerHTML = printQueue.length ? printQueue.map(s => renderPrintCard(s)).join("") : `<p class="muted">No hay partes para imprimir.</p>`;
  const selected = pending.find(s => s.id === selectedPendingId);
  $("#pendingList").classList.toggle("is-zoomed", !!selected);
  renderCompletionEditor(selected);
  renderHistory(services);
  renderMetrics(services);
}

function renderHistory(services) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  const term = $("#historySearch").value.toLowerCase().trim();
  const filtered = services.filter(service => {
    const date = new Date(service.createdAt || service.fechaSalida);
    const text = JSON.stringify(service).toLowerCase();
    return date >= cutoff && (!term || text.includes(term));
  });
  $("#historyList").innerHTML = filtered.length ? filtered.map(s => renderHistoryCard(s)).join("") : `<p class="muted">No hay resultados en los ultimos 3 meses.</p>`;
}

function renderMetrics(services) {
  const total = services.length;
  const hours = services.reduce((sum, service) => sum + durationHours(service), 0);
  const crewTotal = services.reduce((sum, service) => sum + service.crew.length, 0);
  const uniqueMobiles = new Set(services.flatMap(service => service.mobiles.map(m => m.name).filter(Boolean)));
  $("#mTotal").textContent = total;
  $("#mHours").textContent = hours.toFixed(1);
  $("#mCrew").textContent = total ? (crewTotal / total).toFixed(1) : "0";
  $("#mMobiles").textContent = uniqueMobiles.size;
  renderBars("#typeMetrics", countBy(services, s => s.codigo || "Sin codigo"));
  renderBars("#mobileMetrics", mobileHours(services), "hs");
  renderPeopleMetrics(services);
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function mobileHours(services) {
  const totals = {};
  services.forEach(service => {
    const hours = durationHours(service);
    service.mobiles.forEach(mobile => {
      if (!mobile.name) return;
      totals[mobile.name] = (totals[mobile.name] || 0) + hours;
    });
  });
  return totals;
}

function renderBars(selector, data, suffix = "") {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  $(selector).innerHTML = entries.length ? entries.map(([label, value]) => `
    <div class="bar">
      <span>${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
      <strong>${Number(value).toFixed(suffix ? 1 : 0)}${suffix}</strong>
    </div>
  `).join("") : `<p class="muted">Sin datos todavia.</p>`;
}

function renderPeopleMetrics(services) {
  const totals = {};
  services.forEach(service => {
    const hours = durationHours(service);
    service.crew.forEach(item => {
      if (!item.person) return;
      totals[item.person] ||= { count: 0, hours: 0 };
      totals[item.person].count += 1;
      totals[item.person].hours += hours;
    });
  });
  const rows = Object.entries(totals).sort((a, b) => b[1].count - a[1].count).slice(0, 20);
  $("#personMetrics").innerHTML = rows.length ? rows.map(([name, data]) => `
    <article class="service-item">
      <strong>${escapeHtml(name)}</strong>
      <span>${data.count} servicios</span>
      <span>${data.hours.toFixed(1)} hs</span>
    </article>
  `).join("") : `<p class="muted">Sin asistencias registradas.</p>`;
}

function makePrintHtml(service, incomplete = false, mode = "all") {
  const hours = durationHours(service);
  const roleByPerson = new Map((service.crew || []).map(item => [item.person, item.role]));
  const blocks = [
    ["Codigo", service.codigo], ["Tipo", service.tipo], ["Parte de servicio", service.acta],
    ["Denunciante", service.denunciante || "N/A"], ["Telefono", service.telefono || "N/A"], ["Ubicacion", service.ubicacion],
    ["Cantidad moviles", service.mobiles.length], ["A cargo", service.aCargo], ["Operador/a", service.operador],
    ["Fecha llamada", service.fechaLlamada], ["Fecha salida", service.fechaSalida], ["Fecha regreso", service.fechaRegreso],
    ["Hora llamada", service.horaLlamada], ["Hora salida", service.horaSalida], ["Hora regreso", service.horaRegreso],
    ["Distancia", service.distancia ? `${service.distancia} km` : ""], ["Duracion", hours ? `${hours.toFixed(1)} hs` : ""], ["Dotacion", service.crew.length]
  ];
  const allPeople = people();
  const leftCount = Math.min(47, Math.ceil(allPeople.length / 2));
  const leftPeople = allPeople.slice(0, leftCount);
  const rightPeople = allPeople.slice(leftCount);
  const attendanceRows = Array.from({ length: Math.max(leftPeople.length, rightPeople.length) }, (_, index) => {
    const left = leftPeople[index];
    const right = rightPeople[index];
    return `
      <tr>
        <td>${escapeHtml(left?.name || "")}</td>
        <td>${escapeHtml(left?.grade || "")}</td>
        <td>${escapeHtml(left ? roleByPerson.get(left.name) || "-" : "")}</td>
        <td>${escapeHtml(right?.name || "")}</td>
        <td>${escapeHtml(right?.grade || "")}</td>
        <td>${escapeHtml(right ? roleByPerson.get(right.name) || "-" : "")}</td>
      </tr>
    `;
  }).join("");
  const mobileRows = service.mobiles.map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.driver)}</td></tr>`).join("");
  const frontHtml = `
    <section class="print-sheet">
      <div class="print-title">
        <img src="logo-sbvp.png" alt="">
        <div><p>Sociedad de Bomberos Voluntarios Pergamino</p><h2>Parte de servicio</h2></div>
      </div>
      ${incomplete ? `<div class="watermark">IMPRESION INCOMPLETA</div>` : ""}
      <div class="print-grid">${blocks.map(([label, value]) => `<div class="print-cell"><b>${label}</b>${escapeHtml(value || "")}</div>`).join("")}</div>
      <div class="print-block"><h3>Reconocimiento</h3>${escapeHtml(service.reconocimiento || "")}</div>
      <div class="print-block"><h3>Disposiciones</h3>${escapeHtml(service.disposiciones || "")}</div>
      <div class="print-block"><h3>Perdidas</h3>${escapeHtml(service.perdidas || "")}</div>
      <div class="print-block"><h3>Unidades moviles</h3><table class="attendance-table"><thead><tr><th>Movil</th><th>Chofer</th></tr></thead><tbody>${mobileRows}</tbody></table></div>
      <table class="insurance-table">
        <tr><th>Propietario 1:</th><td>${escapeHtml(service.propietario1 || "N/A")}</td><th>Propietario 2:</th><td>${escapeHtml(service.propietario2 || "N/A")}</td></tr>
        <tr><th>DNI Propietario 1:</th><td>${escapeHtml(service.dniPropietario1 || "N/A")}</td><th>DNI Propietario 2:</th><td>${escapeHtml(service.dniPropietario2 || "N/A")}</td></tr>
        <tr><th>Compania 1:</th><td>${escapeHtml(service.compania1 || "N/A")}</td><th>Compania 2:</th><td>${escapeHtml(service.compania2 || "N/A")}</td></tr>
        <tr><th>Nro de poliza 1:</th><td>${escapeHtml(service.poliza1 || "N/A")}</td><th>Nro de poliza 2:</th><td>${escapeHtml(service.poliza2 || "N/A")}</td></tr>
      </table>
      <div class="signature-grid">
        <div class="signature-label">Op. Comando:</div>
        <div class="signature-value">${escapeHtml(service.operador || "")}</div>
        <div class="signature-label">Jefe de servicio</div>
        <div class="signature-value">${escapeHtml(service.aCargo || "")}</div>
        <div class="signature-label tall">Firma:</div>
        <div></div>
        <div class="signature-label tall">Firma:</div>
        <div></div>
      </div>
    </section>
  `;
  const crewHtml = `
    <section class="print-sheet">
      <div class="print-title">
        <img src="logo-sbvp.png" alt="">
        <div><h2>Asistencia del cuerpo activo</h2><p>Parte ${escapeHtml(service.acta || "")} | ${escapeHtml(service.codigo || "")}</p></div>
      </div>
      ${incomplete ? `<div class="watermark">IMPRESION INCOMPLETA</div>` : ""}
      <p><b>Abreviaturas:</b> Dotacion (D) - Retenido (R) - Guardia Paga (G/P) - Chofer (CH)</p>
      <table class="attendance-table full-roster"><thead><tr><th>Apellido / Nombre</th><th>Grado</th><th></th><th>Apellido / Nombre</th><th>Grado</th><th></th></tr></thead><tbody>${attendanceRows}</tbody></table>
    </section>
  `;
  if (mode === "front") return frontHtml;
  if (mode === "crew") return crewHtml;
  return frontHtml + crewHtml;
}

async function printService(id, incomplete = false, mode = "all") {
  const service = (await dbGetAll("services")).find(item => item.id === id);
  if (!service) return;
  $("#printRoot").innerHTML = makePrintHtml(service, incomplete, mode);
  window.print();
}

function printDraftFromForm() {
  const service = collectForm("pending");
  $("#printRoot").innerHTML = makePrintHtml(service, true, "all");
  window.print();
}

async function completeService(id) {
  const service = (await dbGetAll("services")).find(item => item.id === id);
  if (!service) return;
  const panel = $("#completionEditor .completion-panel");
  if (panel) {
    service.reconocimiento = $('[data-field="reconocimiento"]', panel)?.value || "";
    service.disposiciones = $('[data-field="disposiciones"]', panel)?.value || "";
    service.perdidas = $('[data-field="perdidas"]', panel)?.value || "";
    ["propietario1", "dniPropietario1", "compania1", "poliza1", "propietario2", "dniPropietario2", "compania2", "poliza2"].forEach(field => {
      service[field] = $(`[data-field="${field}"]`, panel)?.value || "N/A";
    });
  }
  service.status = "ready_print";
  service.completedAt = new Date().toISOString();
  service.updatedAt = new Date().toISOString();
  await dbPut("services", service);
  await saveEditable(service);
  await sendToAppsScript(service);
  selectedPendingId = null;
  await renderAll();
  showView("imprimir");
}

async function openCompletion(id) {
  selectedPendingId = id;
  await renderAll();
}

async function markPrinted(id, kind) {
  const service = (await dbGetAll("services")).find(item => item.id === id);
  if (!service) return;
  if (kind === "front") service.printedFrontAt = new Date().toISOString();
  if (kind === "crew") service.printedCrewAt = new Date().toISOString();
  if (service.printedFrontAt && service.printedCrewAt) service.status = "complete";
  service.updatedAt = new Date().toISOString();
  await dbPut("services", service);
  await renderAll();
}

async function editService(id) {
  const service = (await dbGetAll("services")).find(item => item.id === id);
  if (!service) return;
  editingId = id;
  Object.entries(service).forEach(([key, value]) => {
    const field = $(`[name="${key}"]`);
    if (field && typeof value !== "object") field.value = value || "";
  });
  const [parteNumero, parteAnio] = String(service.acta || "").split("/");
  $('[name="parteNumero"]').value = parteNumero || "";
  $('[name="parteAnio"]').value = parteAnio || "26";
  $("#mobileRows").innerHTML = "";
  (service.mobiles.length ? service.mobiles : [{}]).forEach(addMobileRow);
  renderCrewPanel(service.crew || []);
  showView("partes");
}

function showView(id) {
  $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === id));
  $$(".view").forEach(view => view.classList.toggle("active", view.id === id));
}

function importPeople() {
  const lines = $("#peopleCsv").value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const imported = parsePeopleRows(lines.map(line => line.includes(";") ? line.split(";") : splitCsvLine(line)));
  if (!imported.length) return;
  localStorage.setItem("sbvpPeople", JSON.stringify(imported));
  refreshPeopleControls();
  alert(`Personal importado: ${imported.length}`);
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values.map(value => value.replace(/^"|"$/g, ""));
}

function parsePeopleRows(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(cell => String(cell || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
  const hasHeader = header.some(cell => cell.includes("nombre") || cell.includes("apellido") || cell.includes("grado"));
  const fullNameIndex = hasHeader ? header.findIndex(cell => cell.includes("apellido_nombre") || cell.includes("apellido y nombre") || cell.includes("nombre completo")) : 0;
  const lastNameIndex = hasHeader ? header.findIndex(cell => cell === "apellido" || cell.includes("apellido")) : -1;
  const firstNameIndex = hasHeader ? header.findIndex(cell => cell === "nombre" || cell.includes("nombre")) : -1;
  const gradeIndex = hasHeader ? header.findIndex(cell => cell.includes("grado") || cell.includes("jerarquia")) : 1;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows.map(row => {
    const fullName = fullNameIndex >= 0 ? String(row[fullNameIndex] || "").trim() : "";
    const lastName = lastNameIndex >= 0 ? String(row[lastNameIndex] || "").trim() : "";
    const firstName = firstNameIndex >= 0 && firstNameIndex !== lastNameIndex ? String(row[firstNameIndex] || "").trim() : "";
    const fallbackName = String(row[0] || "").trim();
    const name = fullName || (lastName && firstName ? `${lastName}, ${firstName}` : lastName || fallbackName);
    return { name, grade: String(row[gradeIndex] || "").trim() };
  }).filter(item => item.name && item.name.toLowerCase() !== "nombre");
}

async function syncPeopleFromSheet(showProgress = true) {
  const status = $("#peopleSyncStatus");
  if (showProgress) status.textContent = "Sincronizando PERSONAL...";
  try {
    const response = await fetch(PERSONAL_SHEET_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = text.split(/\r?\n/).filter(Boolean).map(splitCsvLine);
    const imported = parsePeopleRows(rows);
    if (!imported.length) throw new Error("No se encontraron filas de personal");
    localStorage.setItem("sbvpPeople", JSON.stringify(imported));
    refreshPeopleControls();
    status.textContent = `PERSONAL sincronizado: ${imported.length} personas.`;
  } catch (error) {
    status.textContent = "No se pudo leer PERSONAL. Revisar permisos/publicacion del Google Sheet.";
  }
}

function bindActions() {
  document.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "open-complete") await openCompletion(id);
    if (action === "close-complete") {
      selectedPendingId = null;
      await renderAll();
    }
    if (action === "print-front") {
      await printService(id, false, "front");
      await markPrinted(id, "front");
    }
    if (action === "print-crew") {
      await printService(id, false, "crew");
      await markPrinted(id, "crew");
    }
    if (action === "complete") await completeService(id);
    if (action === "edit") await editService(id);
  });
  $$(".tab").forEach(tab => tab.addEventListener("click", () => showView(tab.dataset.view)));
  $("#addMobile").addEventListener("click", () => addMobileRow());
  $("#clearCrew").addEventListener("click", () => renderCrewPanel());
  $("#newBlank").addEventListener("click", resetForm);
  $("#printDraft").addEventListener("click", printDraftFromForm);
  $("#historySearch").addEventListener("input", renderAll);
  $("#serviceForm").addEventListener("submit", event => {
    event.preventDefault();
    saveService("pending");
  });
  $("#importPeople").addEventListener("click", importPeople);
  $("#syncPeople").addEventListener("click", () => syncPeopleFromSheet(true));
  $("#saveAppsScriptUrl").addEventListener("click", () => {
    const url = $("#appsScriptUrl").value.trim();
    if (url) localStorage.setItem("appsScriptUrl", url);
    $("#folderStatus").textContent = url ? "URL de Apps Script guardada." : "Pegá una URL de Web App valida.";
  });
  $("#clearDemo").addEventListener("click", async () => {
    if (!confirm("Borrar todos los partes guardados en esta computadora?")) return;
    await dbClear("services");
    await renderAll();
  });
  $("#pickFolder").addEventListener("click", async () => {
    if (!window.showDirectoryPicker) {
      $("#folderStatus").textContent = "Este navegador no permite elegir carpeta. Podemos usar Google Sheets en la proxima etapa.";
      return;
    }
    directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    $("#folderStatus").textContent = `Carpeta elegida: ${directoryHandle.name}`;
  });
}

async function init() {
  db = await openDb();
  bindActions();
  $("#appsScriptUrl").value = localStorage.getItem("appsScriptUrl") || DEFAULT_APPS_SCRIPT_URL;
  renderSelects();
  resetForm();
  await syncPeopleFromSheet(false);
  await renderAll();
}

init().catch(error => {
  console.error(error);
  alert("No se pudo iniciar la base local. Revisar permisos del navegador.");
});
