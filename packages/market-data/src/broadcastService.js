const WebSocket = require('ws');

let _wss = null; // Biến để lưu WebSocket Server
let _clients = new Set(); // Sử dụng Set để quản lý các client

function start(httpServer) {
    if (httpServer) {
        // Nếu có httpServer, khởi tạo WebSocket Server trên đó
        _wss = new WebSocket.Server({ server: httpServer, path: './ws' });
        console.log('WebSocket Server started on path ./ws');
    } else {
        // Nếu không có httpServer, khởi tạo WebSocket Server trên cổng riêng
        const port = parseInt(process.env.INTERNAL_PORT || '8080', 10);
        _wss = new WebSocket.Server({ port }, () => {
            console.log(`WebSocket Server started on port ${port} at path ./ws`);
        });
    }

    _wss.on('connection', (ws, req) => {
        console.log('New client connected');
        const ip = req.socket.remoteAddress; // Lấy địa chỉ IP của client
        console.log(`Client IP: ${ip}`);
        _clients.add(ws); // Thêm client vào Set

        ws.send(JSON.stringify({
            type: 'CONNECTION_STATUS',
            payload: { status: 'CONNECTED', timestamp: Date.now() },
        }));

        ws.on('close', () => {
            _clients.delete(ws); // Xóa client khỏi Set khi ngắt kết nối
            console.log('Client disconnected');
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
    _wss.on('error', (error) => {
        console.error('WebSocket Server error:', error);
    });
}

function broadcast(data) {

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    let sent = 0;

    for (const client of _clients) {
        if (client.readyState === WebSocket.OPEN) { // Kiểm tra trạng thái kết nối trước khi gửi
            client.send(payload); // Gửi dữ liệu đến client
            sent++;
        }
    }
    if (sent > 0) {
        console.log(`Broadcasted message to ${sent} clients`);
    }
}

function stop() {
    if (_wss) {
        _wss.close(() => console.log('WebSocket Server stopped'));// Đóng WebSocket Server
    }
}

function clientCount() {
    return _clients.size; // Trả về số lượng client đang kết nối
}


module.exports = {
    start,
    broadcast,
    stop,
    clientCount,
};