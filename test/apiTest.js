const api = require('../api');
const chaiHttp = require('chai-http');
const chai = require('chai');
const expect = require('chai').expect;
const describe = require('mocha').describe;
const should = chai.should();
chai.use(chaiHttp);
BC_PORT = 3000;

const server = api(BC_PORT);

describe('API', () => {
    beforeEach((done) => {
        done();
    });

    describe('GET /cluster-info', () => {
        it('it should GET empty cluster info', (done) => {
            chai.request(server)
                .get('/cluster-info')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.currentNodeUrl.should.equal('http://localhost:3000');
                    res.body.networkNodes.should.be.a('array');
                    res.body.networkNodes.length.should.be.eql(0);
                    done();
                });
        });
    });
});
