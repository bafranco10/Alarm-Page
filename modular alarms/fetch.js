const fetchEndpoints = [
    "http://172.16.1.101/Get_Alarms.cgi?Acknowledge=0",
    "http://172.16.1.101/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.102/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.103/Get_Alarms.cgi?Acknowledge=0"
    //"http://172.16.1.104/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.105/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.106/Get_Alarms.cgi?Acknowledge=0",
    //"http://172.16.1.101/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.102/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.103/Get_Alarms.cgi?Acknowledge=1"
    //"http://172.16.1.104/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.105/Get_Alarms.cgi?Acknowledge=1",
    //"http://172.16.1.106/Get_Alarms.cgi?Acknowledge=1"

    //add any missing ips here 
];

const ipAddresses = {
    '172.16.1.101': false,
    '172.16.1.102': false,
    '172.16.1.103': false,
    '172.16.1.104': false,
    '172.16.1.105': false,
    '172.16.1.106': false,
    '172.16.1.107': false
};

const retryDelay = 3000;
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

//fetches data and moves between indexes of sources
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
        const timeoutDuration = 5000; // Set a timeout of 5 seconds

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
            if (index != 6 || index != 7 || index != 8 || index != 9 || index != 10 || index != 1) {
                fetchAgain(index, resolve, reject);
            }
        };

        scriptElement.onload = function () {
            clearTimeout(timeoutId);
            requestCompleted = true;
            isFetching[index] = false;
            checkIfTrainAlarmNeedsToBeRemoved(ipAddress);
            if (index != 6 || index != 7 || index != 8 || index != 9 || index != 10 || index != 1) {
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

    if (index === 3) {
        setTimeout(() => {
            fetchData(index)
                .then(() => resolve())  // Resolve the promise on success
                .catch(() => reject()); // Reject the promise on error
        }, 3000); // 3-second delay
    }

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
}

function parseResponse(jsonData) {
    try {
        updateGraphic(jsonData);
        checkStopAlarm();
    } catch (error) {
        console.error("Error while updating graphic:", error);
    }
}

function getTrainFromIP(ipAddress) {
    if (ipAddress === "172.16.1.101") {
        return 1;
    } else if (ipAddress === "172.16.1.102") {
        return 2;
    } else if (ipAddress === "172.16.1.103") {
        return 3;
    }
    else if (ipaddress === "172.16.1.104") {
        return 4;
    }
    else if (ipaddress === "172.16.1.105") {
        return 5;
    }
    else if (ipaddress === "172.16.1.106") {
        return 6;
    }
    else {
        return error; // returns an error if message 
    }
}

//if communication is lost post a message to the screen
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
            alarm.Message === "Train Communication Lost" &&
            alarm.ip === ipAddress
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
            "Message": "Train Communication Lost",
            "ip": ipAddress,
            "active": true,
            'plcActiveBit':1
        };
        // Add the new alarm to the dataArray
        dataArray.push(newAlarm);

        // Update the display with the new alarm
        updateDisplay();
    }

}