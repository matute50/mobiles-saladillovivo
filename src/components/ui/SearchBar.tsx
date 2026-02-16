'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNews } from '@/context/NewsContext'; // Importante: Conexión con el contexto
import { cn } from '@/lib/utils';

const SearchBar = () => {
  const { handleSearch, searchQuery, isSearching } = useNews();
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sincroniza el input si se limpia la búsqueda desde otro lado
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita recargar la página
    handleSearch(inputValue); // Ejecuta la búsqueda en el contexto
  };

  const handleClear = () => {
    setInputValue('');
    handleSearch(''); // Limpia los resultados y vuelve al modo normal
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full max-w-[200px] sm:max-w-[300px]"
    >
      <input
        type="text"
        placeholder="Buscar..."
        className={cn(
          "w-full h-9 pl-3 pr-10 text-sm rounded-full border-[2px] border-black dark:border-white",
          "bg-white/90 dark:bg-neutral-800/90 text-black dark:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "transition-all duration-200 placeholder:text-gray-400"
        )}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <div className="absolute right-2 flex items-center gap-1">
        {/* Botón X para limpiar */}
        {(inputValue || isSearching) && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        )}

        {/* Botón Lupa para buscar */}
        <button
          type="submit"
          className="p-1 text-foreground hover:text-primary transition-colors"
        >
          <Search size={16} />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;