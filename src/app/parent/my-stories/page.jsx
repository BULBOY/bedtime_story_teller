"use client"; 
import Button from "@components/Button";
import Card from "@components/Card";

export default function MyStories() {
  return (
    <section className="my-stories-container">
      <h1 className="my-stories-title">My Stories</h1>
      <p className="my-stories-description">Manage your saved bedtime stories.</p>

      <div className="stories-list">
        <Card title="The Magic Forest" description="An AI-generated bedtime story">
          <Button variant="secondary">Play</Button>
          <Button variant="secondary">Edit</Button>
          <Button variant="secondary">Delete</Button>
        </Card>
      </div>
    </section>
  );
}
