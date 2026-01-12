// Copyright 2026 Demiurge Blockchain Project. All Rights Reserved.

#include "DemiurgeNetworkManager.h"
// #include "WebSocketsModule.h"
// #include "IWebSocket.h"
#include "Json.h"
#include "JsonUtilities.h"

UDemiurgeNetworkManager::UDemiurgeNetworkManager()
{
	// Default to Monad server (Pleroma) for production
	// Change to ws://127.0.0.1:9944 for local development
	CurrentNodeURL = TEXT("ws://51.210.209.112:9944");
	bIsConnected = false;
}

void UDemiurgeNetworkManager::Connect(const FString& NodeURL)
{
	CurrentNodeURL = NodeURL;
	
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Connecting to node: %s"), *NodeURL);

	// In real implementation:
	// FWebSocketsModule& WebSocketsModule = FModuleManager::LoadModuleChecked<FWebSocketsModule>(TEXT("WebSockets"));
	// WebSocket = WebSocketsModule.CreateWebSocket(NodeURL, TEXT("wss"));
	// 
	// WebSocket->OnConnected().AddUObject(this, &UDemiurgeNetworkManager::OnWebSocketConnected);
	// WebSocket->OnConnectionError().AddLambda([this](const FString& Error) {
	//     UE_LOG(LogTemp, Error, TEXT("[Demiurge] Connection error: %s"), *Error);
	//     OnConnected.Broadcast(false);
	// });
	// WebSocket->OnClosed().AddUObject(this, &UDemiurgeNetworkManager::OnWebSocketClosed);
	// WebSocket->OnMessage().AddUObject(this, &UDemiurgeNetworkManager::OnWebSocketMessage);
	// 
	// WebSocket->Connect();

	// Stub: Simulate successful connection
	bIsConnected = true;
	OnConnected.Broadcast(true);
}

void UDemiurgeNetworkManager::Disconnect()
{
	// if (WebSocket.IsValid() && WebSocket->IsConnected())
	// {
	//     WebSocket->Close();
	// }
	
	bIsConnected = false;
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Disconnected from node"));
}

void UDemiurgeNetworkManager::GetCGTBalance(const FString& AccountAddress)
{
	if (!bIsConnected)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Not connected to node"));
		return;
	}

	// JSON-RPC request for balance query
	// {
	//   "jsonrpc": "2.0",
	//   "id": 1,
	//   "method": "state_call",
	//   "params": ["BalancesApi_free_balance", "<encoded_account>"]
	// }

	TArray<FString> Params;
	Params.Add(AccountAddress);
	SendRPCRequest(TEXT("cgt_balance"), Params);
}

void UDemiurgeNetworkManager::TransferCGT(const FString& ToAddress, int64 Amount)
{
	if (!bIsConnected)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Not connected to node"));
		return;
	}

	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Initiating CGT transfer: %lld sparks to %s"), Amount, *ToAddress);
	
	// Would sign and submit extrinsic
	TArray<FString> Params;
	Params.Add(ToAddress);
	Params.Add(FString::Printf(TEXT("%lld"), Amount));
	SendRPCRequest(TEXT("cgt_transfer"), Params);
}

void UDemiurgeNetworkManager::GetTotalBurned()
{
	TArray<FString> Params;
	SendRPCRequest(TEXT("cgt_totalBurned"), Params);
}

void UDemiurgeNetworkManager::RegisterQorID(const FString& Username)
{
	if (!bIsConnected)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Not connected to node"));
		return;
	}

	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Registering Qor ID: %s"), *Username);
	
	TArray<FString> Params;
	Params.Add(Username);
	SendRPCRequest(TEXT("qorId_register"), Params);
}

void UDemiurgeNetworkManager::LookupQorID(const FString& AccountAddress)
{
	TArray<FString> Params;
	Params.Add(AccountAddress);
	SendRPCRequest(TEXT("qorId_lookup"), Params);
}

void UDemiurgeNetworkManager::CheckUsernameAvailability(const FString& Username)
{
	TArray<FString> Params;
	Params.Add(Username);
	SendRPCRequest(TEXT("qorId_checkAvailability"), Params);
}

void UDemiurgeNetworkManager::GetInventory(const FString& AccountAddress)
{
	TArray<FString> Params;
	Params.Add(AccountAddress);
	SendRPCRequest(TEXT("drc369_getInventory"), Params);
}

void UDemiurgeNetworkManager::GetItem(const FString& ItemUUID)
{
	TArray<FString> Params;
	Params.Add(ItemUUID);
	SendRPCRequest(TEXT("drc369_getItem"), Params);
}

void UDemiurgeNetworkManager::InitiateTrade(const FString& ItemUUID, const FString& ReceiverAddress)
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Initiating trade: Item %s to %s"), *ItemUUID, *ReceiverAddress);
	
	TArray<FString> Params;
	Params.Add(ItemUUID);
	Params.Add(ReceiverAddress);
	SendRPCRequest(TEXT("drc369_initiateTrade"), Params);
}

void UDemiurgeNetworkManager::AcceptTrade(const FString& OfferID)
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Accepting trade: %s"), *OfferID);
	
	TArray<FString> Params;
	Params.Add(OfferID);
	SendRPCRequest(TEXT("drc369_acceptTrade"), Params);
}

void UDemiurgeNetworkManager::CancelTrade(const FString& OfferID)
{
	TArray<FString> Params;
	Params.Add(OfferID);
	SendRPCRequest(TEXT("drc369_cancelTrade"), Params);
}

void UDemiurgeNetworkManager::SendRPCRequest(const FString& Method, const TArray<FString>& Params)
{
	// Build JSON-RPC 2.0 request
	TSharedPtr<FJsonObject> RequestObject = MakeShareable(new FJsonObject);
	RequestObject->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
	RequestObject->SetNumberField(TEXT("id"), FMath::Rand());
	RequestObject->SetStringField(TEXT("method"), Method);
	
	TArray<TSharedPtr<FJsonValue>> ParamsArray;
	for (const FString& Param : Params)
	{
		ParamsArray.Add(MakeShareable(new FJsonValueString(Param)));
	}
	RequestObject->SetArrayField(TEXT("params"), ParamsArray);
	
	FString RequestString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestString);
	FJsonSerializer::Serialize(RequestObject.ToSharedRef(), Writer);
	
	UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Sending RPC: %s"), *RequestString);
	
	// if (WebSocket.IsValid() && WebSocket->IsConnected())
	// {
	//     WebSocket->Send(RequestString);
	// }
}

void UDemiurgeNetworkManager::ProcessMessage(const FString& Message)
{
	TSharedPtr<FJsonObject> JsonObject;
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);
	
	if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("[Demiurge] Failed to parse JSON response"));
		return;
	}
	
	// Check for error
	if (JsonObject->HasField(TEXT("error")))
	{
		FString ErrorMessage = JsonObject->GetObjectField(TEXT("error"))->GetStringField(TEXT("message"));
		UE_LOG(LogTemp, Error, TEXT("[Demiurge] RPC Error: %s"), *ErrorMessage);
		return;
	}
	
	// Process result based on method (would need to track request IDs)
	if (JsonObject->HasField(TEXT("result")))
	{
		TSharedPtr<FJsonValue> Result = JsonObject->TryGetField(TEXT("result"));
		UE_LOG(LogTemp, Log, TEXT("[Demiurge] Received result"));
		// Parse and dispatch to appropriate handler
	}
}

void UDemiurgeNetworkManager::OnWebSocketConnected()
{
	bIsConnected = true;
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] WebSocket connected to %s"), *CurrentNodeURL);
	OnConnected.Broadcast(true);
}

void UDemiurgeNetworkManager::OnWebSocketClosed(int32 StatusCode, const FString& Reason, bool bWasClean)
{
	bIsConnected = false;
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] WebSocket closed: %s (Code: %d)"), *Reason, StatusCode);
	OnDisconnected.Broadcast(Reason);
}

void UDemiurgeNetworkManager::OnWebSocketMessage(const FString& Message)
{
	UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Received: %s"), *Message);
	ProcessMessage(Message);
}
