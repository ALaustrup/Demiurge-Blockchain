/**
 * IPFS Upload API Route
 * Server-side uploads to protect API keys
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    // Try Pinata first
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (pinataApiKey && pinataSecretKey) {
      const pinataFormData = new FormData();
      pinataFormData.append('file', file);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey,
        },
        body: pinataFormData,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          cid: data.IpfsHash,
          uri: `ipfs://${data.IpfsHash}`,
          size: data.PinSize,
          gateway: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
        });
      }
    }

    // Try Infura as fallback
    const infuraProjectId = process.env.INFURA_IPFS_PROJECT_ID;
    const infuraProjectSecret = process.env.INFURA_IPFS_PROJECT_SECRET;

    if (infuraProjectId && infuraProjectSecret) {
      const infuraFormData = new FormData();
      infuraFormData.append('file', file);

      const auth = Buffer.from(`${infuraProjectId}:${infuraProjectSecret}`).toString('base64');

      const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: infuraFormData,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          cid: data.Hash,
          uri: `ipfs://${data.Hash}`,
          size: parseInt(data.Size),
          gateway: `https://ipfs.infura.io/ipfs/${data.Hash}`,
        });
      }
    }

    // Try web3.storage as last resort (free tier)
    const web3StorageToken = process.env.WEB3_STORAGE_TOKEN;

    if (web3StorageToken) {
      const response = await fetch('https://api.web3.storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${web3StorageToken}`,
          'X-NAME': file.name,
        },
        body: file,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          cid: data.cid,
          uri: `ipfs://${data.cid}`,
          gateway: `https://w3s.link/ipfs/${data.cid}`,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'IPFS upload not configured. Please set PINATA_API_KEY or INFURA_IPFS_PROJECT_ID.' },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// Also support pinning JSON metadata
export async function PUT(request: NextRequest) {
  try {
    const metadata = await request.json();

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      return NextResponse.json(
        { success: false, error: 'Pinata not configured' },
        { status: 503 }
      );
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: metadata.name || 'nft-metadata',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Pinata JSON upload failed');
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      cid: data.IpfsHash,
      uri: `ipfs://${data.IpfsHash}`,
      gateway: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    });
  } catch (error: any) {
    console.error('IPFS metadata upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Metadata upload failed' },
      { status: 500 }
    );
  }
}
