const express = require('express');
const Blockchain = require('./blockchain');
const ClusterInfo = require('./clusterInfo');
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const rp = require('request-promise');


const RunMe = function(port) {
    let NODE_ID, bc, clusterInfo;
    const app = express();
    app.use(bodyParser.json({type: 'application/json'}));
    app.use(bodyParser.urlencoded({extended: false}));

    app.reset = function() {
        NODE_ID = uuid().split('-').join('');
        bc = new Blockchain(NODE_ID);
        clusterInfo = new ClusterInfo(port);
    };
    app.reset();

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
            replySuccess(res);
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
            replySuccess(res);
        } else {
            res.json({note: 'REJECTED', newBlock: newBlock});
        }

    });

    app.get('/consensus', function(req, res) {
        const ps = [];

        clusterInfo.networkNodes.forEach(nn => {
            const requestOptions = {
                uri: nn + '/blockchain',
                method: 'GET',
                json: true
            };

            ps.push(rp(requestOptions));
        });

        let isReplaced = false;
        Promise.all(ps)
            .then(bcs => {
                bcs.forEach(otherBc => {
                    if (bc.chain.length < otherBc.chain.length) {
                        if (Blockchain.prototype.isValid(otherBc)) {
                            bc.chain = otherBc.chain;
                            bc.pendingTransactions = otherBc.pendingTransactions;
                            isReplaced = true;
                        }
                    }
                });

                res.json({ note: `Current chain has ${isReplaced ? 'indeed':'not'} been replaced`, chain: bc.chain });
            });
    });

    app.get('/block/:hash', function(req, res) {
        const hash = req.params.hash;
        const blk = bc.getBlock(hash);
        res.json({ block: blk });
    });

    app.get('/transaction/:transactionId', function(req, res) {
        const tx = req.params.transactionId;
        const txBlk = bc.getTransaction(tx);
        res.json( { transaction: txBlk.transaction, block: txBlk.block });
    });

    app.get('/address/:address', function(req, res) {
        const addr = req.params.address;
        const data = bc.getAddressData(addr);
        res.json( { transactions: data.transactions, balance: data.balance });
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
                console.log(`VAL RESpOnSe ${JSON.stringify(data)}`);

                const bulkRegisterOptions = {
                    uri: newNodeUrl + '/register-nodes-bulk',
                    method: 'POST',
                    body: {allNetworkNodes: [...clusterInfo.networkNodes, clusterInfo.currentNodeUrl]},
                    json: true
                };

                return rp(bulkRegisterOptions);
            }).then(data => {
            replySuccess(res);
        });

    });

    app.post('/register-node', function (req, res) {
        const newNodeUrl = req.body.newNodeUrl;
        console.log(`/register-node: ${newNodeUrl}`);
        clusterInfo.addNetworkNode(newNodeUrl);
        replySuccess(res);
    });

    app.post('/register-nodes-bulk', function (req, res) {
        const allNodes = req.body.allNetworkNodes;
        console.log(`/register-nodes-bulk: ${allNodes}`);

        allNodes.forEach(n => clusterInfo.addNetworkNode(n));
        replySuccess(res);
    });

    app.get('/cluster-info', function (req, res) {
        res.json(clusterInfo);
    });

    app.get('/explorer', function(req, res) {
        res.sendFile('./explorer.html', { root: __dirname });
    });

    const server = app.listen(port, function () {
        console.log("Listening on port " + port);
    });

    function replySuccess(res) {
        res.json({note: "Success", from: `${clusterInfo.currentNodeUrl}` });
    }

    app.close = function() {
        server.close();
    };

    return app;
};

module.exports = RunMe;
