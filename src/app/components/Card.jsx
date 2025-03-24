import React from "react";

export default function Card({ title, description, children }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
      <div className="card-content">{children}</div>
    </div>
  );
}
