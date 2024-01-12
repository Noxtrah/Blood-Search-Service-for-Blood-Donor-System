// mailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
  };

// Function to send email
export async function sendEmail(contactEmail, city) {
  try {
    console.log("Config mail: ", config.email);
    console.log("Config pass: ", config.password);
    // Create a transporter with your email provider's SMTP settings
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // e.g., 'gmail'
      auth: {
        user: config.email,
        pass: config.password,
      },
    });

    // Define the email content
    const mailOptions = {
      from: config.email,
      to: contactEmail,
      subject: 'Available blood in a blood bank within 50km of your requested city',
      text: `There is the requested blood in blood bank located  50 km away from ${city}. Contact the blood bank for further assistance.`,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}