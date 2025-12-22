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



import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // e.g., 'smtp.mailersend.net'
        port: 587, // e.g., 587 or 2525 //465 for true 
        secure: false, 
        auth: {
            user: "satyco2111@gmail.com",
            pass: "afnn mapu gfai pyzk", // App password
        },
    });

    await transporter.sendMail({
        from: "satyco2111@gmail.com",
        to,
        subject,
        text,
    });

    return true;
};
