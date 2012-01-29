var memorydb = require('./Memory.js');
var Ironhide = module.exports = function( app, mongodb, options ) {
    this._app = app;
    this._mongodb = mongodb;
    this._loginPage = app.router.generateUrl(options.login_page);
    this.hookSecurity();
}

Ironhide.prototype.hookSecurity = function() {
    this._app.router.addRouteRequirement('ACCESS', this.requestHandler( request, result, value, fn ));
}

Ironhide.prototype.requestHandler = function( req, res, value, fn ) {
    var session = req.getCookie("session").getValue();
    var user = memorydb.getSessionInfo(session).user;
    var passGo = true;
    if ( user === undefined ) { 
        passGo = false;
    }
    if ( passGo ) {
        this._mongodb.getPrivLevel(user, function(privLevel) {
            if (typeof value === 'string') {
                var h = value.replace(' ', '').toLowerCase();
                if (h === privLevel.toLowerCase()) {
                    fn(req, res);
                    return;
                }
            }
            else {
                for (var i = 0; i < value.length; i++)
                    if (value[i].toLowerCase() === privLevel.toLowerCase()) { 
                        fn(req, res);
                        return;
                    }
            }
        });
    }
    if ( _loginPage === undefined ) {
        res.writeHead('401');
    }
    else {
        res.writeHead('401', {}, '<meta http-equiv="REFRESH" content="0;url='+_loginPage+'">');
    }
    res.end();
    return;
}

Ironhide.prototype.registerUser = function( user, password, privLevel, reg_options, callback ) {
    this._mongodb.registerUser( user, password, privLevel, reg_options, callback );
}

Ironhide.prototype.logOut = function( session, callback ) {
    memorydb.removeSession(session);
    callback();
};

Ironhide.prototype.logIn = function( session, user, ip, callback ) {
    memorydb.addSession(session, user, ip);
    callback();
};