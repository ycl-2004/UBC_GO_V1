import React, { useState, useRef, useEffect } from 'react';
import './MultiSelect.css';

/**
 * MultiSelect Component
 * A searchable multi-select dropdown with tag/chip display for selected items
 * 
 * @param {string[]} options - Array of option strings
 * @param {string[]} value - Array of currently selected values
 * @param {Function} onChange - Callback function called with new array when selection changes
 * @param {string} placeholder - Placeholder text when nothing is selected
 * @param {string} label - Optional label text
 */
const MultiSelect = ({ options = [], value = [], onChange, placeholder = "Select options...", label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term and exclude already selected items
  const filteredOptions = options.filter(option => {
    const matchesSearch = option.toLowerCase().includes(searchTerm.toLowerCase());
    const notSelected = !value.includes(option);
    return matchesSearch && notSelected;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    const newValue = [...value, option];
    onChange(newValue);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const handleRemove = (option, e) => {
    e.stopPropagation();
    const newValue = value.filter(item => item !== option);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredOptions.length > 0 && searchTerm) {
      e.preventDefault();
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className="multi-select-container" ref={containerRef}>
      {label && <label className="multi-select-label">{label}</label>}
      
      <div className="multi-select-wrapper">
        {/* Tags Display */}
        {value.length > 0 && (
          <div className="multi-select-tags">
            {value.map((item) => (
              <span key={item} className="multi-select-tag">
                {item}
                <button
                  type="button"
                  className="multi-select-tag-remove"
                  onClick={(e) => handleRemove(item, e)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input/Dropdown Trigger */}
        <div className="multi-select-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="multi-select-input"
            placeholder={value.length === 0 ? placeholder : ''}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            aria-label="Search and select AP exams"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          <span 
            className="multi-select-arrow" 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Toggle dropdown"
          >
            {isOpen ? '▲' : '▼'}
          </span>
        </div>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="multi-select-dropdown">
            {filteredOptions.length > 0 ? (
              <ul className="multi-select-options" role="listbox">
                {filteredOptions.map((option) => (
                  <li
                    key={option}
                    className="multi-select-option"
                    role="option"
                    onClick={() => handleSelect(option)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                  >
                    {option}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="multi-select-no-results">
                {searchTerm ? 'No matching options' : 'All options selected'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;

