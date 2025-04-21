"use client"; 
import { useState } from "react";
import Form from "@components/Form";
import TextInput from "@components/TextInput";
import Button from "@components/Button";
import LoadingSpinner from "@components/LoadingSpinner";

export default function Contact() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset status
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      // You can create an API route at /api/contact to handle this
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      // Clear form fields
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      
      // Show success message
      setSuccess(true);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'An error occurred while sending your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-container">
      <h1 className="contact-title">Contact Us</h1>
      <p className="contact-description">
        Have questions or need support? Reach out to us!
      </p>

      {success ? (
        <div className="card mt-6 p-6 text-center">
          <h2 className="text-xl text-indigo-800 mb-4">Thank You!</h2>
          <p className="text-indigo-600 mb-4">Your message has been sent successfully. We'll get back to you soon.</p>
          <Button onClick={() => setSuccess(false)}>Send Another Message</Button>
        </div>
      ) : (
        <div className="card p-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <Form onSubmit={handleSubmit}>
            <TextInput 
              label="Your Name" 
              type="text" 
              placeholder="Enter your name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <TextInput 
              label="Your Email" 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <TextInput 
              label="Subject" 
              type="text" 
              placeholder="What is this about?" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            
            <div className="form-group">
              <label htmlFor="message" className="form-label">Your Message</label>
              <textarea
                id="message"
                className="form-textarea h-32"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? <><LoadingSpinner size="sm" /> Sending...</> : 'Send Message'}
            </Button>
          </Form>
        </div>
      )}

      <div className="card mt-6 p-6">
        <h2 className="text-xl text-indigo-800 mb-4">Other Ways to Reach Us</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold">Email</h3>
            <p>support@bedtimestories.com</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Phone</h3>
            <p>(123) 456-7890</p>
          </div>
        </div>
      </div>
    </section>
  );
}