let activeGroups = ["chu_cai", "phu_am"];
let filteredList = [];
let idx = 0;

let selectedCompareFiles = [];
let currentCompareIdx = 0;
let isComparePlaying = false;

window.onload = function() {
    renderTags();
    applyFilters();
    buildCompareCheckboxGrid();
};

// --- MỞ/ĐÓNG CỬA SỔ SO SÁNH ---
function openCompareWindow() {
    document.getElementById("mainAppZone").style.display = "none";
    document.getElementById("compareWindowModal").style.display = "block";
}

function closeCompareWindow() {
    stopComparePlayback();
    document.getElementById("compareWindowModal").style.display = "none";
    document.getElementById("mainAppZone").style.display = "block";
}

// --- SO SÁNH PHÁT ÂM (COMPARE TOOL) ---
function buildCompareCheckboxGrid() {
    const container = document.getElementById("compareCheckboxContainer");
    container.innerHTML = "";
    database.forEach((item) => {
        container.innerHTML += `
            <label class="compare-label-box">
                <input type="checkbox" value="${item.file}" data-word="${item.word}" onchange="handleCompareGridChange()">
                ${item.word}
            </label>`;
    });
}

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

function startComparePlayback() {
    if (selectedCompareFiles.length < 2) {
        alert("请至少勾选 2 个单词进行对比！"); return;
    }
    const player = document.getElementById("compareAudioPlayer");
    currentCompareIdx = 0;
    isComparePlaying = true;
    playNextCompareTrack(player);
}

function playNextCompareTrack(player) {
    if (!isComparePlaying || currentCompareIdx >= selectedCompareFiles.length) {
        isComparePlaying = false; return;
    }
    player.src = encodeURI(cloudStorageUrl + selectedCompareFiles[currentCompareIdx]);
    player.load();
    player.play();
    player.onended = () => {
        currentCompareIdx++;
        setTimeout(() => playNextCompareTrack(player), 600);
    };
}

function stopComparePlayback() {
    isComparePlaying = false;
    const player = document.getElementById("compareAudioPlayer");
    player.pause(); player.src = "";
}

function clearCompareSelection() {
    stopComparePlayback();
    document.querySelectorAll("#compareCheckboxContainer input").forEach(cb => cb.checked = false);
    document.getElementById("compareWordsInput").value = "";
    selectedCompareFiles = [];
}

// --- FLASHCARD & LOGIC CHÍNH ---
function renderTags() {
    const box = document.getElementById("tagBox"); box.innerHTML = "";
    activeGroups.forEach(g => {
        let label = g === "chu_cai" ? "字母表" : (g === "phu_am" ? "辅音" : g.toUpperCase() + "组");
        box.innerHTML += `<div class="tag-item" onclick="removeGroup('${g}')">${label} ✕</div>`;
    });
}

function addGroupFilter(val) {
    if (!val) return;
    if (val === "all") { activeGroups = ["all"]; } 
    else { activeGroups = activeGroups.filter(i => i !== "all"); if (!activeGroups.includes(val)) activeGroups.push(val); }
    renderTags(); applyFilters();
}

function removeGroup(g) { activeGroups = activeGroups.filter(i => i !== g); renderTags(); applyFilters(); }

function applyFilters() {
    filteredList = activeGroups.includes("all") ? [...database] : database.filter(i => activeGroups.includes(i.group));
    idx = 0; syncCardUI();
}

function syncCardUI() {
    document.getElementById("totalProgress").innerText = filteredList.length;
    document.getElementById("alertBox").innerText = "";
    document.getElementById("dictationField").value = "";
    document.getElementById("cardInner").classList.remove("is-flipped");
    if (filteredList.length === 0) return;
    document.getElementById("currentProgress").innerText = idx + 1;
    document.getElementById("wordRevealTarget").innerText = filteredList[idx].word;
    document.getElementById("meanRevealTarget").innerText = filteredList[idx].mean;
    playSoundDirectly();
}

function playSoundDirectly() {
    if (filteredList.length === 0) return;
    const p = document.getElementById("internalAudioPlayer");
    p.src = encodeURI(cloudStorageUrl + filteredList[idx].file);
    p.load(); p.play();
}

function flipCard() { document.getElementById("cardInner").classList.toggle("is-flipped"); }
function movePointer(s) {
    idx = (idx + s + filteredList.length) % filteredList.length; syncCardUI();
}

function shuffleCards() {
    for (let i = filteredList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredList[i], filteredList[j]] = [filteredList[j], filteredList[i]];
    }
    idx = 0; syncCardUI();
}

document.getElementById("dictationField").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const input = e.target.value.trim().toLowerCase();
        const correct = filteredList[idx].word.toLowerCase();
        const alertBox = document.getElementById("alertBox");
        if (input === correct) {
            alertBox.className = "result-message result-success"; alertBox.innerText = "🎉 正确！";
            document.getElementById("cardInner").classList.add("is-flipped");
        } else {
            alertBox.className = "result-message result-error"; alertBox.innerText = "❌ 错误！请点击卡片查看";
        }
    }
});
