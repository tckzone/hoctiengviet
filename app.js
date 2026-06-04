const cloudStorageUrl = "https://cdn.jsdelivr.net/gh/tckzone/hoctiengviet@main/";

let activeGroups = ["chu_cai", "phu_am"];
let filteredList = [];
let idx = 0;

// Các biến điều khiển phát nối đuôi so sánh âm
let selectedCompareFiles = [];
let currentCompareIdx = 0;
let isComparePlaying = false;

window.onload = function() {
    renderTags();
    applyFilters();
    buildCompareCheckboxGrid(); // Khởi tạo lưới checkbox độc lập
};

// ========================================================
/* 🚀 LOGIC ĐIỀU KHIỂN CỬA SỔ SO SÁNH RIÊNG BIỆT */
// ========================================================

// 1. Mở cửa sổ độc lập
function openCompareWindow() {
    document.getElementById("mainAppZone").style.display = "none";
    document.getElementById("compareWindowModal").style.display = "block";
}

// 2. Đóng cửa sổ quay về học bài
function closeCompareWindow() {
    stopComparePlayback(); // Dừng âm thanh nếu đang phát dở
    document.getElementById("compareWindowModal").style.display = "none";
    document.getElementById("mainAppZone").style.display = "block";
}

// 3. Tự động đổ toàn bộ 172 từ ra lưới ô vuông checkbox rộng rãi
function buildCompareCheckboxGrid() {
    const container = document.getElementById("compareCheckboxContainer");
    container.innerHTML = "";
    
    database.forEach((item) => {
        container.innerHTML += `
            <label class="compare-label-box">
                <input type="checkbox" value="${item.file}" data-word="${item.word}" onchange="handleCompareGridChange()">
                ${item.word}
            </label>
        `;
    });
}

// 4. Đồng bộ hóa dữ liệu khi học viên tích chọn từ
function handleCompareGridChange() {
    const checkboxes = document.querySelectorAll("#compareCheckboxContainer input[type='checkbox']");
    let selectedWords = [];
    selectedCompareFiles = [];

    checkboxes.forEach(cb => {
        if (cb.checked) {
            selectedWords.push(cb.getAttribute("data-word"));
            selectedCompareFiles.push(cb.value);
        }
    });

    // Hiện chuỗi từ cách nhau bằng mũi tên (ví dụ: an → ang → ac)
    document.getElementById("compareWordsInput").value = selectedWords.join(" → ");
}

// 5. NÚT BẤM XÓA SẠCH LỰA CHỌN
function clearCompareSelection() {
    stopComparePlayback();
    const checkboxes = document.querySelectorAll("#compareCheckboxContainer input[type='checkbox']");
    checkboxes.forEach(cb => cb.checked = false);
    document.getElementById("compareWordsInput").value = "";
    selectedCompareFiles = [];
}

// 6. NÚT BẤM BẮT ĐẦU NGHE SO SÁNH
function startComparePlayback() {
    if (selectedCompareFiles.length < 2) {
        alert("请至少勾选 2 个单词进行对比！\n(Vui lòng tích chọn ít nhất từ 2 từ trở lên để so sánh!)");
        return;
    }
    
    const player = document.getElementById("compareAudioPlayer");
    document.getElementById("internalAudioPlayer").pause(); // Tắt audio chính
    
    currentCompareIdx = 0;
    isComparePlaying = true;
    playNextCompareTrack(player);
}

// Thuật toán phát âm nối đuôi liên tục
function playNextCompareTrack(player) {
    if (!isComparePlaying || currentCompareIdx >= selectedCompareFiles.length) {
        isComparePlaying = false;
        console.log("Hàng đợi so sánh kết thúc.");
        return;
    }

    const finalUrl = cloudStorageUrl + selectedCompareFiles[currentCompareIdx];
    player.src = encodeURI(finalUrl);
    player.load();
    
    player.play().catch(e => console.log("Lỗi âm thanh: ", e));

    // Sự kiện: Khi phát xong từ này -> tự nhảy sang từ tiếp theo
    player.onended = function() {
        currentCompareIdx++;
        setTimeout(() => {
            playNextCompareTrack(player);
        }, 500); // Khoảng nghỉ nửa giây giữa các từ để học viên nhận biết âm
    };
}

// 7. NÚT BẤM DỪNG PHÁT NGAY LẬP TỨC
function stopComparePlayback() {
    isComparePlaying = false;
    const player = document.getElementById("compareAudioPlayer");
    player.pause();
    player.src = "";
}

// ========================================================
/* ⚙️ LOGIC FLASHCARD GỐC (GIỮ NGUYÊN VẸN 100%) */
// ========================================================

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
    stopComparePlayback(); // Tắt trình so sánh nếu đang bật
    const player = document.getElementById("internalAudioPlayer");
    player.pause();
    const finalAudioUrl = cloudStorageUrl + filteredList[idx].file;
    player.src = encodeURI(finalAudioUrl); 
    player.load();
    player.play().catch(e => console.log("Audio deferred: ", e));
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
            document.getElementById("cardInner").classList.add("is-flipped");
        } else {
            alertElement.className = "result-message result-error";
            alertElement.innerText = `❌ 错误！请点击卡片翻转查看正解`;
        }
    }
});
