// server.cjs
const express = require('express')
const path = require('path')

const app = express()

// Port (Standard: 3000 oder aus ENV)
const port = 80

// Pfad zum gebauten Quasar-Frontend
const distPath = path.join(__dirname, 'dist/spa')

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
    res.setHeaders('Chache-Control', 'public, max-age = 0')
  }
}

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, () => {
  console.log(`Frontend läuft auf http://localhost:${port}`)
})
