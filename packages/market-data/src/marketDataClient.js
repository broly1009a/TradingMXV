const WebSocket = require('ws');

const broadcast = require('./broadcastService');

const { createReconnectHandler } = require('./reconnectHandler');

const WS_URL = process.env.WS_URL || 'ws://localhost:8080/ws';

let _ws = null; // Biến để lưu WebSocket client

const reconnectHandler = createReconnectHandler('MarketDataClient', () => connect()); // Tạo reconnect handler với tên và hàm kết nối

async function connect() {
    console.log(`Connecting to WebSocket server at ${WS_URL}...`);

    try {

        console.log(`Attempting to connect to ${WS_URL}...`);
        const apiKey = process.env.MXV_WS_PASSWORD || ''; // Lấy API key từ biến môi trường nếu cần thiết
        _ws = new WebSocket(WS_URL, {
            rejectUnauthorized: process.env.NODE_ENV === 'production', // Bỏ qua lỗi chứng chỉ nếu sử dụng wss với chứng chỉ tự ký
            headers: {
                'X-API-Key': apiKey, // Thêm header API key nếu cần thiết
            },
        });

        _ws.on('open', () => {
            console.log('WebSocket connection established');
            reconnectHandler.reset(); // Đặt lại reconnect handler khi kết nối thành công
        });

        _ws.on('message', (data) => {
            try{
                const text = Buffer.isBuffer(data) ? data.toString('utf8') : data.toString(); // Chuyển đổi Buffer thành string nếu cần thiết
                if(text.includes('8=FIX')){ // Kiểm tra nếu message có chứa chuỗi FIX
                 const normalized = normalizeExchangeData(text); // Chuẩn hóa dữ liệu FIX
                 if(normalized){
                    broadcast.broadcast(normalized); // Phát dữ liệu đã chuẩn hóa đến các client
                }   
            } else{
                const data = JSON.parse(text); // Nếu không phải FIX, giả sử là JSON và phân tích nó
                const normalized = parseJsonMarketData(data); // Chuẩn hóa dữ liệu JSON
                if(normalized){
                    broadcast.broadcast(normalized); // Phát dữ liệu đã chuẩn hóa đến các client
                }
            }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

        _ws.on('close', (code, reason) => {
            console.warn(`WebSocket connection closed: ${code} - ${reason}`);
            reconnectHandler.scheduleReconnect(); // Lên lịch kết nối lại khi kết nối bị đóng
        });

        _ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    } catch (error) {
        console.error('Failed to connect to WebSocket server:', error);
        reconnectHandler.scheduleReconnect(); // Lên lịch kết nối lại nếu có lỗi khi cố gắng kết nối
    }
}

// Hàm để chuẩn hóa dữ liệu từ sàn giao dịch nếu định dạng là FIX
function normalizeExchangeData(raw){
 
if(!raw || !raw.symbol){ return null; } // Nếu không có dữ liệu hoặc không có trường symbol, trả về null
return {
    type: 'MARKET_DATA_UPDATE',
    payload: {
        symbol: raw.symbol, // Lấy symbol từ dữ liệu gốc
        lastPrice: raw.last || raw.price || raw.lastPrice, // Lấy giá cuối cùng từ trường last hoặc price, tùy theo định dạng của sàn
        lastVol: ra.lastVol || raw.volume || raw.lastVolume, // Lấy khối lượng cuối cùng từ trường lastVol hoặc volume
        prevPrice: raw.prevClose || raw.prevPrice, // Lấy giá trước đó từ trường prevClose hoặc prevPrice
        bid: raw.bid || raw.bestBid, // Lấy giá mua từ trường bid hoặc bestBid
        ask: raw.ask || raw.bestAsk, // Lấy giá bán từ trường ask hoặc bestAsk
        askVol: raw.askVol || raw.bestAskVolume, // Lấy khối lượng bán từ trường askVol hoặc bestAskVolume
        bidVol: raw.bidVol || raw.bestBidVolume, // Lấy khối lượng mua từ trường bidVol hoặc bestBidVolume
        openPrice: raw.open || raw.openPrice, // Lấy giá mở cửa từ trường open hoặc openPrice
        closePrice: raw.close || raw.closePrice, // Lấy giá đóng cửa từ trường close hoặc closePrice
        highPrice: raw.high || raw.highPrice, // Lấy giá cao nhất từ trường high hoặc highPrice 
        lowPrice: raw.low || raw.lowPrice, // Lấy giá thấp nhất từ trường low hoặc lowPrice
        change: raw.change || raw.chg, // Lấy mức thay đổi giá từ trường change hoặc priceChange
        changePct: raw.changePct || raw.chgPct, // Lấy phần trăm thay đổi giá từ trường changePct hoặc priceChangePercent
        timestamp: raw.timestamp || Date.now(), // Lấy timestamp từ trường timestamp hoặc sử dụng thời gian hiện tại nếu không có

}
}
}

function parseFixMarketData(fixString){
    // Hàm này sẽ phụ thuộc vào định dạng cụ thể của dữ liệu FIX mà bạn nhận được từ sàn giao dịch
    // Bạn cần phân tích cấu trúc của dữ liệu FIX và trích xuất các trường cần thiết để tạo ra đối tượng chuẩn hóa
const parts = fixString.split('\x01'); // Giả sử các trường được phân tách bằng ký tự SOH (0x01)
const msg = {};

for(const part of parts){
    if(!part){ continue; } // Bỏ qua phần rỗng
    const equalIndex = part.indexOf('=');// Tìm vị trí của dấu '=' để tách tag và value
    if(equalIndex !==-1){// Nếu có dấu '=', tách tag và value
        msg[part.substring(0,equalIndex)] = part.substring(equalIndex + 1); // Lưu tag và value vào đối tượng msg
    }
}

 if(msg['35'] !== 'X'){ return null; } // Nếu message không phải là loại Market Data Snapshot (35=X), trả về null

 const symbol = msg['55']; // Lấy symbol từ tag 55
  let bid = null, ask = null, lastPrice = null, prevPrice = null;
  let bidVol = null, askVol = null, lastVol = null;
  let openPrice = null, closePrice = null, highPrice = null, lowPrice = null;
  let currentEntryType = null; // Biến để theo dõi loại entry hiện tại (bid, ask, last)
  let currentPos = null; // Biến để theo dõi vị trí hiện tại trong message
  let currentPx = null; // Biến để theo dõi giá hiện tại khi phân tích message

  //
  for(const part of parts){
    if(!part) continue; // Bỏ qua phần rỗng
    const equalIndex = part.indexOf('=');
    if(equalIndex === -1) continue; // Bỏ qua phần không có dấu '='
    const key = part.substring(0,equalIndex);
    const value = part.substring(equalIndex + 1);

    if(key === '269'){ // Tag 269 xác định loại entry (0=bid, 1=ask, 2=last)
        currentEntryType = value; // Cập nhật loại entry hiện tại
        currentPos = null; // Đặt lại vị trí khi gặp entry mới
        currentPx = null; // Đặt lại giá hiện tại khi gặp entry mới
  }