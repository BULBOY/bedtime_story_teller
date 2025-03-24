"use client"; 

import TextInput from "../../components/TextInput";
import Button from "../../components/Button";

export default function Profile() {
  return (
    <section className="profile-container">
      <h1 className="profile-title">Your Profile</h1>

      <form>
        <TextInput label="Edit Your Email" type="email" placeholder="Enter your new email" />
        <TextInput label="Edit Your Password" type="password" placeholder="Enter a new password" />
        <Button type="submit">Update Profile</Button>
      </form>
    </section>
  );
}
