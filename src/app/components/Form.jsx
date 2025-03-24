import React from "react";

export default function Form({ onSubmit, children }) {
  return (
    <form className="form-container" onSubmit={onSubmit}>
      {children}
    </form>
  );
}
