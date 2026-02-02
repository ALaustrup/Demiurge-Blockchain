#!/bin/bash
# Test RPC endpoint

# Create a valid JSON-RPC request
cat > /tmp/rpc_test.json << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}
EOF

echo "Request body:"
cat /tmp/rpc_test.json
echo ""

echo "Testing RPC..."
curl -s http://localhost:9944 -X POST -H "Content-Type: application/json" -d @/tmp/rpc_test.json

echo ""
echo "Done."
