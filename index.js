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

// Утилита для сохранения сообщений в истории
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
    
    1. "Направление на консультацию" (Форма N 057/y-04) ГАУЗ «РКБ им. Н.А. Семашко» (Обоснование направления - консультация реабилитолога, физическая и реабилитационная медицина).
    
    2. Копия осмотра специалиста, направившего на консультацию, с указанием клинического диагноза, а также результатов проведенных лабораторных (ОАК, ОАМ, БАК, флюорография), инструментальных (рентгенограммы, данные КТ, МРТ, ЭНМГ и др.) и других видов исследования по профилю заболевания пациента, сведений о перенесенных и хронических заболеваниях.
    
    3. Копию выписного эпикриза предыдущих госпитализаций (при наличии).
    
    4. Паспорт, страховой медицинский полис, СНИЛС.
    
    5. "Медицинская карта пациента, получающего медицинскую помощь в амбулаторных условиях" (форма N 025/у).
    
    6. Дуплексное сканирование вен нижних конечностей (при наличии парезов нижних конечностей).
    
    7. При наличии злокачественной опухоли в анамнезе - копия осмотра онколога с указанием диагноза и клинической группы.
    
    8. Для пациентов после СВО - направление МО РФ ФГКУ Военного госпиталя по установленной форме.
    
    9. Для пациентов ФКУЗ «МСЧ МВД» по РБ - направление установленной формы (Постановление правительства 1563).
    
    Примечание: При себе иметь удобную спортивную одежду/сменную обувь, маски, бахилы, пеленку.
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
      `${userName}, мне было приятно Вам помочь! 😊\n\nЖелаю Вам здоровья и благополучия! 💐\n\nСкай, информационный ресурс Инновационного амбулаторного отделения медицинской реабилитации РКБ им. Н.А.Семашко`,
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
  } else if (query.data === "video") {
    const loadingMessage = await bot.sendMessage(chatId, "⏳ Загружается видео...");
    saveMessage(chatId, loadingMessage.message_id);

    const videoPath = path.join(__dirname, "video.mp4");
    const sentMessage = await bot.sendVideo(chatId, videoPath, {
      caption: "🎥 Вот видеоинструкция, как пройти в корпус.",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 Начать сначала", callback_data: "restart" }],
        ],
      },
    });
    saveMessage(chatId, sentMessage.message_id);

    await bot.deleteMessage(chatId, loadingMessage.message_id);
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
