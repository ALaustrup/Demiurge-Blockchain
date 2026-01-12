// Copyright 2026 Demiurge Blockchain Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Components/Widget.h"
#include "Blueprint/UserWidget.h"
#include "QorGlassPanel.generated.h"

/**
 * Qor Glass Panel - Cyber Glass Design System Base Widget
 * 
 * This is the foundational UI component for all Demiurge interfaces.
 * Implements the "Cyber Glass" design language with:
 * - Frosted glass blur effect
 * - Gradient overlays
 * - Animated edge highlighting
 * - Depth-aware layering
 * 
 * All Demiurge UI panels inherit from this class.
 */
UCLASS(Blueprintable, BlueprintType)
class QORUI_API UQorGlassPanel : public UUserWidget
{
	GENERATED_BODY()

public:
	UQorGlassPanel(const FObjectInitializer& ObjectInitializer);

	virtual void NativeConstruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

	// ═══════════════════════════════════════════════════════════════════════════
	// GLASS EFFECTS - Blueprint Callable
	// ═══════════════════════════════════════════════════════════════════════════

	/** Set the blur strength for the frosted glass effect (0.0 - 1.0) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetBlurStrength(float Strength);

	/** Get the current blur strength */
	UFUNCTION(BlueprintPure, Category = "Qor|Glass")
	float GetBlurStrength() const { return BlurStrength; }

	/** Set the glass tint color */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetGlassColor(FLinearColor Color);

	/** Get the current glass color */
	UFUNCTION(BlueprintPure, Category = "Qor|Glass")
	FLinearColor GetGlassColor() const { return GlassColor; }

	/** Set the glass opacity (0.0 - 1.0) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetGlassOpacity(float Opacity);

	/** Enable/disable the animated edge glow */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetEdgeGlowEnabled(bool bEnabled);

	/** Set the edge glow color (typically cyan/purple gradient) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetEdgeGlowColor(FLinearColor Color);

	/** Set the edge glow intensity (0.0 - 2.0) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetEdgeGlowIntensity(float Intensity);

	// ═══════════════════════════════════════════════════════════════════════════
	// ANIMATION - Blueprint Callable
	// ═══════════════════════════════════════════════════════════════════════════

	/** Animate the panel appearing (slide + fade) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Animation")
	void AnimateIn(float Duration = 0.3f);

	/** Animate the panel disappearing */
	UFUNCTION(BlueprintCallable, Category = "Qor|Animation")
	void AnimateOut(float Duration = 0.2f);

	/** Pulse the edge glow (for notifications/highlights) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Animation")
	void PulseEdgeGlow(float Duration = 0.5f, float Intensity = 1.5f);

	// ═══════════════════════════════════════════════════════════════════════════
	// PRESETS - Blueprint Callable
	// ═══════════════════════════════════════════════════════════════════════════

	/** Apply default Demiurge glass style (dark, cyan accents) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyDefaultStyle();

	/** Apply "Pleroma" style (light, golden accents) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyPleromaStyle();

	/** Apply "Archon" style (dark, purple accents) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyArchonStyle();

	/** Apply "Warning" style (red tint, urgent) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyWarningStyle();

protected:
	// ═══════════════════════════════════════════════════════════════════════════
	// PROPERTIES - Editable in Blueprint
	// ═══════════════════════════════════════════════════════════════════════════

	/** Blur strength for frosted glass (0.0 = clear, 1.0 = fully frosted) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Qor|Glass", meta = (ClampMin = "0.0", ClampMax = "1.0"))
	float BlurStrength;

	/** Base glass tint color */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Qor|Glass")
	FLinearColor GlassColor;

	/** Glass opacity (0.0 = transparent, 1.0 = opaque) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Qor|Glass", meta = (ClampMin = "0.0", ClampMax = "1.0"))
	float GlassOpacity;

	/** Enable animated edge glow */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Qor|Glass")
	bool bEdgeGlowEnabled;

	/** Edge glow color (typically cyan/purple) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Qor|Glass")
	FLinearColor EdgeGlowColor;

	/** Edge glow intensity multiplier */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Qor|Glass", meta = (ClampMin = "0.0", ClampMax = "2.0"))
	float EdgeGlowIntensity;

	/** Material instance for glass effect */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Qor|Glass")
	UMaterialInterface* GlassMaterial;

	/** Current animation time (for tick updates) */
	float AnimationTime;

	/** Is panel currently animating? */
	bool bIsAnimating;

	/** Animation direction (in = true, out = false) */
	bool bAnimatingIn;

	/** Animation duration */
	float AnimationDuration;

	/** Apply material parameters */
	void UpdateMaterialParameters();
};
