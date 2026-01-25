#!/bin/bash
# Test RPC endpoint on the server

# Create proper JSON file
cat > /tmp/rpc-test.json << 'ENDJSON'
{"jsonrpc":"2.0","method":"chain_getHealth","params":[],"id":1}
ENDJSON

echo "Testing JSON content:"
cat /tmp/rpc-test.json
echo ""
echo "Making RPC request..."
curl -s -X POST -H 'Content-Type: application/json' -d @/tmp/rpc-test.json http://localhost:9944
echo ""
