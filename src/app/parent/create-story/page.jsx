"use client";
import { useState } from "react";
import TextInput from "@components/TextInput";
import Button from "@components/Button";

export default function CreateStory() {
  const [story, setStory] = useState("");

  return (
    <section className="create-story-container">
      <h1 className="create-story-title">Create a New Story</h1>
      <textarea
        className="story-editor"
        placeholder="Write your bedtime story here..."
        value={story}
        onChange={(e) => setStory(e.target.value)}
      />
      <div className="story-actions">
        <Button variant="primary">Generate AI Story</Button>
        <Button variant="secondary">Convert to Audio</Button>
        <Button variant="primary">Save Story</Button>
      </div>
    </section>
  );
}
