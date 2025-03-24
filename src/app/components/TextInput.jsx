"use client"; 

import React from "react";

export default function TextInput({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder} // ✅ Adds placeholder support
        className="input-field"
      />
    </div>
  );
}
