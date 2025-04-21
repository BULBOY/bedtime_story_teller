"use client";
import React, { useEffect, useState } from 'react';

export default function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  className = "" 
}) {
  const [voices, setVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageFilter, setLanguageFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    async function fetchVoices() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/list-voices');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch voices: ${response.statusText}`);
        }
        
        const data = await response.json();
        setVoices(data.voices);
        
        // Extract unique languages for filtering
        const uniqueLanguages = [...new Set(data.voices.map(voice => voice.language))];
        setLanguages(uniqueLanguages.sort());
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching voices:", err);
        setError(err.message);
        setIsLoading(false);
      }
    }
    
    fetchVoices();
  }, []);

  // Filter voices based on language filter and search query
  useEffect(() => {
    let result = [...voices];
    
    // Apply language filter
    if (languageFilter !== "all") {
      result = result.filter(voice => voice.language === languageFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(voice => 
        voice.name.toLowerCase().includes(query) || 
        voice.languageCode.toLowerCase().includes(query) ||
        voice.ssmlGender.toLowerCase().includes(query)
      );
    }
    
    setFilteredVoices(result);
  }, [voices, languageFilter, searchQuery]);

  // Handle selecting a different language
  const handleLanguageChange = (e) => {
    setLanguageFilter(e.target.value);
  };

  // Handle searching
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading) {
    return <div className="loading-indicator">Loading voices...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className={`voice-selector ${className}`}>
      <div className="voice-filters">
        <div className="filter-group">
          <label htmlFor="language-filter">Language:</label>
          <select 
            id="language-filter" 
            value={languageFilter} 
            onChange={handleLanguageChange}
            className="form-select"
          >
            <option value="all">All Languages</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="voice-search">Search:</label>
          <input
            id="voice-search"
            type="text"
            placeholder="Search voices..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="form-input"
          />
        </div>
      </div>
      
      <div className="voices-count">
        Showing {filteredVoices.length} of {voices.length} voices
      </div>
      
      <select 
        className="voice-dropdown form-select"
        value={selectedVoice}
        onChange={(e) => onVoiceChange(e.target.value)}
      >
        {filteredVoices.map(voice => (
          <option key={voice.name} value={voice.name}>
            {voice.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}