/**
 * Hệ thống chấm điểm phát âm giao diện vòng tròn động
 * Phát triển cho dự án học ngôn ngữ của gia đình anh Bùi Bích Nam
 */

let evalRecognition = null;
let isEvalRecording = false;

// Hàm khởi tạo bộ máy nhận diện giọng nói AI
function initEvalSpeech() {
    if (evalRecognition) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Thiết bị hoặc Webview của bạn không hỗ trợ nhận diện giọng nói trực tiếp!");
        return;
    }

    evalRecognition = new SpeechRecognition();
    evalRecognition.continuous = false;
    evalRecognition.interimResults = false;

    evalRecognition.onresult = function(event) {
        const studentText = event.results[0][0].transcript;
        const targetText = filteredList[idx].word;
        
        // Tính toán phần trăm tương đồng giữa hai chuỗi ký tự
        const score = calculateEvalSimilarity(targetText, studentText);
        
        // Cập nhật vòng tròn điểm số trực quan
        updateScoreCircle(score, studentText, targetText);
    };

    evalRecognition.onerror = function(event) {
        console.error("Lỗi thu âm:", event.error);
        stopEvalRecordingUI();
        if(event.error === 'not-allowed') {
            alert("Vui lòng cấp quyền sử dụng Micro trong cài đặt ứng dụng điện thoại!");
        }
    };

    evalRecognition.onend = function() {
        stopEvalRecordingUI();
    };
}

// Hàm Bật/Tắt trạng thái ghi âm từ nút bấm hình tròn
function toggleEvalRecording() {
    initEvalSpeech();
    if (!evalRecognition) return;

    if (!isEvalRecording) {
        const currentGroup = filteredList[idx].group;
        // Tự động cấu hình mã ngôn ngữ: Tiếng Trung cho con gái, tiếng Việt cho bạn người Trung
        evalRecognition.lang = (currentGroup === "tieng_trung") ? 'zh-CN' : 'vi-VN';

        try {
            document.getElementById("internalAudioPlayer").pause();
            evalRecognition.start();
            isEvalRecording = true;
            
            // Đổi hiệu ứng nút ghi âm sang trạng thái đang thu
            const recordBtn = document.getElementById("btnEvalRecordTrigger");
            recordBtn.style.background = "#ff4d4f";
            recordBtn.innerHTML = "🛑<br><span style='font-size:12px;'>Dừng...</span>";
            
            // Tạm ẩn kết quả cũ khi bắt đầu lượt đọc mới
            document.getElementById("evalResultDetails").style.visibility = "hidden";
            updateCircleProgress(0, "#ccc"); // Đưa vòng tròn về mặc định ban đầu
        } catch (e) {
            console.error(e);
        }
    } else {
        evalRecognition.stop();
    }
}

function stopEvalRecordingUI() {
    isEvalRecording = false;
    const recordBtn = document.getElementById("btnEvalRecordTrigger");
    if (recordBtn) {
        recordBtn.style.background = "#4CAF50";
        recordBtn.innerHTML = "🎙️<br><span style='font-size:12px;'>Nhấn đọc</span>";
    }
}

// Thuật toán khoảng cách chuỗi để chấm điểm chính xác
function calculateEvalSimilarity(s1, s2) {
    let str1 = s1.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    let str2 = s2.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    if (str1 === str2) return 100;
    if (str1.length === 0 || str2.length === 0) return 0;

    let matrix = [];
    for (let i = 0; i <= str1.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
            if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    let distance = matrix[str1.length][str2.length];
    let maxLength = Math.max(str1.length, str2.length);
    return Math.round(((maxLength - distance) / maxLength) * 100);
}

// Cập nhật hoạt họa điền đầy vòng tròn và đổi màu theo điểm số
function updateScoreCircle(score, studentText, targetText) {
    let color = "#F44336"; // Đỏ mờ nếu điểm thấp
    if (score >= 80) {
        color = "#4CAF50"; // Xanh lá cây nếu phát âm chuẩn
    } else if (score >= 50) {
        color = "#FF9800"; // Vàng cam nếu ở mức trung bình khá
    }

    // Chạy hiệu ứng lấp đầy vòng tròn SVG
    updateCircleProgress(score, color);

    // Hiển thị chi tiết chữ nhận diện được dưới vòng tròn
    const details = document.getElementById("evalResultDetails");
    const docText = document.getElementById("evalResultComparisonText");
    
    details.style.visibility = "visible";
    docText.innerHTML = `Mẫu chuẩn (标准): <b style="color:#5c4cf4">${targetText}</b><br>Bạn đọc (你读): <b style="color:${color}">${studentText}</b>`;
}

// Hàm tính toán thuộc tính stroke-dashoffset của hình tròn SVG
function updateCircleProgress(percent, color) {
    const circle = document.getElementById("svgProgressCircleBar");
    const text = document.getElementById("evalCirclePercentText");
    
    // Chu vi vòng tròn bán kính r=54 là 2 * Math.PI * 54 ≈ 339.29
    const circumference = 339.292; 
    const offset = circumference - (percent / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = color;
    text.innerText = percent + "%";
    text.style.fill = color;
}

// Quản lý đóng/mở cửa sổ Popup
function openEvalPopup() {
    if (filteredList.length === 0) { alert("Không có dữ liệu từ để thực hiện chấm điểm!"); return; }
    document.getElementById("mainAppZone").style.display = "none";
    document.getElementById("evalPopupModal").style.display = "block";
    
    // Reset giao diện vòng tròn về 0% ban đầu khi mở popup lên
    updateCircleProgress(0, "#ccc");
    document.getElementById("evalResultDetails").style.visibility = "hidden";
}

function closeEvalPopup() {
    stopEvalRecordingUI();
    if(evalRecognition) { try { evalRecognition.stop(); } catch(e){} }
    document.getElementById("evalPopupModal").style.display = "none";
    document.getElementById("mainAppZone").style.display = "block";
}
