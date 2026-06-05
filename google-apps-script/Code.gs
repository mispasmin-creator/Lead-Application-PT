/**
 * Google Apps Script for LeadFlow
 * Paste this into Extensions > Apps Script, then deploy as a Web App.
 */

var SHEET_NAME = "Application";
var USER_SHEET_NAME = "User";
var SPREADSHEET_ID = "1L0Onxmwmqz6JIVHYh_Fjcz8B9GheBd7TPclHwyXcTSw";
var HEADING_ROW = 6;
var DRIVE_FOLDER_ID = "1w27aLnZBCvqHOSvypelsn8gi4FeQa4CM";

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : "";
    if (action === "getUsers") {
      var userResponse = { status: "success", data: getUserSheetData() };
      if (e.parameter.callback) {
        return jsonpResponse(e.parameter.callback, userResponse);
      }
      return jsonResponse(userResponse);
    }

    var sheet = getSheet();
    var data = getSheetData(sheet);
    return jsonResponse({ status: "success", data: data });
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

function doPost(e) {
  try {
    var payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    var action = payload.action;
    var sheet = getSheet();

    if (action === "addLead") {
      return addLeadRow(sheet, payload.lead);
    } else if (action === "updateStep") {
      return updateLeadStep(sheet, payload.leadNo, payload.stepData, payload.stepNumber);
    } else if (action === "revertStep") {
      return revertLeadStep(sheet, payload.leadNo, payload.currentStepNumber);
    } else if (action === "deleteLead") {
      return deleteLeadRow(sheet, payload.leadNo);
    } else if (action === "getUsers") {
      return jsonResponse({ status: "success", data: getUserSheetData() });
    } else if (action === "addUser") {
      return addUserRow(payload.user);
    } else if (action === "updateUser") {
      return updateUserRow(payload.originalUsername, payload.user);
    } else if (action === "uploadFile") {
      return uploadToDrive(payload.base64Data, payload.fileName, payload.mimeType, payload.driveFolderId);
    } else {
      return jsonResponse({ status: "error", message: "Invalid action: " + action });
    }
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

function getSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheetData(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < HEADING_ROW) {
    return { headers: [], rows: [] };
  }

  var headingRange = sheet.getRange(HEADING_ROW, 1, 1, sheet.getLastColumn());
  var headers = headingRange.getValues()[0].map(function(h) {
    return h.toString().trim();
  });

  if (lastRow <= HEADING_ROW) {
    return { headers: headers, rows: [] };
  }

  var dataRange = sheet.getRange(HEADING_ROW + 1, 1, lastRow - HEADING_ROW, sheet.getLastColumn());
  var values = dataRange.getValues();
  var resultRows = [];

  for (var i = 0; i < values.length; i++) {
    var rowValues = values[i];
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var val = rowValues[j];
      if (val instanceof Date) {
        rowObj[header] = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      } else {
        rowObj[header] = val;
      }
    }
    resultRows.push(rowObj);
  }

  return { headers: headers, rows: resultRows };
}

function getUserSheetData() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) {
    return { headers: [], rows: [] };
  }

  var requiredHeaders = ["Username", "Password", "Role", "Page Access"];
  var readableHeaders = ["Username", "Password", "Role", "Firm Name", "Page Access"];
  var headerInfo = findHeaderRow(sheet, requiredHeaders);
  if (!headerInfo) {
    throw new Error("User sheet headers missing. Required: " + requiredHeaders.join(", "));
  }

  var headerRow = headerInfo.row;
  var headers = headerInfo.headers;
  var lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) {
    return { headers: headers, rows: [] };
  }

  var dataRange = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, sheet.getLastColumn());
  var values = dataRange.getValues();
  var rows = [];

  for (var i = 0; i < values.length; i++) {
    var rowValues = values[i];
    var rowObj = {};
    var hasValue = false;
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var val = rowValues[j];
      if (readableHeaders.indexOf(header) !== -1) {
        rowObj[header] = val instanceof Date
          ? Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
          : val;
        if (rowObj[header] !== "" && rowObj[header] !== null) {
          hasValue = true;
        }
      }
    }
    if (hasValue) {
      rows.push(rowObj);
    }
  }

  return { headers: readableHeaders, rows: rows };
}

function findHeaderRow(sheet, requiredHeaders) {
  var maxRows = Math.min(10, sheet.getLastRow());
  if (maxRows === 0) {
    return null;
  }

  var rows = sheet.getRange(1, 1, maxRows, sheet.getLastColumn()).getValues();
  for (var i = 0; i < rows.length; i++) {
    var headers = rows[i].map(function(h) {
      return h.toString().trim();
    });
    var foundAll = requiredHeaders.every(function(requiredHeader) {
      return headers.indexOf(requiredHeader) !== -1;
    });
    if (foundAll) {
      return { row: i + 1, headers: headers };
    }
  }

  return null;
}

function addLeadRow(sheet, leadObj) {
  var headers = sheet.getRange(HEADING_ROW, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return h.toString().trim();
  });

  var newRowValues = new Array(headers.length).fill("");
  leadObj["Timestamp"] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  for (var i = 0; i < headers.length; i++) {
    var headerName = headers[i];
    if (leadObj.hasOwnProperty(headerName)) {
      newRowValues[i] = leadObj[headerName];
    }
  }

  sheet.appendRow(newRowValues);
  return jsonResponse({ status: "success", leadNo: leadObj["Lead No."] });
}

function updateLeadStep(sheet, leadNo, stepData, stepNumber) {
  var lastRow = sheet.getLastRow();
  if (lastRow < HEADING_ROW) {
    return jsonResponse({ status: "error", message: "No data in sheet" });
  }

  var headers = sheet.getRange(HEADING_ROW, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return h.toString().trim();
  });

  var leadNoColIndex = headers.indexOf("Lead No.");
  if (leadNoColIndex === -1) {
    return jsonResponse({ status: "error", message: "Header 'Lead No.' not found" });
  }

  var values = sheet.getRange(HEADING_ROW + 1, leadNoColIndex + 1, lastRow - HEADING_ROW, 1).getValues();
  var matchedRowIndex = -1;

  for (var i = 0; i < values.length; i++) {
    if (values[i][0].toString().trim() === leadNo.toString().trim()) {
      matchedRowIndex = HEADING_ROW + 1 + i;
      break;
    }
  }

  if (matchedRowIndex === -1) {
    return jsonResponse({ status: "error", message: "Lead Number '" + leadNo + "' not found" });
  }

  var todayString = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  for (var key in stepData) {
    if (stepData.hasOwnProperty(key)) {
      var headerName = key.trim();
      var colIndex = headers.indexOf(headerName);
      if (colIndex !== -1) {
        sheet.getRange(matchedRowIndex, colIndex + 1).setValue(stepData[key]);
      }
    }
  }

  var actualHeaderName = "Actual" + stepNumber;
  var actualColIndex = headers.indexOf(actualHeaderName);
  if (actualColIndex !== -1) {
    sheet.getRange(matchedRowIndex, actualColIndex + 1).setValue(todayString);
  }

  // Auto initialize the next step's planned column if not already set
  if (stepNumber < 5) {
    var nextStepNumber = stepNumber + 1;
    var nextPlannedHeaderName = "Planned" + nextStepNumber;
    var nextPlannedColIndex = headers.indexOf(nextPlannedHeaderName);
    if (nextPlannedColIndex !== -1) {
      var nextPlannedCell = sheet.getRange(matchedRowIndex, nextPlannedColIndex + 1);
      var currentVal = nextPlannedCell.getValue();
      if (!currentVal || currentVal.toString().trim() === "") {
        nextPlannedCell.setValue(todayString);
      }
    }
  }

  return jsonResponse({ status: "success", message: "Step " + stepNumber + " updated successfully", actualTime: todayString });
}

function revertLeadStep(sheet, leadNo, currentStepNumber) {
  if (currentStepNumber <= 1) {
    return jsonResponse({ status: "error", message: "Cannot revert from Step 1" });
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < HEADING_ROW) {
    return jsonResponse({ status: "error", message: "No data in sheet" });
  }

  var headers = sheet.getRange(HEADING_ROW, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return h.toString().trim();
  });

  var leadNoColIndex = headers.indexOf("Lead No.");
  if (leadNoColIndex === -1) {
    return jsonResponse({ status: "error", message: "Header 'Lead No.' not found" });
  }

  var values = sheet.getRange(HEADING_ROW + 1, leadNoColIndex + 1, lastRow - HEADING_ROW, 1).getValues();
  var matchedRowIndex = -1;

  for (var i = 0; i < values.length; i++) {
    if (values[i][0].toString().trim() === leadNo.toString().trim()) {
      matchedRowIndex = HEADING_ROW + 1 + i;
      break;
    }
  }

  if (matchedRowIndex === -1) {
    return jsonResponse({ status: "error", message: "Lead Number '" + leadNo + "' not found" });
  }

  var prevStep = currentStepNumber - 1;
  var prevActualHeader = "Actual" + prevStep;
  var prevDelayHeader = "Delay" + prevStep;
  var currentPlannedHeader = "Planned" + currentStepNumber;

  var prevActualIndex = headers.indexOf(prevActualHeader);
  var prevDelayIndex = headers.indexOf(prevDelayHeader);
  var currentPlannedIndex = headers.indexOf(currentPlannedHeader);

  if (prevActualIndex !== -1) {
    sheet.getRange(matchedRowIndex, prevActualIndex + 1).setValue("");
  }
  if (prevDelayIndex !== -1) {
    sheet.getRange(matchedRowIndex, prevDelayIndex + 1).setValue("");
  }
  if (currentPlannedIndex !== -1) {
    sheet.getRange(matchedRowIndex, currentPlannedIndex + 1).setValue("");
  }

  return jsonResponse({ status: "success", message: "Step reverted successfully" });
}

function deleteLeadRow(sheet, leadNo) {
  var lastRow = sheet.getLastRow();
  if (lastRow < HEADING_ROW) {
    return jsonResponse({ status: "error", message: "No rows available" });
  }

  var headers = sheet.getRange(HEADING_ROW, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
    return h.toString().trim();
  });

  var leadNoColIndex = headers.indexOf("Lead No.");
  if (leadNoColIndex === -1) {
    return jsonResponse({ status: "error", message: "Lead No column missing" });
  }

  var values = sheet.getRange(HEADING_ROW + 1, leadNoColIndex + 1, lastRow - HEADING_ROW, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0].toString().trim() === leadNo.toString().trim()) {
      sheet.deleteRow(HEADING_ROW + 1 + i);
      return jsonResponse({ status: "success", message: "Lead row deleted" });
    }
  }

  return jsonResponse({ status: "error", message: "Lead row not found for deletion" });
}

function addUserRow(user) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ status: "error", message: "User sheet not found." });
  }
  var requiredHeaders = ["Username", "Password", "Role"];
  var headerInfo = findHeaderRow(sheet, requiredHeaders);
  if (!headerInfo) {
    return jsonResponse({ status: "error", message: "User sheet headers not found." });
  }
  var headers = headerInfo.headers;
  var newRow = new Array(headers.length).fill("");
  var fieldMap = { "Username": user.username, "Password": user.password, "Role": user.role, "Firm Name": user.firmName, "Page Access": user.pageAccess };
  for (var i = 0; i < headers.length; i++) {
    if (fieldMap.hasOwnProperty(headers[i])) {
      newRow[i] = fieldMap[headers[i]] || "";
    }
  }
  sheet.appendRow(newRow);
  return jsonResponse({ status: "success", message: "User added." });
}

function updateUserRow(originalUsername, user) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ status: "error", message: "User sheet not found." });
  }
  var requiredHeaders = ["Username", "Password", "Role"];
  var headerInfo = findHeaderRow(sheet, requiredHeaders);
  if (!headerInfo) {
    return jsonResponse({ status: "error", message: "User sheet headers not found." });
  }
  var headerRow = headerInfo.row;
  var headers = headerInfo.headers;
  var usernameColIndex = headers.indexOf("Username");
  if (usernameColIndex === -1) {
    return jsonResponse({ status: "error", message: "Username column not found." });
  }
  var lastRow = sheet.getLastRow();
  var dataRange = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, sheet.getLastColumn());
  var values = dataRange.getValues();
  var matchedRow = -1;
  for (var i = 0; i < values.length; i++) {
    if (values[i][usernameColIndex].toString().trim().toLowerCase() === originalUsername.trim().toLowerCase()) {
      matchedRow = headerRow + 1 + i;
      break;
    }
  }
  if (matchedRow === -1) {
    return jsonResponse({ status: "error", message: "User '" + originalUsername + "' not found." });
  }
  var fieldMap = { "Username": user.username, "Password": user.password, "Role": user.role, "Firm Name": user.firmName, "Page Access": user.pageAccess };
  for (var j = 0; j < headers.length; j++) {
    if (fieldMap.hasOwnProperty(headers[j])) {
      sheet.getRange(matchedRow, j + 1).setValue(fieldMap[headers[j]] || "");
    }
  }
  return jsonResponse({ status: "success", message: "User updated." });
}

function uploadToDrive(base64Data, fileName, mimeType, driveFolderId) {
  try {
    var rawData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(rawData, mimeType, fileName);

    var folder;
    var folderId = driveFolderId || DRIVE_FOLDER_ID;
    try {
      if (folderId && folderId.toString().trim() !== "") {
        folder = DriveApp.getFolderById(folderId.toString().trim());
      } else {
        folder = DriveApp.getRootFolder();
      }
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return jsonResponse({ status: "success", fileUrl: file.getUrl() });
  } catch (e) {
    return jsonResponse({ status: "error", message: "Upload failed: " + e.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonpResponse(callback, data) {
  return ContentService.createTextOutput(callback + "(" + JSON.stringify(data) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
