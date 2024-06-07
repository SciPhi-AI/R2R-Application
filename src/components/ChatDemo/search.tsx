import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { FC, useState, useCallback } from 'react';

import { Pipeline } from '../../types';

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
interface SearchProps {
  pipeline?: Pipeline;
}

export const Search: FC<SearchProps> = ({ pipeline }) => {
  const [value, setValue] = useState('');
  const router = useRouter();

  console.log(' pipeline  =', pipeline);
  const navigateToSearch = useCallback(
    debounce((searchValue) => {
      router.push(
        `/pipeline/${pipeline?.pipelineId}/playground/?q=${encodeURIComponent(searchValue)}`
      );
    }, 50),
    [router]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      navigateToSearch(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label
        className="relative border-zinc-700 bg-zinc-800 flex items-center justify-center border py-2 px-2 rounded-lg gap-2 focus-within:border-zinc-500 ring-8 ring-zinc-700/20"
        htmlFor="search-bar"
      >
        <input
          id="search-bar"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="Ask SciPhi AI anything ..."
          className="px-2 pr-6 w-full rounded-md flex-1 outline-none bg-zinc-800 text-zinc-200"
        />
        <button
          type="submit"
          className="w-auto py-1 px-2 bg-zinc-400 border-black text-black fill-white active:scale-95 border overflow-hidden relative rounded-xl hover:bg-zinc-200"
        >
          <ArrowRight size={16} />
        </button>
      </label>
    </form>
  );
};
