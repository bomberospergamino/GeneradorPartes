const CONFIG = {
  spreadsheetId: '1fkfiSwjaFuysUVHaTTaHziDee0Atmrpo-cbH_iqrCuw',
  driveFolderId: '1adVL7PQsi6HJO37TFl7PVtdaj5sygpXI',
  sheets: {
    servicios: 'SERVICIOS',
    dotacion: 'SERVICIO_DOTACION',
    moviles: 'SERVICIO_MOVILES',
    metricas: 'METRICAS'
  }
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action || 'guardarParte';
    if (action === 'guardarParte') return jsonResponse(saveParte(payload.parte));
    if (action === 'metricas') return jsonResponse(rebuildMetricas());
    throw new Error('Accion no soportada: ' + action);
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function saveParte(parte) {
  if (!parte) throw new Error('Falta parte');
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const servicioId = parte.id || Utilities.getUuid();
  const parteServicio = parte.acta || [parte.parteNumero, parte.parteAnio].filter(Boolean).join('/');
  const duracionHoras = getDurationHours(parte);
  const now = new Date();

  appendObject(ss, CONFIG.sheets.servicios, {
    servicio_id: servicioId,
    parte_numero: parte.parteNumero || '',
    parte_anio: parte.parteAnio || '',
    parte_servicio: parteServicio,
    codigo_servicio: parte.codigo || '',
    tipo_servicio: parte.tipo || '',
    denunciante: parte.denunciante || '',
    telefono: parte.telefono || '',
    ubicacion: parte.ubicacion || '',
    distancia_km: Number(parte.distancia || 0),
    fecha_llamada: parte.fechaLlamada || '',
    hora_llamada: parte.horaLlamada || '',
    fecha_salida: parte.fechaSalida || '',
    hora_salida: parte.horaSalida || '',
    fecha_regreso: parte.fechaRegreso || '',
    hora_regreso: parte.horaRegreso || '',
    duracion_horas: duracionHoras,
    persona_a_cargo: parte.aCargo || '',
    operador: parte.operador || '',
    reconocimiento: parte.reconocimiento || '',
    disposiciones: parte.disposiciones || '',
    perdidas: parte.perdidas || '',
    propietario1: parte.propietario1 || 'N/A',
    dni_propietario1: parte.dniPropietario1 || 'N/A',
    compania1: parte.compania1 || 'N/A',
    poliza1: parte.poliza1 || 'N/A',
    propietario2: parte.propietario2 || 'N/A',
    dni_propietario2: parte.dniPropietario2 || 'N/A',
    compania2: parte.compania2 || 'N/A',
    poliza2: parte.poliza2 || 'N/A',
    estado: parte.status || '',
    creado_en: parte.createdAt || now,
    completado_en: parte.completedAt || ''
  });

  (parte.crew || []).forEach(item => appendObject(ss, CONFIG.sheets.dotacion, {
    servicio_id: servicioId,
    parte_servicio: parteServicio,
    fecha_salida: parte.fechaSalida || '',
    persona: item.person || '',
    rol: item.role || '',
    duracion_horas: duracionHoras,
    codigo_servicio: parte.codigo || '',
    tipo_servicio: parte.tipo || ''
  }));

  (parte.mobiles || []).forEach(item => appendObject(ss, CONFIG.sheets.moviles, {
    servicio_id: servicioId,
    parte_servicio: parteServicio,
    fecha_salida: parte.fechaSalida || '',
    movil: item.name || '',
    chofer: item.driver || '',
    persona_a_cargo: parte.aCargo || '',
    codigo_servicio: parte.codigo || '',
    tipo_servicio: parte.tipo || '',
    duracion_horas: duracionHoras,
    distancia_km: Number(parte.distancia || 0)
  }));

  saveEditableCopy(parteServicio, parte);
  rebuildMetricas();
  return { ok: true, servicio_id: servicioId };
}

function appendObject(ss, sheetName, object) {
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const keys = Object.keys(object);
  if (sheet.getLastRow() === 0) sheet.appendRow(keys);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = new Map(header.map((name, index) => [name, index]));
  keys.forEach(key => {
    if (!headerMap.has(key)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(key);
      headerMap.set(key, sheet.getLastColumn() - 1);
    }
  });
  const finalHeader = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = finalHeader.map(key => object[key] ?? '');
  sheet.appendRow(row);
}

function rebuildMetricas() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const servicios = ss.getSheetByName(CONFIG.sheets.servicios);
  if (!servicios || servicios.getLastRow() < 2) return { ok: true, message: 'Sin servicios' };
  const metricas = ss.getSheetByName(CONFIG.sheets.metricas) || ss.insertSheet(CONFIG.sheets.metricas);
  metricas.clear();
  metricas.getRange('A1').setValue('Metricas');
  metricas.getRange('A3').setValue('Usar tablas dinamicas desde SERVICIOS, SERVICIO_DOTACION y SERVICIO_MOVILES.');
  metricas.getRange('A5').setValue('Graficos recomendados: servicios por mes/tipo, torta por tipo, horas y km por movil.');
  return { ok: true };
}

function saveEditableCopy(parteServicio, parte) {
  const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
  const name = ('parte-' + parteServicio + '.json').replace(/[\\/:*?"<>|]/g, '-');
  folder.createFile(name, JSON.stringify(parte, null, 2), MimeType.PLAIN_TEXT);
}

function getDurationHours(parte) {
  if (!parte.fechaSalida || !parte.horaSalida || !parte.fechaRegreso || !parte.horaRegreso) return 0;
  const start = new Date(parte.fechaSalida + 'T' + parte.horaSalida);
  const end = new Date(parte.fechaRegreso + 'T' + parte.horaRegreso);
  const diff = (end.getTime() - start.getTime()) / 36e5;
  return diff > 0 ? diff : 0;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
