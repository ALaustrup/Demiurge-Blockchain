#!/usr/bin/env python3
"""Comprehensive Demiurge RPC Test Suite"""

import urllib.request
import json

RPC_URL = 'http://localhost:9948'

def rpc(method, params=None):
    data = json.dumps({'jsonrpc': '2.0', 'method': method, 'params': params or [], 'id': 1}).encode()
    try:
        req = urllib.request.Request(RPC_URL, data=data, headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(req, timeout=10)
        return json.loads(resp.read().decode())
    except Exception as e:
        return {'error': str(e)}

print('=' * 70)
print('DEMIURGE BLOCKCHAIN - COMPREHENSIVE RPC TEST')
print('=' * 70)

tests = [
    # Chain methods
    ('chain_getBlockNumber', []),
    ('chain_getHealth', []),
    ('chain_getBlock', [0]),
    ('chain_getTransaction', ['0x' + '0' * 64]),
    
    # Consensus methods
    ('consensus_getValidators', []),
    ('consensus_getEraInfo', []),
    ('consensus_getSlashingStatus', ['0' * 64]),
    
    # Balance methods  
    ('balances_getBalance', ['0' * 64]),
    ('balances_totalSupply', []),
    
    # DRC-369 NFT methods
    ('drc369_getToken', ['0x' + '0' * 64]),
    ('drc369_getTokensByOwner', ['0' * 64]),
    ('drc369_getStateTree', ['0x' + '0' * 64, []]),
    
    # Session keys
    ('session_keys_list_authorized', ['0' * 64]),
]

passed = 0
failed = 0

for method, params in tests:
    result = rpc(method, params)
    has_result = 'result' in result
    has_error = 'error' in result
    
    if has_result:
        passed += 1
        r = result['result']
        if isinstance(r, dict):
            summary = ', '.join('{}={}'.format(k, v) for k, v in list(r.items())[:3])
        elif isinstance(r, list):
            summary = '[{} items]'.format(len(r))
        else:
            summary = str(r)[:50]
        print('OK  {}: {}'.format(method, summary[:60]))
    elif has_error:
        failed += 1
        err = result['error']
        if isinstance(err, dict):
            msg = err.get('message', str(err))[:40]
        else:
            msg = str(err)[:40]
        print('ERR {}: {}'.format(method, msg))
    else:
        failed += 1
        print('??? {}: Unknown response'.format(method))

print()
print('=' * 70)
print('LIVE CHAIN METRICS')
print('=' * 70)

health = rpc('chain_getHealth')
if 'result' in health:
    h = health['result']
    print('Block Height:     {}'.format(h.get('block_number', 'N/A')))
    print('Connected:        {}'.format(h.get('connected', 'N/A')))
    print('Validators:       {}'.format(h.get('validators', 'N/A')))
    print('Peers:            {}'.format(h.get('peers', 'N/A')))
    print('Block Time:       {}ms'.format(h.get('block_time', 'N/A')))
    print('Finality:         {}ms'.format(h.get('finality', 'N/A')))

era = rpc('consensus_getEraInfo')
if 'result' in era:
    e = era['result']
    print('Era:              {}'.format(e.get('era', 'N/A')))
    print('Era Start:        Block {}'.format(e.get('start_block', 'N/A')))
    print('Total Staked:     {}'.format(e.get('total_staked', 'N/A')))

supply = rpc('balances_totalSupply')
if 'result' in supply:
    s = supply['result']
    total = int(s.get('total', 0)) / 1e18
    print('Total Supply:     {:,.2f} CGT'.format(total))

print()
print('=' * 70)
print('RESULT: {} passed, {} failed'.format(passed, failed))
print('=' * 70)
