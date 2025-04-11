const OSU_API_KEY = "342522072e2b9936c1c7b9f4fab2c6ec77d4f1f5";

const translations = {
  id: {
    title: "Pelacak Milestone PP osu!",
    description: "Penasaran dengan milestone PP kamu atau para top player? Silakan gunakan situs ini untuk mencari tahu!",
    placeholder: "Masukkan Username osu!",
    search: "Cari",
    credit: "Situs web oleh Sanvie dengan API osu! dan osu!track",
    loading: "Tunggu sebentar, sedang mengambil data...",
    milestone: "{milestone} PP Pertama",
    pp: "PP: {pp}",
    mods: "Mods: {mods}",
    time: "Waktu: {time}",
    beatmap: "Beatmap: {beatmap}",
    grade: "Grade: {grade}",
    accuracy: "Akurasi: {accuracy}%",
    error: "Terjadi kesalahan saat mengambil data. Pastikan username benar atau coba lagi nanti.",
    mode0: "osu!",
    mode1: "osu!taiko",
    mode2: "osu!catch",
    mode3: "osu!mania",
    warning: "Catatan: Skor milestone menunjukkan PP awal saat pertama kali disubmit. Jika tidak ada skor untuk milestone tertentu, itu mungkin karena data historis tidak tersedia.",
    noScore: "Tidak ada skor tersedia untuk milestone ini."
  },
  en: {
    title: "osu! Milestone PP Tracker",
    description: "Curious about your PP milestones or those of top players? Use this website to find out!",
    placeholder: "Enter osu! Username",
    search: "Search",
    credit: "Website by Sanvie with osu! and osu!track APIs",
    loading: "Please wait, fetching data...",
    milestone: "First {milestone} PP",
    pp: "PP: {pp}",
    mods: "Mods: {mods}",
    time: "Time: {time}",
    beatmap: "Beatmap: {beatmap}",
    grade: "Grade: {grade}",
    accuracy: "Accuracy: {accuracy}%",
    error: "An error occurred while fetching data. Ensure the username is correct or try again later.",
    mode0: "osu!",
    mode1: "osu!taiko",
    mode2: "osu!catch",
    mode3: "osu!mania",
    warning: "Note: Milestone scores reflect the initial PP when first submitted. If no score exists for a milestone, it may be due to missing historical data.",
    noScore: "No score available for this milestone."
  }
};

function changeLanguage() {
  const lang = document.getElementById("languageSelect").value;
  document.querySelector("h1").textContent = translations[lang].title;
  document.getElementById("description").textContent = translations[lang].description;
  document.getElementById("warning").textContent = translations[lang].warning;
  document.getElementById("userId").placeholder = translations[lang].placeholder;
  document.getElementById("searchBtn").textContent = translations[lang].search;
  document.getElementById("credit").textContent = translations[lang].credit;
  document.getElementById("loadingText").textContent = translations[lang].loading;

  const gameMode = document.getElementById("gameMode");
  gameMode.options[0].text = translations[lang].mode0;
  gameMode.options[1].text = translations[lang].mode1;
  gameMode.options[2].text = translations[lang].mode2;
  gameMode.options[3].text = translations[lang].mode3;

  const resultsDiv = document.getElementById("results");
  if (resultsDiv.innerHTML) fetchMilestones();
}

async function fetchBeatmapDetails(beatmapId) {
  const url = `https://osu.ppy.sh/api/get_beatmaps?k=${OSU_API_KEY}&b=${beatmapId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      const beatmap = data[0];
      return {
        title: beatmap.title,
        difficulty: beatmap.version,
        beatmapset_id: beatmap.beatmapset_id,
        beatmap_id: beatmap.beatmap_id
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching beatmap details:", error);
    return null;
  }
}

async function fetchScoreDetails(beatmapId, userId, mode) {
  const url = `https://osu.ppy.sh/api/get_scores?k=${OSU_API_KEY}&b=${beatmapId}&u=${userId}&m=${mode}`;
  try {
    const response = await fetch(url);
    const scores = await response.json();
    return scores.length > 0 ? scores[0] : null;
  } catch (error) {
    console.error("Error fetching score details:", error);
    return null;
  }
}

function getModsString(mods) {
  if (!mods || mods === 0) return "No Mods";
  const modMap = {
    1: "NF", 2: "EZ", 4: "TD", 8: "HD", 16: "HR", 32: "SD", 64: "DT",
    128: "RX", 256: "HT", 512: "NC", 1024: "FL", 2048: "AP", 4096: "SO",
    8192: "RX2", 16384: "PF"
  };
  let modList = [];
  for (let bit in modMap) {
    if (mods & bit) {
      modList.push(modMap[bit]);
    }
  }
  if (modList.includes("HD") && modList.includes("DT")) {
    modList = modList.filter(mod => mod !== "HD" && mod !== "DT");
    modList.push("HDDT");
  } else if (modList.includes("HD") && modList.includes("HR")) {
    modList = modList.filter(mod => mod !== "HD" && mod !== "HR");
    modList.push("HDHR");
  } else if (modList.includes("NC")) {
    modList = modList.filter(mod => mod !== "DT");
  }
  return modList.length > 0 ? modList.join("") : "No Mods";
}

function calculateAccuracy(score) {
  const count300 = parseInt(score.count300) || 0;
  const count100 = parseInt(score.count100) || 0;
  const count50 = parseInt(score.count50) || 0;
  const countMiss = parseInt(score.countmiss) || 0;
  const totalHits = count300 + count100 + count50 + countMiss;
  if (totalHits === 0) return 0;
  return ((count300 * 300 + count100 * 100 + count50 * 50) / (totalHits * 300) * 100).toFixed(2);
}

function determineGrade(score) {
  const rank = score.rank;
  if (rank === "XH" || rank === "SH") return "S";
  if (rank === "X") return "SS";
  if (rank === "S") return "S";
  if (rank === "A") return "A";
  if (rank === "B") return "B";
  if (rank === "C") return "C";
  return "D";
}

async function fetchMilestones() {
  const username = document.getElementById("userId").value;
  const mode = document.getElementById("gameMode").value;
  const searchBtn = document.getElementById("searchBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lang = document.getElementById("languageSelect").value;

  if (!username) {
    alert(lang === "id" ? "Masukkan Username!" : "Enter Username!");
    return;
  }

  searchBtn.disabled = true;
  loadingOverlay.style.display = "flex";

  const url = `https://osutrack-api.ameo.dev/hiscores?user=${username}&mode=${mode}&userMode=username`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const hiscores = await response.json();

    if (!Array.isArray(hiscores) || hiscores.length === 0) {
      throw new Error("No hiscores data returned");
    }

    const sortedHiscores = hiscores.sort((a, b) => new Date(a.score_time) - new Date(b.score_time));

    const ranges = [];
    for (let i = 100; i <= 1950; i += 50) {
      ranges.push({ milestone: i, min: i, max: i + 49 });
    }

    let milestones = {};
    for (const score of sortedHiscores) {
      const pp = score.pp;
      for (const range of ranges) {
        const milestoneKey = range.milestone;
        if (pp >= range.min && pp <= range.max && !milestones[milestoneKey]) {
          const beatmapDetails = await fetchBeatmapDetails(score.beatmap_id);
          const scoreDetails = await fetchScoreDetails(score.beatmap_id, username, mode);
          milestones[milestoneKey] = {
            pp: pp,
            beatmap_id: score.beatmap_id,
            score_time: score.score_time || "Unknown time",
            beatmap_title: beatmapDetails ? beatmapDetails.title : "Unknown Beatmap",
            difficulty: beatmapDetails ? beatmapDetails.difficulty : "Unknown",
            beatmapset_id: beatmapDetails ? beatmapDetails.beatmapset_id : null,
            mods: score.mods || 0,
            grade: scoreDetails ? determineGrade(scoreDetails) : "N/A",
            accuracy: scoreDetails ? calculateAccuracy(scoreDetails) : "N/A"
          };
          break;
        }
      }
    }

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    for (let i = 100; i <= 1950; i += 50) {
      const milestone = i;
      const data = milestones[milestone];
      const milestoneCard = document.createElement("div");
      milestoneCard.className = "milestone-card";

      if (data) {
        const beatmapLink = data.beatmapset_id
          ? `<a href="https://osu.ppy.sh/beatmapsets/${data.beatmapset_id}#osu/${data.beatmap_id}" target="_blank">${data.beatmap_title} [${data.difficulty}]</a>`
          : "No link available";
        const backgroundImage = data.beatmapset_id
          ? `https://assets.ppy.sh/beatmaps/${data.beatmapset_id}/covers/cover.jpg`
          : "";
        const modsString = getModsString(data.mods);
        const formattedTime = data.score_time 
          ? new Date(data.score_time).toLocaleString("en-GB", { 
              year: "numeric", 
              month: "2-digit", 
              day: "2-digit", 
              hour: "2-digit", 
              minute: "2-digit" 
            }).replace(/,/, "")
          : lang === "id" ? "Waktu tidak diketahui" : "Unknown time";

        milestoneCard.style.backgroundImage = backgroundImage ? `url('${backgroundImage}')` : "none";
        milestoneCard.innerHTML = `
          <div>
            <h3>${translations[lang].milestone.replace("{milestone}", milestone)}</h3>
            <p>${translations[lang].pp.replace("{pp}", data.pp.toFixed(2))}</p>
            <p>${translations[lang].grade.replace("{grade}", data.grade)}</p>
            <p>${translations[lang].accuracy.replace("{accuracy}", data.accuracy)}</p>
            <p>${translations[lang].mods.replace("{mods}", modsString)}</p>
            <p>${translations[lang].time.replace("{time}", formattedTime)}</p>
            <p>${translations[lang].beatmap.replace("{beatmap}", beatmapLink)}</p>
          </div>
        `;
      } else {
        milestoneCard.style.backgroundImage = "none";
        milestoneCard.innerHTML = `
          <div>
            <h3>${translations[lang].milestone.replace("{milestone}", milestone)}</h3>
            <p>${translations[lang].noScore}</p>
          </div>
        `;
      }
      resultsDiv.appendChild(milestoneCard);
    }
  } catch (error) {
    console.error("Error fetching milestones:", error);
    document.getElementById("results").innerHTML = `<p>${translations[lang].error}</p>`;
  } finally {
    searchBtn.disabled = false;
    loadingOverlay.style.display = "none";
  }
}

changeLanguage();
