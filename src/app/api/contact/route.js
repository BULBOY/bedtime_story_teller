import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Please fill out all required fields'
      }, { status: 400 });
    }
    
    // Configure your email transporter
    // For development, you can use something like Mailtrap
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    // Define email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.CONTACT_EMAIL, // Your business email
      replyTo: email,
      subject: `Contact Form: ${subject || 'No Subject'}`,
      text: `
        Name: ${name}
        Email: ${email}
        
        Message:
        ${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    return NextResponse.json({
      error: 'Failed to send message',
      message: 'There was an error sending your message. Please try again later.'
    }, { status: 500 });
  }
}