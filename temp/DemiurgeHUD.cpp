// Copyright 2026 Demiurge Blockchain Project. All Rights Reserved.

#include "DemiurgeHUD.h"
#include "../DemiurgeWeb3/DemiurgeNetworkManager.h"
#include "../QorUI/QorGlassPanel.h"
#include "Blueprint/UserWidget.h"
#include "Engine/World.h"

ADemiurgeHUD::ADemiurgeHUD()
{
	CachedCGTBalance = 0;
	CachedUsername = TEXT("");
	CachedQorKey = TEXT("");
}

void ADemiurgeHUD::BeginPlay()
{
	Super::BeginPlay();

	// Get network manager singleton
	NetworkManager = UDemiurgeNetworkManager::Get();
	
	// Connect to local Substrate node
	if (NetworkManager)
	{
		NetworkManager->ConnectToNode(TEXT("ws://127.0.0.1:9944"));
	}

	UE_LOG(LogTemp, Display, TEXT("[Demiurge] HUD initialized"));
}

void ADemiurgeHUD::DrawHUD()
{
	Super::DrawHUD();

	// Custom HUD drawing logic here (if needed)
	// Most UI will be handled by UMG widgets
}

void ADemiurgeHUD::ShowQorIDPanel()
{
	HideAllPanels();

	if (QorIDPanelClass)
	{
		CurrentQorIDPanel = CreatePanelWidget(QorIDPanelClass);
		if (CurrentQorIDPanel)
		{
			CurrentQorIDPanel->AddToViewport();
			AnimatePanelEntrance(CurrentQorIDPanel);
		}
	}
}

void ADemiurgeHUD::ShowWalletPanel()
{
	HideAllPanels();

	if (WalletPanelClass)
	{
		CurrentWalletPanel = CreatePanelWidget(WalletPanelClass);
		if (CurrentWalletPanel)
		{
			CurrentWalletPanel->AddToViewport();
			AnimatePanelEntrance(CurrentWalletPanel);
		}
	}
}

void ADemiurgeHUD::ShowInventoryPanel()
{
	HideAllPanels();

	if (InventoryPanelClass)
	{
		CurrentInventoryPanel = CreatePanelWidget(InventoryPanelClass);
		if (CurrentInventoryPanel)
		{
			CurrentInventoryPanel->AddToViewport();
			AnimatePanelEntrance(CurrentInventoryPanel);
		}
	}
}

void ADemiurgeHUD::ShowSocialPanel()
{
	HideAllPanels();

	if (SocialPanelClass)
	{
		CurrentSocialPanel = CreatePanelWidget(SocialPanelClass);
		if (CurrentSocialPanel)
		{
			CurrentSocialPanel->AddToViewport();
			AnimatePanelEntrance(CurrentSocialPanel);
		}
	}
}

void ADemiurgeHUD::HideAllPanels()
{
	if (CurrentQorIDPanel)
	{
		CurrentQorIDPanel->RemoveFromParent();
		CurrentQorIDPanel = nullptr;
	}

	if (CurrentWalletPanel)
	{
		CurrentWalletPanel->RemoveFromParent();
		CurrentWalletPanel = nullptr;
	}

	if (CurrentInventoryPanel)
	{
		CurrentInventoryPanel->RemoveFromParent();
		CurrentInventoryPanel = nullptr;
	}

	if (CurrentSocialPanel)
	{
		CurrentSocialPanel->RemoveFromParent();
		CurrentSocialPanel = nullptr;
	}
}

void ADemiurgeHUD::UpdateCGTBalance(int64 NewBalance)
{
	CachedCGTBalance = NewBalance;
	
	// Update wallet panel if open
	if (CurrentWalletPanel)
	{
		// Call Blueprint event to update balance display
		// (Implement via Blueprint/Interface)
	}
}

void ADemiurgeHUD::UpdateQorID(const FString& Username, const FString& QorKey)
{
	CachedUsername = Username;
	CachedQorKey = QorKey;

	// Update Qor ID panel if open
	if (CurrentQorIDPanel)
	{
		// Call Blueprint event to update QorID display
		// (Implement via Blueprint/Interface)
	}
}

void ADemiurgeHUD::ShowNotification(const FString& Message, float Duration)
{
	if (NotificationClass)
	{
		UUserWidget* NotificationWidget = CreatePanelWidget(NotificationClass);
		if (NotificationWidget)
		{
			NotificationWidget->AddToViewport();
			
			// Auto-remove after duration
			GetWorld()->GetTimerManager().SetTimer(
				FTimerHandle(),
				[NotificationWidget]()
				{
					if (NotificationWidget)
					{
						NotificationWidget->RemoveFromParent();
					}
				},
				Duration,
				false
			);
		}
	}

	UE_LOG(LogTemp, Display, TEXT("[Demiurge] Notification: %s"), *Message);
}

void ADemiurgeHUD::SpawnItemInWorld(const FString& ItemUUID, FVector Location)
{
	if (!NetworkManager)
	{
		UE_LOG(LogTemp, Error, TEXT("[Demiurge] Network manager not initialized"));
		return;
	}

	// Query item metadata from chain
	FOnItemMetadataReceived OnMetadataReceived;
	OnMetadataReceived.BindLambda([this, Location](bool bSuccess, FDrc369Metadata Metadata)
	{
		if (bSuccess)
		{
			// Load UE5 asset and spawn in world
			// (Implement asset loading logic here)
			UE_LOG(LogTemp, Display, TEXT("[Demiurge] Spawning item: %s at location: %s"), *Metadata.Name, *Location.ToString());
		}
	});

	NetworkManager->QueryItemMetadata(ItemUUID, OnMetadataReceived);
}

void ADemiurgeHUD::HighlightItem(const FString& ItemUUID)
{
	// Implement item highlight logic
	UE_LOG(LogTemp, Display, TEXT("[Demiurge] Highlighting item: %s"), *ItemUUID);
}

void ADemiurgeHUD::ShowTradeOffer(const FString& OfferID, const FString& SenderUsername, const FString& ItemUUID)
{
	// Show trade offer notification
	FString Message = FString::Printf(TEXT("Trade offer from %s"), *SenderUsername);
	ShowNotification(Message, 10.0f);
}

void ADemiurgeHUD::AcceptTradeOffer(const FString& OfferID)
{
	if (!NetworkManager)
	{
		return;
	}

	FOnTradeAccepted OnTradeAccepted;
	OnTradeAccepted.BindLambda([this, OfferID](bool bSuccess)
	{
		if (bSuccess)
		{
			ShowNotification(TEXT("Trade accepted successfully"), 3.0f);
		}
		else
		{
			ShowNotification(TEXT("Trade acceptance failed"), 3.0f);
		}
	});

	NetworkManager->AcceptTrade(OfferID, OnTradeAccepted);
}

void ADemiurgeHUD::RejectTradeOffer(const FString& OfferID)
{
	ShowNotification(TEXT("Trade offer rejected"), 3.0f);
}

UUserWidget* ADemiurgeHUD::CreatePanelWidget(TSubclassOf<UUserWidget> WidgetClass)
{
	if (!WidgetClass)
	{
		return nullptr;
	}

	return CreateWidget<UUserWidget>(GetWorld(), WidgetClass);
}

void ADemiurgeHUD::AnimatePanelEntrance(UUserWidget* Panel)
{
	// Cast to QorGlassPanel and trigger entrance animation
	UQorGlassPanel* GlassPanel = Cast<UQorGlassPanel>(Panel);
	if (GlassPanel)
	{
		GlassPanel->PlayEntranceAnimation(0.8f);
	}
}
