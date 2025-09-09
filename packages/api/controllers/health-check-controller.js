import express from "express"

export default function () {
  const router = express.Router()
  router
    .get("/ready", (_, res) => {
      res.status(200).json({
        status: "READY",
      })
    })
    .get("/live", (_, res) => {
      res.status(200).json({
        status: "LIVE",
      })
    })

  return router
}
