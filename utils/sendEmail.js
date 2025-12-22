
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for 587
            auth: {
                user: "satyco2111@gmail.com",
                pass: "afnn mapu gfai pyzk",
            },
        });

        const info = await transporter.sendMail({
            from: `"My App" <${"satyco2111@gmail.com"}>`,
            to,
            subject,
            text,
        });

        console.log("Email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Email send failed:", error);
        return false;
    }
};










// import nodemailer from "nodemailer";

// export const sendEmail = async (to, subject, text) => {
//     const transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com', // e.g., 'smtp.mailersend.net'
//         port: 465, // e.g., 587 or 2525
//         secure: true,
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
