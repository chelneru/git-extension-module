const path = require('path');
const framework = require('./framework');
const git = require(('simple-git/promise'))();

exports.pushRepository = async () => {
    await git.push('origin');
}
exports.PullRepository = async () => {
    await git.pull('origin');
}
exports.CommitRepository = async (message) => {
    await git.commit(message);

}
//the bare repo is used to communicate with other peers in the node. We syncronize the bare repo and the local repo with work
//will push/pull on its own bare repo.
exports.CreateBareRepo = async (projectPath, repoPath) => {
    let bareRepoPath = path.join(projectPath, 'git-extension', 'bare-repo');
   await git.clone(repoPath, bareRepoPath, ['--bare']);
    global.moduleConfig.bareRepoPath = bareRepoPath;
    global.moduleConfig.repoPath = repoPath;
    if(global.test === false) {
    framework.UpdateConfig();
    }
}
exports.InitializeGitConfig = () => {
    git.addConfig('user.name', global.identity.name)
        .addConfig('user.email', global.identity.email)
        .cwd(global.moduleConfig.bareRepoPath)
        .addRemote('origin', global.moduleConfig.bareRepoPath);
}
exports.GetFilesStatus = async () => {
    return await git.diffSummary();

}
