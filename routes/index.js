var express = require('express');
var router = express.Router();
const internal = require('../app/internal');
/* GET home page. */
router.get('/', async function(req, res, next) {
  if(global.moduleConfig.repoPath !== undefined) {
    //show the normal interface with buttons
  }
  else {
    //show interface to input repoPath
    return res.redirect('/set-repo');

  }
 let diffChanges = await internal.GetFilesStatus();
  res.render('home', { fileChanges:diffChanges});
});

router.get('/set-repo', function(req, res, next) {

  res.render('set-repo');
});
router.post('/set-repo', async function (req, res, next) {
  global.moduleConfig.repoPath = req.body.repo;
  await internal.CreateBareRepo(global.identity.projectPath,global.moduleConfig.repoPath);
  return res.redirect('/');
});


module.exports = router;
