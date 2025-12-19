import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.mailersend.net', // e.g., 'smtp.mailersend.net'
        port: 587, // e.g., 587 or 2525
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
