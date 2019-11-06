const expect = require('chai').expect;
const describe = require('mocha').describe;
const Blockchain = require('/opt/blockchain/dev/blockchain');

describe('Blockchain CRUD', function() {
    it('starts with empty transactions', function (done) {
        const bitcoin = new Blockchain();
        expect(bitcoin.pendingTransactions).to.be.empty;
        done();
    });

    it('starts with genesis block', function (done) {
        const bc = new Blockchain();
        expect(bc.chain.length).equal(1);
        expect(bc.chain[0].nonce).equal(bc.GENESIS_NONCE);
        done();
    });

    it('Stores transactions', function (done) {
        const bc = new Blockchain();
        bc.createNewTransaction(100, "Bill", "Jill");
        expect(bc.chain.length).equal(1);
        expect(bc.pendingTransactions.length).equal(1);

        bc.createNewBlock(123, "x", "xyz");
        expect(bc.chain.length).equal(2);
        expect(bc.pendingTransactions.length).equal(0);

        done();
    });
})






