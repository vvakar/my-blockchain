const express = require('express');
const Blockchain = require('./blockchain');
const ClusterInfo = require('./clusterInfo');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const rp = require('request-promise');


const RunMe = function(port) {
    const app = express();
    const NODE_ID = uuid().split('-').join('');
    const bc = new Blockchain(NODE_ID);
    const clusterInfo = new ClusterInfo(port);

    app.use(bodyParser.json({type: 'application/json'}));
    app.use(bodyParser.urlencoded({extended: false}));

    app.get('/blockchain', function (req, res) {
        res.send(bc);
    });

    app.post('/transaction', function (req, res) {
        const tx = req.body;
        console.log(`/transaction called with ${JSON.stringify(req.body)}`);
        const idx = bc.addTransactionToPendingTransactions(tx);
        res.json({"index": idx});
    });

    app.post('/transaction/broadcast', function (req, res) {
        const amount = req.body.amount;
        const sender = req.body.sender;
        const recipient = req.body.recipient;
        console.log(`/transaction/broadcast called with ${JSON.stringify(req.body)}`);

        const tx = bc.createNewTransaction(amount, sender, recipient);
        bc.addTransactionToPendingTransactions(tx);

        const requestPromises = [];
        clusterInfo.networkNodes.forEach(networkNodeUrl => {
            const reqOptions = {
                uri: networkNodeUrl + '/transaction',
                method: 'POST',
                body: tx,
                json: true
            };

            requestPromises.push(rp(reqOptions));
        });

        Promise.all(requestPromises).then(data => {
            res.json({note: "Success"});
        })
    });

    app.post('/mine', function (req, res) {
        console.log(`/mine called`);
        const newBlock = bc.mine();

        const promises = [];
        clusterInfo.networkNodes.forEach(nn => {
            const reqOptions = {
                uri: nn + '/receive-new-block',
                method: 'POST',
                body: {newBlock: newBlock},
                json: true
            };
            promises.push(rp(reqOptions));
        });

        Promise.all(promises).then(data => {
            res.json({note: 'Successfully mined and broadcast', newBlock: newBlock});
        });

        res.json({block: newBlock});
    });

    app.post('/receive-new-block', function (req, res) {
        const newBlock = req.body.newBlock;
        console.log(`/receive-new-block called with ${JSON.stringify(newBlock)}`);

        const lastBlock = bc.getLastBlock();
        const isCorrectHash = lastBlock.hash === newBlock.previousBlockHash;
        const isCorrectIndex = lastBlock.index === newBlock.index - 1;

        if (isCorrectIndex && isCorrectHash) {
            bc.chain.push(newBlock);
            bc.pendingTransactions = [];
            res.json({note: 'Success'}
            );
        } else {
            res.json({note: 'REJECTED', newBlock: newBlock});
        }

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
        res.json({note: "Success"});
    });

    app.post('/register-nodes-bulk', function (req, res) {
        const allNodes = req.body.allNetworkNodes;
        console.log(`/register-nodes-bulk: ${allNodes}`);

        allNodes.forEach(n => clusterInfo.addNetworkNode(n));
        res.json({note: "Success"});
    });

    app.get('/cluster-info', function (req, res) {
        res.json(clusterInfo);
    });

    app.listen(port, function () {
        console.log("Listening on port " + port);
    });

    return app;
};

module.exports = RunMe;
