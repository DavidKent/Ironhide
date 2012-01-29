var Memory = module.exports = function() {
    this._sessions = {};
}
Memory.prototype.addSession( session, user, ip ) {
    this._sessions.session = { 'user' : user, 'ip' : ip };
}
Memory.prototype.removeSession( session ) {
    this._session.session = undefined;
}
Memory.prototype.getSessionInfo( session ) {
    return this._sessions.session;
}

