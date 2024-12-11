import dotenv from 'dotenv'

dotenv.config()

export default {
  port: Number(process.env.PORT!),
  secretJwt: process.env.SECRECT_JWT!,
  mongoUrl: process.env.MONGO_URL!,
  mailerServerUrl: process.env.MAILER_SERVER_URL!
}
