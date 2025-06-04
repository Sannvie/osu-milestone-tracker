const OSU_API_KEY = '4b29cd70e56ec0e587bd578c411b4f72a9a85c01';
const OSU_API_URL = 'https://osu.ppy.sh/api';
const OSUTRACK_API_URL = 'https://osutrack-api.ameo.dev';
let cachedBeatmaps = new Map(); 

const translations = {
  en: {
    title: "osu! Milestone PP Tracker",
    description: "Curious about your PP milestones or those of top players? Use this site to find out!",
    warning: "Note: Milestone scores show the PP when first submitted. If a milestone is missing, historical data may be unavailable.",
    loading: "Please wait, fetching data...",
    placeholder: "Enter osu! Username",
    button: "Search",
    credit: "Website by Sanvie with osu! and osutrack APIs",
    milestone: "PP Milestone",
    pp: "PP",
    beatmap: "Beatmap",
    date: "Date",
    mods: "Mods",
    rank: "Rank", 
    noScores: "No scores found for this milestone.",
    unknownDate: "Unknown Date",
  },
  id: {
    title: "Pelacak Milestone PP osu!",
    description: "Penasaran dengan milestone PP kamu atau para top player? Silakan gunakan situs ini untuk mencari tahu!",
    warning: "Catatan: Skor milestone menunjukkan PP awal saat pertama kali disubmit. Jika tidak ada skor untuk milestone tertentu, itu mungkin karena data historis tidak tersedia.",
    loading: "Tunggu sebentar, sedang mengambil data...",
    placeholder: "Masukkan Username osu!",
    button: "Cari",
    credit: "Situs web oleh Sanvie dengan API osu! dan osu!track",
    milestone: "Milestone PP",
    pp: "PP",
    beatmap: "Beatmap",
    date: "Tanggal",
    mods: "Mod",
    rank: "Rank",
    noScores: "Tidak ada skor ditemukan untuk milestone ini.",
    unknownDate: "Tanggal Tidak Diketahui",
  }
};

let currentLanguage = 'en';
document.getElementById('languageSelect').value = currentLanguage;
updateLanguage();

function changeLanguage() {
  currentLanguage = document.getElementById('languageSelect').value;
  updateLanguage();
}

function updateLanguage() {
  const texts = translations[currentLanguage];
  document.getElementById('title').innerText = texts.title; 
  document.getElementById('description').innerText = texts.description;
  document.getElementById('warning').innerText = texts.warning;
  document.getElementById('loadingText').innerText = texts.loading;
  document.getElementById('userId').placeholder = texts.placeholder;
  document.getElementById('searchBtn').innerText = texts.button;
  document.getElementById('credit').innerText = texts.credit;
}


function toggleLoading(show) {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

async function fetchFromAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

async function getUserId(username) {
  const url = `${OSU_API_URL}/get_user?k=${OSU_API_KEY}&u=${encodeURIComponent(username)}&type=string`;
  const data = await fetchFromAPI(url);
  if (data && data.length > 0) {
    return data[0].user_id;
  }
  throw new Error('User not found');
}

async function updateUserData(userId, gameMode) {
  const url = `${OSUTRACK_API_URL}/update?user=${userId}&mode=${gameMode}`;
  try {
    await fetchFromAPI(url, { method: 'POST' });
  } catch (error) {
    console.warn('Failed to update user data, proceeding with existing data:', error);
  }
}
async function fetchBeatmap(beatmapId) {
  if (cachedBeatmaps.has(beatmapId)) {
    return cachedBeatmaps.get(beatmapId);
  }
  const url = `${OSU_API_URL}/get_beatmaps?k=${OSU_API_KEY}&b=${beatmapId}`;
  const data = await fetchFromAPI(url);
  if (data && data.length > 0) {
    cachedBeatmaps.set(beatmapId, data[0]);
    return data[0];
  }
  return null;
}

function getMods(modsNumber) {
  const mods = [];
  const modMap = {
    1: 'NF', 2: 'EZ', 4: 'TD', 8: 'HD', 16: 'HR', 32: 'SD', 64: 'DT',
    128: 'RX', 256: 'HT', 512: 'NC', 1024: 'FL', 2048: 'AP', 4096: 'SO',
    8192: 'RX2', 16384: 'PF', 32768: 'K4', 65536: 'K5', 131072: 'K6',
    262144: 'K7', 524288: 'K8', 1048576: 'FI', 2097152: 'RD', 4194304: 'LM'
  };
  for (const [bit, mod] of Object.entries(modMap)) {
    if (modsNumber & bit) mods.push(mod);
  }
  return mods.length > 0 ? mods.join(', ') : 'None';
}

function parseDate(dateString) {
  console.log('Input dateString:', dateString);
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.log('Invalid date, returning null');
    return null; 
  }
  const locale = currentLanguage === 'id' ? 'id-ID' : 'en-GB';
  const formattedDate = date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta' 
  }).replace(/,/, '');
  console.log('Formatted date:', formattedDate); 
  return formattedDate;
}

function displayUserProfile(user) {
  const avatarUrl = `https://a.ppy.sh/${user.user_id}`;
  const playerAvatar = document.getElementById('playerAvatar');
  const playerName = document.getElementById('playerName');
  const playerStats = document.getElementById('playerStats');
  const playerProfile = document.getElementById('playerProfile');
  const playerInfo = document.getElementById('playerInfo');
  const texts = translations[currentLanguage];

  playerAvatar.src = avatarUrl;
  playerAvatar.style.display = 'block';
  playerAvatar.onerror = () => {
    playerAvatar.src = 'https://osu.ppy.sh/images/layout/avatar-guest.png'; 
    console.log('Failed to load avatar, using fallback');
  };

  playerName.innerText = user.username;

  const stats = [
    `${texts.pp}: ${parseFloat(user.pp_raw).toFixed(0)}`,
    `#${user.pp_rank}`,
    `Lv${parseFloat(user.level).toFixed(0)}`,
    `${parseFloat(user.accuracy).toFixed(1)}%`,
    user.country
  ];
  playerStats.innerHTML = stats.join('<br>');

  playerInfo.classList.add('visible');
  console.log('Profile content displayed');

  playerProfile.onclick = () => {
    window.open(`https://osu.ppy.sh/users/${user.user_id}`, '_blank');
  };
}

async function fetchMilestones() {
  const username = document.getElementById('userId').value.trim();
  const gameMode = document.getElementById('gameMode').value;
  const resultsDiv = document.getElementById('results');
  const playerProfile = document.getElementById('playerProfile');
  const playerInfo = document.getElementById('playerInfo');
  console.log('Fetching milestones for user:', username, 'Mode:', gameMode);
  resultsDiv.innerHTML = '';

  playerProfile.classList.remove('show');
  playerInfo.classList.remove('visible');
  document.getElementById('playerAvatar').style.display = 'none';
  document.getElementById('playerName').innerText = '';
  document.getElementById('playerStats').innerText = '';

  if (!username) {
    alert(translations[currentLanguage].placeholder);
    return;
  }

  toggleLoading(true);
  playerProfile.classList.add('show');
  console.log('Profile slide down animation triggered');
  document.getElementById('searchBtn').disabled = true;

  try {
    const user = await fetchUserProfile(username);
    displayUserProfile(user);

    const userId = user.user_id;
    console.log('User ID:', userId);
    await updateUserData(userId, gameMode);

    const scoresUrl = `${OSUTRACK_API_URL}/hiscores?user=${encodeURIComponent(username)}&mode=${gameMode}&userMode=username`;
    const scores = await fetchFromAPI(scoresUrl);
    console.log('Scores from API:', scores);

    const highestPP = scores.length > 0 ? Math.max(...scores.map(s => s.pp)) : 0;
    console.log('Highest PP:', highestPP);
    if (highestPP === 0) {
      resultsDiv.innerHTML = `<p style="color: #e74c3c; text-align: center;">${translations[currentLanguage].noScores}</p>`;
      toggleLoading(false);
      document.getElementById('searchBtn').disabled = false;
      return;
    }

    const milestones = [];
    for (let i = 100; i <= Math.ceil(highestPP / 50) * 50; i += 50) {
      if (i !== 50) milestones.push(i);
    }
    console.log('Milestones:', milestones);

    const milestoneScores = [];
    for (const milestone of milestones) {
      const minPP = milestone;
      const maxPP = milestone + 49;
      const score = scores.find(s => s.pp >= minPP && s.pp <= maxPP);
      milestoneScores.push({ milestone, score });
      console.log(`Milestone ${milestone}:`, score);
    }

    for (const { milestone, score } of milestoneScores) {
      const card = document.createElement('div');
      card.className = 'milestone-card';
      const texts = translations[currentLanguage];

      if (score) {
        const beatmap = await fetchBeatmap(score.beatmap_id);
        const formattedDate = parseDate(score.score_time) || texts.unknownDate;
        console.log(`Rendering milestone ${milestone}: score_time=${score.score_time}, formattedDate=${formattedDate}`);
        if (beatmap) {
          card.style.backgroundImage = `url(https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/cover.jpg)`;
          card.innerHTML = `
            <div>
              <h3>${texts.milestone}: ${milestone} PP</h3>
              <p>${texts.pp}: ${score.pp.toFixed(2)}</p>
              <p>${texts.rank}: ${mapRank(score.rank)}</p>
              <p>${texts.beatmap}: <a href="https://osu.ppy.sh/b/${score.beatmap_id}" target="_blank">${beatmap.title} [${beatmap.version}]</a></p>
              <p>${texts.date}: ${formattedDate}</p>
              <p>${texts.mods}: ${getMods(score.mods)}</p>
            </div>
          `;
          card.addEventListener('click', () => {
            window.open(`https://osu.ppy.sh/b/${score.beatmap_id}`, '_blank');
          });
        } else {
          card.innerHTML = `
            <div>
              <h3>${texts.milestone}: ${milestone} PP</h3>
              <p>${texts.noScores}</p>
            </div>
          `;
        }
      } else {
        card.innerHTML = `
          <div>
            <h3>${texts.milestone}: ${milestone} PP</h3>
            <p>${texts.noScores}</p>
          </div>
        `;
      }
      resultsDiv.appendChild(card);
    }
  } catch (error) {
    console.error('Error fetching milestones:', error);
    resultsDiv.innerHTML = `<p style="color: #e74c3c; text-align: center;">Error fetching data. Please try again later.</p>`;
    playerProfile.classList.remove('show'); 
  } finally {
    toggleLoading(false);
    document.getElementById('searchBtn').disabled = false;
  }
}
function mapRank(rank) {
  if (rank === 'SH') return 'S+';
  if (rank === 'XH') return 'SS+';
  return rank; 
}
async function fetchUserProfile(username) {
  const url = `${OSU_API_URL}/get_user?k=${OSU_API_KEY}&u=${encodeURIComponent(username)}&type=string`;
  try {
    const data = await fetchFromAPI(url);
    if (data && data.length > 0) {
      return data[0];
    }
    throw new Error('User not found');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}
