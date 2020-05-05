var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/check-folder-git', function(req, res, next) {
  

});


module.exports = router;
