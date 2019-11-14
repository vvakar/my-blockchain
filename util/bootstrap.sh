curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3002/register-and-broadcast-node' --data '{ "newNodeUrl" : "http://localhost:3001" }'
curl -H "Accept: application/json" -H "Content-Type: application/json" 'http://localhost:3002/cluster-info'
curl -H "Accept: application/json" -H "Content-Type: application/json" 'http://localhost:3001/cluster-info'

curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3001/transaction/broadcast' --data '{ "amount": 255, "sender":"Jill", "recipient":"Bob" }'
curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3001/transaction/broadcast' --data '{ "amount": 255, "sender":"Jill", "recipient":"Bob" }'
curl -XPOST 'http://localhost:3002/mine'

curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3001/transaction/broadcast' --data '{ "amount": 255, "sender":"Jill", "recipient":"Bob" }'
curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3001/transaction/broadcast' --data '{ "amount": 255, "sender":"Jill", "recipient":"Bob" }'
curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3002/mine'

curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3001/transaction/broadcast' --data '{ "amount": 255, "sender":"Jill", "recipient":"Bob" }'


curl -H "Accept: application/json" -H "Content-Type: application/json" -XPOST 'http://localhost:3002/register-and-broadcast-node' --data '{ "newNodeUrl" : "http://localhost:3003" }'
curl -H "Accept: application/json" -H "Content-Type: application/json" 'http://localhost:3003/cluster-info'
curl -H "Accept: application/json" -H "Content-Type: application/json" 'http://localhost:3002/cluster-info'
curl -H "Accept: application/json" -H "Content-Type: application/json" 'http://localhost:3001/cluster-info'

curl -H "Accept: application/json" -H "Content-Type: application/json" 'http://localhost:3003/consensus'


