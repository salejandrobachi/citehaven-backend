import app from '../api/app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor listo en: http://localhost:${PORT}/`);
});