import { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL;

if (!BOT_TOKEN || !VERCEL_URL) {
  throw new Error('BOT_TOKEN and VERCEL_URL must be set in the environment variables.');
}

// Create a new Telegraf instance
const bot = new Telegraf(BOT_TOKEN);

// Define commands and handlers
bot.start((ctx) => {
  ctx.reply(
    'Здравствуйте! Меня зовут СКАЙ. Я информационный ресурс инновационного отделения РКБ им.Н.А.Семашко.\nКак я могу к Вам обращаться?'
  );
});

bot.on('text', (ctx) => {
  const userName = ctx.message.text;
  ctx.reply(
    `Приятно познакомиться, ${userName}! Вы планируете пройти реабилитацию в амбулаторном отделении?`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Да', callback_data: 'yes' }],
          [{ text: 'Нет, спасибо', callback_data: 'no' }],
        ],
      },
    }
  );
});

bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;

  if (callbackData === 'yes') {
    await ctx.reply(
      'Вы можете пройти курс реабилитации в РКБ им.Н.А.Семашко. Вот перечень необходимых документов: ...',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Записаться на приём', callback_data: 'register' }],
            [{ text: 'Отмена', callback_data: 'cancel' }],
          ],
        },
      }
    );
  } else if (callbackData === 'no') {
    await ctx.reply(
      'Мне было приятно Вам помочь! Желаю Вам здоровья и благополучия!\nСКАЙ, Информационный ресурс амбулаторного отделения РКБ им.Н.А.Семашко.'
    );
  } else if (callbackData === 'register') {
    await ctx.reply(
      'Для записи на приём позвоните по телефону: +79025313017.'
    );
  } else if (callbackData === 'cancel') {
    await ctx.reply('Чтобы начать сначала, напишите /start.');
  }

  await ctx.answerCbQuery();
});

// Webhook setup
export default async function handle(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
    } else {
      res.status(200).send('Bot is running');
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).send('Server error');
  }
}

// Set webhook
(async () => {
  const webhookUrl = `${VERCEL_URL}/api`; // Ensure your webhook points to /api
  await bot.telegram.setWebhook(webhookUrl);
  console.log(`Webhook set to ${webhookUrl}`);
})();
