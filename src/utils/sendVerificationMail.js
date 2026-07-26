const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Mail transporter error:", error);
  } else {
    console.log("Mail transporter is ready.");
  }
});

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.SERVER_URL}/api/auth/verify-email/${token}`;

  await transporter.sendMail({
    from: `"Complexell" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your Complexell account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2>Welcome to Complexell 👋</h2>

        <p>Thank you for signing up.</p>

        <p>Please verify your email by clicking the button below.</p>

        <a
          href="${verificationLink}"
          style="
            display:inline-block;
            background:#9FE6A0;
            color:#111111;
            text-decoration:none;
            padding:14px 24px;
            border-radius:8px;
            font-weight:bold;
          "
        >
          Verify Email
        </a>

        <p style="margin-top:25px;">
          This verification link will expire in <b>1 hour</b>.
        </p>

        <p>If you didn't create this account, you can safely ignore this email.</p>

        <hr>

        <small>
          If the button doesn't work, copy and paste this URL into your browser:
        </small>

        <br><br>

        <a href="${verificationLink}">
          ${verificationLink}
        </a>
      </div>
    `,
  });
};

module.exports = sendVerificationEmail;