import React, { useState } from 'react';
import './CollapsibleSection.css';

/**
 * CollapsibleSection Component
 * A reusable accordion/disclosure component for collapsible content sections
 * 
 * @param {string} title - The header text for the collapsible section
 * @param {React.ReactNode} children - Content to display when expanded
 * @param {boolean} defaultOpen - Whether the section should be open by default (default: false)
 */
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <div 
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <h3 className="collapsible-title">{title}</h3>
        <span className={`chevron-icon ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </div>
      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;

