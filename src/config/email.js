import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configuración del transportador de emails
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || 2525),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Enviar email de bienvenida con link de activación
 */
export const sendWelcomeEmail = async (user, activationToken) => {
  const transporter = createTransporter();

  const activationLink = `${
    process.env.FRONTEND_URL || "http://localhost:8080"
  }/activate-account?token=${activationToken}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "E-Commerce"}" <${
      process.env.EMAIL_USER
    }>`,
    to: user.email,
    subject: "¡Bienvenido! Activa tu cuenta",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #667eea;
            margin-top: 0;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.3s;
          }
          .button:hover {
            transform: scale(1.05);
          }
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .warning {
            color: #e74c3c;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido a E-Commerce!</h1>
          </div>
          <div class="content">
            <h2>Hola ${user.first_name} ${user.last_name},</h2>
            <p>Gracias por registrarte en nuestra plataforma. Estamos emocionados de tenerte con nosotros.</p>
            
            <p>Para completar tu registro y activar tu cuenta, por favor haz clic en el siguiente botón:</p>
            
            <div class="button-container">
              <a href="${activationLink}" class="button">✓ Activar Mi Cuenta</a>
            </div>
            
            <div class="info-box">
              <p><strong>⏰ Importante:</strong></p>
              <p>Este enlace expirará en <span class="warning">1 hora</span> por razones de seguridad.</p>
              <p>Si no activaste tu cuenta, simplemente ignora este correo.</p>
            </div>
            
            <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #667eea; font-size: 12px;">${activationLink}</p>
            
            <p style="margin-top: 30px;">¡Esperamos que disfrutes de tu experiencia de compra!</p>
            
            <p>Saludos,<br><strong>El equipo de E-Commerce</strong></p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} E-Commerce. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida enviado a: ${user.email}`);
    return { success: true, message: "Email de bienvenida enviado" };
  } catch (error) {
    console.error("❌ Error enviando email de bienvenida:", error);
    return {
      success: false,
      message: "Error enviando email",
      error: error.message,
    };
  }
};

/**
 * Enviar email de recuperación de contraseña
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();

  const resetLink = `${
    process.env.FRONTEND_URL || "http://localhost:8080"
  }/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "E-Commerce"}" <${
      process.env.EMAIL_USER
    }>`,
    to: user.email,
    subject: "Recuperación de Contraseña",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #f5576c;
            margin-top: 0;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.3s;
          }
          .button:hover {
            transform: scale(1.05);
          }
          .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .security-box {
            background: #d1ecf1;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .warning {
            color: #e74c3c;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${user.first_name},</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            
            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            
            <div class="button-container">
              <a href="${resetLink}" class="button">🔑 Restablecer Contraseña</a>
            </div>
            
            <div class="info-box">
              <p><strong>⏰ Importante:</strong></p>
              <p>Este enlace expirará en <span class="warning">1 hora</span> por razones de seguridad.</p>
            </div>
            
            <div class="security-box">
              <p><strong>🛡️ Seguridad:</strong></p>
              <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual permanecerá sin cambios.</p>
            </div>
            
            <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #f5576c; font-size: 12px;">${resetLink}</p>
            
            <p style="margin-top: 30px;">Saludos,<br><strong>El equipo de E-Commerce</strong></p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} E-Commerce. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de recuperación enviado a: ${user.email}`);
    return { success: true, message: "Email de recuperación enviado" };
  } catch (error) {
    console.error("❌ Error enviando email de recuperación:", error);
    return {
      success: false,
      message: "Error enviando email",
      error: error.message,
    };
  }
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
