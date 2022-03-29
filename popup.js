let table = document.getElementById('table');
let spinner = document.getElementById('spinner');
let btnUpdate = document.getElementById('button-addon');
let txtAccNo = document.getElementById('txtAccNo');
let alertMessage = document.getElementById('alertMessage');

function addRow(data) {
    if (data['status'] === 'Active' || data['status'] === 'Upcoming') {
        let tr = table.insertRow(-1);
        let startTime = moment(data['startTime'], 'YYYY-MM-DD HH:mm');
        let endTime = moment(data['endTime'], 'YYYY-MM-DD HH:mm');

        tr.insertCell(-1).innerHTML = startTime.format('DD-MM-YYYY hh:mm a');
        tr.insertCell(-1).innerHTML = endTime.format('DD-MM-YYYY hh:mm a');
        tr.insertCell(-1).innerHTML = data['interruptionTypeName'];

        let cell = tr.insertCell(-1);

        if (data['status'] === 'Active') {
            let diff = moment.duration(endTime.diff(moment()));

            let info = '<b class="text-danger">' + data['status'] + '</b><br>';
            info = diff.days() > 0 ? info + diff.days() + "d " : info;
            info = diff.hours() > 0 ? info + diff.hours() + "h " : info;
            info = diff.minutes() > 0 ? info + diff.minutes() + "m " : info;

            cell.innerHTML = info;
        }
        else if (data['status'] === 'Upcoming') {
            let diff = moment.duration(startTime.diff(moment()));

            let info = '<b class="text-warning">' + data['status'] + '</b><br>';
            info = diff.days() > 0 ? info + diff.days() + "d " : info;
            info = diff.hours() > 0 ? info + diff.hours() + "h " : info;
            info = diff.minutes() > 0 ? info + diff.minutes() + "m " : info;

            cell.innerHTML = info;
        }
    }
}

function showError(message) {
    table.style.display = 'none';
    spinner.style.display = 'none';
    alertMessage.style.display = 'block';

    alertMessage.innerHTML = message;
}

function fetchData(account) {
    table.style.display = 'none';
    alertMessage.style.display = 'none';
    spinner.style.display = 'block';

    fetch('https://cebcare.ceb.lk/Incognito/OutageMap')
        .then(response => response.text())
        .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, 'text/html');
            let elements = doc.getElementsByName('__RequestVerificationToken');

            let token = elements[0].getAttribute('value');

            fetch('https://cebcare.ceb.lk/Incognito/GetCalendarData?from=' + moment().format('YYYY-MM-DD') + '&to=' + moment().add(3, 'days').format('YYYY-MM-DD') + '&acctNo=' + account, {
                headers: {
                    'RequestVerificationToken': token
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Connection failed. Response code: ' + response.status);
                    }

                    return response.json();
                })
                .then(json => {
                    console.log(json);

                    if (json === undefined || json === 202) {
                        throw new Error('Unable to obtain data. Check the CEB account number and try again.');
                    }

                    if (json.interruptions.length < 1) {
                        throw new Error('No data available');
                    }

                    json.interruptions.forEach(interruption => addRow(interruption));
                    spinner.style.display = 'none';
                    table.style.display = 'block';
                })
                .catch(e => showError(e.message));
        }).catch(e => showError(e.message));
}

btnUpdate.addEventListener("click", async () => {
    chrome.storage.sync.set({ account: txtAccNo.value }, () => fetchData(txtAccNo.value));
});

chrome.storage.sync.get(['account'], result => {
    if (result.account != undefined && result.account != null) {
        btnUpdate.innerHTML = "Update";
        txtAccNo.value = result.account;

        fetchData(result.account);
    }
    else {
        spinner.style.display = 'none';
        alertMessage.style.display = 'none';
        table.style.display = 'none';

        btnUpdate.innerHTML = "Add";
    }
});