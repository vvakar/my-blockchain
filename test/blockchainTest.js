const Constants = require('../constants');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const Blockchain = require('../blockchain');

describe('Blockchain Suite', function () {
    const BC_ID = 'DaMiner';
    let bc;
    beforeEach('Setting up the userList', function () {
        bc = new Blockchain(BC_ID);
    });

    describe('Blockchain basics', function () {
        it('starts with empty transactions', function (done) {
            expect(bc.pendingTransactions).to.be.empty;
            done();
        });

        it('starts with genesis block', function (done) {
            expect(bc.chain.length).equal(1);
            expect(bc.chain[0].nonce).equal(Constants.GENESIS_NONCE);
            done();
        });

        it('Stores pending transactions', function (done) {
            const tx = bc.createNewTransaction(100, "Bill", "Jill");
            bc.addTransactionToPendingTransactions(tx);
            expect(bc.chain.length).equal(1);
            expect(bc.pendingTransactions.length).equal(1);

            const t2 = bc.createNewTransaction(200, "Jill", "Bill");
            bc.addTransactionToPendingTransactions(t2);
            expect(bc.chain.length).equal(1);
            expect(bc.pendingTransactions.length).equal(2);
            done();
        });

        it('creates block with pending transactions', function (done) {
            const t1 = bc.createNewTransaction(200, "Jill", "Bill");
            const t2 = bc.createNewTransaction(200, "Jill", "Bill");
            bc.addTransactionToPendingTransactions(t1);
            bc.addTransactionToPendingTransactions(t2);
            bc.createNewBlock(123, "PREV", 'HASH');
            expect(bc.chain.length).equal(2);
            expect(bc.getLastBlock().transactions.length).equal(2);
            expect(bc.getLastBlock().index).equal(2);
            expect(bc.getLastBlock().nonce).equal(123);
            expect(bc.getLastBlock().previousBlockHash).equal('PREV');
            expect(bc.getLastBlock().hash).equal('HASH');
            expect(bc.pendingTransactions.length).equal(0);
            done();
        });

        it('Generates hash value', function (done) {
            const h = bc.hashBlock("ABC", "CDE", 1234);
            expect(h).equal('f02260913fd35aa7fb28e4b2b37ade55eaf78e942760c8a8fbd16b119c94d61f');
            done();
        });

        it('Generates proof of work', function (done) {
            const n = bc.proofOfWork("abc", "def");
            expect(n).equal(12732);
            done();
        });
    });



    describe('Workflow', function () {
        it('issues reward for mining empty block', function (done) {
            bc.createNewBlock(123, 'PREV', 'HASH');
            const blk = bc.mine();
            expect(blk.transactions.length).equal(1);
            expect(blk.transactions[0].amount).equal(Constants.MINING_REWARD);
            expect(blk.transactions[0].sender).equal(Constants.MINING_SENDER);
            expect(blk.transactions[0].recipient).equal(BC_ID);
            done();
        });

        it('issues reward for mining nonempty block', function (done) {
            bc.createNewBlock(123, 'PREV', 'HASH');
            const tx =bc.createNewTransaction(200, "Jill", "Bill");
            bc.addTransactionToPendingTransactions(tx);
            const blk = bc.mine();
            expect(blk.transactions.length).equal(2);

            expect(blk.transactions[0].amount).equal(200);
            expect(blk.transactions[0].sender).equal('Jill');
            expect(blk.transactions[0].recipient).equal('Bill');

            // Reward transaction comes last
            expect(blk.transactions[1].amount).equal(Constants.MINING_REWARD);
            expect(blk.transactions[1].sender).equal(Constants.MINING_SENDER);
            expect(blk.transactions[1].recipient).equal(BC_ID);
            done();
        });
    });
});

