// app/components/StoryForm.js
import { useState } from 'react';
import TagInput from './TagInput';
import Button from "@components/Button";

export default function StoryForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    prompt: initialData.prompt || '',
    age: initialData.age || 7,
    theme: initialData.theme || 'adventure',
    length: initialData.length || 'medium',
    customTags: initialData.customTags || [],
    categories: initialData.categories || [],
    editInstructions: initialData.editInstructions || '',
  });

  const themes = [
    'adventure', 'fantasy', 'animals', 'friendship', 
    'family', 'space', 'ocean', 'dinosaurs', 'magic',
    'nature', 'science', 'sports', 'superheroes'
  ];

  const categories = [
    'bedtime', 'educational', 'moral lesson', 'funny', 
    'action', 'calm', 'mystery', 'holiday', 'seasonal'
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagsChange = (tags) => {
    setFormData(prev => ({ ...prev, customTags: tags }));
  };
  
  const handleCategoriesChange = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => {
      const updatedCategories = isChecked
        ? [...prev.categories, value]
        : prev.categories.filter(cat => cat !== value);
      
      return { ...prev, categories: updatedCategories };
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const isEdit = initialData.id !== undefined;
  
  return (
    <form onSubmit={handleSubmit} className="story-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group md:col-span-2">
          <label htmlFor="title" className="form-label">Story Title</label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a title for your story..."
            className="form-input"
            required
          />
        </div>
        
        {/* Only show the prompt field when creating a new story, not when editing */}
        {!isEdit && (
          <div className="form-group md:col-span-2">
            <label htmlFor="prompt" className="form-label">Story Prompt</label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              placeholder="Describe what you want the story to be about..."
              className="form-textarea h-24"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Be specific about characters, settings, or lessons you'd like included.
            </p>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="age" className="form-label">Child's Age</label>
          <select
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="form-select"
            required
          >
            {[...Array(13)].map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} year{i !== 0 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="theme" className="form-label">Main Theme</label>
          <select
            id="theme"
            name="theme"
            value={formData.theme}
            onChange={handleChange}
            className="form-select"
            required
          >
            {themes.map(theme => (
              <option key={theme} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="length" className="form-label">Story Length</label>
          <select
            id="length"
            name="length"
            value={formData.length}
            onChange={handleChange}
            className="form-select"
          >
            <option value="short">Short (3-5 minutes)</option>
            <option value="medium">Medium (5-8 minutes)</option>
            <option value="long">Long (8-12 minutes)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Custom Tags</label>
          <TagInput 
            tags={formData.customTags} 
            setTags={handleTagsChange} 
            placeholder="Add tags and press Enter"
          />
          <p className="text-sm text-gray-500 mt-1">
            Add keywords to help organize your stories
          </p>
        </div>
        
        <div className="form-group md:col-span-2">
          <label className="input-label">Categories</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {categories.map(category => (
              <label key={category} className="category-label flex items-center">
                <input
                  type="checkbox"
                  value={category}
                  checked={formData.categories.includes(category)}
                  onChange={handleCategoriesChange}
                  className="category-checkbox mr-2"
                />
                <span> {category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-indigo-800 mt-2">
            Select categories that best describe your story
          </p>
        </div>
        
        {isEdit && (
          <div className="form-group md:col-span-2">
            <label htmlFor="editInstructions" className="form-label">Edit Instructions</label>
            <textarea
              id="editInstructions"
              name="editInstructions"
              value={formData.editInstructions}
              onChange={handleChange}
              placeholder="Describe how you want to change the existing story..."
              className="form-textarea h-24"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              The original prompt and story context will be preserved while making these changes.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-center gap-4">
        {/* Cancel button */}
        <Button 
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        
        {/* Submit button */}
        <Button 
          type="submit" 
          variant="primary"
        >
          {isEdit ? 'Update Story' : 'Generate Story'}
        </Button>
      </div>
    </form>
  );
}