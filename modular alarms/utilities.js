var dataArray = []; // Create an array to store trainData and alarmData objects
var historyArray = []; // stores all alarms that need to or have been moved to history
var xmlFileUrl = 'alarms.xml';
var rowIdToData = {}; // maps the row id to the corresponding data
var filteredRowIdToData = {}; // does the same as rowID but with filters, this is to ensure that rowID does not lose data
var communicationDateTimes = []; // stores the date times of communication alarms to ensure no duplicates
var stopAlarmCodes = [78, 1, 2, 3, 4, 5, 11, 12, 13, 14, 17, 29, 32, 33, 34, 35, 36, 37, 38, 39, 40, 43, 44, 45, 46, 48, 49, 50, 67, 68, 69, 79];
var buttonArray = []; //stores button ids
const oldAlarms = new Set();
const existingAlarms = new Set(); // looks at the alarms that are currently active or on the HMI
const stopAlarmCounts = [0, 0, 0, 0, 0, 0, 0]; // keeps track of stop alarms for each train with each train being index n - 1
var run = true; // this is not used anywhere currently but may be necessary later on
var trainSelection = 'all'; // global var to keep track of the current dropdown value on history page. the default is all trains
var mainTrainSelection = 'allTrains'; // global var to keep track of the current dropdown value on current page. the default is all trains
var filteredDisplay = []; //keeps track of all filters during display 

// checks all logic to ensure the right train logic is implemented
function handleTrainSelectionMain(selectedTrain) {
    if (selectedTrain === "allTrains") {
        showAllTrains();
    } else if (selectedTrain === '1') {
        showTrain1();
    } else if (selectedTrain === '2') {
        showTrain2();
    }
    else if (selectedTrain === '3') {
        showTrain3();
    }
    else if (selectedTrain === '4') {
        showTrain4();
    }
    else if (selectedTrain === '5') {
        showTrain5();
    }
    else if (selectedTrain === '6') {
        showTrain6();
    }
    else if (selectedTrain === '7') {
        showTrain7();
    }
    mainTrainSelection = selectedTrain;
}

// default option
// shows alarms for all trains taking the filters into account 
function showAllTrains() {
    if (myCheckbox3.checked && myCheckbox4.checked) {
        showAllRows();
    } else if (myCheckbox3.checked && !myCheckbox4.checked) {
        hideNonCriticalRows();
    } else if (!myCheckbox3.checked && myCheckbox4.checked) {
        hideCriticalRows();
    } else {
        //
    }
}

// formats date for my custom alarm
// takes in a standard javascript date and returns a date formatted to match the other ones
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
// communication warning are not logged in history because they dont serve a purpose
function checkIfTrainAlarmNeedsToBeRemoved(ipAddress) {
    const trainToRemove = getTrainFromIP(ipAddress); // Get the train from the IP address
    const alarmCodeToRemove = 78;

    // Check if there's a missing alarm with the specified train and alarm code
    // Check if there's a missing alarm with the specified train and alarm code
    for (let i = 0; i < communicationDateTimes.length; i++) {
        const missingAlarm = dataArray.find(entry => entry.Train === trainToRemove && entry.Code === alarmCodeToRemove && communicationDateTimes[i] === entry.DateTime);
        if (missingAlarm) {
            missingAlarm.active = false;
            updateActiveCellText(missingAlarm.Code, missingAlarm.Train, "Inactive", missingAlarm.Desc, missingAlarm.DateTime, missingAlarm.Msg_Data, missingAlarm.Dev_Num);
        }

        if (missingAlarm && missingAlarm.Acknowledged) {
            moveCommunicationAlarmToHistory(trainToRemove, alarmCodeToRemove, communicationDateTimes[i]);
            decreaseCriticalAlarmCount(trainToRemove);
        }
    }
}

//takes in the data from parseResponse
//checks if data is not undefined and stores ip depending on train source
//it also checks the status of the alarm deciding whether or not it should be moved
function updateGraphic(data) {
    //call this function before processing alarms so it will have to have two ways of processing
    var trainData = data.Train;
    var alarms = data.Alarms;
    checkInactiveAlarms(trainData, alarms);
    if (data.Train !== undefined && data.Alarms !== undefined && Array.isArray(data.Alarms)) {
        alarms.forEach(alarm => {
            var ip = '';
            ip = getIpAddress(trainData);
            var alarmKey = trainData + "@" + alarm.DateTime.trim() + "@" + alarm.Code
                + "@" + alarm.Msg_Data + "@" + alarm.Desc + "@" + alarm.Dev_Num +
                "@" + ip;
            if (!existingAlarms.has(alarmKey) && !oldAlarms.has(alarmKey)) {
                fetchAndProcessAlarm(trainData, alarm, alarmKey);
            }
        });
    }
}

//takes in the train information and finds which ip is tied to it depending on what the endpoint is
// it is called from updateGraphic which uses the ip address to create a unique key for each alarm
function getIpAddress(trainData) {
    var ip = '';
    if (trainData === 1) {
        ip = ipAddressByEndpoint[fetchEndpoints[0]];
    } else if (trainData === 2) {
        ip = ipAddressByEndpoint[fetchEndpoints[0]];
    } else if (trainData === 3) {
        ip = ipAddressByEndpoint[fetchEndpoints[2]];
    }
    else if (trainData === 4) {
        ip = ipAddressByEndpoint[fetchEndpoints[3]];
    }
    else if (trainData === 5) {
        ip = ipAddressByEndpoint[fetchEndpoints[4]];
    }
    else if (trainData === 6) {
        ip = ipAddressByEndpoint[fetchEndpoints[5]];
    }
    else if (trainData === 7) {
        ip = ipAddressByEndpoint[fetchEndpoints[6]];
    }
    return ip;
}

// function to change text in active column to inactive if a stop alarm is inactive but needs to be acknowledged
function updateActiveCellText(alarmCode, trainData, newText, Desc, DateTime, Msg_Data, Dev_Num) {
    var rowId = "row" + trainData + alarmCode + Desc + DateTime.trim() + Msg_Data + Dev_Num;
    var buttonId = "button" + rowId;
    var row = document.getElementById(rowId);
    var buttonElement = document.getElementById(buttonId);
    if (buttonElement.disabled) {
        buttonElement.disabled = false;
    }
    if (row) {
        var cells = row.cells;
        var activeCell = cells[cells.length - 2]; // Access the second to last cell in the row
        activeCell.textContent = newText;
    }
}

// delete a row by its ID effectively removing it from display
function deleteRow(rowId) {
    var row = document.getElementById(rowId);
    if (row) {
        // Remove event listeners from elements within the row
        var acknowledgeButton = row.querySelector('.btn');
        if (acknowledgeButton) {
            // Remove the event listener
            acknowledgeButton.removeEventListener('click', acknowledgeAlarm);
        }
        // Remove the bottom border style
        row.style.border = '0';
        // Remove the row from the DOM
        row.remove();
    }
}

// takes in a button id and alarm data these are the ids defined in updateDisplay
function acknowledgeAlarm(buttonId, alarmData) {
    // Disable the Acknowledge button and change its text
    var buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = "Acknowledged";
        buttonElement.onclick = null;
        // Remove the buttonId from buttonArray
        buttonArray = buttonArray.filter(id => id !== buttonId);
        // Find the corresponding alarm in dataArray and update its `acknowledged` status
        const matchingAlarm = dataArray.find(data => data.Code === alarmData.Code && data.Train === alarmData.Train && data.DateTime === alarmData.DateTime && alarmData.Dev_Num == data.Dev_Num && alarmData.Desc === data.Desc && alarmData.Msg_Data == data.Msg_Data);
        if (matchingAlarm) {
            // Update theacknowledged status for the corresponding alarm in dataArray
            matchingAlarm.Acknowledged = true;
            if (matchingAlarm.Code === 78) {
                checkIfTrainAlarmNeedsToBeRemoved(matchingAlarm.ip);
            }
        }
    }
}

// when acknowledge all is clicked this function is called
function acknowledgePLC(train) {
    //this index will need to change to 6 this is just for testing
    if (train === 1 && stopAlarmCounts[0] === 0) {
        fetchData(1); // this will need to be changed to 7 when finished
        console.log("acknowledged train 1");
    }
    // this index will need to change to 7 it is just this for testing
    else if (train === 2 && stopAlarmCounts[1] === 0) {
        fetchData(3); // will need to be changed to 8 when finished
        console.log("acknowledged train 2");
    }
    else if (train === 3 && stopAlarmCounts[2] === 0) {
        fetchData(9);
    }

    else if (train === 4 && stopAlarmCounts[3] === 0) {
        fetchData(10);
    }

    else if (train === 5 && stopAlarmCounts[4] === 0) {
        fetchData(11);
    }

    else if (train === 6 && stopAlarmCounts[5] === 0) {
        fetchData(12);
    }

    else if (train === 7 && stopAlarmCounts[6] === 0) {
        fetchData(13);
    }

    else {
        return
    }
    removeCode63Alarms();
}

// this function opens up page depending on which tab is clicked
function openPage(evt, AlarmPageName) {
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
        updateHistory();
    }
}

// this function takes in no parameters
//it has an event handler tied to it in the html doc
//everytime this is clicked it iterates through the button array and for each element in the list it 
function acknowledgeAllAlarms() {
    buttonArray.forEach(buttonId => {
        const alarmData = rowIdToData[buttonId.replace("button", "")];
        const buttonElement = document.getElementById(buttonId);
        const rowElement = document.getElementById(buttonId.replace("button", ""));
        console.log(rowElement)
        // Check if the button is not disabled and the alarmData is present and not acknowledged
        if (buttonElement && !buttonElement.disabled && alarmData && !alarmData.Acknowledged &&
            rowElement &&
            !isHidden(rowElement)) {
            acknowledgeAlarm(buttonId, alarmData);
        }
    });
    for (let i = 0; i < 2; i++) {
        acknowledgePLC(i + 1);
    }
}

// checks if an element is being displayed
function isHidden(element) {
    return window.getComputedStyle(element).display === 'none';
}

// displays a popup to ensure that an operator is sure they want to acknowledge all alarms
function confirmAcknowledgeAll() {
    // Show the custom popup
    document.getElementById("customPopup2").style.display = "block";
    // Set up event listeners for the Yes and No buttons
    document.getElementById("confirmYes1").onclick = function () {
        // Acknowledge the alarm if the user clicks "Yes"
        acknowledgeAllAlarms();
        // Hide the custom popup
        document.getElementById("customPopup2").style.display = "none";
    };
    document.getElementById("confirmNo1").onclick = function () {
        // Hide the custom popup if the user clicks "No"
        document.getElementById("customPopup2").style.display = "none";
    };
};

// displays a popup to ensure that an operator is sure they want to clear all alarms
function confirmClearAll() {
    // Show the custom popup
    document.getElementById("customPopup3").style.display = "block";
    // Set up event listeners for the Yes and No buttons
    document.getElementById("confirmYes2").onclick = function () {
        // Acknowledge the alarm if the user clicks "Yes"
        clearAllAlarms();
        // Hide the custom popup
        document.getElementById("customPopup3").style.display = "none";
    };
    document.getElementById("confirmNo2").onclick = function () {
        // Hide the custom popup if the user clicks "No"
        document.getElementById("customPopup3").style.display = "none";
    };
};

// this function sends the acknowledgment bit to all trains 
function acknowledgeAllTrains() {
    fetchData(1); // remove this eventually 
    fetchData(3);// remove this too
    /*
     fetchData(7);
     fetchData(8);
     fetchData(9);
     fetchData(10);
     fetchData(11);
     fetchData(12);
     fetchData(14);
     */
    removeCode63Alarms();
}

// this function should attempt to fetch from all sources again when finished because the acknowledgement bit is programmed to only send once
function clearAllAlarms() {
    dataArray.forEach(alarm => {
        alarm.Active = false;
    });
    for (let i = 0; i < stopAlarmCounts.length; i++) {
        stopAlarmCounts[i] = 0;
    }
    run = true;
    acknowledgeAllAlarms();
    acknowledgeAllTrains();
    fetchData(0);
    fetchData(2);
    var tableBody = document.querySelector("#alarmTable tbody");
    tableBody.innerHTML = '';
    // After removing elements, you might want to update the display or perform any other necessary actions
    updateDisplay();
    /*
    fetchData(0);
    fetchData(1);
    fetchData(2);
    fetchData(3);
    fetchData(4);
    fetchData(5);
    fetchData(6);
    */
}

// Function to format a Date object as "MM/DD/YYYY HH:MM:SS" (e.g., "09/11/2023 08:25:22")
//takes in a data object and reformats it to ensure consistency with the PLC data output
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

// makes sure we dont have code 63 alarms exist forever in our set
// this function is called every 2 hours
function removeCode63Alarms() {
    existingAlarms.forEach(alarmKey => {
        const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('@');
        const alarmCode = parseInt(code);
        const alarmTrain = parseInt(train);

        // Check if the alarm's code is 63, and if so, delete the entry
        if (alarmCode === 63) {
            existingAlarms.delete(alarmKey);
        }
    });
}

// makes sure we dont have code 75 alarms exist forever in our set
// this function is called every 2 hours
function removeCode75Alarms() {
    existingAlarms.forEach(alarmKey => {
        const [train, DateTime, code, Msg_Data, Desc, Dev_Num, alarmIp] = alarmKey.split('@');
        const alarmCode = parseInt(code);
        const alarmTrain = parseInt(train);
        // Check if the alarm's code is 75, and if so, delete the entry
        if (alarmCode === 75) {
            existingAlarms.delete(alarmKey);
        }
    });
}

// prevents the set from getting huge if that warning is present repeatedly
function clearOldAlarms() {
    oldAlarms.clear();
}

// self explanatory it hides all warnings
function hideNonCriticalRows() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4]; // Assuming alarm type is in the 5th cell
            if (alarmTypeCell.textContent !== "Critical") {
                // Hide rows that are not "Critical"
                row.style.display = 'none';
            } else {
                // Show rows that are "Critical"
                row.style.display = '';
            }
        }
    }
}

// self explanatory it hides all warnings
function hideCriticalRows() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Check if the row has enough cells
        if (row.cells.length > 4) {
            var alarmTypeCell = row.cells[4]; // Assuming alarm type is in the 5th cell
            if (alarmTypeCell.textContent === "Critical") {
                // Hide rows that are not "Critical"
                row.style.display = 'none';
            } else {
                // Show rows that are "Critical"
                row.style.display = '';
            }
        }
    }
}

// shows all elements in the table
function showAllRows() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        row.style.display = '';
    }
}

//clears all elements from the table
function hideAllRows() {
    var tableBody = document.querySelector("#alarmTable tbody");
    var rows = tableBody.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        row.style.display = 'none';
    }
}

//handles the logic necessary for display when the current alarms checkboxes are selected
function handleToggleClickMain() {
    if (!myCheckbox3.checked && !myCheckbox4.checked) {
        hideAllRows();
    }
    else if (mainTrainSelection === "allTrains") {
        showAllTrains();
    } else if (mainTrainSelection === '1') {
        showTrain1();
    } else if (mainTrainSelection === '2') {
        showTrain2();
    }
    else if (mainTrainSelection === '3') {
        showTrain3();
    }
    else if (mainTrainSelection === '4') {
        showTrain4();
    }
    else if (mainTrainSelection === '5') {
        showTrain5();
    }
    else if (mainTrainSelection === '6') {
        showTrain6();
    }
    else if (mainTrainSelection === '7') {
        showTrain7();
    }
}

// resets all the filters to show all active alarms
function resetFilters() {
    myCheckbox3.checked = true;
    myCheckbox4.checked = true;
    mainTrainSelection = 'allTrains';
    handleTrainSelectionMain(mainTrainSelection);
    // Get the dropdown element
    var trainSelectorMain = document.getElementById('trainSelectorMain'); 
    // Find the index of the "All Trains" option
    var allTrainsIndex = Array.from(trainSelectorMain.options).findIndex(option => option.value === 'allTrains');
    // Set the selected index to the index of "All Trains"
    trainSelectorMain.selectedIndex = allTrainsIndex;
}
