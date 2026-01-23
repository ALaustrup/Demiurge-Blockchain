#!/usr/bin/env python3
"""
Patch sc-network codec index collisions across all versions.
Fixes: Both `Consensus` and `RemoteCallResponse` had duplicate index 6
Solution: Add explicit codec indices to all Message enum variants
"""

import os
import re

versions = ["0.36.0", "0.37.0", "0.38.0"]
cargo_registry = r"C:\Users\Gnosis\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f"

def patch_sc_network(version):
    """Patch a single sc-network version"""
    message_file = os.path.join(cargo_registry, f"sc-network-{version}", "src", "protocol", "message.rs")
    
    if not os.path.exists(message_file):
        print(f"✗ Not found: sc-network-{version}")
        return False
    
    print(f"Processing: sc-network-{version}")
    
    with open(message_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already fully patched
    if all(pattern in content for pattern in [
        "#[codec(index = 0)]",
        "#[codec(index = 1)]",
        "#[codec(index = 8)]",
        "#[codec(index = 9)]"
    ]):
        print(f"✓ Already patched: sc-network-{version}")
        return True
    
    # Replace the entire Message enum with fully indexed version
    # First, identify and extract the enum
    enum_pattern = r'(pub enum Message<Header, Hash, Number, Extrinsic> \{)(.+?)(ConsensusBatch\(Vec<ConsensusMessage>\),\s*\})'
    
    def replacer(match):
        prefix = match.group(1)
        middle = match.group(2)
        suffix = match.group(3)
        
        # Build the new enum with all indices
        new_enum = prefix + '''
		/// Status packet.
		#[codec(index = 0)]
		Status(Status<Hash, Number>),
		/// Block request.
		#[codec(index = 1)]
		BlockRequest(BlockRequest<Hash, Number>),
		/// Block response.
		#[codec(index = 2)]
		BlockResponse(BlockResponse<Header, Hash, Extrinsic>),
		/// Block announce.
		#[codec(index = 3)]
		BlockAnnounce(BlockAnnounce<Header>),
		/// Consensus protocol message.
		// NOTE: index is incremented by 1 due to transaction-related
		// message that was removed
		#[codec(index = 6)]
		Consensus(ConsensusMessage),
		/// Remote method call request.
		#[codec(index = 4)]
		RemoteCallRequest(RemoteCallRequest<Hash>),
		/// Remote method call response.
		#[codec(index = 7)]
		RemoteCallResponse(RemoteCallResponse),
		/// Remote storage read request.
		#[codec(index = 8)]
		RemoteReadRequest(RemoteReadRequest<Hash>),
		/// Remote storage read response.
		#[codec(index = 9)]
		RemoteReadResponse(RemoteReadResponse),
		/// Remote header request.
		#[codec(index = 10)]
		RemoteHeaderRequest(RemoteHeaderRequest<Number>),
		/// Remote header response.
		#[codec(index = 11)]
		RemoteHeaderResponse(RemoteHeaderResponse<Header>),
		/// Remote changes request.
		#[codec(index = 12)]
		RemoteChangesRequest(RemoteChangesRequest<Hash>),
		/// Remote changes response.
		#[codec(index = 13)]
		RemoteChangesResponse(RemoteChangesResponse<Number, Hash>),
		/// Remote child storage read request.
		#[codec(index = 14)]
		RemoteReadChildRequest(RemoteReadChildRequest<Hash>),
		/// Batch of consensus protocol messages.
		// NOTE: index is incremented by 2 due to finality proof related
		// messages that were removed.
		''' + suffix
        
        return new_enum
    
    patched = re.sub(enum_pattern, replacer, content, flags=re.DOTALL)
    
    if patched != content:
        with open(message_file, 'w', encoding='utf-8') as f:
            f.write(patched)
        print(f"✓ Patched: sc-network-{version}")
        return True
    else:
        print(f"✗ Could not patch: sc-network-{version}")
        return False

# Patch all versions
print("Patching sc-network codec indices...")
print("=" * 50)

results = []
for version in versions:
    results.append(patch_sc_network(version))

print("=" * 50)
succeeded = sum(results)
print(f"Summary: {succeeded}/{len(versions)} versions patched")
