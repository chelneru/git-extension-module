let sharedData = null;
let users = [];
let issues = [];
let getSharedDataInterval = null;
let attached = false;
let tribute = null;
let getFileStatusInterval = null;
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
        console.log('commiting...."' + message + '"');

        $.ajax({
            url: 'http://localhost:3001/commit',
            type: 'POST',
            data: {message: message},
            dataType: 'json',
            success(response) {
                $('#commitModal').modal('hide');
                if (response.status === true) {
                    console.log('successfully commited the changes');
                } else {
                    console.log('error while commiting the changes');

                }
            },
            error(jqXHR, status, errorThrown) {
                console.log(jqXHR);

            }
        });
    });
    GetFileStatus();
    GetSharedData();

});

function AddFileRows(data) {
    $('.files-container div').remove();
    for (let iter = 0; iter < data.length; iter++) {
        let $row = $('<div/>', {
            class: 'status-' + data[iter].status.toLowerCase()
        });
        let $nameSpan = $('<span/>', {
            class: 'file-name',
            text: data[iter].file
        });
        let $statusSpan = $('<span/>', {
            class: 'file-status',
            text: data[iter].status

        });
        $($row).append($nameSpan, $statusSpan);
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

            if (getFileStatusInterval === null) {
                getFileStatusInterval = setInterval(function () {
                    GetFileStatus();
                }, 5000);
            }
        },
        error(jqXHR, status, errorThrown) {
            console.log(jqXHR);

        }
    });
}

function UpdateUsersMentions() {

}

function InitializeMentions(users,issues,commits) {
if(tribute === null) {
    tribute = new Tribute({
        collection: [{
            trigger: '@',
            selectClass: 'highlight',
            containerClass: 'tribute-container',
            itemClass: '',
            // function called on select that returns the content to insert
            selectTemplate: function (item) {
                return "<a href='" + item.original.email + "'>" + item.string + "</a>";
            },
            // template for displaying item in menu
            menuItemTemplate: function (item) {
                return '@' + item.original.name;

            },
            // template for when no match is found (optional),
            // If no template is provided, menu is hidden.
            noMatchTemplate: null,

            // specify an alternative parent container for the menu
            // container must be a positioned element for the menu to appear correctly ie. `position: relative;`
            // default container is the body
            menuContainer: document.body,
            lookup: 'name',
            fillAttr: 'email',

            // REQUIRED: array of objects to match
            values: users,

            // specify whether a space is required before the trigger string
            requireLeadingSpace: true,

            // specify whether a space is allowed in the middle of mentions
            allowSpaces: false,

            // optionally specify a custom suffix for the replace text
            // (defaults to empty space if undefined)
            replaceTextSuffix: '\n',

            // specify whether the menu should be positioned.  Set to false and use in conjuction with menuContainer to create an inline menu
            // (defaults to true)
            positionMenu: true,

            // when the spacebar is hit, select the current match
            spaceSelectsMatch: false,

            // turn tribute into an autocomplete
            autocompleteMode: false,

            // Customize the elements used to wrap matched strings within the results list
            // defaults to <span></span> if undefined
            searchOpts: {
                pre: '<span>',
                post: '</span>',
                skip: false // true will skip local search, useful if doing server-side search
            },

            // specify the minimum number of characters that must be typed before menu appears
            menuShowMinLength: 0
        },
            {
                trigger: '#',
                selectClass: 'highlight',
                containerClass: 'tribute-container',
                itemClass: '',
                // function called on select that returns the content to insert
                selectTemplate: function (item) {
                    //TODO
                    return "<a href='" + item.original.email + "'>" + item.string + "</a>";
                },
                // template for displaying item in menu
                menuItemTemplate: function (item) {
                    //TODO

                    return '@' + item.original.name;

                },
                // template for when no match is found (optional),
                // If no template is provided, menu is hidden.
                noMatchTemplate: null,

                // specify an alternative parent container for the menu
                // container must be a positioned element for the menu to appear correctly ie. `position: relative;`
                // default container is the body
                menuContainer: document.body,
                lookup: 'name',
                fillAttr: 'email',

                // REQUIRED: array of objects to match
                values: issues,

                // specify whether a space is required before the trigger string
                requireLeadingSpace: true,

                // specify whether a space is allowed in the middle of mentions
                allowSpaces: false,

                // optionally specify a custom suffix for the replace text
                // (defaults to empty space if undefined)
                replaceTextSuffix: '\n',

                // specify whether the menu should be positioned.  Set to false and use in conjuction with menuContainer to create an inline menu
                // (defaults to true)
                positionMenu: true,

                // when the spacebar is hit, select the current match
                spaceSelectsMatch: false,

                // turn tribute into an autocomplete
                autocompleteMode: false,

                // Customize the elements used to wrap matched strings within the results list
                // defaults to <span></span> if undefined
                searchOpts: {
                    pre: '<span>',
                    post: '</span>',
                    skip: false // true will skip local search, useful if doing server-side search
                },

                // specify the minimum number of characters that must be typed before menu appears
                menuShowMinLength: 0
            }]
    });

    tribute.attach(document.querySelectorAll(".commit-message-input"));
}
else {
    tribute.append(0,users);
    tribute.append(1,issues);
}

}

function GetSharedData() {
    $.ajax({
        url: 'http://localhost:3001/get-shared-data',
        type: 'POST',
        dataType: 'json',
        success(response) {
            if (response.status === true) {
                let users = response.content[3].data || [];
                let issues = response.content[1].data || [];
                let commits = response.content[2].data || [];
                InitializeMentions(users,issues,commits);
                if (getSharedDataInterval === null) {
                    getSharedDataInterval = setInterval(function () {
                        GetSharedData();
                    }, 5000);
                }
            }

        },
        error(jqXHR, status, errorThrown) {
            console.log(jqXHR);

        }
    });
}
