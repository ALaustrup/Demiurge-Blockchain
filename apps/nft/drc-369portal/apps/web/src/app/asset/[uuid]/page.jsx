"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DrcSidebar from "../../../components/DrcSidebar";
import DrcHeader from "../../../components/DrcHeader";
import {
  ArrowLeft,
  Layers,
  Package,
  Shield,
  Zap,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  Box,
  Music,
  Eye,
} from "lucide-react";

export default function AssetDetail({ params }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddResource, setShowAddResource] = useState(false);
  const [showDelegate, setShowDelegate] = useState(false);
  const [showAddXP, setShowAddXP] = useState(false);

  const queryClient = useQueryClient();

  const { data: assetData, isLoading } = useQuery({
    queryKey: ["asset", params.uuid],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${params.uuid}`);
      if (!response.ok) throw new Error("Failed to fetch asset");
      return response.json();
    },
  });

  const { data: childrenData } = useQuery({
    queryKey: ["children", params.uuid],
    queryFn: async () => {
      const response = await fetch(`/api/assets?hasParent=true`);
      if (!response.ok) throw new Error("Failed to fetch children");
      const data = await response.json();
      return data.assets.filter((a) => a.parent_uuid === params.uuid);
    },
    enabled: !!assetData?.asset,
  });

  const asset = assetData?.asset;
  const children = childrenData || [];

  const addXPMutation = useMutation({
    mutationFn: async (xp) => {
      const response = await fetch(`/api/assets/${params.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience_points: (asset.experience_points || 0) + parseInt(xp),
        }),
      });
      if (!response.ok) throw new Error("Failed to add XP");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", params.uuid] });
      setShowAddXP(false);
    },
  });

  const delegateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/assets/${params.uuid}/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to delegate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", params.uuid] });
      setShowDelegate(false);
    },
  });

  const addResourceMutation = useMutation({
    mutationFn: async (resource) => {
      const response = await fetch(`/api/assets/${params.uuid}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resource),
      });
      if (!response.ok) throw new Error("Failed to add resource");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", params.uuid] });
      setShowAddResource(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A] items-center justify-center">
        <div className="text-center">
          <Sparkles
            size={48}
            className="mx-auto text-purple-500 animate-pulse mb-4"
          />
          <p className="text-black/60 dark:text-white/60 font-inter">
            Loading asset...
          </p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A] items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-black/60 dark:text-white/60 font-inter">
            Asset not found
          </p>
        </div>
      </div>
    );
  }

  const primaryResource = asset.resources?.[0];
  const imageUrl = primaryResource?.uri || "https://via.placeholder.com/600";

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    {
      id: "resources",
      label: "Resources",
      icon: Layers,
      count: asset.resources?.length || 0,
    },
    { id: "nesting", label: "Nesting", icon: Package, count: children.length },
    { id: "delegation", label: "Delegation", icon: Shield },
    { id: "state", label: "State", icon: Zap },
  ];

  const calculateLevel = (xp) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
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
          title="Asset Details"
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <button
            onClick={() => {
              if (typeof window !== "undefined")
                window.location.href = "/explorer";
            }}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline mb-6 font-inter"
          >
            <ArrowLeft size={20} />
            Back to Explorer
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Asset Image & Info */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden">
                <img
                  src={imageUrl}
                  alt={asset.name}
                  className="w-full h-80 object-cover"
                />

                <div className="p-6">
                  <h1 className="text-2xl font-bold text-black dark:text-white mb-2 font-sora">
                    {asset.name}
                  </h1>
                  <p className="text-sm text-black/60 dark:text-white/60 mb-4 font-inter">
                    {asset.description || "No description"}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-[#E6E6E6] dark:border-[#333333]">
                      <span className="text-sm text-black/60 dark:text-white/60 font-inter">
                        Owner
                      </span>
                      <span className="text-sm font-mono font-semibold text-black dark:text-white">
                        {asset.owner_account.slice(0, 6)}...
                        {asset.owner_account.slice(-4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-[#E6E6E6] dark:border-[#333333]">
                      <span className="text-sm text-black/60 dark:text-white/60 font-inter">
                        Creator
                      </span>
                      <span className="text-sm font-mono font-semibold text-black dark:text-white">
                        {asset.creator_account.slice(0, 6)}...
                        {asset.creator_account.slice(-4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-black/60 dark:text-white/60 font-inter">
                        UUID
                      </span>
                      <span className="text-xs font-mono text-black dark:text-white">
                        {asset.uuid.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-inter mb-1">
                        Level
                      </p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 font-sora">
                        {asset.level}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-xs text-green-600 dark:text-green-400 font-inter mb-1">
                        Durability
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300 font-sora">
                        {asset.durability}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs & Content */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333]">
                {/* Tab Navigation */}
                <div className="border-b border-[#E6E6E6] dark:border-[#333333] p-4 overflow-x-auto">
                  <div className="flex gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 whitespace-nowrap ${
                            activeTab === tab.id
                              ? "bg-purple-600 text-white"
                              : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/30"
                          }`}
                        >
                          <Icon size={16} />
                          {tab.label}
                          {tab.count !== undefined && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                activeTab === tab.id
                                  ? "bg-white/20"
                                  : "bg-black/10 dark:bg-white/10"
                              }`}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
                          DRC-369 Modules Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Layers
                                size={20}
                                className="text-purple-600 dark:text-purple-400"
                              />
                              <h4 className="font-semibold text-black dark:text-white font-inter">
                                Multi-Resource
                              </h4>
                            </div>
                            <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                              {asset.resources?.length || 0} resources with
                              context-aware rendering
                            </p>
                          </div>

                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Package
                                size={20}
                                className="text-blue-600 dark:text-blue-400"
                              />
                              <h4 className="font-semibold text-black dark:text-white font-inter">
                                Nesting
                              </h4>
                            </div>
                            <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                              {children.length} nested children,{" "}
                              {asset.equipment_slots?.length || 0} slots
                            </p>
                          </div>

                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield
                                size={20}
                                className="text-orange-600 dark:text-orange-400"
                              />
                              <h4 className="font-semibold text-black dark:text-white font-inter">
                                Delegation
                              </h4>
                            </div>
                            <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                              {asset.delegated_user
                                ? "Currently delegated"
                                : "Not delegated"}
                            </p>
                          </div>

                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap
                                size={20}
                                className="text-green-600 dark:text-green-400"
                              />
                              <h4 className="font-semibold text-black dark:text-white font-inter">
                                State
                              </h4>
                            </div>
                            <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                              {asset.experience_points} XP, {asset.kill_count}{" "}
                              kills
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
                          Stats
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-inter text-black/60 dark:text-white/60">
                                Experience
                              </span>
                              <span className="text-sm font-semibold font-sora text-black dark:text-white">
                                {asset.experience_points} XP
                              </span>
                            </div>
                            <div className="h-2 bg-[#F9FAFB] dark:bg-[#262626] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                style={{
                                  width: `${Math.min((asset.experience_points % 1000) / 10, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-inter text-black/60 dark:text-white/60">
                                Durability
                              </span>
                              <span className="text-sm font-semibold font-sora text-black dark:text-white">
                                {asset.durability}%
                              </span>
                            </div>
                            <div className="h-2 bg-[#F9FAFB] dark:bg-[#262626] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  asset.durability > 66
                                    ? "bg-green-500"
                                    : asset.durability > 33
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${asset.durability}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "resources" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-black dark:text-white font-sora">
                          Multi-Resource Polymorphism
                        </h3>
                        <button
                          onClick={() => setShowAddResource(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-150 font-inter"
                        >
                          <Plus size={16} />
                          Add Resource
                        </button>
                      </div>

                      {asset.resources && asset.resources.length > 0 ? (
                        <div className="space-y-3">
                          {asset.resources.map((resource, idx) => {
                            const iconMap = {
                              Image: ImageIcon,
                              "3D_Model": Box,
                              VR_Model: Box,
                              Sound: Music,
                            };
                            const Icon =
                              iconMap[resource.resource_type] || Layers;

                            return (
                              <div
                                key={idx}
                                className="p-4 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg border border-[#E6E6E6] dark:border-[#333333]"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Icon
                                        size={20}
                                        className="text-purple-600 dark:text-purple-400"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-black dark:text-white font-inter mb-1">
                                        {resource.resource_type}
                                      </h4>
                                      <p className="text-xs text-black/60 dark:text-white/60 font-mono truncate mb-2">
                                        {resource.uri}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold font-inter">
                                          Priority: {resource.priority}
                                        </span>
                                        {resource.context_tags &&
                                          resource.context_tags.map(
                                            (tag, i) => (
                                              <span
                                                key={i}
                                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold font-inter"
                                              >
                                                {tag}
                                              </span>
                                            ),
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                  <button className="text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Layers
                            size={48}
                            className="mx-auto text-black/20 dark:text-white/20 mb-4"
                          />
                          <p className="text-black/60 dark:text-white/60 font-inter">
                            No resources yet
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "nesting" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
                          Equipment Slots
                        </h3>
                        {asset.equipment_slots &&
                        asset.equipment_slots.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {asset.equipment_slots.map((slot, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg border border-[#E6E6E6] dark:border-[#333333]"
                              >
                                <h4 className="font-semibold text-black dark:text-white font-inter mb-2">
                                  {slot.slot_name}
                                </h4>
                                {slot.equipped_child_uuid ? (
                                  <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                                    Equipped:{" "}
                                    {slot.equipped_child_uuid.slice(0, 8)}...
                                  </p>
                                ) : (
                                  <p className="text-xs text-black/40 dark:text-white/40 font-inter">
                                    Empty
                                  </p>
                                )}
                                {slot.required_trait && (
                                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-inter">
                                    Requires: {slot.required_trait}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-black/60 dark:text-white/60 font-inter">
                            No equipment slots
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
                          Nested Children ({children.length})
                        </h3>
                        {children.length > 0 ? (
                          <div className="space-y-3">
                            {children.map((child) => (
                              <div
                                key={child.uuid}
                                className="p-4 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg border border-[#E6E6E6] dark:border-[#333333] hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-150"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-black dark:text-white font-inter">
                                      {child.name}
                                    </h4>
                                    <p className="text-xs text-black/60 dark:text-white/60 font-inter">
                                      Level {child.level} • {child.durability}%
                                      HP
                                    </p>
                                  </div>
                                  <ExternalLink
                                    size={16}
                                    className="text-purple-600 dark:text-purple-400"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Package
                              size={48}
                              className="mx-auto text-black/20 dark:text-white/20 mb-4"
                            />
                            <p className="text-black/60 dark:text-white/60 font-inter">
                              No nested children
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "delegation" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-black dark:text-white font-sora">
                          Delegation Management
                        </h3>
                        {!asset.delegated_user && (
                          <button
                            onClick={() => setShowDelegate(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all duration-150 font-inter"
                          >
                            <Shield size={16} />
                            Delegate
                          </button>
                        )}
                      </div>

                      {asset.delegated_user ? (
                        <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 mb-4">
                            <Shield
                              size={24}
                              className="text-orange-600 dark:text-orange-400"
                            />
                            <h4 className="text-lg font-semibold text-black dark:text-white font-inter">
                              Currently Delegated
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-black/60 dark:text-white/60 font-inter mb-1">
                                Delegated To
                              </p>
                              <p className="font-mono font-semibold text-black dark:text-white">
                                {asset.delegated_user}
                              </p>
                            </div>

                            {asset.delegation_expires_at_block && (
                              <div>
                                <p className="text-sm text-black/60 dark:text-white/60 font-inter mb-1">
                                  Expires At Block
                                </p>
                                <p className="font-mono font-semibold text-black dark:text-white">
                                  {asset.delegation_expires_at_block}
                                </p>
                              </div>
                            )}

                            <button className="w-full mt-4 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all duration-150 font-inter">
                              Revoke Delegation
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Shield
                            size={48}
                            className="mx-auto text-black/20 dark:text-white/20 mb-4"
                          />
                          <p className="text-black/60 dark:text-white/60 font-inter">
                            This asset is not currently delegated
                          </p>
                          <p className="text-sm text-black/40 dark:text-white/40 font-inter mt-2">
                            Delegate to allow another user to use this asset
                            while you retain ownership
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "state" && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-black dark:text-white font-sora">
                            Dynamic State
                          </h3>
                          <button
                            onClick={() => setShowAddXP(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all duration-150 font-inter"
                          >
                            <TrendingUp size={16} />
                            Add XP
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-inter mb-1">
                              XP
                            </p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 font-sora">
                              {asset.experience_points}
                            </p>
                          </div>

                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-inter mb-1">
                              Level
                            </p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-sora">
                              {asset.level}
                            </p>
                          </div>

                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-xs text-green-600 dark:text-green-400 font-inter mb-1">
                              Durability
                            </p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300 font-sora">
                              {asset.durability}%
                            </p>
                          </div>

                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-xs text-red-600 dark:text-red-400 font-inter mb-1">
                              Kills
                            </p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300 font-sora">
                              {asset.kill_count}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-black dark:text-white mb-4 font-sora">
                          Custom State
                        </h3>
                        {asset.custom_state && asset.custom_state.length > 0 ? (
                          <div className="space-y-2">
                            {asset.custom_state.map((state, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg border border-[#E6E6E6] dark:border-[#333333] flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-black dark:text-white font-inter">
                                    {state.state_key}
                                  </p>
                                  <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                                    {state.state_value}
                                  </p>
                                </div>
                                <Edit
                                  size={16}
                                  className="text-black/40 dark:text-white/40"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-black/60 dark:text-white/60 font-inter">
                            No custom state defined
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add XP Modal */}
      {showAddXP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-black dark:text-white mb-4 font-sora">
              Add Experience
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const xp = e.target.xp.value;
                addXPMutation.mutate(xp);
              }}
            >
              <input
                type="number"
                name="xp"
                placeholder="Amount of XP to add"
                className="w-full px-4 py-3 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter mb-4"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddXP(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-all duration-150 font-inter"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all duration-150 font-inter"
                >
                  Add XP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
