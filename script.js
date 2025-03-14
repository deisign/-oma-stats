document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://public.radio.co/stations/s4360dbc20/history";
    let genreChart, artistChart;

    // Функция получения данных
    async function fetchStats() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Ошибка загрузки данных");
            const data = await response.json();
            return data.tracks;
        } catch (error) {
            console.error("Ошибка API:", error);
            return [];
        }
    }

    // Фильтр по периоду (24ч / неделя / месяц)
    function filterTracks(tracks, period) {
        let now = new Date();
        let cutoffDate = new Date();

        if (period === "week") cutoffDate.setDate(now.getDate() - 7);
        if (period === "month") cutoffDate.setMonth(now.getMonth() - 1);

        return tracks.filter(track => {
            let trackDate = new Date(track.start_time);
            return trackDate >= cutoffDate;
        });
    }

    // Обработка статистики
    function processStats(tracks) {
        let genreCounts = {};
        let artistCounts = {};
        let trackCounts = {};

        tracks.forEach(track => {
            let [artist, title] = track.title.split(" - ", 2);
            if (artist) artistCounts[artist] = (artistCounts[artist] || 0) + 1;
            if (title) trackCounts[title] = (trackCounts[title] || 0) + 1;

            let genre = track.genre || "Неизвестный жанр";
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });

        return {
            topGenres: Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
            topArtists: Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
            topTracks: Object.entries(trackCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
        };
    }

    // Функция обновления статистики
    async function updateStats(period = "24h") {
        console.log(`Обновляем статистику за: ${period}`);

        let tracks = await fetchStats();
        if (!tracks.length) return;

        let filteredTracks = filterTracks(tracks, period);
        let { topGenres, topArtists, topTracks } = processStats(filteredTracks);

        // Обновляем круговую диаграмму жанров
        let genreCtx = document.getElementById("genreChart").getContext("2d");
        if (genreChart) genreChart.destroy();
        genreChart = new Chart(genreCtx, {
            type: "pie",
            data: {
                labels: topGenres.map(g => g[0]),
                datasets: [{
                    data: topGenres.map(g => g[1]),
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9966FF"],
                }]
            },
            options: { responsive: true }
        });

        // Обновляем бар-график артистов
        let artistCtx = document.getElementById("artistChart").getContext("2d");
        if (artistChart) artistChart.destroy();
        artistChart = new Chart(artistCtx, {
            type: "bar",
            data: {
                labels: topArtists.map(a => a[0]),
                datasets: [{
                    data: topArtists.map(a => a[1]),
                    backgroundColor: "#FFCC00"
                }]
            },
            options: { responsive: true }
        });

        // Обновляем топ-10 треков
        let trackList = document.getElementById("topTracks");
        trackList.innerHTML = topTracks.map(t => `<li>${t[0]} (${t[1]})</li>`).join("");
    }

    updateStats();
});
