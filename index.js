const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const path = require("path");

const app = express();
const TOKEN = "7822342149:AAErV0ppnFOAOFWIAfOJUqiykHG5PBfs_eU";
const bot = new TelegramBot(TOKEN, { webHook: true });

const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = `https://telegram-bot-anu.onrender.com/api/webhook`;

bot.setWebHook(WEBHOOK_URL);

const userNames = {};
const messageHistory = {}; // Хранение истории сообщений для каждого чата

app.use(express.json());

app.post("/api/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.use(express.static(path.join(__dirname, "public")));

// Утилита для сохранения сообщения в историю
function saveMessage(chatId, messageId) {
  if (!messageHistory[chatId]) {
    messageHistory[chatId] = [];
  }
  messageHistory[chatId].push(messageId);
}

// Утилита для удаления всех сообщений из истории
async function deleteMessageHistory(chatId) {
  if (messageHistory[chatId]) {
    for (const messageId of messageHistory[chatId]) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        console.error(`Ошибка удаления сообщения ${messageId}:`, error.message);
      }
    }
    messageHistory[chatId] = []; // Очищаем историю после удаления
  }
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const message = `
Здравствуйте, меня зовут СКАЙ! 🤖

Я информационный ресурс Инновационного амбулаторного отделения медицинской реабилитации РКБ им.Н.А.Семашко.

Как я могу к Вам обращаться? 👇
`;
  const photoPath = path.join(__dirname, "photo.jpg");
  const sentMessage = await bot.sendPhoto(chatId, photoPath, { caption: message });
  saveMessage(chatId, sentMessage.message_id);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/start") return;

  const userName = msg.text;
  userNames[chatId] = userName;

  const sentMessage = await bot.sendMessage(
    chatId,
    `Приятно познакомиться, ${userName}! 😊 Вы планируете пройти реабилитацию в амбулаторном отделении?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Да", callback_data: "yes" },
            { text: "❌ Нет, спасибо", callback_data: "no" },
          ],
        ],
      },
    }
  );
  saveMessage(chatId, sentMessage.message_id);
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userName = userNames[chatId] || "Уважаемый пользователь";

  if (query.data === "yes") {
    const message = `
${userName}, Вы можете пройти курс реабилитации в РКБ им.Н.А.Семашко, согласовав с вашим лечащим врачом. Вот перечень документов, которые необходимо иметь при себе:
...
`;
    const sentMessage = await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📅 Записаться на приём", callback_data: "register" },
            { text: "🔄 Начать сначала", callback_data: "restart" },
          ],
        ],
      },
    });
    saveMessage(chatId, sentMessage.message_id);
  } else if (query.data === "no") {
    const sentMessage = await bot.sendMessage(
      chatId,
      `${userName}, мне было приятно Вам помочь! 😊\n\nЖелаю Вам здоровья и благополучия! 💐`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Начать сначала", callback_data: "restart" }],
          ],
        },
      }
    );
    saveMessage(chatId, sentMessage.message_id);
  } else if (query.data === "register") {
    const sentMessage = await bot.sendMessage(
      chatId,
      "Для записи на приём позвоните по телефону:\n📞 +79025313017\n\nНаши специалисты ответят на все вопросы! 📋",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📍 Местоположение", callback_data: "location" }],
            [{ text: "🔄 Начать сначала", callback_data: "restart" }],
          ],
        },
      }
    );
    saveMessage(chatId, sentMessage.message_id);
  } else if (query.data === "location") {
    const sentMessage = await bot.sendMessage(
      chatId,
      "📍 РКБ им. Н.А. Семашко находится по адресу:\n\n**г. Улан-Удэ, Ул. Павлова, 12, корпус 1**",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🗺️ Открыть местоположение в 2Gis",
                url: "https://2gis.ru/ulanude/firm/70000001041029095?m=107.613031%2C51.805952%2F18.47",
              },
            ],
            [{ text: "🔄 Начать сначала", callback_data: "restart" }],
          ],
        },
      }
    );
    saveMessage(chatId, sentMessage.message_id);
  } else if (query.data === "restart") {
    // Удаляем всю историю сообщений
    await deleteMessageHistory(chatId);

    // Отправляем стартовое сообщение заново
    const message = `
Здравствуйте, меня зовут СКАЙ! 🤖

Я информационный ресурс Инновационного амбулаторного отделения медицинской реабилитации РКБ им.Н.А.Семашко.

Как я могу к Вам обращаться? 👇
`;
    const photoPath = path.join(__dirname, "photo.jpg");
    const sentMessage = await bot.sendPhoto(chatId, photoPath, { caption: message });
    saveMessage(chatId, sentMessage.message_id);
  }

  bot.answerCallbackQuery(query.id);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

module.exports = app;
