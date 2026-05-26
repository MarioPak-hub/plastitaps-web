import React, { createContext, useContext, useState, useEffect } from 'react';

const QuotesContext = createContext();
const STORAGE_KEY = 'plastitaps-quotes';

export function QuotesProvider({ children }) {
  const [quotes, setQuotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  }, [quotes]);

  const addQuote = (quote) => setQuotes(prev => [quote, ...prev]);

  const updateQuote = (folio, updates) =>
    setQuotes(prev => prev.map(q => q.folio === folio ? { ...q, ...updates } : q));

  return (
    <QuotesContext.Provider value={{ quotes, addQuote, updateQuote }}>
      {children}
    </QuotesContext.Provider>
  );
}

export const useQuotes = () => useContext(QuotesContext);
