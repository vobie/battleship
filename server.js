import express from 'express'
const app = express()
const port = 8000
app.use(express.static('public'))
app.listen(port, () => console.log(`Listening http://localhost:${port}`))
