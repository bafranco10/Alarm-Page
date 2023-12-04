var dataArray = []; // Create an array to store trainData and alarmData objects
var historyArray = [];
var xmlFileUrl = 'alarms.xml';
var alarmActive = false;
var isAcknowledged = false;
var rowIdToData = {};
var stopAlarmCodes = [19, 1, 2, 3, 4, 5, 11, 12, 13, 14, 17, 18, 29, 32, 33, 34, 35, 36, 37, 38, 39, 40, 42, 43, 44, 45, 46, 48, 49, 50, 68, 69];
var buttonArray = []; //stores button ids
const activeAlarms = new Set();
const existingAlarms = new Set();

// formats date for my custom alarm
function formatDateToCustomString(date) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    };

    return date.toLocaleString('en-US', options);
}

// after every successful fetch this is called with ipaddress to ensure we dont have any communication warnings when there is in fact no warning
// if there is no communicationn issue then remove it 
function checkIfTrainAlarmNeedsToBeRemoved(ipAddress) {
    const trainToRemove = getTrainFromIP(ipAddress); // Get the train from the IP address
    const alarmCodeToRemove = 78;

    // Check if there's a missing alarm with the specified train and alarm code
    const missingAlarm = dataArray.find(entry => entry.Train === trainToRemove && entry.Code === alarmCodeToRemove);

    if (missingAlarm) {
        moveCommunicationAlarmToHistory(trainToRemove, alarmCodeToRemove);
    }
}

//checks if data is not undefined and stores ip depending on train source
//it also checks the status of the alarm deciding whether or not it should be moved
function updateGraphic(data, alarmData) {
    //call this function before processing alarms so it will have to have two ways of processing
    var trainData = data.Train;
    var alarms = data.Alarms;
    checkInactiveAlarms(trainData, alarms);
    if (data.Train !== undefined && data.Alarms !== undefined && Array.isArray(data.Alarms)) {
        alarms.forEach(alarm => {
            var ip = ''; // Declare 'ip' here

            if (trainData === 1) {
                ip = ipAddressByEndpoint[fetchEndpoints[0]];
            } else if (trainData === 2) {
                ip = ipAddressByEndpoint[fetchEndpoints[1]];
            } else if (trainData === 3) {
                ip = ipAddressByEndpoint[fetchEndpoints[2]];
            }

            var alarmKey = trainData + "-" + alarm.DateTime + "-" + alarm.Code + "-" + alarm.Msg_Data + "-" + alarm.Desc + "-" + alarm.Dev_Num + "-" + ip;
            // Check if the alarm is already in dataArray
            /*var alarmExistsInDataArray = dataArray.some(existingAlarm => {
                return existingAlarm.Train === trainData && existingAlarm.Code === alarm.Code && existingAlarm.ip === ip;
            }); */

            if (!existingAlarms.has(alarmKey)) {
                fetchAndProcessAlarm(trainData, alarm, alarmKey);
            }
        });
    }
}

function checkServerAvailability() {
    const serverUrl = fetchEndpoints[currentServerIndex];
    const scriptElement = document.createElement("script");
    const ipAddress = getIpAddressFromEndpoint(serverUrl);

    isFetching[currentServerIndex] = true;

    scriptElement.src = `${serverUrl}&IPAddress=${ipAddress}`;
    scriptElement.onerror = function () {
        console.error("Error loading script:", scriptElement.src);
        console.error("IP Address:", ipAddress);
        isFetching[currentServerIndex] = false;
        addTrainDownAlarm(ipAddress);
        currentServerIndex = (currentServerIndex + 1) % fetchEndpoints.length;
        fetchData(currentServerIndex);
    };
    scriptElement.onload = function () {
        checkIfTrainAlarmNeedsToBeRemoved(ipAddress);
        fetchData(currentServerIndex); // Fetch data from the available server
        currentServerIndex = (currentServerIndex + 1) % fetchEndpoints.length;
    };

    // Replace existing script, if any
    const existingScript = document.getElementById("serverCheckScript");
    if (existingScript) {
        existingScript.remove();
    }
    scriptElement.id = "serverCheckScript";
    document.body.appendChild(scriptElement);
}

const serverCheckInterval = setInterval(checkServerAvailability, 500); // Adjust the interval as needed
function postErrorMessage(errorMessage) {
    const errorContainer = document.getElementById("errorContainer");

    if (errorContainer) {
        // Create a new paragraph for the error message
        const errorMessageElement = document.createElement("p");
        errorMessageElement.textContent = errorMessage;

        // Append it to the error container
        errorContainer.appendChild(errorMessageElement);
    }
}

// function to change text in active column to inactive if a stop alarm is inactive but needs to be acknowledged
function updateActiveCellText(alarmCode, trainData, newText, Desc, DateTime) {
    var rowId = "row" + trainData + alarmCode + Desc + DateTime;
    var row = document.getElementById(rowId);

    if (row) {
        var cells = row.cells;
        var activeCell = cells[cells.length - 2]; // Access the second to last cell in the row
        activeCell.textContent = newText;
    }
}

// delete a row by its ID effectively removing it from display
function deleteRow(rowId) {
    console.log(rowId);
    var row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

//this function is not working correctly 
// double check acknowledgeAlarm and moveAlarmToHistory
function acknowledgeAlarm(buttonId, alarmData) {
    // Disable the Acknowledge button and change its text
    var buttonElement = document.getElementById(buttonId);
    buttonElement.disabled = true;
    buttonElement.textContent = "Acknowledged";

    // Find the corresponding alarm in dataArray and update its `acknowledged` status
    const matchingAlarm = dataArray.find(data => data.Code === alarmData.Code && data.Train === alarmData.Train && data.DateTime === alarmData.DateTime);
    if (matchingAlarm) {
        // Update the `acknowledged` status for the corresponding alarm in dataArray
        matchingAlarm.Acknowledged = true;

        // Check if the alarm was flagged for removal
        if (matchingAlarm.flagForRemoval) {
            // Alarm was flagged for removal, remove it from active alarms and move to history
            existingAlarms.delete(alarmData.Train + '-' + alarmData.Code + '-' + alarmData.MSG_Data + "-" + alarmData.Desc + "-" + alarmData.Dev_Num + "-" + alarmData.ip);
            moveAlarmToHistory(alarmData.Train, alarmData.Code, alarmData.DateTime);
        }
        // Update the history array in cookies with both existing and new data
        updateHistoryInCookies(historyArray);
    }
}

//disable button and change text after acknowledgement
function removeButton(...ids) {
    ids.forEach(id => {
        var buttonElement = document.getElementById(id);
        console.log("Button Element:", buttonElement);
        // change button after it is clicked
        buttonElement.disabled = true;
        buttonElement.innerText = "Acknowledged";

        // Remove the buttonId from buttonArray
        buttonArray = buttonArray.filter(buttonId => buttonId !== id);

        if (id == "historyButton" || id == "mainButton") {
            buttonElement.style.display = 'none';
        }
    });
}

// this function opens up page depending on which tab is clicked
function openPage(evt, AlarmPageName) {
    // Declare all variables
    var i, tabcontent, tablinks;
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(AlarmPageName).style.display = "block";
    evt.currentTarget.className += " active";

    // Call the displayAlarmHistory function when the "Alarm History" tab is selected
    if (AlarmPageName === "Alarm History") {
        displayAlarmHistory();
    }
}

// disables all buttons and removes flashing from each alarm
function acknowledgeAllAlarms() {
    buttonArray.forEach(buttonId => {
        const alarmData = rowIdToData[buttonId.replace("button", "")];
        if (alarmData) {
            acknowledgeAlarm(buttonId, alarmData);
        }
    });
}

// Function to format a Date object as "MM/DD/YYYY HH:MM:SS" (e.g., "09/11/2023 08:25:22")
function formatDate(date) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return date.toLocaleString(undefined, options);
}