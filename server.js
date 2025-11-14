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

// میدلور
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// route اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// socket.io برای چت real-time
io.on('connection', (socket) => {
    console.log('کاربر متصل شد:', socket.id);

    socket.on('send-message', (data) => {
        console.log('پیام دریافت شد:', data);
        io.emit('receive-message', data);
    });

    socket.on('disconnect', () => {
        console.log('کاربر قطع شد:', socket.id);
    });
});

// اجرای سرور
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ سرور پیامرسان سعدی روی پورت ${PORT} اجرا شد`);
    console.log(`🌐 آدرس: http://localhost:${PORT}`);
});