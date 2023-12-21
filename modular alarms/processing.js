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
            "active": true
        };
        // Pass alarmData to checkStopAlarm function
        checkStopAlarm(alarmData);
        dataArray.push(alarmData);
        existingAlarms.add(alarmKey);
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
        const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('-');
        const alarmCode = parseInt(code);
        const alarmTrain = parseInt(train);
        // Check if the alarm's train data matches the provided trainData
        if (alarmTrain === trainData) {
            let found = false;
            // Iterate through alarms from the current data
            for (const alarm of alarms) {
                // Check if the alarm from activeAlarms matches an alarm from the current data
                if (alarm.DateTime === DateTime && alarm.Code === alarmCode && alarm.Desc === Desc && alarm.Msg_Data == Msg_Data) {
                    found = true;
                    break;
                }
            }
            // If the alarm is not found in the current data, mark it for removal
            // the problem is inside this for each loop
            if (!found) {
                keysToRemove.push(alarmKey);
                const matchingAlarm = dataArray.find(data => data.Code === alarmCode && data.Train === alarmTrain && data.DateTime === DateTime && data.Desc === Desc && data.Msg_Data == Msg_Data &&
                    data.Dev_Num == Dev_Num);
                inactiveAlarmHandling(existingAlarms,keysToRemove, matchingAlarm);
            }
        }
    });
}

//takes in the existingAlarms set as well as keys to remove list and the alarm that was not found 
// it checks if the alarm is a stop alarm and if it is not it removes it from the display and existingAlarms set
// if it is a stop alarm it changes the state from active to inactive and waits for acknowledgment
// if it is acknowledged it removes it from the display and existingAlarms set
function inactiveAlarmHandling(existingAlarms,keysToRemove,matchingAlarm) {
   //warnings can be removed without acknowledgement so remove it
    if (matchingAlarm && !matchingAlarm.stopAlarm) {
        matchingAlarm.active = false;
        keysToRemove.forEach(alarmKey => {
            const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('-');
            const alarmCode = parseInt(code);
            const alarmTrain = parseInt(train);
            existingAlarms.delete(alarmKey);
            // Remove from dataArray
            const indexToRemove = dataArray.findIndex(data => data.Code === alarmCode && data.Train === alarmTrain && data.ip === alarmIp && data.DateTime === DateTime
                && data.Desc === Desc && data.Msg_Data == Msg_Data && data.Dev_Num == Dev_Num);
            moveAlarmToHistory(indexToRemove);
        });
    }
    // stop alarms have to be acknowledged change text
    if (matchingAlarm && matchingAlarm.stopAlarm && !matchingAlarm.Acknowledged) {
        matchingAlarm.active = false;
        updateActiveCellText(matchingAlarm.Code, matchingAlarm.Train, "Inactive", matchingAlarm.Desc, matchingAlarm.DateTime);
    }
    // stop alarm can be safely removed
    if (
        matchingAlarm &&
        matchingAlarm.stopAlarm &&
        matchingAlarm.Acknowledged === true
    ) {
        matchingAlarm.active = false;
        keysToRemove.forEach(alarmKey => {
            const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('-');
            const alarmCode = parseInt(code);
            const alarmTrain = parseInt(train);
            const indexToRemove = dataArray.findIndex(data => data.Code === alarmCode && data.Train === alarmTrain && data.ip === alarmIp && String(data.DateTime) === String(DateTime)
                && data.Desc === Desc && data.Msg_Data == Msg_Data && data.Dev_Num == Dev_Num);
            removed = moveAlarmToHistory(indexToRemove);
            if (removed) {
                existingAlarms.delete(alarmKey);
            }

        });
    }
}

//takes in the alarm data from the plc
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

//creates each individual row for the display logging each entry in the dataArray
// this also applies specific css classes and updates acknowledged/active status 
function updateDisplay() {
    var tableBody = document.querySelector("#alarmTable tbody");
    dataArray.forEach(entry => {
        // Create a unique row ID by concatenating "train" and "alarm code" and datetime
        var rowId = "row" + entry.Train + entry.Code + entry.Desc + entry.DateTime.trim();
        // Check if the row already exists
        var existingRow = document.getElementById(rowId);

        if (!existingRow) {
            // If the row doesn't exist, create a new one
            var row = tableBody.insertRow();
            // Add this CSS style to ensure consistent cell padding
            row.style.padding = "0";
            row.id = rowId;
            // Create individual cell elements
            var dateCell = row.insertCell();
            var trainCell = row.insertCell();
            var codeCell = row.insertCell();
            var msgDataCell = row.insertCell()
            var alarmTypeCell = row.insertCell();;
            var activeCell = row.insertCell();

            // Set text content for each cell
            trainCell.textContent = entry.Train;
            const date = new Date(entry.DateTime);
            dateCell.textContent = formatDate(date);
            codeCell.textContent = entry.Code;
            msgDataCell.textContent = entry.Message;
            activeCell.textContent = "Active"

            if (entry.stopAlarm) {
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
                acknowledgeButton.textContent = "Acknowledge";
            }
            else {
                row.classList.add('table-warning');
                // Create a cell for the Acknowledge button.
                var buttonCell = row.insertCell();
                var acknowledgeButton = document.createElement("button");
                alarmTypeCell.textContent = "Warning";
                // Use a unique ID for each button based on k
                acknowledgeButton.id = "button" + rowId;
                buttonArray.push(acknowledgeButton.id);
                acknowledgeButton.type = "button";
                acknowledgeButton.className = "btn btn-warning";
                acknowledgeButton.textContent = "Acknowledge";

            }
            // Store the current alarmData in a variable
            var currentAlarmData = entry;
            // Add an onclick event to the button using a closure
            acknowledgeButton.onclick = (function (buttonId, alarmData) {
                return function () {
                    acknowledgeAlarm(buttonId, alarmData);
                };
            })(acknowledgeButton.id, currentAlarmData);
            // Append the button to the cell
            buttonCell.appendChild(acknowledgeButton);
        }
        // Store the mapping between row ID and dataArray index
        rowIdToData[rowId] = entry;
    });
}