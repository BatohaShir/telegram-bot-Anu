const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

// Настройки
const TOKEN = "7822342149:AAErV0ppnFOAOFWIAfOJUqiykHG5PBfs_eU";
const bot = new TelegramBot(TOKEN, { webHook: true });
const WEBHOOK_URL = `https://telegram-bot-anu.vercel.app/api/bot`;

// Устанавливаем Webhook
bot.setWebHook(WEBHOOK_URL);

const app = express();
app.use(express.json());

// Обработка Webhook
app.post("/api/bot", async (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing Webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const message = `
Здравствуйте, меня зовут СКАЙ!

Я информационный ресурс инновационного отделения РКБ им.Н.А.Семашко.

Как я могу к Вам обращаться? 👇
`;
  const photoUrl = `https://telegram-bot-anu.vercel.app/photo.jpg`;
  bot.sendPhoto(chatId, photoUrl, { caption: message });
});

// Обработчик сообщений
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  if (msg.text === "/start") return;

  const userName = msg.text;
  bot.sendMessage(
    chatId,
    `Приятно познакомиться, ${userName}! Вы планируете пройти реабилитацию в амбулаторном отделении?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Да", callback_data: "yes" },
            { text: "Нет, спасибо", callback_data: "no" },
          ],
        ],
      },
    }
  );
});

// Обработчик CallbackQuery
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "yes") {
    const message = `
Для прохождения реабилитации необходимо предоставить следующие документы:
1. Паспорт.
2. Медицинский полис.
3. СНИЛС.
    `;
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Записаться на приём", callback_data: "register" },
            { text: "Отмена", callback_data: "cancel" },
          ],
        ],
      },
    });
  } else if (query.data === "register") {
    bot.sendMessage(
      chatId,
      "Для записи на приём позвоните по телефону:\n+79025313017",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Местоположение", callback_data: "location" }],
            [{ text: "Начать сначала", callback_data: "restart" }],
          ],
        },
      }
    );
  } else if (query.data === "location") {
    bot.sendMessage(
      chatId,
      "РКБ им. Н.А. Семашко находится по адресу:\n\nг. Улан-Удэ, Ул. Павлова, 12, корпус 1",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Открыть местоположение в 2Gis",
                url: "https://2gis.ru/ulanude/firm/70000001041029095",
              },
            ],
          ],
        },
      }
    );
  } else if (query.data === "cancel" || query.data === "restart") {
    bot.sendMessage(chatId, "Чтобы начать сначала, введите /start.");
  }

  bot.answerCallbackQuery(query.id);
});

module.exports = app;
