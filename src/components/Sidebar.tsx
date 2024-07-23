import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

import SingleSwitch from '@/components/ChatDemo/SingleSwitch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModelSelector from '@/components/ui/ModelSelector';
import { Slider } from '@/components/ui/slider';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  switches: any;
  handleSwitchChange: (id: string, checked: boolean) => void;
  searchLimit: number;
  setSearchLimit: (limit: number) => void;
  searchFilters: string;
  setSearchFilters: (filters: string) => void;
  selectedModel: string;
  top_k: number;
  setTop_k: (value: number) => void;
  max_tokens_to_sample: number;
  setMax_tokens_to_sample: (value: number) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  topP: number;
  setTopP: (value: number) => void;
  pipelineUrl: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  switches,
  handleSwitchChange,
  searchLimit,
  setSearchLimit,
  searchFilters,
  setSearchFilters,
  selectedModel,
  top_k,
  setTop_k,
  max_tokens_to_sample,
  setMax_tokens_to_sample,
  temperature,
  setTemperature,
  topP,
  setTopP,
  pipelineUrl,
}) => {
  return (
    <>
      <div
        className={`fixed left-0 top-0 z-50 h-full w-80 bg-zinc-800 transition-transform duration-300 ease-in-out overflow-hidden`}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="h-[var(--header-height)]" />
        <div className="p-4 overflow-y-auto h-[calc(100%-var(--header-height))]">
          <h2 className="text-xl font-bold text-blue-500 mb-4">
            Control Panel
          </h2>

          {/* Configuration Fields */}
          <div className="space-y-4 mb-4">
            <h3 className="text-lg font-semibold text-blue-400 mt-2">
              Search Settings
            </h3>

            {/* Switches */}
            <div className="space-y-2 mb-4">
              {Object.keys(switches).map((id) => (
                <SingleSwitch
                  key={id}
                  id={id}
                  initialChecked={switches[id].checked}
                  onChange={handleSwitchChange}
                  label={switches[id].label}
                  tooltipText={switches[id].tooltipText}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="searchLimit">Search Results Limit</Label>
              <Input
                id="searchLimit"
                value={searchLimit}
                onChange={(e) => setSearchLimit(Number(e.target.value))}
              />
            </div>

            {/* Search Filters Input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="searchFilters">Search Filters</Label>
              <Input
                id="searchFilters"
                type="text"
                value={searchFilters}
                onChange={(e) => setSearchFilters(e.target.value)}
              />
            </div>

            <h3 className="text-lg font-semibold text-blue-400 pt-4">
              RAG Generation Config
            </h3>
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="selectedModel">Selected Model</Label>
                <ModelSelector id={selectedModel} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="top_k">Top K</Label>
                <Input
                  id="top_k"
                  type="number"
                  value={top_k}
                  onChange={(e) => setTop_k(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="max_tokens_to_sample">
                  Max Tokens to Sample
                </Label>
                <Input
                  id="max_tokens_to_sample"
                  type="number"
                  value={max_tokens_to_sample}
                  onChange={(e) =>
                    setMax_tokens_to_sample(Number(e.target.value))
                  }
                />
              </div>

              <Label htmlFor="temperature">Temperature</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="temperature"
                  value={[temperature]}
                  max={2}
                  step={0.01}
                  className="w-60"
                  onValueChange={(value) => setTemperature(value[0])}
                />
                <span className="text-sm">{temperature.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="top_p">Top P</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="top_p"
                  value={[topP]}
                  max={1}
                  step={0.01}
                  className="w-60"
                  onValueChange={(value) => setTopP(value[0])}
                />
                <span className="text-sm">{topP.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        className={`fixed left-0 top-1/2 z-50 bg-zinc-800 p-2 rounded-r-md transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-80' : 'translate-x-0'
        }`}
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronLeftIcon className="h-6 w-6 text-white" />
        ) : (
          <ChevronRightIcon className="h-6 w-6 text-white" />
        )}
      </button>
    </>
  );
};

export default Sidebar;
