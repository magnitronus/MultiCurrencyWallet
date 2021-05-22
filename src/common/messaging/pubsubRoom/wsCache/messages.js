"use strict";
exports.__esModule = true;
exports.wsMessagesServer = exports.wsMessagesClient = void 0;
var wsMessagesClient;
(function (wsMessagesClient) {
    wsMessagesClient["PeerConnected"] = "PeerConnected";
    wsMessagesClient["PeerDisconnected"] = "PeerDisconnected";
    wsMessagesClient["PeerOrdersInit"] = "PeerOrdersInit";
    wsMessagesClient["OrderAdded"] = "OrderAdded";
    wsMessagesClient["OrderRemoved"] = "OrderRemoved";
    wsMessagesClient["Pong"] = "Pong";
})(wsMessagesClient = exports.wsMessagesClient || (exports.wsMessagesClient = {}));
var wsMessagesServer;
(function (wsMessagesServer) {
    wsMessagesServer["Peers"] = "Peers";
    wsMessagesServer["Orders"] = "Orders";
    wsMessagesServer["Ping"] = "Ping";
    wsMessagesServer["PeerDisconnected"] = "PeerDisconnected";
})(wsMessagesServer = exports.wsMessagesServer || (exports.wsMessagesServer = {}));
