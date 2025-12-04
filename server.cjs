// server.cjs
const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()

// Pfad zum gebauten Quasar-Frontend
const distPath = path.join(__dirname, 'dist/spa')

const certPath = '/etc/ssl/ginwalkers'

let options
try {
  options = {
    key: fs.readFileSync(`${certPath}/privkey.pem`),
    cert: fs.readFileSync(`${certPath}/fullchain.pem`),
  }
  console.log('SSL Certificates loaded')
} catch (err) {
  console.error('Could not load SSL certificates:', err)
  options = null
}

let server
if (options) {
  const https = require('https')
  server = https.createServer(options, app)
} else {
  const http = require('http')
  server = http.createServer(app)
}

// Statische Dateien ausliefern
app.use(
  express.static(distPath, {
    extensions: ['html'],
    maxAge: 1000 * 60 * 60,
    setHeaders: customCacheControl,
  }),
)

function customCacheControl(res, file) {
  if (path.extname(file) === 'html') {
    res.setHeaders('Cache-Control', 'public, max-age = 0')
  }
}

const PORT = 443

app.use(express.static(distPath))

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

server.listen(PORT, () => {
  console.log('Server running on ', PORT)
})
