import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value?: string | number;
  onChange?: (e: any) => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

export function CustomSelect({ value, onChange, className, disabled, children, actionButton }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = React.Children.toArray(children).map((child: any) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const childrenText = Array.isArray(child.props.children) 
        ? child.props.children.join('') 
        : child.props.children;
      return {
        value: child.props.value,
        label: childrenText,
        searchKey: `${child.props.value} ${childrenText}`
      };
    }
    return null;
  }).filter(Boolean) as { value: any, label: string, searchKey: string }[];

  const filteredOptions = options.filter(opt => {
    if (!searchTerm) return true;
    return String(opt.searchKey).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedOpt = options.find(o => String(o.value) === String(value));

  return (
    <div ref={wrapperRef} className={`relative w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div 
        className={`flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 ${className || ''} ${disabled ? 'pointer-events-none' : 'cursor-pointer'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : 'Select...'}</span>
        <ChevronDown size={16} className="text-slate-500 shrink-0 ml-2" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-[99] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl">
          <div className="p-2 border-b border-slate-100 flex items-center bg-slate-50 rounded-t-lg">
            <Search size={14} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              className="w-full text-sm outline-none bg-transparent"
              placeholder="Search ID, name, number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer ${String(opt.value) === String(value) ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                onClick={() => {
                  if (onChange) {
                    onChange({ target: { value: String(opt.value) } });
                  }
                  if (!actionButton) {
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }}
              >
                {opt.label}
              </div>
            )) : (
              <div className="p-3 text-sm text-slate-500 text-center">No results found</div>
            )}
          </div>
          {actionButton && (
            <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-lg">
              {actionButton}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
