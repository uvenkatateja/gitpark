import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  size?: 'default' | 'large';
}

export function SearchBar({ placeholder = 'Enter a GitHub username...', className = '', size = 'default' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/lot/${trimmed}`);
  };

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${isLarge ? 'w-5 h-5' : 'w-4 h-4'}`} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-mono rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
          isLarge ? 'pl-11 pr-28 py-4 text-base' : 'pl-9 pr-20 py-2.5 text-sm'
        }`}
      />
      <button
        type="submit"
        className={`absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground font-pixel rounded hover:opacity-90 transition-opacity ${
          isLarge ? 'px-5 py-2 text-sm' : 'px-3 py-1.5 text-xs'
        }`}
      >
        Park it!
      </button>
    </form>
  );
}
