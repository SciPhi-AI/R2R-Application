import { SlidersHorizontal } from 'lucide-react';
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
import { GenerationConfig } from '@/types';

const ConfigurationSheet: React.FC<GenerationConfig> = ({
  temperature,
  setTemperature,
  topP,
  setTopP,
  top_k,
  setTop_k,
  maxTokensToSample,
  setmaxTokensToSample,
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
  kg_topP,
  setKgTopP,
  kg_top_k,
  setKgTop_k,
  kg_maxTokensToSample,
  setKgmaxTokensToSample,
}) => {
  return (
    <Sheet>
      <SheetTrigger>
        <SlidersHorizontal className="h-8 w-8 mb-3" />
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
          {topP !== undefined && setTopP && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="topP" className="text-right">
                topP
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[topP]}
                  max={1}
                  step={0.01}
                  className="w-40"
                  onValueChange={(value) => setTopP(value[0])}
                />
                <span className="text-sm">{topP.toFixed(2)}</span>
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
          {maxTokensToSample !== undefined && setmaxTokensToSample && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="maxTokensToSample" className="text-right">
                maxTokensToSample
              </Label>
              <Input
                id="maxTokensToSample"
                value={maxTokensToSample}
                className="col-span-1 w-24"
                onChange={(e) => setmaxTokensToSample(Number(e.target.value))}
              />
            </div>
          )}
        </div>
        <SheetHeader>
          <SheetTitle>KG Agent Generation Config</SheetTitle>
          <SheetDescription>
            Parameters for the knowledge graph don&apos;t have to match the
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
          {kg_topP !== undefined && setKgTopP && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="topP" className="text-right">
                topP
              </Label>
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[kg_topP]}
                  max={1}
                  step={0.01}
                  className="w-40"
                  onValueChange={(value) => setKgTopP(value[0])}
                />
                <span className="text-sm">{kg_topP.toFixed(2)}</span>
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
          {kg_maxTokensToSample !== undefined && setKgmaxTokensToSample && (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="kg_maxTokensToSample" className="text-right">
                maxTokensToSample
              </Label>
              <Input
                id="kg_maxTokensToSample"
                value={kg_maxTokensToSample}
                className="col-span-1 w-24"
                onChange={(e) => setKgmaxTokensToSample(Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConfigurationSheet;
