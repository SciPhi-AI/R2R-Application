import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserContext } from '@/context/UserContext';

interface ModelSelectorProps {
  id?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ id }) => {
  const { selectedModel, setSelectedModel } = useUserContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customModelValue, setCustomModelValue] = useState('');

  const handleValueChange = (value: string) => {
    if (value === 'customModel') {
      setIsDialogOpen(true);
    } else {
      setSelectedModel(value);
    }
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomModelValue(e.target.value);
  };

  const handleCustomModelSubmit = () => {
    if (customModelValue.trim() !== '') {
      setSelectedModel(customModelValue.trim());
      setCustomModelValue('');
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <div id={id}>
        <Select value={selectedModel} onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Select a model</SelectItem>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="ollama/llama3">Llama 3</SelectItem>
            <SelectItem value="customModel">Add another model</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new model</DialogTitle>
              <DialogDescription>
                Enter the name of the model that you wish to use.
              </DialogDescription>
            </DialogHeader>
            <div>
              <input
                type="text"
                value={customModelValue}
                onChange={handleCustomModelChange}
                className="mt-2 block w-full py-2 px-3 border border-gray-300 bg-white rounded-2xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                placeholder="Enter custom model name"
              />
              <button
                onClick={handleCustomModelSubmit}
                className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ModelSelector;