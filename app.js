const cloudStorageUrl = "https://cdn.jsdelivr.net/gh/tckzone/hoctiengviet@main/";

let activeGroups = ["chu_cai", "phu_am"];
let filteredList = [];
let idx = 0;

// Các biến phục vụ tính năng so sánh phát âm liên tiếp
let selectedCompareFiles = [];
let currentCompareIdx = 0;

window.onload = function() {
    renderTags();
    applyFilters();
    buildCompareCheckboxMenu(); // Khởi tạo danh sách từ chọn so sánh
};

// --- TÍNH NĂNG ⚙️ MENU SO SÁNH PHÁT ÂM ---

// 1. Ẩn hiện menu khi bấm nút 3 chấm
function toggleCompareMenu() {
    document.getElementById("compareMenu").classList.toggle("show");
}

// 2. Tự động gom toàn bộ 172 từ trong database ra danh sách Checkbox
function buildCompareCheckboxMenu() {
    const container = document.getElementById("compareCheckboxContainer");
    container.innerHTML = "";
    
    database.forEach((item, index) => {
        container.innerHTML += `
            <label class="compare-item-label">
                <input type="checkbox" value="${item.file}" data-word="${item.word}" onchange="handleCompareCheckboxChange()">
                ${item.word}
            </label>
        `;
    });
}

// 3. Xử lý khi học viên tích chọn hoặc bỏ tích từ vựng
function handleCompareCheckboxChange() {
    const checkboxes = document.querySelectorAll("#compareCheckboxContainer input[type='checkbox']");
    let selectedWords = [];
    selectedCompareFiles = [];

    checkboxes.forEach(cb => {
        if (cb.checked) {
            selectedWords.push(cb.getAttribute("data-word"));
            selectedCompareFiles.push(cb.value); // Lưu link file nhạc tương ứng
        }
    });

    // Cập nhật hiển thị vào ô input cho học viên nhìn thấy
    document.getElementById("compareWordsInput").value = selectedWords.join(" → ");
}

// 4. Nút xóa sạch các lựa chọn so sánh
function clearCompareSelection() {
    const checkboxes = document.querySelectorAll("#compareCheckboxContainer input[type='checkbox']");
    checkboxes.forEach(cb => cb.checked = false);
    document.getElementById("compareWordsInput").value = "";
    selectedCompareFiles = [];
    document.getElementById("compareAudioPlayer").pause();
}

// 5. THUẬT TOÁN ĐỌC LẦN LƯỢT TỪNG ÂM NỐI ĐUÔI NHAU
function startComparePlayback() {
    if (selectedCompareFiles.length === 0) {
        alert("请先勾选想要对比的字母！(Vui lòng tích chọn từ cần so sánh trước!)");
        return;
    }
    
    // Thu nhỏ menu thả xuống lại để nhìn màn hình cho thoáng khi đang đọc
    document.getElementById("compareMenu").classList.remove("show");
    
    const player = document.getElementById("compareAudioPlayer");
    document.getElementById("internalAudioPlayer").pause(); // Dừng trình phát chính nếu có
    
    currentCompareIdx = 0; // Bắt đầu từ từ đầu tiên trong danh sách chọn
    playNextCompareTrack(player);
}

function playNextCompareTrack(player) {
    if (currentCompareIdx >= selectedCompareFiles.length) {
        console.log("Đã phát xong toàn bộ danh sách so sánh.");
        return;
    }

    const finalUrl = cloudStorageUrl + selectedCompareFiles[currentCompareIdx];
    player.src = encodeURI(finalUrl);
    player.load();
    
    player.play().catch(e => console.log("Lỗi phát audio so sánh: ", e));

    // Bắt sự kiện: Khi bài nhạc hiện tại phát XONG (ended) -> Tự động kích hoạt bài tiếp theo
    player.onended = function() {
        currentCompareIdx++;
        // Tạo một khoảng nghỉ ngắn 400 mili-giây giữa 2 từ để học viên kịp định hình âm thanh
        setTimeout(() => {
            playNextCompareTrack(player);
        }, 400);
    };
}

// --- CÁC HÀM LOGIC GIAO DIỆN FLASHCARD GỐC GIỮ NGUYÊN ---

function renderTags() {
    const box = document.getElementById("tagBox");
    box.innerHTML = "";
    activeGroups.forEach(g => {
        let labelText = g.toUpperCase();
        if(g === "chu_cai") labelText = "字母表";
        if(g === "phu_am") labelText = "辅音";
        box.innerHTML += `<div class="tag-item" onclick="removeGroup('${g}')">${labelText} <span>×</span></div>`;
    });
    if(activeGroups.length === 0) {
        box.innerHTML = `<span style="color:#aaa;font-size:14px;">点击下拉框选择字母组...</span>`;
    }
}

function addGroupFilter(val) {
    if (!val) return;
    document.getElementById("groupAdder").value = "";
    if (val === "all") {
        activeGroups = ["all"];
    } else {
        activeGroups = activeGroups.filter(item => item !== "all");
        if (!activeGroups.includes(val)) activeGroups.push(val);
    }
    renderTags();
    applyFilters();
}

function removeGroup(g) {
    activeGroups = activeGroups.filter(item => item !== g);
    renderTags();
    applyFilters();
}

function applyFilters() {
    if (activeGroups.length === 0) {
        filteredList = [];
    } else if (activeGroups.includes("all")) {
        filteredList = [...database];
    } else {
        filteredList = database.filter(item => activeGroups.includes(item.group));
    }
    idx = 0;
    syncCardUI();
}

function shuffleCards() {
    if (filteredList.length <= 1) return;
    for (let i = filteredList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredList[i], filteredList[j]] = [filteredList[j], filteredList[i]];
    }
    idx = 0;
    syncCardUI();
}

function syncCardUI() {
    const total = filteredList.length;
    document.getElementById("totalProgress").innerText = total;
    document.getElementById("alertBox").innerText = "";
    document.getElementById("dictationField").value = "";
    document.getElementById("cardInner").classList.remove("is-flipped");

    if (total === 0) {
        document.getElementById("currentProgress").innerText = 0;
        document.getElementById("wordRevealTarget").innerText = "---";
        document.getElementById("meanRevealTarget").innerText = "---";
        return;
    }

    document.getElementById("currentProgress").innerText = idx + 1;
    document.getElementById("wordRevealTarget").innerText = filteredList[idx].word;
    document.getElementById("meanRevealTarget").innerText = filteredList[idx].mean;
    playSoundDirectly();
}

function playSoundDirectly() {
    if (filteredList.length === 0) return;
    document.getElementById("compareAudioPlayer").pause(); // Dừng trình phát so sánh nếu đang chạy
    const player = document.getElementById("internalAudioPlayer");
    player.pause();
    const finalAudioUrl = cloudStorageUrl + filteredList[idx].file;
    player.src = encodeURI(finalAudioUrl); 
    player.load();
    player.play().catch(e => console.log("Audio play deferred: ", e));
}

function flipCard() {
    if (filteredList.length === 0) return;
    document.getElementById("cardInner").classList.toggle("is-flipped");
}

function movePointer(step) {
    if (filteredList.length === 0) return;
    idx += step;
    if (idx >= filteredList.length) idx = 0;
    if (idx < 0) idx = filteredList.length - 1;
    syncCardUI();
}

document.getElementById("dictationField").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        const inputVal = this.value.trim().toLowerCase();
        const answerVal = filteredList[idx].word.toLowerCase();
        const alertElement = document.getElementById("alertBox");

        if(inputVal === "") return;

        if (inputVal === answerVal) {
            alertElement.className = "result-message result-success";
            alertElement.innerText = "🎉 正确！拼写完全一致！";
            document.getElementById("cardInner").classList.add("add("is-flipped");
        } else {
            alertElement.className = "result-message result-error";
            alertElement.innerText = `❌ 错误！请点击卡片翻转查看正解`;
        }
    }
});
