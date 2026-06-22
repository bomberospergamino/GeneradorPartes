const CONFIG = {
  spreadsheetId: '1fkfiSwjaFuysUVHaTTaHziDee0Atmrpo-cbH_iqrCuw',
  driveFolderId: '1-IkiEXQSUdiXDnlfYxGPTSOPr8_sWjhB',
  fallbackFolderName: 'SBVP_PARTES_EDITABLES',
  createFallbackFolder: true,
  sheets: {
    servicios: 'SERVICIOS',
    dotacion: 'SERVICIO_DOTACION',
    moviles: 'SERVICIO_MOVILES',
    metricas: 'METRICAS',
    errores: 'ERRORES'
  }
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action || 'guardarParte';
    if (action === 'guardarParte') return outputResponse(saveParte(payload.parte, payload.options || {}), e);
    if (action === 'guardarEditable') return outputResponse(saveEditableOnly(payload.parte), e);
    if (action === 'metricas') return outputResponse(rebuildMetricas(), e);
    throw new Error('Accion no soportada: ' + action);
  } catch (error) {
    return outputResponse({ ok: false, error: error.message }, e);
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'data';
    if (action === 'data') return outputResponse(getData(), e);
    if (action === 'diagnosticoDrive') return outputResponse(diagnosticoDrive(), e);
    if (action === 'metricas') return outputResponse(rebuildMetricas(), e);
    throw new Error('Accion no soportada: ' + action);
  } catch (error) {
    return outputResponse({ ok: false, error: error.message }, e);
  }
}

function saveParte(parte, options) {
  if (!parte) throw new Error('Falta parte');
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const servicioId = parte.id || Utilities.getUuid();
  const parteServicio = parte.acta || [parte.parteNumero, parte.parteAnio].filter(Boolean).join('/');
  const duracionHoras = getDurationHours(parte);
  const now = new Date();
  removeDuplicateParteRows(ss, parteServicio, servicioId);

  upsertObject(ss, CONFIG.sheets.servicios, 'servicio_id', servicioId, {
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
    completado_en: parte.completedAt || '',
    frente_impreso_en: parte.printedFrontAt || '',
    dotacion_impresa_en: parte.printedCrewAt || '',
    actualizado_en: parte.updatedAt || now
  });

  deleteRowsByValue(ss, CONFIG.sheets.dotacion, 'servicio_id', servicioId);
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

  deleteRowsByValue(ss, CONFIG.sheets.moviles, 'servicio_id', servicioId);
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

  const shouldSaveEditable = options && options.saveEditable || parte.printedFrontAt || parte.printedCrewAt;
  if (shouldSaveEditable) {
    const editable = safeSaveEditableCopy(parteServicio, parte);
    upsertObject(ss, CONFIG.sheets.servicios, 'servicio_id', servicioId, {
      servicio_id: servicioId,
      editable_id: editable.id || '',
      editable_url: editable.url || '',
      editable_guardado_en: editable.savedAt || '',
      editable_error: editable.error || '',
      editable_folder_id: editable.folderId || '',
      editable_folder_url: editable.folderUrl || '',
      editable_fallback_usado: editable.fallbackUsed || false,
      editable_version: editable.version || ''
    });
  }
  rebuildMetricas();
  return { ok: true, servicio_id: servicioId };
}

function saveEditableOnly(parte) {
  if (!parte) throw new Error('Falta parte');
  const parteServicio = parte.acta || [parte.parteNumero, parte.parteAnio].filter(Boolean).join('/');
  return safeSaveEditableCopy(parteServicio, parte);
}

function probarCarpetaDrive() {
  const result = saveEditableCopy('PRUEBA-DRIVE', {
    acta: 'PRUEBA-DRIVE',
    codigo: 'PRUEBA',
    tipo: 'Conexion Drive',
    ubicacion: 'Prueba',
    aCargo: 'Prueba',
    operador: 'Prueba',
    fechaSalida: '',
    horaSalida: '',
    fechaRegreso: '',
    horaRegreso: '',
    reconocimiento: 'Archivo de prueba para verificar permisos de Drive.',
    disposiciones: '',
    perdidas: '',
    crew: []
  });
  Logger.log(result.url);
  return result;
}

function autorizarServiciosGoogle() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const folder = getEditableFolder().folder;
  const doc = DocumentApp.create('SBVP_AUTORIZACION_TEMPORAL');
  doc.getBody().appendParagraph('Archivo temporal para autorizar permisos de Google Docs y Drive.');
  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  file.setTrashed(true);
  return {
    ok: true,
    spreadsheetName: ss.getName(),
    folderId: folder.getId(),
    folderName: folder.getName()
  };
}

function diagnosticoDrive() {
  const folderInfo = getEditableFolder();
  return {
    ok: true,
    targetFolderId: CONFIG.driveFolderId,
    activeFolderId: folderInfo.folder.getId(),
    activeFolderName: folderInfo.folder.getName(),
    activeFolderUrl: folderInfo.folder.getUrl(),
    fallbackUsed: folderInfo.fallbackUsed,
    originalError: folderInfo.originalError || ''
  };
}

function getData() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  return {
    ok: true,
    servicios: readObjects(ss, CONFIG.sheets.servicios),
    dotacion: readObjects(ss, CONFIG.sheets.dotacion),
    moviles: readObjects(ss, CONFIG.sheets.moviles)
  };
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

function upsertObject(ss, sheetName, keyName, keyValue, object) {
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  ensureHeader(sheet, Object.keys(object));
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const keyIndex = header.indexOf(keyName);
  let targetRow = 0;
  if (keyIndex >= 0 && sheet.getLastRow() > 1) {
    const values = sheet.getRange(2, keyIndex + 1, sheet.getLastRow() - 1, 1).getValues();
    const foundIndex = values.findIndex(row => String(row[0]) === String(keyValue));
    if (foundIndex >= 0) targetRow = foundIndex + 2;
  }
  if (targetRow) {
    const existing = sheet.getRange(targetRow, 1, 1, header.length).getValues()[0];
    const row = header.map((key, index) => Object.prototype.hasOwnProperty.call(object, key) ? object[key] ?? '' : existing[index]);
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  }
  else {
    const row = header.map(key => object[key] ?? '');
    sheet.appendRow(row);
  }
}

function ensureHeader(sheet, keys) {
  if (sheet.getLastRow() === 0) sheet.appendRow(keys);
  const header = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  const headerSet = new Set(header);
  keys.forEach(key => {
    if (!headerSet.has(key)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(key);
      headerSet.add(key);
    }
  });
}

function deleteRowsByValue(ss, sheetName, keyName, keyValue) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const keyIndex = header.indexOf(keyName);
  if (keyIndex < 0) return;
  const values = sheet.getRange(2, keyIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  for (let index = values.length - 1; index >= 0; index--) {
    if (String(values[index][0]) === String(keyValue)) sheet.deleteRow(index + 2);
  }
}

function removeDuplicateParteRows(ss, parteServicio, keepServicioId) {
  const sheet = ss.getSheetByName(CONFIG.sheets.servicios);
  if (!sheet || sheet.getLastRow() < 2) return;
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const parteIndex = header.indexOf('parte_servicio');
  const idIndex = header.indexOf('servicio_id');
  if (parteIndex < 0 || idIndex < 0) return;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const duplicateIds = [];
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index];
    if (String(row[parteIndex]) === String(parteServicio) && String(row[idIndex]) !== String(keepServicioId)) {
      duplicateIds.push(String(row[idIndex]));
      sheet.deleteRow(index + 2);
    }
  }
  duplicateIds.forEach(id => {
    deleteRowsByValue(ss, CONFIG.sheets.dotacion, 'servicio_id', id);
    deleteRowsByValue(ss, CONFIG.sheets.moviles, 'servicio_id', id);
  });
}

function readObjects(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const header = values[0].map(String);
  return values.slice(1).map(row => {
    const object = {};
    header.forEach((key, index) => object[key] = row[index]);
    return object;
  });
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
  const folderInfo = getEditableFolder();
  const folder = folderInfo.folder;
  const baseName = ('Parte ' + parteServicio).replace(/[\\/:*?"<>|]/g, '-');
  const versionInfo = getNextEditableVersion(folder, baseName);
  const name = versionInfo.name;
  const doc = DocumentApp.create(name);
  const body = doc.getBody();
  body.clear();
  body.appendParagraph('Sociedad de Bomberos Voluntarios Pergamino').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('Parte de servicio ' + parteServicio).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Codigo: ' + (parte.codigo || '') + ' | Tipo: ' + (parte.tipo || ''));
  body.appendParagraph('Ubicacion: ' + (parte.ubicacion || ''));
  body.appendParagraph('A cargo: ' + (parte.aCargo || '') + ' | Operador/a: ' + (parte.operador || ''));
  body.appendParagraph('Salida: ' + (parte.fechaSalida || '') + ' ' + (parte.horaSalida || ''));
  body.appendParagraph('Regreso: ' + (parte.fechaRegreso || '') + ' ' + (parte.horaRegreso || ''));
  body.appendParagraph('Reconocimiento').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  body.appendParagraph(parte.reconocimiento || '');
  body.appendParagraph('Disposiciones').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  body.appendParagraph(parte.disposiciones || '');
  body.appendParagraph('Perdidas').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  body.appendParagraph(parte.perdidas || '');
  body.appendParagraph('Dotacion').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  (parte.crew || []).forEach(item => body.appendParagraph((item.person || '') + ' - ' + (item.role || '')));
  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  return {
    ok: true,
    id: doc.getId(),
    url: doc.getUrl(),
    savedAt: new Date().toISOString(),
    folderId: folder.getId(),
    folderUrl: folder.getUrl(),
    version: versionInfo.version,
    fallbackUsed: folderInfo.fallbackUsed,
    originalError: folderInfo.originalError || ''
  };
}

function getNextEditableVersion(folder, baseName) {
  let maxVersion = 0;
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name === baseName) {
      maxVersion = Math.max(maxVersion, 1);
      continue;
    }
    const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = name.match(new RegExp('^' + escaped + ' - version (\\d+)$', 'i'));
    if (match) maxVersion = Math.max(maxVersion, Number(match[1]));
  }
  const version = maxVersion + 1;
  return {
    version: version,
    name: version === 1 ? baseName : baseName + ' - version ' + version
  };
}

function getEditableFolder() {
  try {
    const folder = DriveApp.getFolderById(CONFIG.driveFolderId);
    folder.getName();
    return { folder: folder, fallbackUsed: false };
  } catch (error) {
    if (!CONFIG.createFallbackFolder) throw error;
    const folder = getOrCreateFolderByName(CONFIG.fallbackFolderName);
    logError('getEditableFolder', error, {
      targetFolderId: CONFIG.driveFolderId,
      fallbackFolderId: folder.getId(),
      fallbackFolderUrl: folder.getUrl()
    });
    return { folder: folder, fallbackUsed: true, originalError: error.message };
  }
}

function getOrCreateFolderByName(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function safeSaveEditableCopy(parteServicio, parte) {
  try {
    return saveEditableCopy(parteServicio, parte);
  } catch (error) {
    logError('saveEditableCopy', error, { parteServicio: parteServicio, folderId: CONFIG.driveFolderId });
    return { ok: false, error: error.message };
  }
}

function logError(context, error, extra) {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  appendObject(ss, CONFIG.sheets.errores, {
    fecha: new Date(),
    contexto: context,
    mensaje: error && error.message ? error.message : String(error),
    detalle: JSON.stringify(extra || {})
  });
}

function getDurationHours(parte) {
  if (!parte.fechaSalida || !parte.horaSalida || !parte.fechaRegreso || !parte.horaRegreso) return 0;
  const start = new Date(parte.fechaSalida + 'T' + parte.horaSalida);
  const end = new Date(parte.fechaRegreso + 'T' + parte.horaRegreso);
  const diff = (end.getTime() - start.getTime()) / 36e5;
  return diff > 0 ? diff : 0;
}

function outputResponse(data, e) {
  const json = JSON.stringify(data);
  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
