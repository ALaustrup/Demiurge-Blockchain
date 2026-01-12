// Copyright 2026 Demiurge Blockchain Project. All Rights Reserved.

using UnrealBuildTool;

public class DemiurgeClient : ModuleRules
{
	public DemiurgeClient(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] 
		{ 
			"Core", 
			"CoreUObject", 
			"Engine", 
			"InputCore",
			"UMG",
			"Slate",
			"SlateCore"
		});

		PrivateDependencyModuleNames.AddRange(new string[] 
		{ 
			"DemiurgeWeb3",
			"QorUI"
		});
	}
}
