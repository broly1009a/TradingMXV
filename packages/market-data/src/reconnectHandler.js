


const DELAYS_MS = process.env.RECONNECT_DELAYS
? process.env.RECONNECT_DELAYS.split(',').map(Number)
: [1000, 5000, 10000]; // Độ trễ mặc định

function createReconnectHandler(name, connectFn){
  let attempt = 0; // Số lần thử kết nối lại
  let timer = null; // Biến để lưu timer
  let active = false; // Trạng thái kết nối

  function scheduleReconnect(){
    if(!active){ return; } // Nếu không còn active, không lên lịch lại
    const delay = DELAYS_MS[Math.min(attempt, DELAYS_MS.length-1)]// Lấy độ trễ tương ứng với số lần thử
    attempt++; // Tăng số lần thử
    console.log(`[${name}] Connection lost. Attempting to reconnect in ${delay} ms... (Attempt ${attempt})`);

    timer = setTimeout(async()=>{
        if(!active){ return; } // Nếu không còn active, không thực hiện kết nối
        try{
            console.log(`[${name}] Attempting to reconnect...`);
            await connectFn(); // Thử kết nối lại
        } catch (error) {
            console.error(`[${name}] Failed to reconnect:`, error);
            scheduleReconnect(); // Lên lịch lại nếu kết nối thất bại
        }
    },delay);
}

 function reset(){
       attempt = 0 ; // Đặt lại số lần thử về 0 khi kết nối thành công
       if(timer){
        clearTimeout(timer); // Hủy timer nếu còn tồn tại
        timer = null;
       }
         console.log(`[${name}] Connection successful. Reconnect handler reset.`);
 }
function stop(){
    active = false; // Đánh dấu không còn active
    if(timer){
        clearTimeout(timer); // Hủy timer nếu còn tồn tại
        timer = null;
    }
    console.log(`[${name}] Reconnect handler stopped.`);
}
 return {
    scheduleReconnect,
    reset,
    stop
 }
}

module.exports = createReconnectHandler;