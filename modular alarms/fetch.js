// my code is structured to have it be 0-6 is  the fetch endpoints and then 7-13 are the acknowledge bits
const fetchEndpoints = [
    "http://172.16.1.101/Get_Alarms.cgi?Acknowledge=0",
    "http://172.16.1.101/Get_Alarms.cgi?Acknowledge=1",
    "http://172.16.1.160/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.133/Get_Alarms.cgi?Acknowledge=0"
    //"http://172.16.1.134/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.135/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.136/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.137/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.101/Get_Alarms.cgi?Acknowledge=1",
    "http://172.16.1.160/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.133/Get_Alarms.cgi?Acknowledge=1"
    //"http://172.16.1.134/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.135/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.136/Get_Alarms.cgi?Acknowledge=1"
    //"http://172.16.1.137/Get_Alarms.cgi?Acknowledge=1",
    //add any missing ips here 
];

// boolean flags for each ip address
const ipAddresses = {
    '172.16.1.131': false,
    '172.16.1.132': false,
    '172.16.1.133': false,
    '172.16.1.134': false,
    '172.16.1.135': false,
    '172.16.1.136': false,
    '172.16.1.137': false,
    '172.16.1.160': false
};

const retryDelay = 3000; // time that elapses after a failed fetch
let currentServerIndex = 0; 
const ipAddressByEndpoint = {};

// Function to extract the IP address from a fetchEndpoint
function getIpAddressFromEndpoint(endpoint) {
    const url = new URL(endpoint);
    return url.hostname;
}

// Loop through the fetchEndpoints and store the IP address for each
fetchEndpoints.forEach(endpoint => {
    const ipAddress = getIpAddressFromEndpoint(endpoint);
    ipAddressByEndpoint[endpoint] = ipAddress;
});

const isFetching = Array.from({ length: fetchEndpoints.length }, () => false);
let currentFetchIndex = 0;
let retryCount = 0;

// fetches data and moves between indexes of sources
// Inside fetchData function
function fetchData(index) {
    return new Promise((resolve, reject) => {
        if (isFetching[index]) {
            reject(new Error('Already fetching data'));
            return;
        }

        isFetching[index] = true;
        const scriptElement = document.createElement("script");
        const ipAddress = ipAddressByEndpoint[fetchEndpoints[index]];

        let requestCompleted = false; // Flag to track if the request has completed
        const timeoutDuration = 3000; // Set a timeout of 3 seconds

        const timeoutId = setTimeout(function () {
            if (!requestCompleted) {
                // If the request is still pending after the timeout, handle it as an error
                scriptElement.onerror();
            }
        }, timeoutDuration);
        scriptElement.src = `${fetchEndpoints[index]}&IPAddress=${ipAddress}`;
        scriptElement.onerror = function () {
            clearTimeout(timeoutId); // Clear the timeout
            isFetching[index] = false;
            addTrainDownAlarm(ipAddress);
            if (index != 6 || index != 7 || index != 8 || index != 9 || index != 10 || index != 1 || index != 3) {
                fetchAgain(index, resolve, reject);
            }
        };

        scriptElement.onload = function () {
            clearTimeout(timeoutId);
            requestCompleted = true;
            isFetching[index] = false;
            checkIfTrainAlarmNeedsToBeRemoved(ipAddress);
            if (index != 6 || index != 7 || index != 8 || index != 9 || index != 10 || index != 1 || index != 3) {
                fetchAgain(index, resolve, reject);
            }
        };

        const existingScript = document.getElementById("dataScript");
        if (existingScript) {
            existingScript.remove();
        }
        scriptElement.id = "dataScript";
        document.body.appendChild(scriptElement);
    });
}

// function that ensures that each valid source is fetched from multiple times

function fetchAgain(index, resolve, reject) {
    if (index === 0) {
        setTimeout(() => {
            fetchData(index)
                .then(() => resolve())  // Resolve the promise on success
                .catch(() => reject()); // Reject the promise on error
        }, 3000); // 3-second delay
    }
    /*
        if (index === 1) {
            setTimeout(() => {
                fetchData(index)
                    .then(() => resolve())  // Resolve the promise on success
                    .catch(() => reject()); // Reject the promise on error
            }, 3000); // 3-second delay
        }
    */
    if (index === 2) {
        setTimeout(() => {
            fetchData(index)
                .then(() => resolve())  // Resolve the promise on success
                .catch(() => reject()); // Reject the promise on error
        }, 3000); // 3-second delay
    }
    /*
        if (index === 3) {
            setTimeout(() => {
                fetchData(index)
                    .then(() => resolve())  // Resolve the promise on success
                    .catch(() => reject()); // Reject the promise on error
            }, 3000); // 3-second delay
        } */

    if (index === 4) {
        setTimeout(() => {
            fetchData(index)
                .then(() => resolve())  // Resolve the promise on success
                .catch(() => reject()); // Reject the promise on error
        }, 3000); // 3-second delay
    }

    if (index === 5) {
        setTimeout(() => {
            fetchData(index)
                .then(() => resolve())  // Resolve the promise on success
                .catch(() => reject()); // Reject the promise on error
        }, 3000); // 3-second delay
    }

    if (index === 6) {
        setTimeout(() => {
            fetchData(index)
                .then(() => resolve())  // Resolve the promise on success
                .catch(() => reject()); // Reject the promise on error
        }, 3000); // 3-second delay
    }
}

function parseResponse(jsonData) {
    try {
        updateGraphic(jsonData);
        checkStopAlarm();
    } catch (error) {
        console.error("Error while updating graphic:", error);
    }
}

// this function is used to get the train number in the train down alarm. It is useful for an accurate representation of what the train is that is down
function getTrainFromIP(ipAddress) {
    if (ipAddress === "172.16.1.101") {
        return 1;
    } else if (ipAddress === "172.16.1.160") {
        return 2;
    } else if (ipAddress === "172.16.1.133") {
        return 3;
    }
    else if (ipAddress === "172.16.1.134") {
        return 4;
    }
    else if (ipAddress === "172.16.1.135") {
        return 5;
    }
    else if (ipAddress === "172.16.1.136") {
        return 6;
    }
    else if (ipAddress === "172.16.1.137") {
        return 7;
    }
    else {
        throw new Error("Invalid IP address. Please provide a valid IP.");
    }
}

// if a fetch request is unsuccessful post a message to the screen
// this adds all necessary fields to the alarm
function addTrainDownAlarm(ipAddress) {
    var currentDate = new Date();
    var formattedDate = formatDateToCustomString(currentDate);

    // Check if an alarm with the same characteristics already exists
    const existingAlarmIndex = dataArray.findIndex((alarm) => {
        return (
            alarm.Train === getTrainFromIP(ipAddress) &&
            alarm.Code === 78 &&
            alarm.Msg_Data === "New Alarm Data" &&
            alarm.Desc === "New Alarm Description" &&
            alarm.Dev_Num === "" &&
            alarm.Message === "Main Lost Communication with Train " + getTrainFromIP(ipAddress) &&
            alarm.ip === ipAddress &&
            alarm.active === true
        );
    });

    if (existingAlarmIndex === -1) {
        // Create a new alarm if it doesn't exist
        const newAlarm = {
            "Train": getTrainFromIP(ipAddress),
            "DateTime": formattedDate,
            "Code": 78,
            "Msg_Data": "New Alarm Data",
            "Desc": "New Alarm Description",
            "Dev_Num": "",
            "Acknowledged": false,
            "stopAlarm": true,
            "Message": "Main Lost Communication with Train " + getTrainFromIP(ipAddress),
            "ip": ipAddress,
            "active": true,
            'plcActiveBit': 1
        };
        // Add the new alarm to the dataArray
        dataArray.push(newAlarm);
        communicationDateTimes.push(formattedDate);
        // Update the display with the new alarm
        updateDisplay();
    }
}