import nodemailer from "nodemailer"
import process from "process"
import logger from "./logger.js"
import { getZipFileName } from "./file.js"

// Create reusable transporter object using one.com SMTP
const transporter = nodemailer.createTransport({
  service: "One",
  auth: {
    user: process.env.MAIL_USER, // your one.com email address
    pass: process.env.MAIL_PASS, // your one.com email password
  },
})

const sendEmail = async (toEmails, jobId) => {
  const BASE_URL = process.env.BASE_URL
  const downloadLink = `${BASE_URL}/download/${jobId}/${getZipFileName(jobId)}`
  const emailBody = `
        <div style="width: 100%; background-color: #f4f4f4; padding: 20px;">
            <div style="background-color: #ffffff; max-width: 400px; margin: 40px auto; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333;">Hello,</h2>
                <p style="color: #555; font-size: 16px;">Your converted audio files are ready for download. Click the button below to get them:</p>
                <a href="${downloadLink}" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 16px; margin-top: 20px;">Download audio files</a>
                <p style="color: #555; font-size: 16px;">This link will expire after 3 days. Please download the files as soon as possible!</p>
                <div style="margin-top: 40px; font-size: 12px; color: #777; text-align: center;">
                    <p>Enjoy and be blessed!</p>
                    <p>&copy; 2024 darikletter</p>
                </div>
            </div>
        </div>
    `
  const fromEmail = `RBTC Audio Converter <${process.env.MAIL_USER}>`

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmails,
      subject: "RBTC converted audios",
      html: emailBody,
    })

    logger.info(`Email was sent for jobId: ${jobId}`)
  } catch (error) {
    logger.error(`Failed to send email for jobId: ${jobId}`, error)
    throw error
  }
}

export default sendEmail
