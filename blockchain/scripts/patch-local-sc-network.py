#!/usr/bin/env python3
"""
Patch sc-network codec indices in local copies
"""
import os
import re

versions = ["0.36.0", "0.37.0", "0.38.0"]
patch_base = r"x:\Demiurge-Blockchain\blockchain\patches"

def patch_codec_indices(version):
    message_file = os.path.join(patch_base, f"sc-network-{version}-fixed", "src", "protocol", "message.rs")
    
    if not os.path.exists(message_file):
        print(f"✗ Not found: {message_file}")
        return False
    
    with open(message_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find and patch individual lines
    patched = False
    for i, line in enumerate(lines):
        # Status packet
        if "Status(Status<Hash, Number>)," in line and "#[codec(index = 0)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 0)]\n")
            patched = True
            continue
        
        # Block request
        if "BlockRequest(BlockRequest<Hash, Number>)," in line and "#[codec(index = 1)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 1)]\n")
            patched = True
            continue
        
        # Block response
        if "BlockResponse(BlockResponse<Header, Hash, Extrinsic>)," in line and "#[codec(index = 2)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 2)]\n")
            patched = True
            continue
        
        # Block announce
        if "BlockAnnounce(BlockAnnounce<Header>)," in line and "#[codec(index = 3)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 3)]\n")
            patched = True
            continue
        
        # Remote call request
        if "RemoteCallRequest(RemoteCallRequest<Hash>)," in line and "#[codec(index = 4)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 4)]\n")
            patched = True
            continue
        
        # Remote call response
        if "RemoteCallResponse(RemoteCallResponse)," in line and "#[codec(index = 7)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 7)]\n")
            patched = True
            continue
        
        # Remote read request
        if "RemoteReadRequest(RemoteReadRequest<Hash>)," in line and "#[codec(index = 8)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 8)]\n")
            patched = True
            continue
        
        # Remote read response
        if "RemoteReadResponse(RemoteReadResponse)," in line and "#[codec(index = 9)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 9)]\n")
            patched = True
            continue
        
        # Remote header request
        if "RemoteHeaderRequest(RemoteHeaderRequest<Number>)," in line and "#[codec(index = 10)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 10)]\n")
            patched = True
            continue
        
        # Remote header response
        if "RemoteHeaderResponse(RemoteHeaderResponse<Header>)," in line and "#[codec(index = 11)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 11)]\n")
            patched = True
            continue
        
        # Remote changes request
        if "RemoteChangesRequest(RemoteChangesRequest<Hash>)," in line and "#[codec(index = 12)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 12)]\n")
            patched = True
            continue
        
        # Remote changes response
        if "RemoteChangesResponse(RemoteChangesResponse<Number, Hash>)," in line and "#[codec(index = 13)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 13)]\n")
            patched = True
            continue
        
        # Remote read child request
        if "RemoteReadChildRequest(RemoteReadChildRequest<Hash>)," in line and "#[codec(index = 14)]" not in "".join(lines[max(0,i-1):i]):
            lines.insert(i, "\t\t#[codec(index = 14)]\n")
            patched = True
    
    if patched:
        with open(message_file, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"✓ Patched: {version}")
        return True
    else:
        print(f"✗ No changes: {version}")
        return False

for version in versions:
    patch_codec_indices(version)

print("Done!")
