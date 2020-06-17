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
        global.moduleConfig = {};
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
        global.git = require('simple-git/promise')(global.moduleConfig.repoPath);
        await global.git.getRemotes().then(function (result) {
            if (result.findIndex(i => i.name === 'colligo') < 0) {
                return global.git.addRemote('colligo', global.moduleConfig.bareRepoPath).then(function () {
                    return global.git.push('colligo', 'master');
                });
            }
            else {
                return global.git.push('colligo', 'master');

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
        global.git = require('simple-git/promise')(global.moduleConfig.repoPath);
        console.log('synchronizing data..');
        await framework.SyncronizeData('git-bare-repo',global.moduleConfig.bareRepoPath);
        await global.git.addRemote('colligo', global.moduleConfig.bareRepoPath);

        await global.git.pull('colligo');
        return {status: true};

    } catch (e) {
        console.log('error pulling:', e.toString());

        return {status: false, message: e.toString()};

    }
};
exports.CommitRepository = async (message) => {
    try {
        global.git = require('simple-git/promise')(global.moduleConfig.repoPath);

        await global.git.commit(message);
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
    console.log('Creating bare repo at ',bareRepoPath);
    global.git = require('simple-git/promise')();
    try {
        if (!fs.existsSync(bareRepoPath)) {
            global.git.clone(global.moduleConfig.repoPath, bareRepoPath, ['--bare']);
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
        global.git = require('simple-git/promise')(global.moduleConfig.repoPath);
        global.git.cwd(global.moduleConfig.repoPath);

        return global.git.listConfig().then(function (result) {

            if (!result.all.hasOwnProperty('user.name')) {
                global.git.addConfig('user.name', global.identity.name);
            }
            if (!result.all.hasOwnProperty('user.email')) {
                global.git.addConfig('user.email', global.identity.name);
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

exports.CreateRepository = async (path) => {
    const simpleGit = require('simple-git/promise')(path);
    return simpleGit.checkIsRepo().then(function (res) {
        if (res === false) {
            try {
                simpleGit.init().then(function () {
                    return {status: true};
                });

            } catch (e) {
                console.log('Error creating repository:',e.toString())
                return {status: false, message: e.toString()};
            }
        }

    })
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
exports.GetCommits = () => {
    try {
        const git = require('simple-git')(global.moduleConfig.repoPath);

        return git.log({multiLine: true}, (err, gitLog) => {
            return gitLog;
        });
    } catch (e) {
        console.log('Error retrieving commits:', e.toString());
    }
}

exports.UpdateSharedData = () => {
    global.sharedData.commits = exports.GetCommits();
    console.log(global.sharedData.commits);
}
