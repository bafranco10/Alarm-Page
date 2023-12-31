// finds communication alarm in dataArray and removes it from here
//once it is removed it moves the data to the historyArray where it can now be displayed in history
function moveCommunicationAlarmToHistory(trainData, alarmCode) {
    // Find the alarm in dataArray and move it to historyArray
    const indexToRemove = dataArray.findIndex(data => data.Code === alarmCode && data.Train === trainData);
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
            console.log(removedAlarm);
            historyArray.push(removedAlarm);
            console.log(historyArray);
            updateHistoryInLocalStorage(historyArray);
            console.log(historyArray);
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
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
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

//takes no paramters
//gets history array and displays all data to table
function displayAlarmHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Sort the historyArray based on the DateTime property, from newest to oldest
    historyArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));

    // Ensure that historyArray contains at most 100 alarms
    if (historyArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = historyArray.length - MAX_HISTORY_ELEMENTS;
        historyArray.splice(0, elementsToRemove);
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
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
        }
        historyRow.classList.add('table-success');
    });
}

function displayStopAlarmHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => alarmData.stopAlarm);

    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));

    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (filteredHistoryArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = filteredHistoryArray.length - MAX_HISTORY_ELEMENTS;
        filteredHistoryArray.splice(0, elementsToRemove);
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
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
        }

        historyRow.classList.add('table-success');
    });
}

function displayWarningHistory() {
    var historyTable = document.getElementById("historyTable").getElementsByTagName('tbody')[0];
    historyTable.innerHTML = ''; // Clear the existing history table
    // Filter the historyArray to include only alarms where stopAlarm is true
    const filteredHistoryArray = historyArray.filter(alarmData => !alarmData.stopAlarm);

    // Sort the filtered historyArray based on the DateTime property, from newest to oldest
    filteredHistoryArray.sort((a, b) => new Date(b.DateTime) - new Date(a.DateTime));

    // Ensure that filteredHistoryArray contains at most 100 alarms
    if (filteredHistoryArray.length > MAX_HISTORY_ELEMENTS) {
        const elementsToRemove = filteredHistoryArray.length - MAX_HISTORY_ELEMENTS;
        filteredHistoryArray.splice(0, elementsToRemove);
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
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
        }
        else {
            historyRow.insertCell().textContent = "Warning";
            if (alarmData.Code === 78) {
                //Display alarm.Message if Code is 78
                historyRow.insertCell().textContent = alarmData.Message;
            }

            else {
                // Display alarmDescription for other alarm codes
                fetchAndProcessXML(alarmData.Code, alarmData, function (alarmDescription) {
                    historyRow.insertCell().textContent = alarmDescription;
                });
            }
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

function clearDateRange() {
    // Clear the date range inputs
    document.querySelector("#datepicker1").value = "";
    document.querySelector("#datepicker2").value = "";
    myCheckbox.checked = true;
    myCheckbox2.checked = true;
    // Display the entire historyArray
    displayAlarmHistory();
}

const MAX_HISTORY_ELEMENTS = 1000;

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
