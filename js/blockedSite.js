var site = document.URL;
site = site.substring(site.indexOf("?"));
site = site.substring(site.indexOf("=") + 1);

var motivationPhrases = [
    "Не теряй время",
    "Ничего страшного нет, просто начни",
    "Подумай о семье",
    "А зачем ты этим занимаешься?",
    "Почему ты зашёл себя?",
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

console.log(motivationPhrases)

$("#blockMessage").text(motivationPhrases[getRandomInt(motivationPhrases.length - 1)]); //site + " has been Blacklisted.");

var content = $("#countdown");
var i = 15;
var interval = 0;

function updateCountdown() {
    content.text("Unlisting " + site + " in " + --i + " seconds...");
    if (i === 0) {
        clearInterval(interval);
        chrome.tabs.getCurrent(function (tab) {
            chrome.extension.getBackgroundPage().unlistSite(tab.id, site);
        });
        window.location = site;
    }
}

function beginCountdown() {
    i = 15;
    content.text("Unlisting " + site + " in " + i + " seconds...");
    interval = setInterval(function () {
        updateCountdown(i)
    }, 1000);
}

function modalHidden() {
    clearInterval(interval);
}

function hideModal() {
    $("#unlistModal").modal("hide");
}

$("#unlistModal").on('hidden', modalHidden);
$("#cancelUnlist").click(hideModal);

chrome.extension.onMessage.addListener(
    function (message, sender, sendResponse) {
        chrome.tabs.getCurrent(function (tab) {
            if (tab.id == message) {
                $("#unlistModal").modal("show");
                beginCountdown();
            }
        });
    });

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}