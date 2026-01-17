import { NextRequest, NextResponse } from 'next/server';
import { getQorIdFromRequest } from '@/lib/auth-utils';
import { qorAuth } from '@demiurge/qor-sdk';
import { blockchainClient } from '@/lib/blockchain';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { loadStoredWalletMnemonic } from '@/lib/wallet';

/**
 * POST /api/games/spend
 * Spend CGT from user's wallet for in-game purchases
 * 
 * This endpoint handles CGT spending transactions initiated by games.
 * The user's wallet password is required to unlock the keypair for signing.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract QOR ID from auth token
    const qorId = await getQorIdFromRequest(request);
    if (!qorId) {
      return NextResponse.json(
        { error: 'Unauthorized - QOR ID required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, reason, walletPassword, toAddress } = body;

    if (!amount || !reason || !walletPassword) {
      return NextResponse.json(
        { error: 'amount, reason, and walletPassword are required' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get user's profile to find their on-chain address
    const profile = await qorAuth.getProfile();
    const fromAddress = profile.on_chain?.address || profile.on_chain_address;
    
    if (!fromAddress) {
      return NextResponse.json(
        { error: 'User does not have an on-chain address. Please connect your wallet.' },
        { status: 400 }
      );
    }

    // Load wallet mnemonic
    let mnemonic: string;
    try {
      mnemonic = await loadStoredWalletMnemonic(walletPassword);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Invalid wallet password' },
        { status: 401 }
      );
    }

    // Create keyring pair
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const pair = keyring.addFromUri(mnemonic);

    // Verify address matches
    if (pair.address !== fromAddress) {
      return NextResponse.json(
        { error: 'Wallet address does not match user profile' },
        { status: 400 }
      );
    }

    // Convert amount to smallest units (2 decimals, 100 Sparks = 1 CGT)
    const CGT_UNIT = 100;
    const amountInSmallestUnits = Math.floor(amountNum * CGT_UNIT).toString();

    // Check balance
    const balanceStr = await blockchainClient.getCGTBalance(fromAddress);
    const balanceNum = BigInt(balanceStr);
    const amountBigInt = BigInt(amountInSmallestUnits);
    
    if (amountBigInt > balanceNum) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Determine recipient address (default to game pool if not specified)
    const recipientAddress = toAddress || fromAddress; // TODO: Use game pool address

    // Execute transaction
    const txHash = await blockchainClient.transferCGT(
      pair,
      recipientAddress,
      amountInSmallestUnits
    );

    // Log transaction
    console.log(`[Spend] ${qorId} spent ${amountNum} CGT - ${reason} (${txHash})`);

    return NextResponse.json({
      success: true,
      txHash,
      amount: amountNum,
      reason,
      fromAddress,
      toAddress: recipientAddress,
    });
  } catch (error: any) {
    console.error('Spend API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process CGT spending' },
      { status: 500 }
    );
  }
}
