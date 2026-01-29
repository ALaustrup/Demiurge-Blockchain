#!/bin/bash
# Demiurge Testnet Launcher - The Syzygy Protocol
# Starts a 3-node testnet for testing LibP2P networking

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NODE_BINARY="$PROJECT_ROOT/framework/target/release/demiurge-node"
CONFIG_DIR="$PROJECT_ROOT/config/testnet"
LOG_DIR="/data/testnet/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           DEMIURGE TESTNET - THE SYZYGY PROTOCOL               ║"
echo "║                    The Heart Awakens                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if node binary exists
if [ ! -f "$NODE_BINARY" ]; then
    echo -e "${RED}Error: Node binary not found at $NODE_BINARY${NC}"
    echo "Please build with: cargo build --release -p demiurge-node"
    exit 1
fi

# Create log directory
mkdir -p "$LOG_DIR"

# Stop any existing nodes
echo -e "${CYAN}Stopping any existing nodes...${NC}"
pkill -f "demiurge-node" 2>/dev/null || true
sleep 2

# Start Node 1 (Boot Node)
echo -e "${GREEN}Starting Node 1 (archon-alpha) - Boot Node...${NC}"
$NODE_BINARY --config "$CONFIG_DIR/node1.toml" > "$LOG_DIR/node1.log" 2>&1 &
NODE1_PID=$!
echo "  PID: $NODE1_PID"
sleep 3

# Start Node 2
echo -e "${GREEN}Starting Node 2 (archon-beta)...${NC}"
$NODE_BINARY --config "$CONFIG_DIR/node2.toml" > "$LOG_DIR/node2.log" 2>&1 &
NODE2_PID=$!
echo "  PID: $NODE2_PID"
sleep 2

# Start Node 3
echo -e "${GREEN}Starting Node 3 (archon-gamma)...${NC}"
$NODE_BINARY --config "$CONFIG_DIR/node3.toml" > "$LOG_DIR/node3.log" 2>&1 &
NODE3_PID=$!
echo "  PID: $NODE3_PID"
sleep 2

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    TESTNET STATUS                              ║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Node 1 (archon-alpha):  Port 30333  RPC 9933  PID: $NODE1_PID ${NC}"
echo -e "${CYAN}║  Node 2 (archon-beta):   Port 30334  RPC 9934  PID: $NODE2_PID ${NC}"
echo -e "${CYAN}║  Node 3 (archon-gamma):  Port 30335  RPC 9935  PID: $NODE3_PID ${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Logs: $LOG_DIR                           ${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait a moment for nodes to initialize
sleep 5

# Check if nodes are running
echo -e "${CYAN}Checking node status...${NC}"
if ps -p $NODE1_PID > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Node 1 is running${NC}"
else
    echo -e "  ${RED}✗ Node 1 failed to start${NC}"
    echo "  Check log: $LOG_DIR/node1.log"
fi

if ps -p $NODE2_PID > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Node 2 is running${NC}"
else
    echo -e "  ${RED}✗ Node 2 failed to start${NC}"
    echo "  Check log: $LOG_DIR/node2.log"
fi

if ps -p $NODE3_PID > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Node 3 is running${NC}"
else
    echo -e "  ${RED}✗ Node 3 failed to start${NC}"
    echo "  Check log: $LOG_DIR/node3.log"
fi

echo ""
echo -e "${GREEN}The Heart is beating. The Nervous System is alive.${NC}"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_DIR/node1.log"
echo "  tail -f $LOG_DIR/node2.log"
echo "  tail -f $LOG_DIR/node3.log"
echo ""
echo "To stop the testnet:"
echo "  pkill -f demiurge-node"
