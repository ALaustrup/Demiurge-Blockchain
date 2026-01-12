// Copyright 2026 Demiurge Blockchain Project. All Rights Reserved.

#include "QorGlassPanel.h"
#include "Components/Image.h"
#include "Materials/MaterialInstanceDynamic.h"

UQorGlassPanel::UQorGlassPanel(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
	// Default Demiurge glass style
	BlurStrength = 0.6f;
	GlassColor = FLinearColor(0.05f, 0.08f, 0.12f, 1.0f); // Dark blue-gray
	GlassOpacity = 0.85f;
	bEdgeGlowEnabled = true;
	EdgeGlowColor = FLinearColor(0.0f, 0.8f, 1.0f, 1.0f); // Cyan
	EdgeGlowIntensity = 1.0f;
	AnimationTime = 0.0f;
	bIsAnimating = false;
	bAnimatingIn = true;
	AnimationDuration = 0.3f;
}

void UQorGlassPanel::NativeConstruct()
{
	Super::NativeConstruct();
	ApplyDefaultStyle();
}

void UQorGlassPanel::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);

	if (bIsAnimating)
	{
		AnimationTime += InDeltaTime;
		float Alpha = FMath::Clamp(AnimationTime / AnimationDuration, 0.0f, 1.0f);
		
		if (bAnimatingIn)
		{
			// Ease out animation
			float EasedAlpha = 1.0f - FMath::Pow(1.0f - Alpha, 3.0f);
			SetRenderOpacity(EasedAlpha);
		}
		else
		{
			// Ease in animation
			float EasedAlpha = FMath::Pow(Alpha, 2.0f);
			SetRenderOpacity(1.0f - EasedAlpha);
		}

		if (Alpha >= 1.0f)
		{
			bIsAnimating = false;
			if (!bAnimatingIn)
			{
				SetVisibility(ESlateVisibility::Collapsed);
			}
		}
	}

	// Animate edge glow pulsing
	if (bEdgeGlowEnabled)
	{
		float PulseValue = (FMath::Sin(GetWorld()->GetTimeSeconds() * 2.0f) + 1.0f) * 0.5f;
		// Would update material parameter here
	}
}

void UQorGlassPanel::SetBlurStrength(float Strength)
{
	BlurStrength = FMath::Clamp(Strength, 0.0f, 1.0f);
	UpdateMaterialParameters();
}

void UQorGlassPanel::SetGlassColor(FLinearColor Color)
{
	GlassColor = Color;
	UpdateMaterialParameters();
}

void UQorGlassPanel::SetGlassOpacity(float Opacity)
{
	GlassOpacity = FMath::Clamp(Opacity, 0.0f, 1.0f);
	UpdateMaterialParameters();
}

void UQorGlassPanel::SetEdgeGlowEnabled(bool bEnabled)
{
	bEdgeGlowEnabled = bEnabled;
	UpdateMaterialParameters();
}

void UQorGlassPanel::SetEdgeGlowColor(FLinearColor Color)
{
	EdgeGlowColor = Color;
	UpdateMaterialParameters();
}

void UQorGlassPanel::SetEdgeGlowIntensity(float Intensity)
{
	EdgeGlowIntensity = FMath::Clamp(Intensity, 0.0f, 2.0f);
	UpdateMaterialParameters();
}

void UQorGlassPanel::AnimateIn(float Duration)
{
	AnimationTime = 0.0f;
	AnimationDuration = Duration;
	bAnimatingIn = true;
	bIsAnimating = true;
	SetVisibility(ESlateVisibility::Visible);
	SetRenderOpacity(0.0f);
}

void UQorGlassPanel::AnimateOut(float Duration)
{
	AnimationTime = 0.0f;
	AnimationDuration = Duration;
	bAnimatingIn = false;
	bIsAnimating = true;
}

void UQorGlassPanel::PulseEdgeGlow(float Duration, float Intensity)
{
	// Trigger a temporary intensity boost
	float OriginalIntensity = EdgeGlowIntensity;
	EdgeGlowIntensity = Intensity;
	UpdateMaterialParameters();
	
	// Would use a timer to restore in real implementation
}

void UQorGlassPanel::ApplyDefaultStyle()
{
	BlurStrength = 0.6f;
	GlassColor = FLinearColor(0.05f, 0.08f, 0.12f, 1.0f);
	GlassOpacity = 0.85f;
	EdgeGlowColor = FLinearColor(0.0f, 0.8f, 1.0f, 1.0f); // Cyan
	EdgeGlowIntensity = 1.0f;
	bEdgeGlowEnabled = true;
	UpdateMaterialParameters();
}

void UQorGlassPanel::ApplyPleromaStyle()
{
	BlurStrength = 0.4f;
	GlassColor = FLinearColor(0.15f, 0.12f, 0.08f, 1.0f);
	GlassOpacity = 0.75f;
	EdgeGlowColor = FLinearColor(1.0f, 0.85f, 0.3f, 1.0f); // Gold
	EdgeGlowIntensity = 1.2f;
	bEdgeGlowEnabled = true;
	UpdateMaterialParameters();
}

void UQorGlassPanel::ApplyArchonStyle()
{
	BlurStrength = 0.7f;
	GlassColor = FLinearColor(0.08f, 0.05f, 0.12f, 1.0f);
	GlassOpacity = 0.9f;
	EdgeGlowColor = FLinearColor(0.6f, 0.2f, 1.0f, 1.0f); // Purple
	EdgeGlowIntensity = 1.5f;
	bEdgeGlowEnabled = true;
	UpdateMaterialParameters();
}

void UQorGlassPanel::ApplyWarningStyle()
{
	BlurStrength = 0.5f;
	GlassColor = FLinearColor(0.15f, 0.05f, 0.05f, 1.0f);
	GlassOpacity = 0.9f;
	EdgeGlowColor = FLinearColor(1.0f, 0.2f, 0.1f, 1.0f); // Red
	EdgeGlowIntensity = 1.8f;
	bEdgeGlowEnabled = true;
	UpdateMaterialParameters();
}

void UQorGlassPanel::UpdateMaterialParameters()
{
	// In real implementation, this would update dynamic material instance:
	// if (GlassMaterial)
	// {
	//     UMaterialInstanceDynamic* DynamicMat = UMaterialInstanceDynamic::Create(GlassMaterial, this);
	//     DynamicMat->SetScalarParameterValue("BlurStrength", BlurStrength);
	//     DynamicMat->SetVectorParameterValue("GlassColor", GlassColor);
	//     DynamicMat->SetScalarParameterValue("Opacity", GlassOpacity);
	//     DynamicMat->SetVectorParameterValue("EdgeGlowColor", EdgeGlowColor);
	//     DynamicMat->SetScalarParameterValue("EdgeGlowIntensity", bEdgeGlowEnabled ? EdgeGlowIntensity : 0.0f);
	// }
}
