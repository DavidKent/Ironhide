var Memory = module.exports = function() {
    this._sessions = {};
}
Memory.prototype.addSession = function( session, user, ip ) {
    this._sessions.session = { 'user' : user, 'ip' : ip };
}
Memory.prototype.removeSession = function( session ) {
    this._sessions.session = undefined;
}
Memory.prototype.getSessionInfo = function( session ) {
    return this._sessions.session;
}

