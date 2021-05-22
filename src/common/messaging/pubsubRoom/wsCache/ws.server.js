"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
var WebSocket = require("ws");
var messages_1 = require("./messages");
var CLIENT_TIMEOUT = 60 * 3;
var wss = new WebSocket.Server({ port: 8080 });
var clientsInfo = {};
var broadcast = function (message) {
    wss.clients.forEach(function (client) {
        client.send(JSON.stringify(message));
    });
};
var MessageHandler = /** @class */ (function () {
    function MessageHandler() {
        var _a;
        var _this = this;
        this.handlers = (_a = {},
            _a[messages_1.wsMessagesClient.PeerConnected] = this._handleNewPeer,
            _a[messages_1.wsMessagesClient.PeerOrdersInit] = this._handlePeerOrders,
            _a);
        this.handleMessage = function (client, message) {
            var data = JSON.parse(message);
            var handler = _this.handlers[data.type].bind(_this);
            handler(client, data.data);
        };
    }
    MessageHandler.prototype._handleNewPeer = function (client, _a) {
        var peerId = _a.peerId;
        clientsInfo[client.id].peerId = peerId;
        broadcast({ type: messages_1.wsMessagesClient.PeerConnected, data: { peerId: peerId } });
    };
    MessageHandler.prototype._handlePeerOrders = function (client, _a) {
        var peerId = _a.peerId, peerOrders = _a.orders;
        clientsInfo[client.id].orders = peerOrders;
        broadcast({
            type: messages_1.wsMessagesClient.PeerOrdersInit,
            data: { peerId: peerId, orders: peerOrders }
        });
    };
    return MessageHandler;
}());
var messageHandler = new MessageHandler();
wss.on('connection', function connection(ws) {
    ws.isAlive = true;
    clientsInfo[ws.id] = { orders: [] };
    ws.on('message', function incoming(message) {
        messageHandler.handleMessage(ws, message);
    });
    var peers = Object.entries(clientsInfo).reduce(function (acc, _a) {
        var _ = _a[0], info = _a[1];
        return __spreadArray(__spreadArray([], acc), [info.peerId]);
    }, []);
    var orders = Object.entries(clientsInfo).reduce(function (acc, _a) {
        var _ = _a[0], info = _a[1];
        return __spreadArray(__spreadArray([], acc), info.orders);
    }, []);
    ws.send(JSON.stringify({ type: messages_1.wsMessagesServer.Peers, data: __spreadArray([], peers) }));
    ws.send(JSON.stringify({ type: messages_1.wsMessagesServer.Orders, data: __spreadArray([], orders) }));
});
setInterval(function () {
    wss.clients.forEach(function (client) {
        if (client.isAlive === false) {
            broadcast({
                type: messages_1.wsMessagesServer.PeerDisconnected,
                data: { peerId: clientsInfo[client.id].peerId }
            });
            delete clientsInfo[client.id];
            return client.terminate();
        }
        client.isAlive = false;
        client.ping();
    });
}, CLIENT_TIMEOUT / 2);
