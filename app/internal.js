const path = require('path');
const framework = require('./framework');
const fs = require('fs');

exports.LoadConfig = () => {
    global.sharedData = {};
    const appRoot = require('app-root-path').toString();
    if (fs.existsSync(path.join(appRoot, 'settings.json'))) {
        try {
            let rawdata = fs.readFileSync(path.join(appRoot, 'settings.json'));
            global.moduleConfig = JSON.parse(rawdata.toString());
        }catch (e) {
            console.log('Error loading config from settings file. The file does not have valid JSON:',e.toString());
        }
    }else {
        global.moduleConfig = {
            sync_time:'N/A'
        };
        exports.SaveConfig();
    }
}
exports.SaveConfig = async () => {
    const appRoot = require('app-root-path').toString();
    return fs.writeFile(path.join(appRoot, 'settings.json'), JSON.stringify(global.moduleConfig), (err) => {
        if (err) {
            console.log('Error saving config file:', err.toString());
        }
    });
}
exports.PushRepository = async () => {
    try {
        let git = require('simple-git/promise')(global.moduleConfig.repoPath);
        await git.getRemotes().then(async function (result) {
            if (result.findIndex(i => i.name === 'colligo') < 0) {
                return git.addRemote('colligo', global.moduleConfig.bareRepoPath).then(function () {
                    return git.push('colligo', 'master');
                });
            }
            else {
                await git.remote(['set-url','colligo',global.moduleConfig.bareRepoPath])

                return git.push('colligo', 'master');

            }
        });
        console.log('publishing repo from bare repo ',global.moduleConfig.bareRepoPath)
        framework.PublishData(global.moduleConfig.bareRepoPath,'git-bare-repo');
    } catch (e) {
        console.log('error pushing:', e.toString());

        return {status: false, message: e.toString()};

    }
    return {status: true};
}
exports.PullRepository = async () => {
    try {
        let git = require('simple-git/promise')(global.moduleConfig.repoPath);
        console.log('synchronizing data..',global.moduleConfig.bareRepoPath);
        await framework.SyncronizeData('git-bare-repo',global.moduleConfig.bareRepoPath);
        await git.getRemotes().then(async function (result) {
            if (result.findIndex(i => i.name === 'colligo') < 0) {
                return git.addRemote('colligo', global.moduleConfig.bareRepoPath).then(function () {
                    return git.push('colligo', 'master');
                });
            }

            else {

                await git.remote(['set-url','colligo',global.moduleConfig.bareRepoPath])
                return git.push('colligo', 'master');

            }
        });
        await git.pull('colligo','master');
        return {status: true};

    } catch (e) {
        console.log('error pulling:', e.toString());

        return {status: false, message: e.toString()};

    }
};
exports.CommitRepository = async (message) => {
    try {
        let git = require('simple-git/promise')(global.moduleConfig.repoPath);

        await git.commit(message);
        exports.UpdateSharedData();
    } catch (e) {
        console.log('error committing:', e.toString());
        return {status: false, message: e.toString()};

    }
    return {status: true};
}

//the bare repo is used to communicate with other peers in the node. We syncronize the bare repo and the local repo with work
//will push/pull on its own bare repo.
exports.CreateBareRepo = async (bareRepoPath) => {
    let git = require('simple-git/promise')();
    try {
        if (!fs.existsSync(bareRepoPath)) {
            console.log('Creating bare repo at ',bareRepoPath);

            git.clone(global.moduleConfig.repoPath, bareRepoPath, ['--bare']);
        }

    } catch (e) {
        console.log('Error cloning the repository for bare repo:', e.toString());
    }
}

exports.CreateEmptyRepository = (projectPath) => {
    try {
        console.log('creating the paths')
        let bareRepoPath = path.join(projectPath, 'git-extension', 'bare-repository');
        let repoPath = path.join(projectPath, 'git-extension', 'repository');

        console.log(bareRepoPath, repoPath);
        global.moduleConfig.repoPath = repoPath;
        global.moduleConfig.bareRepoPath = bareRepoPath;
        if (global.test === false) {
            framework.UpdateConfig();
        }
        if (!fs.existsSync(repoPath)) {
            //create folder
            fs.mkdirSync(repoPath, {recursive: true});
        }
        let git = require('simple-git/promise')(repoPath);

        git.init();
    } catch (e) {
        console.log('Error initializing empty repository:', e.toString());
    }
}
exports.InitializeGitConfig = async () => {
    try {
        let git = require('simple-git/promise')(global.moduleConfig.repoPath);
        await git.cwd(global.moduleConfig.repoPath);

        return git.listConfig().then(function (result) {

            if (!result.all.hasOwnProperty('user.name')) {
                git.addConfig('user.name', global.identity.name);
            }
            if (!result.all.hasOwnProperty('user.email')) {
                git.addConfig('user.email', global.identity.name);
            }
        });
    } catch (e) {
        console.log('Error setting initial git config in ' + global.moduleConfig.repoPath + ':', e.toString());

    }
}
exports.GetFilesStatus = async () => {
    if (global.moduleConfig.repoPath !== undefined) {

        let git = require('simple-git/promise')(global.moduleConfig.repoPath);

        return exports.ParseGitStatus(await git.raw(
            [
                'status',
                '-s'
            ]));
    } else {
        console.log('provided path is undefined');
        return [];
    }
}

exports.CreateRepository = async (repoPath) => {
    try {
    // if(!fs.existsSync(repoPath)) {
    //     fs.mkdirSync(repoPath,{recursive:true});
    //
    // }
    const git = require('simple-git/promise')(repoPath);
    return git.checkIsRepo().then(function (res) {
        if (res === false) {
            //try to clone from bare repository
            if (fs.existsSync(global.moduleConfig.bareRepoPath)) {

                try {
                    git.clone(global.moduleConfig.repoPath, global.moduleConfig.bareRepoPath);
                } catch
                    (e) {
                    console.log('Error cloning the repository for bare repo:', e.toString());
                }
            } else {
                //initialize a new repository
                try {
                    git.init().then(function () {
                        return {status: true};
                    });

                } catch (e) {
                    console.log('Error creating repository:', e.toString())
                    return {status: false, message: e.toString()};
                }
            }
        }

    })
    }catch (e) {
        console.log('Error creating repository at ',repoPath,':',e.toString())
    }
}
exports.isDirEmpty = async (dirname) => {
    return fs.promises.readdir(dirname).then(files => {
        return files.length === 0;
    });
}
exports.ParseGitStatus = (raw_result) => {

    let parsedResult = [];
    if (raw_result !== null) {
        raw_result = raw_result.trim();
        let array_result = raw_result.split("\n");
        for (let iter = 0; iter < array_result.length; iter++) {
            array_result[iter] = array_result[iter].trim(); // remove extra spaces
            let status = array_result[iter].slice(0, 1);

            switch (status) {
                case 'A' :
                    status = 'Added';
                    break;
                case 'M':
                    status = 'Modified';
                    break;
                case 'D':
                    status = 'Deleted';
                    break;
                case '?':
                    status = 'Unversioned';
                    break;
            }
            let resultObject = {
                status: status,
                file: array_result[iter].slice(2, array_result[iter].length)
            }
            parsedResult.push(resultObject);
        }
    }
    return parsedResult;
}
exports.GetCommits = async () => {
    try {
        const git = require('simple-git/promise')(global.moduleConfig.repoPath);
        return await git.log({multiLine: true});
    } catch (e) {
        console.log('Error retrieving commits:', e.toString());
    }
}


exports.UpdateSharedData = async () => {
    if(global.periodic_commits_update !== true) {
        global.periodic_commits_update = true;
        setInterval(
            async function () {
                if(global.moduleConfig.bareRepoPath !== undefined)
                global.sharedData.commits = await exports.GetCommits();
                if(global.sharedData.commits !== undefined) {
                global.sharedData.commits = global.sharedData.commits.all.map(function (el) {
                    return el.hash.slice(0,9);
                });
                // console.log('Current commits: ',JSON.stringify(global.sharedData.commits));
                framework.PublishSharedData(global.sharedData.commits);
                }
            },5000
        )
    }

}
