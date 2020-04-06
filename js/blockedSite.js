let currentUrl, originalUrl, blockedDomain;
currentUrl = new URL(document.URL);
originalUrl = currentUrl.searchParams.get("url");
blockedDomain = currentUrl.searchParams.get("blocked");

let motivationPhrases = [
    "Не теряй время",
    "Ничего страшного нет, просто начни",
    "Подумай о семье",
    "А зачем ты этим занимаешься?",
    "Почему ты зашёл сюда?",
    "Давай, соберись",
    "У тебя получится",
    "Я верю в тебя",
    "Ты сможешь",
    "Просто начни",
    "Попробуй начать",
    "Встань и подыши",
    "Просто открой, то что нужно сделать",
    "Что не так в этот раз?",
    "Это несерьезно",
    "Надо делать деньги",
    "Тебе нужны бабки?",
    "И как ты достигнешь чего-то?",
    "Да сколько можно?",
    "Делай, делай, делай",
    "Мой отец работал много, мать немногим меньше",
    "Мне нужно больше денег",
    "Просто закончи с этим",
    "Возьми себя в руки",
    "Сегодня именно тот день, когда ты изменишь себя",
    "Пора меняться",
    "Ты сможешь",
    "У тебя всё получится",
    "Иди работай",
    "Just Do It!",
    "Просто начни",
    "Возьми себя в руки",
    "Ламба сама себя не купит",
    "Не стыдно?",
    "Да, ты зашёл сюда, но ты молодец. Иди работай дальше",
    "Хватит прокрастинировать",
    "Почему ты прокрастинируешь?",
    "Что не так?"
];

$("#blockMessage").text(motivationPhrases[getRandomInt(motivationPhrases.length - 1)]); //site + " has been Blacklisted.");

let content = $("#countdown");
let secondsUntilUnblock = 10;
let intervalId = 0;

$("#unlistModal").on('hidden', modalHidden);
$("#cancelUnlist").click(hideModal);

chrome.extension.onMessage.addListener(
    function (message, sender, sendResponse) {
        chrome.tabs.getCurrent(function (tab) {
            if (tab.id == message) {
                $("#unlistModal").modal("show");
                beginCountdown(secondsUntilUnblock);
            }
        });
    });

function updateCountdown() {
    content.text("Unlisting " + blockedDomain + " in " + --secondsUntilUnblock + " seconds...");
    if (secondsUntilUnblock === 0) {
        clearInterval(intervalId);
        chrome.tabs.getCurrent(function (tab) {
            chrome.extension.getBackgroundPage().unlistSite(tab.id, blockedDomain);
        });
        window.location = originalUrl;
    }
}

function beginCountdown(i) {
    secondsUntilUnblock = i;
    content.text("Unlisting " + blockedDomain + " in " + i + " seconds...");
    intervalId = setInterval(function () {
        updateCountdown()
    }, 1000);
}

function modalHidden() {
    clearInterval(intervalId);
}

function hideModal() {
    $("#unlistModal").modal("hide");
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}