//receives alarm data in JSON form and stores it in data array with corresponding values typed in and checks the type of alarm that it is
//it then calls for display to be updated 
async function fetchAndProcessAlarm(trainData, alarm, alarmKey) {
    fetchAndProcessXML(alarm.Code, alarm, function (alarmDescription) {
        let ip = '';
        ip = getIpAddress(trainData);
        var alarmData = {
            "Train": trainData,
            "DateTime": alarm.DateTime,
            "Code": alarm.Code,
            "Msg_Data": alarm.Msg_Data,
            "Desc": alarm.Desc,
            "Dev_Num": alarm.Dev_Num,
            "Acknowledged": false,
            "stopAlarm": false,
            "Message": alarmDescription,
            "ip": ip, // Add the "ip" field based on trainData
            "active": true,
            "plcActiveBit": alarm.Active
        };
        // Pass alarmData to checkStopAlarm function
        checkStopAlarm(alarmData);
        if (alarm.Active === 1 || alarmData.stopAlarm) {
            dataArray.push(alarmData);
            existingAlarms.add(alarmKey);
        }
    });
    updateDisplay();
}

//takes in alarmCode, alarm information, and then returns the new informationn through a call back
// finds the corresponding alarm description in the alarms.xml file and changes appropriate fields based on this 
function fetchAndProcessXML(alarmCode, alarm, callback) {
    if (xmlDoc === null) {
        return;
    }

    // Find the corresponding alarm description based on alarmCode
    var description = null;
    var alarmItems = xmlDoc.querySelectorAll('AlarmItem');
    alarmItems.forEach(function (alarmItem) {
        var codeProperty = alarmItem.querySelector("Property[Name='Index']");
        var textProperty = alarmItem.querySelector("Property[Name='TextItemText[0]']");
        if (codeProperty && textProperty) {
            var code = codeProperty.getAttribute('Value');
            var textValue = textProperty.getAttribute('Value');
            if (code == alarmCode) {
                // Replace placeholders in textValue with actual data from the alarm object
                textValue = textValue.replace(/{DEV_NUM}/g, alarm.Dev_Num);
                textValue = textValue.replace(/{MSG_DATA}/g, alarm.Msg_Data);
                textValue = textValue.replace(/{DESC}/g, alarm.Desc);
                description = textValue;
                return;
            }
        }
    });
    // Call the callback function with the fetched description
    callback(description);
}

// takes in the train and alarm data in json format
// checks if an alarm is still being reported and if it is it does nothing, otherwise it marks it for removal finds the matchingAlarm in the dataArray and calls the alarm handling function
function checkInactiveAlarms(trainData, alarms) {
    // Create a list of alarm keys to remove
    const keysToRemove = [];
    // Iterate through alarms in existingAlarms
    existingAlarms.forEach(alarmKey => {
        const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('@');
        const alarmCode = parseInt(code);
        const alarmTrain = parseInt(train);
        // Check if the alarm's train data matches the provided trainData
        if (alarmTrain === trainData) {

            let found = false;
            // Iterate through alarms from the current data
            for (const alarm of alarms) {
                if (alarm.Dev_Num == Dev_Num && alarm.DateTime === DateTime && alarm.Code === alarmCode && alarm.Desc === Desc && alarm.Msg_Data == Msg_Data && alarm.Active === 0) {
                    console.log('first condition');
                    break;
                }
                // these next two should go straight to history per project manager request
                else if (alarm.Code === alarmCode && alarmCode === 63) {
                    break;
                }
                else if (alarm.Code === alarmCode && alarmCode === 75) {
                    break;
                }
                // Check if the alarm from activeAlarms matches an alarm from the current data
                else if (alarm.DateTime === DateTime && alarm.Code === alarmCode && alarm.Desc === Desc && alarm.Msg_Data == Msg_Data && alarm.Dev_Num == Dev_Num && alarm.Active === 1) {
                    console.log('broke here');
                    found = true;
                    break;
                }
                //safe guard for minimal unique key an alarm can have
                else if (alarm.DateTime === DateTime && alarm.Code === alarmCode && alarm.Active === 1 && alarm.Dev_Num == Dev_Num && alarm.Desc === Desc) {
                    console.log('broke in the last condition');
                    found = true;
                    break;
                }
            }

            // If the alarm is not found in the current data, mark it for removal and call the handler function
            if (!found) {
                keysToRemove.push(alarmKey);
                const matchingAlarm = dataArray.find(data => {
                    const condition1 = data.Code === alarmCode;
                    const condition2 = data.Train === alarmTrain;
                    const condition3 = data.DateTime === DateTime;
                    const condition4 = data.Desc === Desc;
                    const condition5 = data.Msg_Data == Msg_Data;
                    const condition6 = data.Dev_Num == Dev_Num;
                    return condition1 && condition2 && condition3 && condition4 && condition5 && condition6;
                });

                inactiveAlarmHandling(existingAlarms, keysToRemove, matchingAlarm);
            }
        }
    });
}

// takes in the existingAlarms set as well as keys to remove list and the alarm that was not found 
// it checks if the alarm is a stop alarm and if it is not it removes it from the display and existingAlarms set
// if it is a stop alarm it changes the state from active to inactive and waits for acknowledgment
// if it is acknowledged it removes it from the display and existingAlarms set
function inactiveAlarmHandling(existingAlarms, keysToRemove, matchingAlarm) {
    //warnings can be removed without acknowledgement so remove it
    if (matchingAlarm && !matchingAlarm.stopAlarm) {
        matchingAlarm.active = false;
        matchingAlarm.Acknowledged = true;
        keysToRemove.forEach(alarmKey => {
            const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('@');
            const alarmCode = parseInt(code);
            const alarmTrain = parseInt(train);
            const indexToRemove = dataArray.findIndex(data => data.Code === alarmCode && data.Train === alarmTrain && data.ip === alarmIp && String(data.DateTime) === String(DateTime)
                && data.Desc === Desc && data.Msg_Data == Msg_Data && data.Dev_Num == Dev_Num);
            removed = moveAlarmToHistory(indexToRemove);
            // these alarms are special and are handled differently these remain in the keys to remove set for 2 hours so that we are not taking up screen space with internal warnings
            if (removed && matchingAlarm.Code !== 63 && matchingAlarm.Code !== 75) {
                existingAlarms.delete(alarmKey);
                oldAlarms.add(alarmKey);
            }
        });
    }

    // critical alarms have to be acknowledged change text and let the alarm be acknowledged now
    if (matchingAlarm && matchingAlarm.stopAlarm && !matchingAlarm.Acknowledged) {
        matchingAlarm.active = false;
        updateActiveCellText(matchingAlarm.Code, matchingAlarm.Train, "Inactive", matchingAlarm.Desc, matchingAlarm.DateTime, matchingAlarm.Msg_Data, matchingAlarm.Dev_Num);
    }
    // critical alarm can be safely removed
    if (
        matchingAlarm &&
        matchingAlarm.stopAlarm &&
        matchingAlarm.Acknowledged
    ) {
        keysToRemove.forEach(alarmKey => {
            const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('@');
            const alarmCode = parseInt(code);
            const alarmTrain = parseInt(train);
            const indexToRemove = dataArray.findIndex(data => data.Code === alarmCode && data.Train === alarmTrain && data.ip === alarmIp && String(data.DateTime) === String(DateTime)
                && data.Desc === Desc && data.Msg_Data == Msg_Data && data.Dev_Num == Dev_Num);
            removed = moveAlarmToHistory(indexToRemove);
            if (removed) {
                existingAlarms.delete(alarmKey);
                oldAlarms.add(alarmKey);
                decreaseCriticalAlarmCount(alarmTrain);
            }
        });
    }
}

// this keeps track of the amount of critical alarms we have per train. It decreases from the corresponding index
function decreaseCriticalAlarmCount(alarmTrain) {
    const index = alarmTrain - 1;
    if (stopAlarmCounts[index] !== undefined) {
        --stopAlarmCounts[index];
        parent.postMessage({ alarm: stopAlarmCounts, ID: "processing" }, "*");
        parent.document.getElementById("demo.html").contentWindow.postMessage({ ID: "Alarm", alarms: dataArray }, "*");
        acknowledgePLC(alarmTrain);
        // Check if every element in stopAlarmCounts is zero
        const allZeros = stopAlarmCounts.every(count => count === 0);
        // If all elements are zero, set run to true
        if (allZeros) {
            run = true;
        }
    }
}

// takes in the alarm data from the plc
// checks if an alarm code matches any in the database for stop alarm codes
// if it does it changes the stopAlarm field to true otherwise it is false
function checkStopAlarm(alarmData) {
    if (alarmData && alarmData.Code) {
        if (stopAlarmCodes.includes(alarmData.Code)) {
            alarmData.stopAlarm = true; // Set stopAlarm to true if the Code is in stopAlarmCodes
        } else {
            alarmData.stopAlarm = false;
        }
    }
    updateDisplay();
}

// creates each individual row for the display logging each entry in the dataArray
// this also applies specific css classes and updates acknowledged/active status 
function updateDisplay() {
    var tableBody = document.querySelector("#alarmTable tbody");
    dataArray.forEach(entry => {
        // Create a unique row ID by concatenating "train" and "alarm code" and datetime
        var rowId = "row" + entry.Train + entry.Code + entry.Desc + entry.DateTime.trim() + entry.Msg_Data + entry.Dev_Num;
        // Check if the row already exists
        var existingRow = document.getElementById(rowId);
        if (!existingRow) {
            if (entry.stopAlarm) {
                createCriticalAlarmRow(tableBody, entry);
                ++stopAlarmCounts[entry.Train - 1];
                run = false;
            }
            else {
                createWarningAlarmRow(tableBody, entry);
            }
            // Store the mapping between row ID and dataArray index
            rowIdToData[rowId] = entry;
        }
        parent.postMessage({ alarm: stopAlarmCounts, ID: "processing" }, "*");
        parent.document.getElementById("demo.html").contentWindow.postMessage({ ID: "Alarm", alarms: dataArray }, "*");
    });
}

// the next big chunk of code does the same thing for many different trains.
// these all allow a user to filter by train, critical, and warnings to better look at critical alarms
//these take in no parameters because they are handled by the toggle click handlers attached to the checkboxes 
// logic for which function and train to call is handled in utilities.js 
function showAllTrain1() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 1) {
            var alarmTypeCell = row.cells[1];
            if (alarmTypeCell.textContent !== "1") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain1Warnings() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "1" || alarmTypeCell.textContent === "Critical") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain1Criticals() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "1" || alarmTypeCell.textContent === "Warning") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showTrain1() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain1();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        showAllTrain1Criticals();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain1Warnings();
    } else if (!myCheckbox3.checked && !myCheckbox4.checked) {
        hideAllRows();
    }
}

function showAllTrain2() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 1) {
            var alarmTypeCell = row.cells[1];
            if (alarmTypeCell.textContent !== "2") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain2Warnings() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "2" || alarmTypeCell.textContent === "Critical") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain2Criticals() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "2" || alarmTypeCell.textContent === "Warning") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showTrain2() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain2();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        showAllTrain2Criticals();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain2Warnings();
    } else {
        hideAllRows();
    }
}

function showAllTrain3() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 1) {
            var alarmTypeCell = row.cells[1];
            if (alarmTypeCell.textContent !== "3") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain3Warnings() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "3" || alarmTypeCell.textContent === "Critical") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain3Criticals() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "3" || alarmTypeCell.textContent === "Warning") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showTrain3() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain3();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        showAllTrain3Criticals();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain3Warnings();
    } else {
        hideAllRows();
    }
}

function showAllTrain4() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 1) {
            var alarmTypeCell = row.cells[1];
            if (alarmTypeCell.textContent !== "4") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain4Warnings() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "4" || alarmTypeCell.textContent === "Critical") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain4Criticals() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "4" || alarmTypeCell.textContent === "Warning") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showTrain4() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain4();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        showAllTrain4Criticals();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain4Warnings();
    } else {
        hideAllRows();
    }
}

function showAllTrain5() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 1) {
            var alarmTypeCell = row.cells[1];
            if (alarmTypeCell.textContent !== "5") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain5Warnings() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "5" || alarmTypeCell.textContent === "Critical") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain5Criticals() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "5" || alarmTypeCell === "Warning") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showTrain5() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain5();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        showAllTrain5Criticals();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain5Warnings();
    } else {
        hideAllRows();
    }
}

function showAllTrain6() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 1) {
            var alarmTypeCell = row.cells[1];
            if (alarmTypeCell.textContent !== "6") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain6Warnings() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "6" || alarmTypeCell.textContent === "Critical") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain6Criticals() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "6" || alarmTypeCell.textContent === "Warning") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showTrain6() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain6();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        showAllTrain6Criticals();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain6Warnings();
    } else {
        hideAllRows();
    }
}

function showAllTrain7() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 1) {
            var alarmTypeCell = row.cells[1];
            if (alarmTypeCell.textContent !== "7") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain7Warnings() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "7" || alarmTypeCell.textContent === "Critical") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showAllTrain7Criticals() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4];
            var alarmTrainCell = row.cells[1];
            if (alarmTrainCell.textContent !== "7" || alarmTypeCell.textContent === "Warning") {
                row.style.display = 'none';
            } else {
                row.style.display = '';
            }
        }
    }
}

function showTrain7() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain7();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        showAllTrain7Criticals();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        showAllTrain7Warnings();
    } else {
        hideAllRows();
    }
}

// takes in the table and all corresponding entries
// handles assignment of classes and button enablement for all critical alarms
function createCriticalAlarmRow(tableBody, entry) {
    // Create a unique row ID by concatenating "train" and "alarm code" and datetime
    var rowId = "row" + entry.Train + entry.Code + entry.Desc + entry.DateTime.trim() + entry.Msg_Data + entry.Dev_Num;
    // If the row doesn't exist, create a new one
    var row = tableBody.insertRow(0);
    // Add this CSS style to ensure consistent cell padding
    row.style.padding = "0";
    row.id = rowId;
    // Create individual cell elements
    var dateCell = row.insertCell();
    var trainCell = row.insertCell();
    var codeCell = row.insertCell();
    var msgDataCell = row.insertCell();
    var alarmTypeCell = row.insertCell();
    var activeCell = row.insertCell();
    // Set text content for each cell
    trainCell.textContent = entry.Train;
    const date = new Date(entry.DateTime);
    console.log(date);
    dateCell.textContent = formatDate(date);
    codeCell.textContent = entry.Code;
    msgDataCell.textContent = entry.Message;
    activeCell.textContent = "Active";
    row.classList.add('table-danger');
    // Create a cell for the Acknowledge button.
    var buttonCell = row.insertCell();
    var acknowledgeButton = document.createElement("button");
    alarmTypeCell.textContent = "Critical";
    // Use a unique ID for each button based on k
    acknowledgeButton.id = "button" + rowId;
    buttonArray.push(acknowledgeButton.id);
    acknowledgeButton.type = "button";
    acknowledgeButton.className = "btn btn-danger";
    acknowledgeButton.disabled = true;
    acknowledgeButton.textContent = "Acknowledge";
    acknowledgeButton.onclick = function () {
        // Show the custom popup
        document.getElementById("customPopup").style.display = "block";
        // Set up event listeners for the Yes and No buttons
        document.getElementById("confirmYes").onclick = function () {
            // Acknowledge the alarm if the user clicks "Yes"
            acknowledgeAlarm(acknowledgeButton.id, entry);
            // Hide the custom popup
            document.getElementById("customPopup").style.display = "none";
        };
        document.getElementById("confirmNo").onclick = function () {
            // Hide the custom popup if the user clicks "No"
            document.getElementById("customPopup").style.display = "none";
        };
    };
    buttonCell.appendChild(acknowledgeButton);
    setVisibility(row);
    sortTableRows(tableBody);
}

// based on the filters currently selected by the user we show and hide the rows dependng on what is selected
// so if we have warnings only toggled on then critical alarms will be hidden but still appended to the table and vice versa
// same goes for train selections
function setVisibility(row) {
    var alarmTypeCell = row.cells[4];
    var alarmTrainCell = row.cells[1];

    if (myCheckbox3.checked && myCheckbox4.checked) {
        if (alarmTrainCell !== mainTrainSelection && mainTrainSelection !== 'allTrains') {
            row.style.display = 'none';
        } else {
            row.style.display = '';
        }
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        if (alarmTypeCell.textContent === "Critical" || alarmTrainCell !== mainTrainSelection) {
            row.style.display = 'none';
        } else {
            row.style.display = '';
        }
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        if (alarmTypeCell.textContent === "Warning" || alarmTrainCell !== mainTrainSelection) {
            row.style.display = 'none';
        } else {
            row.style.display = '';
        }
    } else if (mainTrainSelection === 'allTrains') {
        row.style.display = '';
    }
    else {
        row.style.display = '';
    }
}

// handles the assignment of classes and alarm type for warnings
// so it adds the warning text to the alarm type field 
// also ensures that the display for warnings are yellow
function createWarningAlarmRow(tableBody, entry) {
    if (entry.Code != 63 || entry.Code != 75) {
        // Create a unique row ID by concatenating "train" and "alarm code" and datetime
        var rowId = "row" + entry.Train + entry.Code + entry.Desc + entry.DateTime.trim() + entry.Msg_Data + entry.Dev_Num;
        // If the row doesn't exist, create a new one
        var row = tableBody.insertRow();
        // Add this CSS style to ensure consistent cell padding
        row.style.padding = "0";
        row.id = rowId;
        // Create individual cell elements
        var dateCell = row.insertCell();
        var trainCell = row.insertCell();
        var codeCell = row.insertCell();
        var msgDataCell = row.insertCell();
        var alarmTypeCell = row.insertCell();
        var activeCell = row.insertCell();

        // Set text content for each cell
        trainCell.textContent = entry.Train;
        const date = new Date(entry.DateTime);
        dateCell.textContent = formatDate(date);
        codeCell.textContent = entry.Code;
        msgDataCell.textContent = entry.Message;
        alarmTypeCell.textContent = "Warning";
        activeCell.textContent = "Active";
        row.classList.add('table-warning');
        var buttonCell = row.insertCell();
        var acknowledgeButton = document.createElement("button");
        // Use a unique ID for each button based on k
        acknowledgeButton.id = "button" + rowId;
        buttonArray.push(acknowledgeButton.id);
        acknowledgeButton.type = "button";
        acknowledgeButton.className = "btn btn-warning";
        acknowledgeButton.textContent = "Acknowledge";
        acknowledgeButton.onclick = (function (buttonId, alarmData) {
            return function () {
                acknowledgeAlarm(buttonId, alarmData);
            };
        })(acknowledgeButton.id, entry);
        // Append the button to the cell
        buttonCell.appendChild(acknowledgeButton);
        setVisibility(row);
        sortTableRows(tableBody);
    }
}

// ensures that the newest alarm dates are displayed first with critica taking priority and being on top sorted from newest to oldest
// warnings are under critical alarms and are sorted newest to oldest
function sortTableRows(tableBody) {
    // Convert the HTMLCollection to an array for sorting
    const rowsArray = Array.from(tableBody.rows);
    // Separate rows into three groups: Critical, Warning, and Other Non-Critical
    const criticalRows = rowsArray.filter(row => row.cells[4]?.textContent === 'Critical');
    const warningRows = rowsArray.filter(row => row.cells[4]?.textContent === 'Warning');
    const otherNonCriticalRows = rowsArray.filter(row => row.cells[4]?.textContent !== 'Critical' && row.cells[4]?.textContent !== 'Warning');
    // Sort the critical rows based on the date in descending order (recent times at the top)
    criticalRows.sort((a, b) => {
        const textContentA = (a.cells[0] && a.cells[0].textContent) || ''; // Check if cells[0] exists
        const textContentB = (b.cells[0] && b.cells[0].textContent) || ''; // Check if cells[0] exists
        const dateA = new Date(textContentA.replace(/,/g, ''));
        const dateB = new Date(textContentB.replace(/,/g, ''));
        return dateB.getTime() - dateA.getTime(); // Reverse the order for descending sorting
    });
    // Sort the warning rows based on the date in descending order (recent times at the top)
    warningRows.sort((a, b) => {
        const textContentA = (a.cells[0] && a.cells[0].textContent) || ''; // Check if cells[0] exists
        const textContentB = (b.cells[0] && b.cells[0].textContent) || ''; // Check if cells[0] exists
        const dateA = new Date(textContentA.replace(/,/g, ''));
        const dateB = new Date(textContentB.replace(/,/g, ''));
        return dateB.getTime() - dateA.getTime(); // Reverse the order for descending sorting
    });

    // Sort the other non-critical rows based on the date in descending order (recent times at the top)
    otherNonCriticalRows.sort((a, b) => {
        const textContentA = (a.cells[0] && a.cells[0].textContent) || ''; // Check if cells[0] exists
        const textContentB = (b.cells[0] && b.cells[0].textContent) || ''; // Check if cells[0] exists
        const dateA = new Date(textContentA.replace(/,/g, ''));
        const dateB = new Date(textContentB.replace(/,/g, ''));
        return dateB.getTime() - dateA.getTime(); // Reverse the order for descending sorting
    });
    // Clear the existing rows
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }
    // Append the sorted critical rows back to the table
    criticalRows.forEach(row => {
        tableBody.appendChild(row);
    });
    // Append the sorted warning rows back to the table
    warningRows.forEach(row => {
        tableBody.appendChild(row);
    });
    // Append the sorted other non-critical rows back to the table
    otherNonCriticalRows.forEach(row => {
        tableBody.appendChild(row);
    });
}
