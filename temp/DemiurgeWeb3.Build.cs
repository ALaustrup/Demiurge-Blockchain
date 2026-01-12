// Copyright 2026 Demiurge Blockchain Project. All Rights Reserved.

using UnrealBuildTool;

public class DemiurgeWeb3 : ModuleRules
{
	public DemiurgeWeb3(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] 
		{ 
			"Core", 
			"CoreUObject", 
			"Engine",
			"HTTP",
			"Json",
			"JsonUtilities"
		});
	}
}
