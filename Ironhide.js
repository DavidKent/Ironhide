var mem = require('./Memory.js');
var MemoryDatabase = new mem();


var Ironhide = module.exports = function( app, mongodb, options ) {
    this._app = app;
    this._mongodb = mongodb;
    this._memoryDB = MemoryDatabase;
    if(options != undefined)
        this._loginPage = app.router.generateUrl(options.login_page);
    else
        this._loginPage = undefined;
    this.hookSecurity();
}



/*
*   Deprecated: using handle now inside request query.
*/
Ironhide.prototype.hookSecurity = function() {
}



/*
*   Returns the session cookie, undefined if cookie.length
    is less than constant '60'
*/
Ironhide.prototype.getSession = function(req){
    var session_cookie = req.getCookie("session") != undefined ? req.getCookie("session").getValue() : undefined;
    if(session_cookie != undefined && session_cookie.length < 60)
        session_cookie = undefined;
    return session_cookie;
}



/*
*   Use this inside of your app request functions to monitor user privs
    may be altered in the future if quasar fixes routing requirements 
    additions.
*/
Ironhide.prototype.handle = function( req, res, value, isAllowedAccess, isNotAllowedAccess ) {
    var session_cookie = this.getSession(req);
    var sessionInfo = MemoryDatabase.getSessionInfo(session_cookie);
    var user = session_cookie != undefined ? sessionInfo == undefined ? undefined : sessionInfo.user : undefined;
    var pass = true;
    if ( user === undefined ) { 
        pass = false;
    }
    if(pass){
        this._mongodb.getPrivLevel(user, function(privLevel) {
            if (typeof value === 'string') {
                var h = value.replace(' ', '').toLowerCase();
                if (h === privLevel.toLowerCase()) {
                    isAllowedAccess();
                    return;
                }
            }
            else {
                for (var i = 0; i < value.length; i++)
                    if (value[i].toLowerCase() === privLevel.toLowerCase()) { 
                        isAllowedAccess();
                        return;
                    }
            }
        });
        return;
    }
    if(isNotAllowedAccess === undefined) {
        if ( this._loginPage === undefined ) {
            res.setStatusCode('401');
        }
        else {
            res.setStatusCode('401');
            res.setContent('<meta http-equiv="REFRESH" content="0;url='+_loginPage+'">');
        }
        res.send();
    }
    else
    {
        isNotAllowedAccess();
    }
}



/*
*   Register the user with the MongoDB
*/
Ironhide.prototype.registerUser = function( user, password, privLevel, reg_options, callback ) {
    this._mongodb.registerUser( user, password, privLevel, reg_options, callback );
}



/*
*   Removes the session from RAM Database (replace later with Regis)
*/
Ironhide.prototype.logOut = function( session, callback ) {
    MemoryDatabase.removeSession(session);
    callback();
};



/*
*   Adds the session to RAM Database (replace later with Regis)
*/
Ironhide.prototype.logIn = function( session, user, ip, callback ) {
    MemoryDatabase.addSession(session, user, ip);
    callback();
};