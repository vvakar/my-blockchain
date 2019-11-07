const express = require('express');
const Blockchain = require('./blockchain');
const app = express();
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const BC_PORT = 3000;

const NODE_ADDRESS = uuid().split('-').join('');
const bc = new Blockchain(NODE_ADDRESS);

app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', function (req, res) {
    res.send(bc);
});

app.post('/transaction', function (req, res) {
    const amount = req.body.amount;
    const sender = req.body.sender;
    const recipient = req.body.recipient;
    const idx = bc.createNewTransaction(amount, sender, recipient);
    res.json({ "index": idx });
});

app.post('/mine', function (req, res) {
    const newBlock = bc.mine();
    res.json({ block: newBlock });

});

app.listen(BC_PORT, function () {
    console.log("Listening on port " + BC_PORT);
});
