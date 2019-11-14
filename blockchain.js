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


function createBlockData(transactions, index) {
    return { transactions: transactions, index: index };
}

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

/**
 * Add new pending transaction
 * @returns the index of the anticipated block in which this transaction is stored
 */
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    return {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };
};

Blockchain.prototype.addTransactionToPendingTransactions = function(tx) {
    this.pendingTransactions.push(tx);
    return this.getLastBlock().index + 1;
};

Blockchain.prototype.hashBlock = function (prevBlocHash, currentBlockData, nonce) {
    const dataAsString = prevBlocHash + nonce.toString() + JSON.stringify(currentBlockData);
    return sha256(dataAsString);
};

Blockchain.prototype.proofOfWork = function (prvBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = '';

    do {
        ++nonce;
        hash = this.hashBlock(prvBlockHash, currentBlockData, nonce);
    } while (!isValidHash(hash));

    return nonce;
};

function isValidHash(hash) {
    return hash.substring(0, 4) === '0000'
}

Blockchain.prototype.mine = function() {
    const lastBlock = this.getLastBlock();
    const prevHash = lastBlock.hash;

    // Add mining reward
    const tx = this.createNewTransaction(Constants.MINING_REWARD, Constants.MINING_SENDER, this.id);
    this.addTransactionToPendingTransactions(tx);

    const currentBlockData = createBlockData(this.pendingTransactions, lastBlock.index+1);
    const nonce = this.proofOfWork(prevHash, currentBlockData);
    const currentHash = this.hashBlock(prevHash, currentBlockData, nonce);

    return this.createNewBlock(nonce, prevHash, currentHash);
};

Blockchain.prototype.isValid = function(bc) {
    let isOk = true;

    for (let i = 1; i < bc.chain.length; ++i) {
        const curBlock = bc.chain[i];
        const prevBlock = bc.chain[i-1];
        const expectedHash = Blockchain.prototype.hashBlock(prevBlock.hash, createBlockData(curBlock.transactions, i + 1), curBlock.nonce);

        if (curBlock.previousBlockHash !== prevBlock.hash ||
            curBlock.hash !== expectedHash ||
            !isValidHash(expectedHash)) {
            isOk = false;
        }
    }

    const genesisBlock = bc.chain[0];
    if (genesisBlock.hash !== Constants.GENESIS_HASH ||
        genesisBlock.previousBlockHash !== Constants.GENESIS_HASH ||
        genesisBlock.nonce !== Constants.GENESIS_NONCE ||
        genesisBlock.transactions.length !== 0) {

        isOk = false;
    }

    return isOk;
};

module.exports = Blockchain;