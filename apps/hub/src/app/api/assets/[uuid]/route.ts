import { NextRequest, NextResponse } from 'next/server';
import { blockchainClient } from '@/lib/blockchain';

/**
 * GET /api/assets/:uuid
 * Get full metadata for a specific DRC-369 asset
 * 
 * This endpoint queries the blockchain for asset metadata including:
 * - Core identity (name, creator, owner)
 * - Stateful properties (XP, durability, kill count)
 * - Metadata (resources, attributes, nesting info)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    
    if (!uuid) {
      return NextResponse.json(
        { error: 'Asset UUID required' },
        { status: 400 }
      );
    }

    // Ensure blockchain connection
    if (!blockchainClient.isConnected()) {
      await blockchainClient.connect();
    }

    // Query blockchain for asset metadata
    // This queries pallet-drc369.assets(uuid) storage
    const api = blockchainClient.getApi();
    if (!api) {
      throw new Error('Blockchain API not available');
    }

    try {
      // Query asset metadata from pallet-drc369
      const assetData = await api.query.drc369.assets(uuid);
      
      if (!assetData || assetData.isEmpty) {
        return NextResponse.json(
          { error: 'Asset not found' },
          { status: 404 }
        );
      }

      // Convert to human-readable format
      const asset = assetData.toHuman();
      
      // Format the response
      const formattedAsset = {
        uuid: uuid,
        name: asset?.name || 'Unknown',
        creatorQorId: asset?.creator_qor_id || '',
        creatorAccount: asset?.creator_account || '',
        owner: asset?.owner || '',
        assetType: 'virtual', // Default, can be determined from metadata
        xpLevel: asset?.level || 0,
        experiencePoints: asset?.experience_points || 0,
        durability: asset?.durability || 100,
        killCount: asset?.kill_count || 0,
        classId: asset?.class_id || 0,
        isSoulbound: asset?.is_soulbound || false,
        royaltyFeePercent: asset?.royalty_fee_percent || 0,
        mintedAt: asset?.minted_at || 0,
        metadata: {
          description: asset?.description || '',
          image: asset?.image || '',
          attributes: asset?.attributes || {},
          // Multi-Resource (Module 1)
          resources: asset?.resources || [],
          // Nesting (Module 2)
          parentUuid: asset?.parent_uuid || null,
          childrenUuids: asset?.children_uuids || [],
          equipmentSlots: asset?.equipment_slots || [],
          // Delegation (Module 3)
          delegation: asset?.delegation || null,
          // Custom state (Module 4)
          customState: asset?.custom_state || {}
        }
      };

      return NextResponse.json({ asset: formattedAsset });
    } catch (queryError: any) {
      console.error('Failed to query asset from blockchain:', queryError);
      
      // If query fails, return a helpful error
      return NextResponse.json(
        { 
          error: 'Failed to query asset from blockchain',
          details: queryError.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Failed to fetch asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch asset' },
      { status: 500 }
    );
  }
}
