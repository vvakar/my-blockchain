const api = require('../api');
const chaiHttp = require('chai-http');
const chai = require('chai');
const expect = require('chai').expect;
const assert = require('chai').assert;
const describe = require('mocha').describe;
const should = chai.should();
chai.use(chaiHttp);
const PORT1 = 2995;
const PORT2 = 2996;

function clusterInfo(server, func) {
    return chai.request(server)
        .get('/cluster-info')
        .then(res => {
            res.should.have.status(200);
            func(res);
        });
}

describe('API', () => {
    const server1 = api(PORT1);
    const server2 = api(PORT2);

    beforeEach((done) => {
        server1.reset();
        server2.reset();
        done();
    });

    after(done => {
        server1.close();
        server2.close();
        done();
    });

    describe('GET /cluster-info', () => {
        it('it should GET empty cluster info', (done) => {
            const p1 = clusterInfo(server1, function (res) {
                res.body.currentNodeUrl.should.equal('http://localhost:' + PORT1);
                res.body.networkNodes.should.be.a('array');
                res.body.networkNodes.length.should.be.eql(0);
            });

            const p2 = clusterInfo(server2, function (res) {
                res.body.currentNodeUrl.should.equal('http://localhost:' + PORT2);
                res.body.networkNodes.should.be.a('array');
                res.body.networkNodes.length.should.be.eql(0);
            });

            Promise.all([p1, p2])
                .then(() => done());
        });

        it('it should register another cluster member', (done) => {
            chai.request(server1)
                .post('/register-and-broadcast-node')
                .send({newNodeUrl: `http://localhost:${PORT2}`})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.note.should.equal('Success');

                    const p1 = clusterInfo(server1, function (res) {
                        res.body.currentNodeUrl.should.equal(`http://localhost:${PORT1}`);
                        res.body.networkNodes.should.contain(`http://localhost:${PORT2}`);
                    });

                    const p2 = clusterInfo(server2, function (res) {
                        res.body.currentNodeUrl.should.equal('http://localhost:' + PORT2);
                        res.body.networkNodes.should.contain(`http://localhost:${PORT1}`);
                    });

                    Promise.all([p1, p2])
                        .then(() => done());
                });
        });

        it('it should register another cluster member', (done) => {
            chai.request(server1)
                .post('/register-and-broadcast-node')
                .send({newNodeUrl: `http://localhost:${PORT2}`})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.note.should.equal('Success');

                    const p1 = clusterInfo(server1, function (res) {
                        res.body.currentNodeUrl.should.equal(`http://localhost:${PORT1}`);
                        res.body.networkNodes.should.contain(`http://localhost:${PORT2}`);
                    });

                    const p2 = clusterInfo(server2, function (res) {
                        res.body.currentNodeUrl.should.equal('http://localhost:' + PORT2);
                        res.body.networkNodes.should.contain(`http://localhost:${PORT1}`);
                    });

                    Promise.all([p1, p2])
                        .then(() => done());
                });
        });
    });
});


/**
 * Fail any tests with unhandled exceptions
 */
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    assert.fail()
});
