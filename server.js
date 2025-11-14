const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ذخیره پیام‌ها در سرور
let messages = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('کاربر متصل شد:', socket.id);

    // ارسال پیام
    socket.on('send-message', (data) => {
        if (!messages[data.chatId]) {
            messages[data.chatId] = [];
        }
        
        const message = {
            id: Date.now(),
            text: data.text,
            sender: data.sender,
            timestamp: new Date().toISOString(),
            chatId: data.chatId,
            status: 'delivered',
            isEdited: false,
            isDeleted: false
        };
        
        messages[data.chatId].push(message);
        io.emit('receive-message', message);
    });

    // ویرایش پیام
    socket.on('edit-message', (data) => {
        if (messages[data.chatId]) {
            const messageIndex = messages[data.chatId].findIndex(m => m.id === data.messageId);
            if (messageIndex !== -1 && messages[data.chatId][messageIndex].sender === data.sender) {
                messages[data.chatId][messageIndex].text = data.newText;
                messages[data.chatId][messageIndex].isEdited = true;
                messages[data.chatId][messageIndex].editedAt = new Date().toISOString();
                
                io.emit('message-edited', {
                    messageId: data.messageId,
                    newText: data.newText,
                    chatId: data.chatId,
                    editedAt: messages[data.chatId][messageIndex].editedAt
                });
            }
        }
    });

    // حذف پیام
    socket.on('delete-message', (data) => {
        if (messages[data.chatId]) {
            const messageIndex = messages[data.chatId].findIndex(m => m.id === data.messageId);
            if (messageIndex !== -1 && messages[data.chatId][messageIndex].sender === data.sender) {
                messages[data.chatId][messageIndex].isDeleted = true;
                messages[data.chatId][messageIndex].deletedAt = new Date().toISOString();
                
                io.emit('message-deleted', {
                    messageId: data.messageId,
                    chatId: data.chatId
                });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('کاربر قطع شد:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`سرور پیامرسان سعدی روی پورت ${PORT} اجرا شد`);
});
