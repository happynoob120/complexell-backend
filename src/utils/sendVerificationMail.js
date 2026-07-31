const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.SERVER_URL}/api/auth/verify-email/${token}`;

  try {
    await resend.emails.send({
      from: "Complexell <noreply@souel.in>",
      to: email,
      subject: "Verify your Complexell account",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Welcome to Complexell 🚀</h2>

          <p>Thanks for joining the beta.</p>

          <p>Click the button below to verify your email.</p>

          <a
            href="${verificationLink}"
            style="
              display:inline-block;
              padding:12px 24px;
              background:#9FE6A0;
              color:#111;
              text-decoration:none;
              border-radius:8px;
              font-weight:bold;
            "
          >
            Verify Email
          </a>

          <p style="margin-top:20px;">
            This link expires in <b>1 hour</b>.
          </p>

          <p>If you didn't create this account, simply ignore this email.</p>
        </div>
      `,
    });

    console.log("Verification email sent.");
  } catch (error) {
    console.error("Resend Error:", error);
    throw error;
  }
};

module.exports = sendVerificationEmail;