import { type ClassValue, clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { v5 as uuidv5 } from 'uuid';

export const setColor = (keyword: string): string => {
  switch (keyword) {
    case 'success':
      return 'bg-emerald-400';
    case 'failure':
      return 'bg-red-400';
    case 'Search':
      return 'bg-sky-500';
    case 'Embedding':
      return 'bg-orange-600';
    case 'RAG':
      return 'bg-indigo-400';
    case 'WARNING':
      return 'bg-amber-400';
    default:
      return 'bg-gray-400';
  }
};

export const setTextColor = (keyword: string): string => {
  switch (keyword) {
    case 'WARNING':
      return 'text-amber-800';
    default:
      return 'text-gray-800';
  }
};

export const isValidUrl = (value: string) => {
  const urlPattern = new RegExp(
    '^https?://' + // must start with http:// or https://
      '([a-zA-Z0-9.-]+|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})' + // hostname or IP
      '(:\\d+)?' + // optional port
      '$' // end of string
  );
  return urlPattern.test(value);
};

export const capitalizeFirstLetter = (string: string) => {
  if (!string) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
};

type ValidateFunction = (value: string) => {
  isValid: boolean;
  message: string;
};
export const useValidation = (
  value: string,
  validations: ValidateFunction[]
) => {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    for (const validate of validations) {
      const result = validate(value);
      if (!result.isValid) {
        setIsValid(false);
        setErrorMessage(result.message);
        return;
      }
    }
    setIsValid(true);
    setErrorMessage('');
  }, [value, validations]);

  const inputStyles = isValid ? 'border-green-700' : 'border-red-600';

  return { isValid, inputStyles, errorMessage };
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateIdFromLabel(label: string): string {
  const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID for DNS namespace
  return uuidv5(label, NAMESPACE_DNS);
}
