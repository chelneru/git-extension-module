$(document).ready(function () {

    // $('#git-toast').toast('show');
    $('.push-btn').on('click', function () {
        $.ajax({
            url: 'http://localhost:3001/push',
            type: 'POST',
            dataType: 'json',
            success(response) {
                if (response.status === true) {
                    console.log('successfully pushed the repo');
                }
            },
            error(jqXHR, status, errorThrown) {
                console.log(jqXHR);

            }
        });
    });
    $('.pull-btn').on('click', function () {
        $.ajax({
            url: 'http://localhost:3001/pull',
            type: 'POST',
            dataType: 'json',
            success(response) {
                if (response.status === true) {
                    console.log('successfully pulled the repo');
                }
            },
            error(jqXHR, status, errorThrown) {
                console.log(jqXHR);

            }
        });
    });
    $('.submit-commit-message').on('click', function () {
        let message = $('#commitModal .commit-message-input').val();
        console.log('commiting...."'+message+'"');

        $.ajax({
            url: 'http://localhost:3001/commit',
            type: 'POST',
            data: {message: message},
            dataType: 'json',
            success(response) {
                $('#commitModal').modal('hide');
                if (response.status === true) {
                    console.log('successfully commited the changes');
                }
                else {
                    console.log('error while commiting the changes');

                }
            },
            error(jqXHR, status, errorThrown) {
                console.log(jqXHR);

            }
        });
    });
    setInterval(function () {
        GetFileStatus();
    },5000);
});

function AddFileRows(data) {
    $('.files-container div').remove();
    console.log(JSON.stringify(data));
    for (let iter = 0; iter < data.length; iter++) {
        let $row = $('<div/>', {
            class: 'status-'+data[iter].status.toLowerCase()
        });
        let $nameSpan = $('<span/>', {
            class: 'file-name',
            text:data[iter].file
        });
        let $statusSpan = $('<span/>', {
            class: 'file-status',
            text:data[iter].status

        });
        $($row).append($nameSpan,$statusSpan);
        $('.files-container').append($row);
    }
}

function GetFileStatus() {
    $.ajax({
        url: 'http://localhost:3001/getfilestatus',
        type: 'POST',
        dataType: 'json',
        success(response) {
            AddFileRows(response);

        },
        error(jqXHR, status, errorThrown) {
            console.log(jqXHR);

        }
    });
}
