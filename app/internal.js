const path = require('path');
const framework = require('./framework');
const fs = require('fs');
exports.PushRepository = async () => {
    try {
        await global.git.push('origin');
        framework.PublishData(global.moduleConfig.bareRepoPath);
    } catch (e) {
        return {status: false, message: e.toString()};

    }
    return {status: true};
}
exports.PullRepository = async () => {
    try {
        framework.SyncronizeData(global.moduleConfig.bareRepoPath);
        await global.git.pull('origin');
    } catch (e) {
        return {status: false, message: e.toString()};

    }
    return {status: true};
}
exports.CommitRepository = async (message) => {
    try {
    await global.git.commit(message);
    exports.UpdateSharedData();
    } catch (e) {
        return {status: false, message: e.toString()};

    }
    return {status: true};
}

//the bare repo is used to communicate with other peers in the node. We syncronize the bare repo and the local repo with work
//will push/pull on its own bare repo.
exports.CreateBareRepo = async (projectPath, repoPath) => {
    let bareRepoPath = path.join(projectPath, 'git-extension', 'bare-repo');
    if (!fs.existsSync(bareRepoPath)) {
        await global.git.clone(repoPath, bareRepoPath, ['--bare']);
        global.moduleConfig.bareRepoPath = bareRepoPath;
        global.moduleConfig.repoPath = repoPath;
        if (global.test === false) {
            framework.UpdateConfig();
        }
    }
}
exports.InitializeGitConfig = () => {
    global.git = require('simple-git/promise')(global.moduleConfig.repoPath);

    global.git.addConfig('user.name', global.identity.name);
    global.git.addConfig('user.email', global.identity.email)
    global.git.cwd(global.moduleConfig.bareRepoPath)
    global.git.addRemote('origin', global.moduleConfig.bareRepoPath);
}
exports.GetFilesStatus = async () => {
    // return await global.git.raw('git status -s');
    return exports.ParseGitStatus(await global.git.raw(
        [
            'status',
            '-s'
        ]));
}

exports.ParseGitStatus = (raw_result) => {
    let parsedResult = [];
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
        }
        let resultObject = {
            status: status,
            file: array_result[iter].slice(2, array_result[iter].length)
        }
        parsedResult.push(resultObject);
    }
    return parsedResult;
}
exports.GetCommits = () => {
    const git = require('simple-git')(global.moduleConfig.repoPath);

    return git.log({multiLine: true}, (err, gitLog) => {
        return gitLog;
    });

}

exports.UpdateSharedData = () => {
    global.sharedData.commits = exports.GetCommits();
    console.log(global.sharedData.commits);
}
