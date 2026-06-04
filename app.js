let activeGroups = ["chu_cai", "phu_am"];
let filteredList = [];
let idx = 0;

window.onload = function() {
    renderTags();
    applyFilters();
};

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
