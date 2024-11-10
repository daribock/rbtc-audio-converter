import Mailgun from "mailgun.js"
import formData from "form-data"
import logger from "./logger.js"
import { getZipFileName } from "./file-utils.js"

const domain = process.env.EMAIL_DOMAIN || ""
const mailgun = new Mailgun(formData)
const mg = mailgun.client({
  username: "api",
  key: process.env.EMAIL_API_KEY || "",
  url: "https://api.eu.mailgun.net",
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
  const fromEmail = `RBTC Audio Converter <no-reply@${domain}>`

  await mg.messages
    .create(domain, {
      from: fromEmail,
      to: toEmails,
      subject: "RBTC converted audios",
      html: emailBody,
    })
    .then(() => {
      logger.info(`Email was sent for jobId: ${jobId}`)
    })
}

export default sendEmail
