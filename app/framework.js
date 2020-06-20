const axios = require('axios');
const internal = require('./internal');
const path = require('path');
exports.GetIdentity = () => {
    axios.interceptors.response.use(
        function (response) {
            global.connected = true;
            return response;
        },
        function (err) {
            if (err.code === "ECONNREFUSED") {
                //we cannot reach the framework.
                console.log('Cannot reach framework.')
            }

            return Promise.reject(err);
        }
    );
    axios.post('http://localhost:3000/extension/identity', {
        name: 'git',
    })
        .then(async (res) => {
            if (res.data.status === true) {
                let new_identity = {
                    name: res.data.identity.name,
                    email: res.data.identity.email,
                    is_author: res.data.identity.is_author,
                    projectPath: res.data.identity.projectPath
                };
                try {
                    if (global.moduleConfig.identity !== undefined){

                       if (global.moduleConfig.identity.projectPath != new_identity.projectPath) {
                        global.reset_repo_path = true;
                    } else {
                        global.reset_repo_path = false;
                    }}
                } catch (e) {

                }
                global.moduleConfig.identity = {...global.moduleConfig.identity, ...new_identity}; //update new identity
                global.moduleConfig.bareRepoPath = path.join(global.moduleConfig.identity.projectPath, 'git-extension', 'bare-repo');
                console.log('Git: From identity, Bare repo path is ',global.moduleConfig.bareRepoPath)
                internal.SaveConfig();
                console.log('Retrieved identity for git successfully!');

                internal.GetCommits();
                console.log('done initializing git module');
            } else {
                console.log('Failed to get valid identity information.');
            }
        })
        .catch((error) => {
            console.error('Error getting identity information:', error.toString());
            if (global.connected === false) {
                setTimeout(function () {
                    exports.GetIdentity();
                }, 3000);
            }
        })

};


exports.PublishSharedData = (sharedData) => {
    axios.post('http://localhost:3000/extension/publish-shared-data', {
            name: 'git',
            data: sharedData
        }
    )
        .then((res) => {
            if (res.data.status) {
                console.log('Git: Shared data published successfully!');

            }
            setTimeout(internal.UpdateSharedData,10000);

        })
        .catch((error) => {
            console.error(error)
        })
}
exports.RetrieveSharedData = () => axios.post('http://localhost:3000/extension/retrieve-shared-data', {
        name: 'git',
        data: sharedData
    }
)
    .then((res) => {
        if (res.data.status) {
            global.sharedData = res.data.content;
            return {status:true,content:global.sharedData}
        }
    })
    .catch((error) => {
        console.error('Error retrieving shared data for git :',error.toString());
    })

exports.PublishData = (sourcePath, folderName) =>
    // publishing data for this extension modules means we will publish hash for the bare repo
    axios.post('http://localhost:3000/extension/publish-data', {
            name: 'git',
            path: sourcePath,
            folder: folderName,
        }
    )
        .then((res) => {
            if (res.data.status) {
                console.log('Bare repo published successfully!');
            }
        })
        .catch((error) => {
            console.error(error)
        });

// syncronizing data for this extension modules means we will update the local repo

exports.SyncronizeData = (folderName, targetPath) => axios.post('http://localhost:3000/extension/update-data', {
            name: 'git',
            path: targetPath,
            folder: folderName
        }
    )
        .then((res) => {
            if (res.data.status) {
                console.log('Git : Bare repo folder updated successfully!');
            }
            // console.log(JSON.stringify(res.data));

            return {status:res.data.status};
        })
        .catch((error) => {
            console.log('Error synchronizing the bare repo',error.toString())
            console.error(error)
        })


