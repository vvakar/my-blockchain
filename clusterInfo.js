
function ClusterInfo(nodeAddress, currentNodePort) {
    this.currentNodeUrl = 'http://localhost:' + currentNodePort;
    this.networkNodes = [];
}

ClusterInfo.prototype.addNetworkNode = function(nn) {
    if (this.networkNodes.indexOf(nn) === -1 && this.currentNodeUrl !== nn) {
        this.networkNodes.push(nn);
    }
};

module.exports = ClusterInfo;
