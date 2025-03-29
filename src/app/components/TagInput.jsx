// app/components/TagInput.js
import { useState } from 'react';

export default function TagInput({ tags, setTags, placeholder }) {
  const [input, setInput] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input) {
      e.preventDefault();
      if (!tags.includes(input.toLowerCase())) {
        setTags([...tags, input.toLowerCase()]);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map(tag => (
          <div key={tag} className="tag-item">
            <span>{tag}</span>
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="tag-remove-btn"
              aria-label={`Remove ${tag} tag`}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}