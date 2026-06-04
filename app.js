const cloudStorageUrl = "https://cdn.jsdelivr.net/gh/tckzone/hoctiengviet@main/";

let activeGroups = ["chu_cai", "phu_am"];
let filteredList = [];
let idx = 0;

// Các biến điều khiển phát nối đuôi so sánh âm
let selectedCompareFiles = [];
let currentCompareIdx = 0;
let isComparePlaying = false;

// Đảm bảo dữ liệu từ database.js đã được tải xong hoàn toàn trước khi dựng giao diện
window.addEventListener('DOMContentLoaded', () => {
    if (typeof database !== 'undefined' && database.length > 0) {
        renderTags();
        applyFilters();
        buildCompareCheckboxGrid(); // Gọi hàm đổ dữ liệu ra bảng so sánh
    } else {
        // Dự phòng nếu database.js load chậm hơn app.js
        setTimeout(() => {
            renderTags();
            applyFilters();
            buildCompareCheckboxGrid();
        }, 500);
    }
});

// ========================================================
/* 🚀 CHỨC NĂNG 1: CỬA SỔ SO SÁNH PHÁT ÂM ĐỘC LẬP */
// ========================================================

// Mở cửa sổ độc lập
function openCompareWindow() {
    document.getElementById("mainAppZone").style.display = "none";
    document.getElementById("compareWindowModal").style.display = "block";
    // Mỗi lần mở cửa sổ, làm mới lại lưới để đảm bảo hiển thị đúng
    buildCompareCheckboxGrid();
}

// Đóng cửa sổ quay về học bài
function closeCompareWindow() {
    stopComparePlayback(); // Dừng âm thanh nếu đang phát dở
    document.getElementById("compareWindowModal").style.display = "none";
    document.getElementById("mainAppZone").style.display = "block";
}

// Đổ dữ liệu 172 từ ra lưới ô vuông checkbox rộng rãi (Dễ chạm trên điện thoại)
function buildCompareCheckboxGrid() {
    const container = document.getElementById("compareCheckboxContainer");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (typeof database === 'undefined' || database.length === 0) {
        container.innerHTML = "<div style='grid-column: span 4; text-align:center; color:#999; padding:20px;'>正在加载词庫... (Đang tải kho từ...)</div>";
        return;
    }

    database.forEach((item) => {
        // Kiểm tra xem file này trước đó đã được tích chọn chưa để giữ nguyên trạng thái
        const isChecked = selectedCompareFiles.includes(item.file) ? "checked" : "";
        
        container.innerHTML += `
            <label class="compare-label-box">
                <input type="checkbox" value="${item.file}" data-word="${item.word}" ${isChecked} onchange="handleCompareGridChange()">
                ${item.word}
            </label>
        `;
    });
}

// Đồng bộ hóa dữ liệu khi học viên tích chọn từ
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
    document.getElementById("compareWordsInput").value = selectedWords.join(" → ");
}

// Bắt đầu nghe so sánh lần lượt
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
        return;
    }

    const finalUrl = cloudStorageUrl + selectedCompareFiles[currentCompareIdx];
    player.src = encodeURI(finalUrl);
    player.load();
    player.play().catch(e => console.log("Lỗi âm thanh so sánh: ", e));

    // Khi phát xong từ này -> tự nhảy sang từ tiếp theo
    player.onended = function() {
        currentCompareIdx++;
        setTimeout(() => {
            playNextCompareTrack(player);
        }, 600); // Khoảng nghỉ nửa giây giữa các từ để học viên kịp nhận biết âm
    };
}

// Dừng phát ngay lập tức
function stopComparePlayback() {
    isComparePlaying = false;
    const player = document.getElementById("compareAudioPlayer");
    player.pause();
    player.src = "";
}

// Xóa sạch lựa chọn so sánh
function clearCompareSelection() {
    stopComparePlayback();
    document.querySelectorAll("#compareCheckboxContainer input[type='checkbox']").forEach(cb => cb.checked = false);
    document.getElementById("compareWordsInput").value = "";
    selectedCompareFiles = [];
}

// ========================================================
/* ⚙️ CHỨC NĂNG 2: BỘ LỌC NHÓM ÂM & FLASHCARD CHÍNH */
// ========================================================

function renderTags() {
    const box = document.getElementById("tagBox");
    if (!box) return;
    box.innerHTML = "";
    activeGroups.forEach(g => {
        let label = g === "chu_cai" ? "字母表" : (g === "phu_am" ? "辅音" : g.toUpperCase() + "组");
        box.innerHTML += `<div class="tag-item" onclick="removeGroup('${g}')">${label} ✕</div>`;
    });
    if (activeGroups.length === 0) {
        box.innerHTML = `<span style="color:#aaa; font-size:13px;">请选择字母组进行过滤...</span>`;
    }
}

function addGroupFilter(val) {
    if (!val) return;
    if (val === "all") {
        activeGroups = ["all"];
    } else {
        activeGroups = activeGroups.filter(i => i !== "all");
        if (!activeGroups.includes(val)) activeGroups.push(val);
    }
    renderTags();
    applyFilters();
}

function removeGroup(g) {
    activeGroups = activeGroups.filter(i => i !== g);
    renderTags();
    applyFilters();
}

function applyFilters() {
    if (typeof database === 'undefined') return;
    
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

function syncCardUI() {
    const totalProgressEl = document.getElementById("totalProgress");
    if (!totalProgressEl) return;
    
    totalProgressEl.innerText = filteredList.length;
    document.getElementById("alertBox").innerText = "";
    document.getElementById("dictationField").value = "";
    document.getElementById("cardInner").classList.remove("is-flipped");
    
    if (filteredList.length === 0) {
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
    stopComparePlayback();
    const player = document.getElementById("internalAudioPlayer");
    player.pause();
    const finalAudioUrl = cloudStorageUrl + filteredList[idx].file;
    player.src = encodeURI(finalAudioUrl); 
    player.load();
    player.play().catch(e => console.log("Audio deferred: ", e));
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

function flipCard() {
    if (filteredList.length === 0) return;
    document.getElementById("cardInner").classList.toggle("is-flipped");
}

function movePointer(s) {
    if (filteredList.length === 0) return;
    idx = (idx + s + filteredList.length) % filteredList.length;
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
