"use client"; 

import React from "react";

export default function Button({ children, onClick, variant = "primary" }) {
  return (
    <button className={`button ${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
