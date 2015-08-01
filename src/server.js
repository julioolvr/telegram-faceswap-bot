import express from 'express';
import bodyParser from 'body-parser';
import Bot from './bot';

const app = express();
const bot = new Bot();

app.use(bodyParser.json());

app.post('/update', (req, res) => {
  bot.respondTo(req.body.message);
  res.end();
});

export default app;
