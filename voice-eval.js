/**
 * Hệ thống chấm điểm phát âm có danh sách chọn từ mục tiêu để so sánh
 * Phát triển cho dự án của anh Bùi Bích Nam
 */

let evalRecognition = null;
let isEvalRecording = false;
let currentEvalTargetWord = ""; // Lưu trữ từ mẫu đang được chọn để so sánh

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
        
        // Tính toán phần trăm tương đồng dựa trên từ mẫu đang chọn trong danh sách công cụ
        const score = calculateEvalSimilarity(currentEvalTargetWord, studentText);
        
        // Cập nhật vòng tròn điểm số trực quan
        updateScoreCircle(score, studentText, currentEvalTargetWord);
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

// Hàm cập nhật từ mẫu khi người dùng thay đổi lựa chọn trong danh sách thả xuống của Popup
function handleEvalWordSelectChange(selectedValue) {
    if (!selectedValue) return;
    currentEvalTargetWord = selectedValue;
    
    // Đưa giao diện vòng tròn về trạng thái chuẩn bị ban đầu
    updateCircleProgress(0, "#ccc");
    document.getElementById("evalResultDetails").style.visibility = "hidden";
}

// Hàm Bật/Tắt trạng thái ghi âm từ nút bấm hình tròn
function toggleEvalRecording() {
    if (!currentEvalTargetWord) {
        alert("Vui lòng chọn một âm/từ trong danh sách trước khi ghi âm!");
        return;
    }
    
    initEvalSpeech();
    if (!evalRecognition) return;

    if (!isEvalRecording) {
        // Tự động tìm nhóm của từ hiện tại để cấu hình mã ngôn ngữ phù hợp
        const foundItem = database.find(item => item.word === currentEvalTargetWord);
        const currentGroup = foundItem ? foundItem.group : "chu_cai";
        
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
            updateCircleProgress(0, "#ccc");
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
    
    const circumference = 339.292; 
    const offset = circumference - (percent / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    circle.style.stroke = color;
    text.innerText = percent + "%";
    text.style.fill = color;
}

// Quản lý mở cửa sổ Popup và dựng danh sách chọn từ linh hoạt
function openEvalPopup() {
    if (filteredList.length === 0) { 
        alert("Không có dữ liệu từ để thực hiện chấm điểm!"); 
        return; 
    }
    
    document.getElementById("mainAppZone").style.display = "none";
    document.getElementById("evalPopupModal").style.display = "block";
    
    // Tự động gán từ mẫu mặc định là từ hiện tại trên Card đang học
    currentEvalTargetWord = filteredList[idx].word;
    
    // Đổ danh sách các từ đang được lọc vào ô Select để người dùng tiện chuyển đổi chọn từ nhanh
    const selectElement = document.getElementById("evalWordSelector");
    selectElement.innerHTML = ""; // Xóa dữ liệu cũ
    
    filteredList.forEach((item) => {
        const isSelected = (item.word === currentEvalTargetWord) ? "selected" : "";
        selectElement.innerHTML += `<option value="${item.word}" ${isSelected}>${item.word} (${item.mean})</option>`;
    });

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
