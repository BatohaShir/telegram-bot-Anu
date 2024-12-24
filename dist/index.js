"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handle;
const telegraf_1 = require("telegraf");
const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL;
if (!BOT_TOKEN || !VERCEL_URL) {
    throw new Error('BOT_TOKEN and VERCEL_URL must be set in the environment variables.');
}
// Create a new Telegraf instance
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
// Define commands and handlers
bot.start((ctx) => {
    ctx.reply('Здравствуйте! Меня зовут СКАЙ. Я информационный ресурс инновационного отделения РКБ им.Н.А.Семашко.\nКак я могу к Вам обращаться?');
});
bot.on('text', (ctx) => {
    const userName = ctx.message.text;
    ctx.reply(`Приятно познакомиться, ${userName}! Вы планируете пройти реабилитацию в амбулаторном отделении?`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Да', callback_data: 'yes' }],
                [{ text: 'Нет, спасибо', callback_data: 'no' }],
            ],
        },
    });
});
bot.on('callback_query', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = ctx.callbackQuery.data;
    if (callbackData === 'yes') {
        yield ctx.reply('Вы можете пройти курс реабилитации в РКБ им.Н.А.Семашко. Вот перечень необходимых документов: ...', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Записаться на приём', callback_data: 'register' }],
                    [{ text: 'Отмена', callback_data: 'cancel' }],
                ],
            },
        });
    }
    else if (callbackData === 'no') {
        yield ctx.reply('Мне было приятно Вам помочь! Желаю Вам здоровья и благополучия!\nСКАЙ, Информационный ресурс амбулаторного отделения РКБ им.Н.А.Семашко.');
    }
    else if (callbackData === 'register') {
        yield ctx.reply('Для записи на приём позвоните по телефону: +79025313017.');
    }
    else if (callbackData === 'cancel') {
        yield ctx.reply('Чтобы начать сначала, напишите /start.');
    }
    yield ctx.answerCbQuery();
}));
// Webhook setup
function handle(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (req.method === 'POST') {
                yield bot.handleUpdate(req.body);
            }
            else {
                res.status(200).send('Bot is running');
            }
        }
        catch (error) {
            console.error('Error handling request:', error);
            res.status(500).send('Server error');
        }
    });
}
// Set webhook
(() => __awaiter(void 0, void 0, void 0, function* () {
    const webhookUrl = `${VERCEL_URL}/api`; // Ensure your webhook points to /api
    yield bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook set to ${webhookUrl}`);
}))();
