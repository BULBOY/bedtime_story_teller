"use client"; 
import Button from "@components/Button";
import Card from "@components/Card";

export default function MyStories() {
  return (
    <section className="my-stories-container">
      <h1 className="my-stories-title">My Stories</h1>
      <p className="my-stories-description">Manage your saved bedtime stories.</p>
      {/* Sidebar / Navbar on the left */}
            <div className="dashboard-actions-container">
              <h1 className="dashboard-title">Parent Dashboard</h1>
              <p className="dashboard-description">Manage your bedtime stories</p>
      
              <div className="dashboard-actions">
                <Button
                  variant="secondary"
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
            </div>

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
