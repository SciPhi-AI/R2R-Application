import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';

interface GenerationConfig {
  // RAG Configuration
  temperature?: number;
  setTemperature?: (value: number) => void;
  top_p?: number;
  setTopP?: (value: number) => void;
  top_k?: number;
  setTop_k?: (value: number) => void;
  max_tokens_to_sample?: number;
  setMax_tokens_to_sample?: (value: number) => void;
  model?: string;
  setModel?: (value: string) => void;
  stream?: boolean;
  setStream?: (value: boolean) => void;
  functions?: Array<Record<string, any>> | null;
  setFunctions?: (value: Array<Record<string, any>> | null) => void;
  skip_special_tokens?: boolean;
  setSkipSpecialTokens?: (value: boolean) => void;
  stop_token?: string | null;
  setStopToken?: (value: string | null) => void;
  num_beams?: number;
  setNumBeams?: (value: number) => void;
  do_sample?: boolean;
  setDoSample?: (value: boolean) => void;
  generate_with_chat?: boolean;
  setGenerateWithChat?: (value: boolean) => void;
  add_generation_kwargs?: Record<string, any>;
  setAddGenerationKwargs?: (value: Record<string, any>) => void;
  api_base?: string | null;
  setApiBase?: (value: string | null) => void;

  // Knowledge Graph Configuration
  kg_temperature?: number;
  setKgTemperature?: (value: number) => void;
  kg_top_p?: number;
  setKgTopP?: (value: number) => void;
  kg_top_k?: number;
  setKgTop_k?: (value: number) => void;
  kg_max_tokens_to_sample?: number;
  setKgMax_tokens_to_sample?: (value: number) => void;
}

const ConfigurationSheet: React.FC<GenerationConfig> = ({
  temperature,
  setTemperature,
  top_p,
  setTopP,
  top_k,
  setTop_k,
  max_tokens_to_sample,
  setMax_tokens_to_sample,
  model,
  setModel,
  stream,
  setStream,
  functions,
  setFunctions,
  skip_special_tokens,
  setSkipSpecialTokens,
  stop_token,
  setStopToken,
  num_beams,
  setNumBeams,
  do_sample,
  setDoSample,
  generate_with_chat,
  setGenerateWithChat,
  add_generation_kwargs,
  setAddGenerationKwargs,
  api_base,
  setApiBase,
  kg_temperature,
  setKgTemperature,
  kg_top_p,
  setKgTopP,
  kg_top_k,
  setKgTop_k,
  kg_max_tokens_to_sample,
  setKgMax_tokens_to_sample,
}) => {
  return (
    <Sheet>
      <SheetTrigger>
        <AdjustmentsHorizontalIcon className="h-8 w-8 mb-3" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>RAG Generation Config</SheetTitle>
          <SheetDescription>
            Set the parameters for your model.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {temperature !== undefined && setTemperature && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="temperature" className="text-right">
                temperature
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[temperature]}
                  max={2}
                  step={0.01}
                  className="w-40"
                  onValueChange={(value) => setTemperature(value[0])}
                />
                <span className="text-sm">{temperature.toFixed(2)}</span>
              </div>
            </div>
          )}
          {top_p !== undefined && setTopP && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="top_p" className="text-right">
                top_p
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[top_p]}
                  max={1}
                  step={0.01}
                  className="w-40"
                  onValueChange={(value) => setTopP(value[0])}
                />
                <span className="text-sm">{top_p.toFixed(2)}</span>
              </div>
            </div>
          )}
          {top_k !== undefined && setTop_k && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="top_k" className="text-right">
                top_k
              </Label>
              <Input
                id="top_k"
                value={top_k}
                className="col-span-1 w-24"
                onChange={(e) => setTop_k(Number(e.target.value))}
              />
            </div>
          )}
          {max_tokens_to_sample !== undefined && setMax_tokens_to_sample && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="max_tokens_to_sample" className="text-right">
                max_tokens_to_sample
              </Label>
              <Input
                id="max_tokens_to_sample"
                value={max_tokens_to_sample}
                className="col-span-1 w-24"
                onChange={(e) =>
                  setMax_tokens_to_sample(Number(e.target.value))
                }
              />
            </div>
          )}
        </div>
        <SheetHeader>
          <SheetTitle>KG Agent Generation Config</SheetTitle>
          <SheetDescription>
            Parameters for the knowledge graph don't have to match the
            generation model.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {kg_temperature !== undefined && setKgTemperature && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="kg_temperature" className="text-right">
                temperature
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[kg_temperature]}
                  max={2}
                  step={0.01}
                  className="w-40"
                  onValueChange={(value) => setKgTemperature(value[0])}
                />
                <span className="text-sm">{kg_temperature.toFixed(2)}</span>
              </div>
            </div>
          )}
          {kg_top_p !== undefined && setKgTopP && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="top_p" className="text-right">
                top_p
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[kg_top_p]}
                  max={1}
                  step={0.01}
                  className="w-40"
                  onValueChange={(value) => setKgTopP(value[0])}
                />
                <span className="text-sm">{kg_top_p.toFixed(2)}</span>
              </div>
            </div>
          )}
          {kg_top_k !== undefined && setKgTop_k && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="kg_top_k" className="text-right">
                top_k
              </Label>
              <Input
                id="kg_top_k"
                value={kg_top_k}
                className="col-span-1 w-24"
                onChange={(e) => setKgTop_k(Number(e.target.value))}
              />
            </div>
          )}
          {kg_max_tokens_to_sample !== undefined &&
            setKgMax_tokens_to_sample && (
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="kg_max_tokens_to_sample" className="text-right">
                  max_tokens_to_sample
                </Label>
                <Input
                  id="kg_max_tokens_to_sample"
                  value={kg_max_tokens_to_sample}
                  className="col-span-1 w-24"
                  onChange={(e) =>
                    setKgMax_tokens_to_sample(Number(e.target.value))
                  }
                />
              </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConfigurationSheet;
