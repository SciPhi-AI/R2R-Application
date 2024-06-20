import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

const temperature = 0.1;
const top_p = 1;
const top_k = 100;
const max_tokens_to_sample = 1024;

const RagConfig = () => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4 justify-between">
        <Label htmlFor="temperature" className="text-right">
          temperature
        </Label>
        <Slider
          defaultValue={[temperature]}
          max={2}
          step={0.01}
          className="col-span-3 w-full"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4 justify-between">
        <Label htmlFor="top_p" className="text-right">
          top_p
        </Label>
        <Slider
          defaultValue={[top_p]}
          max={1}
          step={0.01}
          className="col-span-3 w-full"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4 justify-between">
        <Label htmlFor="top_k" className="text-right">
          top_k
        </Label>
        <Input id="top_k" value={top_k} className="col-span-1 w-24" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4 justify-between">
        <Label htmlFor="max_tokens_to_sample" className="text-right">
          max_tokens_to_sample
        </Label>
        <Input
          id="max_tokens_to_sample"
          value={max_tokens_to_sample}
          className="col-span-1 w-24"
        />
      </div>
    </div>
  );
};

export default RagConfig;
