// import nodemailer from "nodemailer";

// export const sendEmail = async (to, subject, text) => {
//     try {
//         const transporter = nodemailer.createTransport({
//             host: "smtp-relay.brevo.com",
//             port: 587,
//             secure: false,
//             auth: {
//                 user: "satyco2111@gmail.com", // your Brevo login email
//                 pass: "bskhIEmtWazJsQ3",  // Brevo SMTP key
//             },
//         });

//         const info = await transporter.sendMail({
//             from: "saty<satyco2111@gmail.com>",
//             to,
//             subject,
//             text,
//         });

//         console.log("Brevo email sent:", info.messageId);
//         return true;
//     } catch (error) {
//         console.error("Brevo email error:", error);
//         return false;
//     }
// };





//   auth: {
//                 user: process.env.BREVO_SMTP_USER, // your Brevo login email
//                 pass: process.env.BREVO_SMTP_KEY,  // Brevo SMTP key
//             },







// import nodemailer from "nodemailer";

// export const sendEmail = async (to, subject, text) => {
//     try {
//         const transporter = nodemailer.createTransport({
//             host: "smtp.gmail.com",
//             port: 587,
//             secure: false, // true for 465, false for 587
//             auth: {
//                 user: "satyco2111@gmail.com",
//                 pass: "afnn mapu gfai pyzk",
//             },
//         });

//         const info = await transporter.sendMail({
//             from: "satyco2111@gmail.com",
//             to,
//             subject,
//             text,
//         });

//         console.log("Email sent:", info.messageId);
//         return true;
//     } catch (error) {
//         console.error("Email send failed:", error);
//         return false;
//     }
// };




// Your SMTP Settings
// SMTP Server
// smtp-relay.brevo.com
// Port
// 587
// Login
// 9e905c001@smtp-brevo.com


// mailkey
// xsmtpsib-51b4074eb784a9277ab63e938591dbc5870ff3b20a19f4a9e62be2ceeafe48c6-JkwpcOwvEZZ4WTO1


// this is main  code work on here without any extarnal api  =======================================

// import nodemailer from "nodemailer";

// export const sendEmail = async (to, subject, text) => {
//     const transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com', // e.g., 'smtp.mailersend.net'
//         port: 587, // e.g., 587 or 2525 //465 for true 
//         secure: false, 
//         auth: {
//             user: "satyco2111@gmail.com",
//             pass: "afnn mapu gfai pyzk", // App password
//         },
//     });

//     await transporter.sendMail({
//         from: "satyco2111@gmail.com",
//         to,
//         subject,
//         text,
//     });

//     return true;
// };

// =====================================================================

// fetch('https://4c6e2aa4-9801-4d3d-aad1-dfd3d3d5f705-00-n9ysph1wwdzg.sisko.replit.dev/api/send-email', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     receiver_email: 'user@example.com',
//     text: 'Your message',
//     subject: 'Email Subject'
//   })
// })
// .then(res => res.json())
// .then(data => console.log(data.success ? 'Sent!' : 'Error: ' + data.message));





// 🚀 API Endpoints (Ready to Use)
// POST Endpoint (Recommended):

// POST https://your-replit-domain.replit.dev/api/send-email
// Content-Type: application/json
// {
//   "receiver_email": "recipient@gmail.com",
//   "text": "Your message here",
//   "subject": "Optional: Custom subject"
// }
// GET Endpoint:

// GET https://your-replit-domain.replit.dev/api/send-email?receiver_email=recipient@gmail.com&text=Hello%20World
// 📝 Quick JavaScript Example (Use on Any Webpage)
// fetch('https://your-replit-domain.replit.dev/api/send-email', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     receiver_email: 'user@example.com',
//     text: 'Your message',
//     subject: 'Email Subject'
//   })
// })
// .then(res => res.json())
// .then(data => console.log(data.success ? 'Sent!' : 'Error: ' + data.message));
// ✅ Features
// ✓ CORS Enabled - Works from any website or domain
// ✓ GET & POST - Both methods supported
// ✓ Custom Subjects - Optional parameter
// ✓ Live UI - Interactive form at /
// ✓ Full Documentation - Visit /API_DOCS.html for complete details with Python, cURL, jQuery examples
// Your server is running! Replace your-replit-domain.replit.dev with your actual Replit project URL from the web preview.

// Checkpoint made
// Add a versatile email sending API with CORS support




// Perfect! Here's your URL:

// 🌐 Your Email Service URL
// Base URL:

// https://4c6e2aa4-9801-4d3d-aad1-dfd3d3d5f705-00-n9ysph1wwdzg.sisko.replit.dev
// 📧 API Endpoints
// Send Email (POST):

// https://4c6e2aa4-9801-4d3d-aad1-dfd3d3d5f705-00-n9ysph1wwdzg.sisko.replit.dev/api/send-email
// Send Email (GET):

// https://4c6e2aa4-9801-4d3d-aad1-dfd3d3d5f705-00-n9ysph1wwdzg.sisko.replit.dev/api/send-email?receiver_email=user@gmail.com&text=Hello
// 📚 Documentation
// https://4c6e2aa4-9801-4d3d-aad1-dfd3d3d5f705-00-n9ysph1wwdzg.sisko.replit.dev/API_DOCS.html














// finaly working code by riplit api ====================================

import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {

    const resp = await fetch('https://4c6e2aa4-9801-4d3d-aad1-dfd3d3d5f705-00-n9ysph1wwdzg.sisko.replit.dev/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            receiver_email: to,
            text: text,
            subject: subject
        })
    })
    const data = await resp.json();

    if (data.success) { return true; } else {

        return false;
    }
};







// export const sendEmail = async (to, subject, text) => {
//   try {
//     const resp = await fetch(
//       "https://4c6e2aa4-9801-4d3d-aad1-dfd3d3d5f705-00-n9ysph1wwdzg.sisko.replit.dev/api/send-email",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           receiver_email: to,
//           subject,
//           text
//         })
//       }
//     );

//     if (!resp.ok) return false;

//     const data = await resp.json();
//     return data.success === true;
//   } catch (error) {
//     console.error("Email error:", error);
//     return false;
//   }
// };
