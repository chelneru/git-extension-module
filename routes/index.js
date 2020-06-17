var express = require('express');
var router = express.Router();
const internal = require('../app/internal');
const framework = require('../app/framework');

/* GET home page. */
router.get('/', async function(req, res, next) {

    if(global.connected === false) {
        return res.redirect('/loading');
    }
    if (global.moduleConfig.repoPath === undefined ) {
        console.log('Repo path not defined. Redirecting to set-repo');
      return res.redirect('/set-repo');
  }if (global.reset_repo_path === true) {
        console.log('Repo path needs to be refreshed. Redirecting to set-repo');

        return res.redirect('/set-repo');
  }
    // internal.CreateBareRepo(global.moduleConfig.bareRepoPath);

 let diffChanges = internal.GetFilesStatus;
     return  res.render('home', { fileChanges:diffChanges});
});

router.post('/commit', async function (req, res, next) {
    console.log('received commit message ',req.body.message);
  let response = await internal.CommitRepository(req.body.message);
  return res.json(response);
});

router.post('/push', async function (req, res, next) {
  return res.json(await internal.PushRepository());

});

router.get('/set-repo', async function (req, res, next) {
    return res.render('set-repo');
});

router.post('/set-repo', async function (req, res, next) {
    global.moduleConfig.repoPath = req.body.repo;
    // if (global.moduleConfig.identity.is_author === false) {
        //retrieve data
    try {
        await framework.SyncronizeData('git-bare-repo', global.moduleConfig.repoPath);
        await internal.CreateRepository(global.moduleConfig.repoPath);
    // } else {
    //     await internal.CreateRepository(global.moduleConfig.repoPath);
    // }
    internal.SaveConfig();
     internal.CreateBareRepo(global.moduleConfig.bareRepoPath);
     internal.InitializeGitConfig();
        global.reset_repo_path = false;
    }
    catch (e) {
        console.log('Error setting the repo',e.toString());
    }

    return res.redirect('/');
});

router.post('/getfilestatus', async function (req, res, next) {
    return res.json(await internal.GetFilesStatus());

});

router.post('/pull', async function (req, res, next) {

  return res.json(await internal.PullRepository());
});

router.post('/status', async function (req, res, next) {
    return res.json({status:global.connected});
});
router.get('/loading', async function (req, res, next) {
    return res.render('loading');
});

router.post('/get-shared-data', async function (req, res, next) {
    return res.json(await framework.RetrieveSharedData());
});


module.exports = router;
