var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

console.log('starting git extension');

const internal = require('./app/internal');
global.connected = false;

if (global.test === true) {
    // global.identity = {
    //     name: 'alin',
    //     email: 'alin@test.com',
    //     folderPath: 'C:\\Users\\Alin\\distcollab',
    //     projectPath: 'C:\\Users\\Alin\\distcollab\\project'
    // };
    // global.moduleConfig.repoPath = global.identity.projectPath;
} else {
    let framework = require('./app/framework');
    let internal = require('./app/internal');
    internal.LoadConfig();
    framework.GetIdentity();
}


var app = express();
global.moduleConfig = {};
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});
global.test = false;
global.sharedData = {};
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    console.log(err.toString() + ' at ' + err.stack.toString())
    res.render('error', {error: err.toString(), stack: err.stack.toString()});
});





module.exports = app;
