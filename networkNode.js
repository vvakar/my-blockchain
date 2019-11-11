const express = require('express');
const Blockchain = require('./blockchain');
const ClusterInfo = require('./clusterInfo');
const app = express();
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const rp = require('request-promise');

const BC_PORT = process.argv[2];

const NODE_ID = uuid().split('-').join('');
const bc = new Blockchain(NODE_ID);
const clusterInfo = new ClusterInfo(NODE_ID, BC_PORT);


app.use(bodyParser.json({type: 'application/json'}));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function (req, res) {
    res.send(bc);
});

app.post('/transaction', function (req, res) {
    const amount = req.body.amount;
    const sender = req.body.sender;
    const recipient = req.body.recipient;
    const idx = bc.createNewTransaction(amount, sender, recipient);
    res.json({"index": idx});
});

app.post('/mine', function (req, res) {
    const newBlock = bc.mine();
    res.json({block: newBlock});

});

app.post('/register-and-broadcast-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    console.log(`/register-and-broadcast-node newNodeUrl ${newNodeUrl}`);

    clusterInfo.addNetworkNode(newNodeUrl);

    const regNodePromises = [];
    clusterInfo.networkNodes.forEach(nn => {
        let uri = nn + '/register-node';

        console.log(`    ... adding promise for ${uri}`);
        const reqOptions = {
            uri: uri,
            method: 'POST',
            body: {newNodeUrl: newNodeUrl},
            json: true
        };

        regNodePromises.push(rp(reqOptions));
    });

    Promise.all(regNodePromises)
        .then(data => {
            console.log(` ... registrations completed. Bulk-registering with ${newNodeUrl}`);

            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: {allNetworkNodes: [...clusterInfo.networkNodes, clusterInfo.currentNodeUrl]},
                json: true
            };

            return rp(bulkRegisterOptions);
        }).then(data => {
        res.json({note: 'Success'});
    });

});

app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    console.log(`/register-node: ${newNodeUrl}`);
    clusterInfo.addNetworkNode(newNodeUrl);
    res.json({ note: "Success"});
});

app.post('/register-nodes-bulk', function (req, res) {
    const allNodes = req.body.allNetworkNodes;
    console.log(`/register-nodes-bulk: ${allNodes}`);

    allNodes.forEach(n => clusterInfo.addNetworkNode(n));
    res.json({ note: "Success"});
});

app.get('/cluster-info', function(req, res) {
    res.json(clusterInfo);
});


app.listen(BC_PORT, function () {
    console.log("Listening on port " + BC_PORT);
});
