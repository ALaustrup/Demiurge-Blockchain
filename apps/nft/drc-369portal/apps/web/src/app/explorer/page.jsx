"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DrcSidebar from "../../components/DrcSidebar";
import DrcHeader from "../../components/DrcHeader";
import { Search, Layers, TrendingUp, Zap, Shield } from "lucide-react";

export default function Explorer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["assets", searchTerm, filterType],
    queryFn: async () => {
      let url = "/api/assets?";
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (filterType === "parent") url += "hasParent=false";
      if (filterType === "nested") url += "hasParent=true";
      if (filterType === "delegated") url += "isDelegated=true";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const assets = assetsData?.assets || [];

  const getModuleBadges = (asset) => {
    const badges = [];

    if (asset.resources && asset.resources.length > 1) {
      badges.push({ label: "Multi-Resource", icon: Layers, color: "purple" });
    }

    if (asset.children_count > 0) {
      badges.push({
        label: `${asset.children_count} Nested`,
        icon: TrendingUp,
        color: "blue",
      });
    }

    if (asset.delegated_user) {
      badges.push({ label: "Delegated", icon: Shield, color: "orange" });
    }

    if (asset.level > 1) {
      badges.push({ label: `Lv ${asset.level}`, icon: Zap, color: "green" });
    }

    return badges;
  };

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <DrcSidebar
          onClose={() => setSidebarOpen(false)}
          activePage="Explorer"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Asset Explorer"
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search assets by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] font-inter text-black dark:text-white placeholder-[#6E6E6E] dark:placeholder-[#888888] focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                />
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6E6E6E] dark:text-[#888888]"
                />
              </div>

              <div className="flex gap-2">
                {["all", "parent", "nested", "delegated"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 font-inter capitalize ${
                      filterType === type
                        ? "bg-purple-600 text-white"
                        : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 animate-pulse"
                >
                  <div className="w-full h-48 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg mb-4"></div>
                  <div className="h-6 bg-[#F9FAFB] dark:bg-[#262626] rounded mb-2"></div>
                  <div className="h-4 bg-[#F9FAFB] dark:bg-[#262626] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-20">
              <Layers
                size={64}
                className="mx-auto text-black/20 dark:text-white/20 mb-4"
              />
              <p className="text-xl text-black/60 dark:text-white/60 font-inter">
                No assets found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {assets.map((asset) => {
                const primaryResource = asset.resources?.[0];
                const imageUrl =
                  primaryResource?.uri || "https://via.placeholder.com/400";
                const badges = getModuleBadges(asset);

                return (
                  <button
                    key={asset.uuid}
                    onClick={() => {
                      if (typeof window !== "undefined")
                        window.location.href = `/asset/${asset.uuid}`;
                    }}
                    className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] text-left"
                  >
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt={asset.name}
                        className="w-full h-48 object-cover"
                      />
                      {asset.durability < 50 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded font-jetbrains">
                          {asset.durability}% HP
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-black dark:text-white mb-1 font-bricolage truncate">
                        {asset.name}
                      </h3>
                      <p className="text-sm text-black/60 dark:text-white/60 mb-3 font-inter line-clamp-2">
                        {asset.description || "No description"}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {badges.map((badge, index) => {
                          const Icon = badge.icon;
                          const colorClasses = {
                            purple:
                              "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
                            blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                            orange:
                              "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                            green:
                              "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                          };

                          return (
                            <span
                              key={index}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${colorClasses[badge.color]} font-inter`}
                            >
                              <Icon size={12} />
                              {badge.label}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-black/60 dark:text-white/60 font-inter">
                          Level {asset.level}
                        </span>
                        <span className="font-semibold text-black dark:text-white font-sora">
                          {asset.experience_points} XP
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
