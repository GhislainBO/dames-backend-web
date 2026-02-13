/**
 * LanguageSelector - Sélecteur de langue
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../i18n';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  compact?: boolean;
}

function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    // RTL est géré automatiquement dans i18n/index.ts
  };

  if (compact) {
    return (
      <div className="language-selector compact">
        <button
          className="language-btn compact"
          onClick={() => setIsOpen(!isOpen)}
        >
          {currentLang.flag}
        </button>
        {isOpen && (
          <div className="language-dropdown">
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
                onClick={() => changeLanguage(lang.code)}
              >
                <span className="flag">{lang.flag}</span>
                <span className="name">{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="language-selector">
      <button
        className="language-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flag">{currentLang.flag}</span>
        <span className="name">{currentLang.name}</span>
        <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="language-dropdown">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="flag">{lang.flag}</span>
              <span className="name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
