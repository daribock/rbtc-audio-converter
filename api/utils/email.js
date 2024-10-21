import nodemailer from "nodemailer"
import logger from "./logger.js"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// TODO: add downloadlink to html or text
const sendEmail = async (recipient, jobId) => {
  await transporter
    .sendMail({
      from: "info@demomailtrap.com", // sender address
      to: recipient, // list of receivers
      subject: "RBTC converted audios", // Subject line
      text: "Test", // plain text body
    })
    .then(() => {
      logger.info(`Email was sent for jobId: ${jobId}`)
    })
}

export default sendEmail
