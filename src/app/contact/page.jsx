"use client"; 
import { useState } from "react";
import Form from "@components/Form";
import TextInput from "@components/TextInput";
import Button from "@components/Button";

export default function Contact() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Message sent from: ${email}`);
  };

  return (
    <section className="contact-container">
      <h1 className="contact-title">Contact Us</h1>
      <p className="contact-description">
        Have questions or need support? Reach out to us!
      </p>

      <Form onSubmit={handleSubmit}>
        <TextInput label="Your Email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput label="Your Message" type="text" placeholder="Type your message here..." value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button type="submit">Send Message</Button>
      </Form>
    </section>
  );
}
