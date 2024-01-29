// finds communication alarm in dataArray and removes it from here
//once it is removed it moves the data to the historyArray where it can now be displayed in history
function moveCommunicationAlarmToHistory(trainData, alarmCode, DateTime) {
    // Find the alarm in dataArray and move it to historyArray
    const indexToRemove = dataArray.findIndex(data => data.Code === alarmCode && data.Train === trainData && data.DateTime === DateTime);
    if (indexToRemove !== -1) {
        const removedAlarm = dataArray.splice(indexToRemove, 1)[0];
        // Update the display
        updateDisplay();
        // Remove the corresponding row from the table 
        deleteRow("row" + removedAlarm.Train + removedAlarm.Code + removedAlarm.Desc + removedAlarm.DateTime + removedAlarm.Msg_Data + removedAlarm.Dev_Num);
    }
}

//takes in the index of the alarm that is no longer needed in the dataArray
// if the index is a valid index is checks if the alarm exists and that it is acknowledged
// if these conditions are met then remove the alarm 
function moveAlarmToHistory(indexToRemove) {
    // Use the provided index to remove the alarm from dataArray and move it to historyArray
    if (indexToRemove !== -1) {
        const alarmToRemove = dataArray[indexToRemove];
        // Check if the alarm is acknowledged before removing it
        if (alarmToRemove && alarmToRemove.Acknowledged) {
            const removedAlarm = dataArray.splice(indexToRemove, 1)[0];
            historyArray.push(removedAlarm);
            updateHistoryInLocalStorage(historyArray);
            deleteRow("row" + removedAlarm.Train + removedAlarm.Code + removedAlarm.Desc + removedAlarm.DateTime.trim() + removedAlarm.Msg_Data + removedAlarm.Dev_Num);
            updateDisplay();
            var currentTab = document.querySelector(".tablinks.active").textContent.trim();
            if (currentTab === "Alarm History") {
                updateHistory();
            }
            return true;
        }

        else {
            return false;
        }
    }
}

// displays history based on the filters imposed by search bar or date picker
function displayFilteredHistory(filteredHistory) {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    filteredHistory.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            //Display alarm.Message if Code is 78
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            //Display alarm.Message if Code is 78
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

//takes no parameters
// every time a new alarm is added to history it adds it to dataArray and displays the new table
function updateHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    displayAlarmHistory();
}

//takes no parameters
//gets history array and displays all data to table
function displayAlarmHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Sort the historyArray based on the DateTime property, from newest to oldest
    historyArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that historyArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    //output all necessary fields for history
    historyArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            //Display alarm.Message if Code is 78
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

// selects items that are critical only and adds these to our filteredArray that is then displayed
function displayStopAlarmHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.stopAlarm);

    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));

    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            //Display alarm.Message if Code is 78
            historyRow.insertCell().textContent = alarmData.Message;
        }

        historyRow.classList.add('table-success');
    });
}

// selects items that are warnings only and adds these to our filteredArray that is then displayed
function displayWarningHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            //Display alarm.Message if Code is 78
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayNoHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = '';
}

// filters data based on the dates that are input it also adds 1 to the end date so that we do not compare midight on start date to midnight at end date. 
//Before this change we could not do same date searches 
function filterData() {
    const startDate = new Date(document.querySelector("#datepicker1").value);
    const endDate = new Date(document.querySelector("#datepicker2").value);
    if (isNaN(startDate) || isNaN(endDate)) {
        alert("Please select valid start and end dates.");
        return;
    }
    endDate.setDate(endDate.getDate() + 1);
    // Filter the data based on the selected date range
    const filteredData = historyArray.filter(entry => {
        const date = new Date(entry.DateTime);
        return date >= startDate && date <= endDate;
    });

    // Display the filtered data in the history table
    displayFilteredHistory(filteredData);
}

// removes the value of all filters present on the history page
function clearDateRange() {
    // Clear the date range inputs
    document.querySelector("#datepicker1").value = "";
    document.querySelector("#datepicker2").value = "";
    myCheckbox.checked = true;
    myCheckbox2.checked = true;
    // Display the entire historyArray
    displayAlarmHistory();
}

const MAX_HISTORY_ELEMENTS = 100;

function updateHistoryInLocalStorage(historyArray) {
    // Keep only the last MAX_HISTORY_ELEMENTS elements
    const truncatedHistory = historyArray.slice(-MAX_HISTORY_ELEMENTS);
    // Store the truncated historyArray in local storage
    localStorage.setItem('history', JSON.stringify(truncatedHistory));
}

function getHistoryFromLocalStorage() {
    const storedHistory = localStorage.getItem('history');
    return storedHistory ? JSON.parse(storedHistory) : [];
}

// gets the value of historyArray in local storage and puts it into historyArray removing duplicates
function initializeHistoryFromLocalStorage() {
    // Retrieve data from local storage
    const storedHistory = getHistoryFromLocalStorage();

    // Ensure uniqueness before concatenating
    storedHistory.forEach(newAlarm => {
        const isDuplicate = historyArray.some(existingAlarm => {
            return (
                existingAlarm.Code === newAlarm.Code &&
                existingAlarm.Train === newAlarm.Train &&
                existingAlarm.DateTime === newAlarm.DateTime
            );
        });

        if (!isDuplicate) {
            // Append the parsed history data to the existing historyArray
            historyArray.push(newAlarm);
        }
    });
}

// this next chunk of functions is very repetitive but does the same thing for each train
// it creates a new array from the historyArray that removes all elements that dont fit the current filters
//these filters can be toggle switches, dropdown menus, and other items
function displayAllTrain1Alarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 1);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayTrain1Warnings() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 1 && !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Warning";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain1CriticalAlarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 1 && alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Critical";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain2Alarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 2);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayTrain2Warnings() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 2 && !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Warning";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain2CriticalAlarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 2 && alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Critical";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain3Alarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 3);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayTrain3Warnings() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 3 && !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Warning";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain3CriticalAlarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 3 && alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Critical";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain4Alarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 4);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayTrain4Warnings() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 4 && !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Warning";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain4CriticalAlarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 4 && alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Critical";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain5Alarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 5);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayTrain5Warnings() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 5 && !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Warning";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain5CriticalAlarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 5 && alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Critical";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain6Alarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 6);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayTrain6Warnings() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 6 && !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Warning";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain6CriticalAlarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 6 && alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Critical";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain7Alarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 7);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        if (alarmData.stopAlarm) {
            historyRow.insertCell().textContent = "Critical";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            historyRow.insertCell().textContent = alarmData.Message;
        }
        historyRow.classList.add('table-success');
    });
}

function displayTrain7Warnings() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 7 && !alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Warning";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function displayTrain7CriticalAlarms() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.Train === 7 && alarmData.stopAlarm);
    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));
    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        for (let i = 0; i < elementsToRemove; i++) {
            historyArray.pop();
        }
    }
    // Output all necessary fields for history
    filteredHistoryArray.forEach(alarmData => {
        var historyRow = historyTable.insertRow();
        const date = new Date(alarmData.DateTime);
        historyRow.insertCell().textContent = formatDate(date); // Use the formatDate function
        historyRow.insertCell().textContent = alarmData.Train;
        historyRow.insertCell().textContent = alarmData.Code;
        historyRow.insertCell().textContent = "Critical";
        historyRow.insertCell().textContent = alarmData.Message;
        historyRow.classList.add('table-success');
    });
}

function handleAllTrainAlarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayAlarmHistory();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayStopAlarmHistory();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayWarningHistory();
    } else {
        displayNoHistory();
    }
}

function handleTrain1Alarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayAllTrain1Alarms();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayTrain1CriticalAlarms();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayTrain1Warnings();
    } else {
        displayNoHistory();
    }
}

function handleTrain2Alarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayTrain2Alarms();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayTrain2CriticalAlarms();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayTrain2Warnings();
    } else {
        displayNoHistory();
    }
}

function handleTrain3Alarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayTrain3Alarms();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayTrain3CriticalAlarms();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayTrain3Warnings();
    } else {
        displayNoHistory();
    }
}

function handleTrain4Alarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayTrain4Alarms();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayTrain4CriticalAlarms();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayTrain4Warnings();
    } else {
        displayNoHistory();
    }
}

function handleTrain5Alarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayTrain5Alarms();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayTrain5CriticalAlarms();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayTrain5Warnings();
    } else {
        displayNoHistory();
    }
}

function handleTrain6Alarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayTrain6Alarms();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayTrain6CriticalAlarms();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayTrain6Warnings();
    } else {
        displayNoHistory();
    }
}

function handleTrain7Alarms() {
    if (myCheckbox.checked && myCheckbox2.checked) {
        displayTrain7Alarms();
    } else if (myCheckbox.checked && !myCheckbox2.checked) {
        displayTrain7CriticalAlarms();
    } else if (!myCheckbox.checked && myCheckbox2.checked) {
        displayTrain7Warnings();
    } else {
        displayNoHistory();
    }
}

// function that handles the logic depending on the selected value of the dropdown menu
function handleTrainSelection(selectedTrain) {
    trainSelection = selectedTrain;
    if (selectedTrain === "all") {
        handleAllTrainAlarms();
    } else if (selectedTrain === 'train1') {
        handleTrain1Alarms();
    } else if (selectedTrain === 'train2') {
        handleTrain2Alarms();
    }
    else if (selectedTrain === 'train3') {
        handleTrain3Alarms();
    }
    else if (selectedTrain === 'train4') {
        handleTrain4Alarms();
    }
    else if (selectedTrain === 'train5') {
        handleTrain5Alarms();
    }
    else if (selectedTrain === 'train6') {
        handleTrain6Alarms();
    }
    else if (selectedTrain === 'train7') {
        handleTrain7Alarms();
    }
}

//handles the logic depending on the state of each checkbox and the state of the dropdown menu
function handleToggleClick() {
    // Use the global variable for trainSelection
    if (trainSelection === "all") {
        handleAllTrainAlarms();
    } else if (trainSelection === 'train1') {
        handleTrain1Alarms();
    } else if (trainSelection === 'train2') {
        handleTrain2Alarms();
    }
    else if (trainSelection === 'train3') {
        handleTrain3Alarms();
    }
    else if (trainSelection === 'train4') {
        handleTrain4Alarms();
    }
    else if (trainSelection === 'train5') {
        handleTrain5Alarms();
    }
    else if (trainSelection === 'train6') {
        handleTrain6Alarms();
    }
    else if (trainSelection === 'train7') {
        handleTrain7Alarms();
    }
}