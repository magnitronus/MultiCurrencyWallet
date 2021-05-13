const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const peers = new Set();
let orders = [];

const clients = new Set();

class MessageHandler {

    broadcast(message) {
        clients.forEach((client) => {
            client.send(JSON.stringify(message));
        })
    }

    handleMessage = (message) => {
        const data = JSON.parse(message);
        console.log(data);
        const handler = this[`_handle${data.type}`].bind(this)
        handler(data.data)
    }

    _handleNewPeer({peerId}) {
        peers.add(peerId);
        this.broadcast({type: 'NewPeer', data: {peerId}});
        console.log(peerId);
    }

    _handlePeerOrders({peerId, orders: peerOrders}) {
        const ids = new Set();
        // unique orders by id
        orders = [...orders, ...peerOrders].filter((order) => {
            if (!ids.has(order.id)) {
                ids.add(order.id);
                return true
            }
            return false;
        })
        this.broadcast({type: 'Orders', data: {peerId, orders: peerOrders}});
    }
}

const messageHandler = new MessageHandler();

wss.on('connection', function connection(ws) {
  clients.add(ws);

  ws.on('message', function incoming(message) {
    messageHandler.handleMessage(message)
  });
  ws.send(JSON.stringify({type: 'Peers', data: [...peers]}));
  ws.send(JSON.stringify({type: 'Orders', data: [...orders]}));
});