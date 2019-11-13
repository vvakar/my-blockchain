const Constants = require('./constants');
const sha256 = require('sha256');
const uuid = require('uuid/v1');

function Blockchain(id) {
    this.chain = [];
    this.pendingTransactions = [];
    this.id = id;
    this.createNewBlock(Constants.GENESIS_NONCE, Constants.GENESIS_HASH, Constants.GENESIS_HASH); // genesis block
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);
    return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

/**
 * Add new pending transaction
 * @returns the index of the anticipated block in which this transaction is stored
 */
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };

    return newTransaction;
}

Blockchain.prototype.addTransactionToPendingTransactions = function(tx) {
    this.pendingTransactions.push(tx);
    return this.getLastBlock().index + 1;
};

Blockchain.prototype.hashBlock = function (prevBlocHash, currentBlockData, nonce) {
    const dataAsString = prevBlocHash + nonce.toString() + JSON.stringify(currentBlockData);
    return sha256(dataAsString);
}

Blockchain.prototype.proofOfWork = function (prvBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = '';

    do {
        ++nonce;
        hash = this.hashBlock(prvBlockHash, currentBlockData, nonce);
    } while (hash.substring(0, 4) !== '0000');

    return nonce;
}

Blockchain.prototype.mine = function() {
    const lastBlock = this.getLastBlock();
    const prevHash = lastBlock.hash;
    const currentBlockData = {
        transactions: this.pendingTransactions,
        index: lastBlock.index + 1
    };
    const nonce = this.proofOfWork(prevHash, currentBlockData);
    const currentHash = this.hashBlock(prevHash, currentBlockData, nonce);

    // Add mining reward
    const tx = this.createNewTransaction(Constants.MINING_REWARD, Constants.MINING_SENDER, this.id);
    this.addTransactionToPendingTransactions(tx);
    return this.createNewBlock(nonce, prevHash, currentHash);
}

module.exports = Blockchain;