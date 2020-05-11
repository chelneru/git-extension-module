

$(document).ready(function () {
    console.log('eerer');

    $('#git-toast').toast();
    $('#git-toast').toast('show');
    $('.push-btn').on('click',function () {
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
    $('.pull-btn').on('click',function () {
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
    $('.submit-commit-message').on('click',function () {
        let message = $('#commitModal .commit-message-input').text();
        $.ajax({
            url: 'http://localhost:3001/commit',
            type: 'POST',
            data: {message:message},
            dataType: 'json',
            success(response) {
                if (response.status === true) {
                    console.log('successfully commited the changes');
                }
            },
            error(jqXHR, status, errorThrown) {
                console.log(jqXHR);

            }
        });
    });
});
