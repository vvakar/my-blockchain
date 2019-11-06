const sha256 = require('sha256');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];

    this.createNewBlock(100, '0', '0'); // genesis block
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
        recipient: recipient
    };
    this.pendingTransactions.push(newTransaction);
    return this.getLastBlock().index + 1;
}

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

module.exports = Blockchain;