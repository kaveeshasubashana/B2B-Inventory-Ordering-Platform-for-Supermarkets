const nodemailer = require("nodemailer");

const sendContactMail = async (req, res) => {
  const { name, email, message } = req.body;

  // 1️⃣ Validate input
  if (!name || !email || !message) {
    return res.status(400).json({
      message: "Name, email, and message are required",
    });
  }

  try {
    // 2️⃣ Create transporter (MAILTRAP - SAFE CONFIG)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,                 // sandbox.smtp.mailtrap.io
      port: Number(process.env.EMAIL_PORT),         // 587 or 2525
      secure: false,                                // ❗ MUST be false
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,                  // ❗ prevents timeout
      },
      connectionTimeout: 10000,                     // 10s timeout
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // 3️⃣ Send email
    await transporter.sendMail({
      from: `"BridgeMart Contact" <no-reply@bridgemart.com>`,
      to: "kaveeshasubashana@gmail.com",
      subject: "New Contact Message - BridgeMart",
      text: `
New Contact Message

Name: ${name}
Email: ${email}

Message:
${message}
      `,
      html: `
        <h2>New Contact Message - BridgeMart</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    // 4️⃣ Success response
    res.status(200).json({
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);

    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

module.exports = { sendContactMail };
