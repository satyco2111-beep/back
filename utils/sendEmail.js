import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
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
