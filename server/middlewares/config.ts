export const PORT: number = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 3000

export const HEADERS = {
  'Content-Type': 'application/json'
}
