"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TabOption {
  id: string;
  label: string;
  wordCount: number;
}

interface TabSelectorProps {
  tabs: TabOption[];
  selectedTabIds: string[];
  onChange: (tabIds: string[]) => void;
  disabled?: boolean;
}

export function TabSelector({
  tabs,
  selectedTabIds,
  onChange,
  disabled
}: TabSelectorProps) {
  if (!tabs || tabs.length === 0) return null;

  const isAllSelected = selectedTabIds.length === 0 || selectedTabIds.length === tabs.length;

  const handleToggle = (tabId: string) => {
    if (isAllSelected) {
      onChange(tabs.map(t => t.id).filter(id => id !== tabId));
    } else {
      if (selectedTabIds.includes(tabId)) {
        const newIds = selectedTabIds.filter(id => id !== tabId);
        // If deselecting the last one, maybe we should prevent it or it will become [] (all)?
        // If it becomes [], it means all are selected. To prevent this, we could set it to ["NONE"] but let's just allow it or maybe if newIds.length === 0, it means none selected. But API treats [] as all!
        // To fix this: if newIds is empty, we must pass a dummy id like "NONE" so API returns 0 words.
        onChange(newIds.length === 0 ? ["_NONE_"] : newIds);
      } else {
        const newIds = [...selectedTabIds, tabId];
        // if all are now selected, we can just pass [] to save URL space
        onChange(newIds.length === tabs.length ? [] : newIds);
      }
    }
  };

  const handleSelectAll = () => onChange([]);
  const handleDeselectAll = () => onChange(["_NONE_"]);

  return (
    <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Chọn phần (Tabs):
        </span>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={handleSelectAll}
            disabled={disabled || isAllSelected}
          >
            Chọn tất cả
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={handleDeselectAll}
            disabled={disabled || (!isAllSelected && selectedTabIds.includes("_NONE_"))}
          >
            Bỏ chọn
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => {
          const isSelected = isAllSelected || selectedTabIds.includes(tab.id);
          
          return (
            <button
              key={tab.id}
              onClick={() => handleToggle(tab.id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all",
                isSelected 
                  ? "bg-brand/10 border-brand text-brand" 
                  : "bg-white border-[#f0e0e7] text-muted-foreground hover:border-brand/30 hover:bg-brand/5",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {tab.label}
              <span className="text-xs opacity-70 ml-1">({tab.wordCount})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
