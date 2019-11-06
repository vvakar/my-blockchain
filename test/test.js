const expect = require('chai').expect;
const describe = require('mocha').describe;
const Blockchain = require('/opt/blockchain/dev/blockchain');

describe('Blockchain CRUD', function() {
    it('starts with empty transactions', function (done) {
        const bitcoin = new Blockchain();
        expect(bitcoin.pendingTransactions).to.be.empty;
        done();
    });
})






