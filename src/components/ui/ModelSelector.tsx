import React, { useState, useEffect } from 'react';

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

const predefinedModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'ollama/llama3', label: 'Llama 3' },
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ id }) => {
  const { selectedModel, setSelectedModel } = useUserContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customModelValue, setCustomModelValue] = useState('');
  const [allModels, setAllModels] = useState(predefinedModels);

  useEffect(() => {
    console.log('Current selected model:', selectedModel);
    console.log('All available models:', allModels);
  }, [selectedModel, allModels]);

  const handleSelectChange = (value: string) => {
    console.log('Select value changed:', value);
    if (value === 'add_custom') {
      setIsDialogOpen(true);
    } else {
      setSelectedModel(value);
    }
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomModelValue(e.target.value);
  };

  const handleCustomModelSubmit = () => {
    const trimmedValue = customModelValue.trim();
    if (trimmedValue !== '') {
      console.log('Adding custom model:', trimmedValue);
      const newModel = { value: trimmedValue, label: trimmedValue };
      setAllModels((prevModels) => [...prevModels, newModel]);
      setSelectedModel(trimmedValue);
      setCustomModelValue('');
      setIsDialogOpen(false);
    } else {
      console.warn('Attempted to submit empty custom model name');
    }
  };

  return (
    <div id={id}>
      <Select value={selectedModel} onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {allModels.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
          <SelectItem value="add_custom">Add another model</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new model</DialogTitle>
            <DialogDescription>
              Enter the name of the model you wish to use.
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
  );
};

export default ModelSelector;
