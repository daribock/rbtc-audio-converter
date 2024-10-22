import nodemailer from "nodemailer"
import logger from "./logger.js"
import { getZipFileName } from "./file-utils.js"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = async (recipient, jobId) => {
  const BASE_URL = process.env.BASE_URL
  const downloadLink = `${BASE_URL}/download/${jobId}/${getZipFileName(jobId)}`
  const emailBody = `
        <div style="width: 100%; background-color: #f4f4f4; padding: 20px;">
            <div style="background-color: #ffffff; max-width: 600px; margin: 40px auto; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333;">Hello,</h2>
                <p style="color: #555; font-size: 16px;">Your file is ready for download. Click the button below to get it:</p>
                <a href="${downloadLink}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; margin-top: 20px;">Download File</a>
                <p style="color: #555; font-size: 16px;">If you have any questions, feel free to reach out to us.</p>
                <div style="margin-top: 40px; font-size: 12px; color: #777; text-align: center;">
                    <p>Thank you for using our service!</p>
                    <p>&copy; 2024 Your Company. All rights reserved.</p>
                </div>
            </div>
        </div>
    `

  await transporter
    .sendMail({
      from: "RBTC Audio Converter <no-reply@rbtc-audio-converter.darikletter.de>",
      to: recipient,
      subject: "RBTC converted audios",
      html: emailBody,
    })
    .then(() => {
      logger.info(`Email was sent for jobId: ${jobId}`)
    })
}

export default sendEmail
