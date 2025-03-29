"use client"; 

import React from "react";

export default function TextInput({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  required = false,
  disabled = false,
  name
}) {
  return (
    <div className="form-group">
      <label className="input-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        name={name}
        className="input-field"
      />
    </div>
  );
}