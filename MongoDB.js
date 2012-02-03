var mongo = require('mongodb');

/*
    Function: DBConnect

        DBConnect object constructor

    Parameters:

        database - {String} database name
        ip - {String} ip address
        port - {Int} db port
        serverOptions - {Object} various MongoDB server options
        dbOptions - {Object} various MongoDB database options
*/
var MongoDB = module.exports = function( database, ip, port, serverOptions, dbOptions ) {
    this._ip = ip;
    this._port = port;
    this._db = database;
    this._sOptions = serverOptions;
    this._dbOptions = dbOptions;
    this._connection;
    this._server;
    this._model;
    this._hasConnection = false;
};



/*
    Function: setModel

        sets _model to the specific collection

    Parameters:

        collectionName - collection name
        onSuccess - {Function} called if setModel is successful
*/
MongoDB.prototype.setModel = function( collectionName, onSuccess ) {
    var self = this;
    if (!this._hasConnection) {
         throw Error( 'Name: "No Connection Found", Description: '
         + '"No connection was found when trying to access the database collection."' );
        return;
    }
    this._connection.collection(collectionName, function(err, collection){
        self._model = collection;
        onSuccess();
    });
};



/*
    Function: connect

        connects to specified MongoDB

    Parameters:

        callback - {Function} called when connection successful
*/
MongoDB.prototype.connect = function( callback ) {
    if (this._hasConnection) {
            throw Error('Name: "Already Connected", Description: "There is already'
            + ' an active database connection established"');
    }
    this._server = new mongo.Server(this._ip, this._port, this._sOptions);
    this._connection = new mongo.Db(this._db, this._server, this._dbOptions);
    var self = this;
    this._connection.open(function(err,cl){
        if (err) {
            throw Error('Name: "DB Error", Description: "An error was thrown: ' + err + '"');
        }
        self._hasConnection = true;
        callback();
    });

};



/*
    Function: addCollections

        adds 'users' collection to noSql db if dne, sets Model on completion.
*/
MongoDB.prototype.addCollections = function(callback) {
    var self = this;
    this.setModel('users', function() {
        if(self._model === undefined) {
            self._connection.createCollection('users', function() {
                self.setModel('users', callback);
            });
        }
    });
 
};



/*
    Function: getConnection

        Get connection

    Returns:
        {Connection} MongoDB.Db
*/
MongoDB.prototype.getConnection = function() {
    return this._connection;
};



/*
    Function: findOneUser

        selects one user based on username, this._model must be set
    
    Parameters:
        
        user - {String} user to find
        callback - (Function) execute callback on completion

    Returns:
        {Object} user model
*/
MongoDB.prototype.findOneUser = function( user, callback ) {
    return this._model.findOne({ 'username' : user}, callback);
};



/*
    Function: canRegister

        Can the user register or does he have too many accounts on this IP
    
    Parameters:
        
        ip - {String} get all users with IP 
        allowed - (Function) called when user is allowed  
        notallowed - {Function} called if user is not allowed
*/
MongoDB.prototype.canRegister = function( ip, allowed, notallowed ) {
    this._model.find({ 'ip' : ip}, function(err, items) {
        if(items.length > 3)
            {
                notallowed();
            }
        else
            allowed();
    });
}



/*
    Function: isCorrectLogin

        Is the users supplied information correct? Check mongoDB
    
    Parameters:
        
        user - {String} user to find
        password - (String) 
        correct - {Function} if user is found and password corresponds to said user
        incorrect - {Function} if user is NOT found or password is incorrect
*/
MongoDB.prototype.isCorrectLogin = function ( user, password, correct, incorrect ) {
    this.findOneUser(user, function (err, cursor) {
        console.log(user);
        if(cursor === null){
            incorrect();
            return;
        }
        if(password === cursor.password)
            correct();    
        else
            incorrect();
    });
};

/*
    Function: updateUser

        selects one user based on username and updates his values,
        will add new user if called and user does not exist.
    
    Parameters:
        
        user - {String} user to find
        upsert - {Boolean} do we create a new user if none exists?
        options - {Object} add excess options to username
        callback - (Function) execute callback on completion
*/
MongoDB.prototype.updateUser = function( user, upsert, options, callback ) {
    var self = this;
    var userObj = this.findOneUser(user, function(err, cursor){
        if(cursor) {
                self._model.update({username : user}, 
                        {$set : options}, 
                        {safe : true, upsert : true}, callback);
             }
        else {
                if (!upsert) callback();
                else {
                    options['username'] = user;
                    self._model.insert(options, function(err, docs){
                    callback();});
                   
                }     
            }   
    });

};



/*
    Function: getServer

        Get server

    Returns:
        {Server} MongoDB.Server
*/
MongoDB.prototype.getServer = function() {
    return this._server;
};



/*
    Function: connection

        Gets boolean from object that is modified on connection to mongodb server.

    Returns:
        {Boolean} is connected to database?
*/
MongoDB.prototype.connected = function() {
    return this._hasConnection;
};



/*
    Function: setPrivLevel

        Get connection
    
    Parameters:
        
        user - {String} username to update
        priv - {String} privledge level to set user to
        callback - {Function} callback performed after completion
*/
MongoDB.prototype.setPrivLevel = function( user, priv, callback ) {
    this.updateUser(user, false, {privLevel : priv}, callback);
};



/*
    Function: logIn

        selects specified user in database table 'users' and adds a session to the collection
        for the selected user.
    
    Parameters:
        
        user - {String} username to query
        sessionId - {String} randomized hash 50ish chars in length
        callback - {Function} callback performed after completion
*/
MongoDB.prototype.logIn = function( user, sessionId, callback ) {
    this.updateUser(user, false, {session : sessionId}, callback);
};



/*
    Function: logOut

        selects specified user in database table 'users' and removes the session
        for that user.
    
    Parameters:
        
        user - {String} username to query
        callback - {Function} callback performed after completion
*/
MongoDB.prototype.logOut = function( user, callback ) {
    this.updateUser(user, false, {session : undefined}, callback);
};



/*
    Function: registerUser

        updates user information or adds new user to database
    
    Parameters:
        
        user - {String} username to query
        password - {String} password to add user with.
        privLevel - {String} set user to USER, ADMIN etc. or non-predefined priv.
        callback - {Function} callback performed after completion
        reg_options - {Object} example: {email : x, birthday : y}
*/
MongoDB.prototype.registerUser = function( user, pass, plvl, reg_options, callback ) {
    var remail = reg_options['email'];
    this._model.insert({username:user, password : pass, privLevel: plvl, email : remail }, function(err,docs){});
    //this.updateUser(user, true, reg_options, callback);
};



/*
    Function: setPassword

        set password for specified user
    
    Parameters:
        
        user - {String} username to update
        pass - {String} new password
        callback - {Function} callback performed after completion
*/
MongoDB.prototype.setPassword = function( user, pass, callback ) {
    this.updateUser(user, false, {password : pass}, callback);
};



/*
    Function: getPrivLevel

        get current privLevel of a user
    
    Parameters:
        
        user - {String} username to search
        callback - {Function} callback performed after completion PARAMS (privLevel)
*/
MongoDB.prototype.getPrivLevel = function( user, callback ) {
    this.findOneUser( user, function(err, cursor) {
        callback(cursor.privLevel);
    });
}
