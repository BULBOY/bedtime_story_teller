"use client";

import Button from "@components/Button";

export default function Settings() {
  return (
    <section className="settings-container">
      <h1 className="settings-title">Settings</h1>

      <p>Manage your preferences:</p>
      <label>
        <input type="checkbox" /> Enable Notifications
      </label>
      <label>
        <input type="checkbox" /> Use AI Text-to-Speech
      </label>

      <Button>Save Settings</Button>
    </section>
  );
}
