export const googleAppsScriptCode = `/**
 * Google Apps Script for "Lead and Design Tracker" Workspace Integration
 * ----------------------------------------------------------------------
 * Place this code in Extensions > Apps Script of your Google Sheet.
 * Set the Sheet URL, Folder ID, and deploy as a Web App to connect live!
 */

// Configuration Options
var SHEET_NAME = "Application";
var HEADING_ROW = 6; // Heading is at row 6
var DRIVE_FOLDER_ID = "1w27aLnZBCvqHOSvypelsn8gi4FeQa4CM";

function doGet(e) {
  try {
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
    } else if (action === "deleteLead") {
      return deleteLeadRow(sheet, payload.leadNo);
    } else if (action === "uploadFile") {
      return uploadToDrive(payload.base64Data, payload.fileName, payload.mimeType);
    } else {
      return jsonResponse({ status: "error", message: "Invalid action: " + action });
    }
  } catch (error) {
    return jsonResponse({ status: "error", message: error.toString() });
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // Falls back to first sheet if "Application" names are different
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

function getSheetData(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < HEADING_ROW) {
    return [];
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
      // Format Dates or display string comfortably
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

function addLeadRow(sheet, leadObj) {
  var lastRow = sheet.getLastRow();
  var headersRange = sheet.getRange(HEADING_ROW, 1, 1, sheet.getLastColumn());
  var headers = headersRange.getValues()[0].map(function(h) { 
    return h.toString().trim(); 
  });
  
  var newRowValues = new Array(headers.length).fill("");
  
  // Set defaults and metadata
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
  
  // Update step key/value inputs + auto-write of ACTUAL columns
  var todayString = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  // Map fields we want to update
  for (var key in stepData) {
    if (stepData.hasOwnProperty(key)) {
      var headerName = key.trim();
      var colIndex = headers.indexOf(headerName);
      if (colIndex !== -1) {
        sheet.getRange(matchedRowIndex, colIndex + 1).setValue(stepData[key]);
      }
    }
  }
  
  // Set the corresponding Actual column to current time
  var actualHeaderName = "Actual" + stepNumber;
  var actualColIndex = headers.indexOf(actualHeaderName);
  if (actualColIndex !== -1) {
    sheet.getRange(matchedRowIndex, actualColIndex + 1).setValue(todayString);
  }
  
  return jsonResponse({ status: "success", message: "Step " + stepNumber + " updated successfully", actualTime: todayString });
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

function uploadToDrive(base64Data, fileName, mimeType) {
  try {
    var rawData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(rawData, mimeType, fileName);
    
    var folder;
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      // Fallback folder creation or default root if ID not setup or accessible
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
`;
