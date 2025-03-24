"use client";
import Button from "@components/Button";
import Card from "@components/Card";

export default function Dashboard() {
  return (
    <section className="dashboard-container">
      <h1 className="dashboard-title">Parent Dashboard</h1>
      <p className="dashboard-description">Manage your bedtime stories</p>

      <div className="dashboard-actions">
        <Button
          variant="primary"
          onClick={() => (window.location.href = "/parent/create-story")}
        >
          Create New Story
        </Button>
        <Button
          variant="secondary"
          onClick={() => (window.location.href = "/parent/my-stories")}
        >
          My Stories
        </Button>
        <Button
          variant="secondary"
          onClick={() => (window.location.href = "/parent/profile")}
        >
          Profile
        </Button>
        <Button
          variant="secondary"
          onClick={() => (window.location.href = "/parent/settings")}
        >
          Settings
        </Button>
      </div>

      <h2 className="dashboard-subtitle">Recent Stories</h2>
      <div className="stories-list">
        <Card
          title="The Magic Forest"
          description="An AI-generated bedtime story"
        >
          <Button variant="secondary">Play</Button>
          <Button variant="secondary">Edit</Button>
        </Card>
      </div>
    </section>
  );
}
