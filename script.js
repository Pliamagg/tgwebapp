window.onload = function() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
        }, 500);
    }, 5000);
};

let score = 0;
let energy = 1000;
const tg = window.Telegram.WebApp;
tg.ready();

let userId = tg.initDataUnsafe?.user?.id || null;
if (!userId) {
    alert("Користувача не знайдено. Перезапустіть додаток.");
} else {
    const user = tg.initDataUnsafe.user;
    const nickname = user.username || `${user.first_name} ${user.last_name}`;
    document.getElementById('nickname').innerText = `Player: ${nickname}`;
    document.getElementById('avatar').src = user.photo_url || 'images/default-avatar.png';
}

async function fetchUserData() {
    try {
        let response = await fetch(`http://localhost:5000/user/${userId}`);
        if (response.ok) {
            let userData = await response.json();
            score = userData.score;
            energy = userData.energy;
            updateStats();
        } else {
            console.error("Error fetching user data:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

async function saveUserProgress() {
    try {
        let response = await fetch(`http://localhost:5000/user/${userId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                score: score,
                energy: energy
            })
        });
        if (!response.ok) {
            console.error("Error saving user progress:", response.statusText);
        }
    } catch (error) {
        console.error("Error saving user progress:", error);
    }
}

document.getElementById('tapImage').onclick = async function() {
    if (energy > 0) {
        score += 1;
        energy -= 1;
        updateStats();
        await saveUserProgress();

        this.classList.add('blur');
        setTimeout(() => this.classList.remove('blur'), 100);
    } else {
        alert('No energy left! Come back tomorrow.');
    }
};

async function fetchReferralLink() {
    try {
        let response = await fetch(`http://localhost:5000/referral-link/${userId}`);
        if (response.ok) {
            let data = await response.json();
            document.getElementById('referralLink').innerText = data.referral_link;
        } else {
            console.error("Error fetching referral link:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching referral link:", error);
    }
}

async function fetchReferrals() {
    try {
        let response = await fetch(`http://localhost:5000/referrals/${userId}`);
        if (response.ok) {
            let referrals = await response.json();
            updateReferralsList(referrals);
        } else {
            console.error("Error fetching referrals:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching referrals:", error);
    }
}

function updateReferralsList(referrals) {
    const referralList = document.getElementById('referralList');
    referralList.innerHTML = '';
    referrals.forEach((referral, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${referral.referral_id}: ${referral.points} points`;
        referralList.appendChild(listItem);
    });
}

document.getElementById('friendButton').onclick = function() {
    showPage('friendPage');
    fetchReferralLink();
    fetchReferrals();
};

function updateStats() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('energy').innerText = 'Energy: ' + energy;
}
