/* 1. استيراد المحرك والبيانات */
import { initSpace, raycaster, camera, clickablePlanets } from './spaceEngine.js';
import { planetsDeepData } from './planetsData.js';

/* 2. قاعدة بيانات الكواكب المختصرة (للعرض السريع) */
const planetDetails = {
    "عطارد": "أصغر كوكب في مجموعتنا الشمسية والأقرب إلى الشمس. 🌑",
    "الزهرة": "توأم الأرض في الحجم، لكنه الكوكب الأكثر حرارة. 🌡️",
    "الأرض": "كوكبنا الأزرق، الوحيد المعروف بوجود حياة ومياه سائلة. 🌍",
    "المريخ": "يُعرف بالكوكب الأحمر، ويحتوي على أكبر بركان في مجموعتنا. 🔴",
    "المشتري": "ملك الكواكب وأكبرهم حجماً، وهو عملاق غازي ضخم. 🌀",
    "زحل": "الكوكب الجميل المشهور بحلقاته اللامعة المكونة من الجليد. 🪐",
    "أورانوس": "كوكب جليدي عملاق يميل لونه إلى الأزرق الفاتح. 💎",
    "نبتون": "أبعد كوكب عن الشمس ويتميز برياحه العاتية جداً. 🌊",
    "سيريس": "يقع في حزام الكويكبات وهو أصغر كوكب قزم معروف. ☄️",
    "بلوتو": "كان يُعتبر كوكباً تاسعاً، وحالياً هو أشهر كوكب قزم. ❄️",
    "إيريس": "كوكب قزم يقع في منطقة بعيدة جداً وكتلته كبيرة. 🌑",
    "هاوميا": "يتميز بشكله البيضاوي الغريب ودورانه السريع جداً. 🥚",
    "ماكي ماكي": "كوكب قزم مغطى بالجليد ويقع في أطراف النظام الشمسي. 🪨"
};

/* 3. إدارة النوافذ المنبثقة (Modals) */
window.showPlanetInfo = function(name) {
    const modal = document.getElementById('planet-info-modal');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('modal-text');
    
    if (planetDetails[name] && modal) {
        title.innerText = name;
        text.innerText = ""; 
        let i = 0;
        let infoText = planetDetails[name];
        
        modal.style.display = "block";

        function typeInModal() {
            if (i < infoText.length) {
                text.innerText += infoText[i];
                i++;
                setTimeout(typeInModal, 30);
            }
        }
        typeInModal();
    }
};

window.closeModal = function() {
    const modals = ['planet-info', 'planet-info-modal'];
    modals.forEach(id => {
        const m = document.getElementById(id);
        if (m) m.style.display = "none";
    });
    if (window.speechSynthesis) window.speechSynthesis.cancel(); // إيقاف الصوت عند القفل
    console.log("تم إغلاق النافذة وإيقاف الصوت 🚀");
};

/* 4. التنقل والتحكم في الصفحة */
window.goToPage = function(id) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        playLocalSound('btn-sound');
    }
};

window.launchTo3D = function() {
    const overlay = document.getElementById("intro-overlay");
    const rocket = document.getElementById("rocket-img");
    const launchText = document.querySelector(".launch-text");
    if (!overlay || !rocket) return;

    launchText.innerText = "جاري الانطلاق إلى فضاء الـ 3D... 🚀";
    overlay.style.display = "flex";
    overlay.style.opacity = "1";
    playLocalSound('launch-sound');

    setTimeout(() => {
        rocket.style.transition = "transform 2s cubic-bezier(0.6, -0.28, 0.735, 0.045)";
        rocket.style.transform = "translateY(-150vh)";
    }, 100); 

    setTimeout(() => {
        window.open('space.html', '_blank');
        overlay.style.opacity = "0";
        setTimeout(() => { 
            overlay.style.display = "none"; 
            rocket.style.transition = "none";
            rocket.style.transform = "translateY(0)";
        }, 1000);
    }, 2200);
};

/* 5. المؤثرات الصوتية والبصرية */
function playLocalSound(id) {
    const audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }
}

/* 6. تأثيرات الأنيميشن عند التحميل */
const welcomeText = "مرحباً بك في مشروع جامعة شرق بورسعيد الأهلية✨👨‍🚀. استكشف عجائب الكون🌠.";
let charIdx = 0; 

function typeWriter() {
    const typingElement = document.getElementById("typing");
    if (typingElement && charIdx < welcomeText.length) {
        typingElement.textContent = welcomeText.substring(0, charIdx + 1);
        charIdx++;
        setTimeout(typeWriter, 50);
    }
}

function createStars() {
    const container = document.getElementById("stars");
    if(!container) return;
    for (let i = 0; i < 150; i++) {
        let star = document.createElement("div");
        star.className = "star";
        star.style.left = Math.random() * 100 + "vw";
        star.style.top = Math.random() * 100 + "vh";
        star.style.animationDuration = (Math.random() * 5 + 3) + "s";
        container.appendChild(star);
    }
}

/* 7. التشغيل الابتدائي وربط الأحداث */
window.addEventListener('load', () => {
    createStars();
    const welcomeSound = document.getElementById("welcome-sound");

    setTimeout(() => {
        if (welcomeSound) welcomeSound.play().catch(() => {});
        typeWriter(); 
    }, 1000);
});

// إغلاق المودال عند الضغط خارجه
window.addEventListener('click', (event) => {
    const modal1 = document.getElementById('planet-info');
    const modal2 = document.getElementById('planet-info-modal');
    if (event.target === modal1 || event.target === modal2) {
        window.closeModal();
    }
});

/* 🚀 بدء تشغيل المحرك */
initSpace('space-container');