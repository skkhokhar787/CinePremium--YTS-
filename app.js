const card = document.getElementById("movie_card");
const genreSelect = document.getElementById("genreSelect");
const ratingSelect = document.getElementById("ratingSelect");

const gridLoader = document.getElementById("gridLoader");
const searchSmallIcon = document.getElementById("searchSmallIcon");
const searchSmallSpinner = document.getElementById("searchSmallSpinner");
const searchLargeIcon = document.getElementById("searchLargeIcon");
const searchLargeSpinner = document.getElementById("searchLargeSpinner");

const API_URL = "https://movies-api.accel.li/api/v2/list_movies.json";
const DETAIL_API_URL = "https://movies-api.accel.li/api/v2/movie_details.json";
const movieSuggestion_API =
  "https://movies-api.accel.li/api/v2/movie_suggestions.json";

let allMovies = [];

let currentPage = 1;
let totalPages = 1;
let limit = 20;
let currentGenre = "All Genres";
let currentRating = 0;
let currentSearch = "";

// ================= LOADERS =================
function showGridLoader() {
  if (gridLoader) {
    gridLoader.classList.remove("hidden");
    gridLoader.classList.add("flex");
  }
}

function hideGridLoader() {
  if (gridLoader) {
    gridLoader.classList.add("hidden");
    gridLoader.classList.remove("flex");
  }
}

function setSearchLoading(isLoading) {
  [
    [searchSmallIcon, searchSmallSpinner],
    [searchLargeIcon, searchLargeSpinner],
  ].forEach(([icon, spinner]) => {
    if (!icon || !spinner) return;
    icon.classList.toggle("hidden", isLoading);
    spinner.classList.toggle("hidden", !isLoading);
  });
}

// ================= FETCH MOVIES =================
async function getMovies(page = 1, genre = "All Genres", rating = 0, searchText = "") {
  showGridLoader();
  if (searchText) setSearchLoading(true);

  try {
    let url = `${API_URL}?page=${page}&limit=${limit}`;

    if (genre !== "All Genres") {
      url += `&genre=${encodeURIComponent(genre)}`;
    }

    if (rating > 0) {
      url += `&minimum_rating=${rating}`;
    }

    if (searchText) {
      url += `&query_term=${encodeURIComponent(searchText)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const movies = data?.data?.movies || [];
    allMovies = movies;

    totalPages = data?.data?.movie_count
      ? Math.ceil(data.data.movie_count / limit)
      : 1;

    displayMovies(movies);
    renderPagination();

    if (!searchText && genre === "All Genres" && rating === 0) {
      extractGenres(movies);
    }
    extractRating(movies);
  } catch (error) {
    console.error("Error:", error);
    if (card) card.innerHTML = `<p class="text-white col-span-full text-center">Something went wrong loading movies. Please try again.</p>`;
  } finally {
    hideGridLoader();
    setSearchLoading(false);
  }
}

// ================= DISPLAY MOVIES =================
function displayMovies(movies) {
  if (!card) return;

  if (movies.length === 0) {
    card.innerHTML = `<p class="text-white">No movies found</p>`;
    return;
  }

  const moviesHTML = movies
    .map((movie) => {
      const title = movie.title || "Untitled";
      const rating = movie.rating ? movie.rating.toFixed(1) : "N/A";
      const year = movie.year || "N/A";

      return `
        <article class="group relative overflow-hidden rounded-xl bg-surface-container shadow-xl">
          <img
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            src="${movie.medium_cover_image || movie.large_cover_image || ""}"
            alt="${title}"
          />
          <div class="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black via-black/50 to-transparent p-6">
            <div class="mb-4">
              <h3 class="mb-1 text-white">${title}</h3>
              <div class="flex items-center gap-2 text-sm">
                <span class="font-bold text-yellow-400">⭐ ${rating}</span>
                <span class="text-gray-400">• ${year}</span>
              </div>
            </div>
            <a href="details.html?id=${movie.id}" 
              class="block w-full rounded-lg bg-yellow-400 py-2.5 text-center text-sm font-semibold text-black hover:brightness-110 transition">
              View Details
            </a>
          </div>
        </article>
      `;
    })
    .join("");

  card.innerHTML = moviesHTML;
}

// ================= SEARCH =================
function filterMovies(searchText) {
  currentSearch = searchText;
  currentPage = 1;
  getMovies(currentPage, currentGenre, currentRating, currentSearch);
}

// ================= FILTERS =================
function extractGenres(movies) {
  const genreSet = new Set();

  movies.forEach((movie) => {
    if (movie.genres) {
      movie.genres.forEach((g) => genreSet.add(g));
    }
  });

  renderGenres([...genreSet]);
}

function extractRating(movies) {
  const ratingSet = new Set();

  movies.forEach((movie) => {
    if (movie.rating !== undefined && movie.rating !== null) {
      ratingSet.add(Math.floor(movie.rating));
    }
  });

  renderRating([...ratingSet].sort((a, b) => b - a));
}

function renderGenres(genres) {
  if (!genreSelect) return;

  const options = ["All Genres", ...genres]
    .map((g) => `<option value="${g}">${g}</option>`)
    .join("");

  genreSelect.innerHTML = options;
}

function renderRating(ratings) {
  if (!ratingSelect) return;

  if (ratingSelect.options.length > 1) return;

  const options = ["Any Rating", ...ratings.map((r) => `${r}+`)]
    .map((label, index) => {
      const value = index === 0 ? 0 : ratings[index - 1];
      return `<option value="${value}">${label}</option>`;
    })
    .join("");

  ratingSelect.innerHTML = options;
}

// ================= PAGINATION =================
function renderPagination() {
  const container = document.querySelector(".mt-xl.flex");
  if (!container) return;

  let buttons = "";

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      buttons += `
        <button onclick="changePage(${i})"
          class="flex h-10 w-10 items-center justify-center rounded-lg ${
            i === currentPage
              ? "bg-yellow-400 text-black font-bold"
              : "bg-gray-800 text-white hover:border-yellow-400 border"
          }">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      buttons += `<span class="px-2 text-white">...</span>`;
    }
  }

  container.innerHTML = buttons;
}

function changePage(page) {
  currentPage = page;
  getMovies(currentPage, currentGenre, currentRating, currentSearch);
}

// ================= DETAILS =================
function getMovieIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderMovieDetail(movie) {
  const detailContainer = document.getElementById("movie-detail");
  if (!detailContainer) return;

  let downloadLink = "#";
  let qualityLabel = "HD";

  if (movie.torrents && movie.torrents.length > 0) {
    const best =
      movie.torrents.find((t) => t.quality === "1080p") ||
      movie.torrents.find((t) => t.quality === "720p") ||
      movie.torrents[0];

    downloadLink = best.url;
    qualityLabel = best.quality;
  }

  const title = movie.title_long || movie.title;
  const description = movie.description_full || movie.summary;

  const poster = movie.large_cover_image || movie.medium_cover_image || "";

  const backdrop =
    movie.background_image || movie.background_image_original || poster;

  detailContainer.innerHTML = `
    <section class="relative text-white">

      <div class="absolute inset-0 -z-10">
        <img src="${backdrop}" class="w-full h-full object-cover opacity-30"/>
        <div class="absolute inset-0 bg-black/80"></div>
      </div>

      <div class="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">

        <div class="rounded-xl overflow-hidden shadow-xl">
          <img src="${poster}" class="w-full h-full object-cover"/>
        </div>

        <div class="md:col-span-2 space-y-6">

          <h1 class="text-4xl font-bold">${title}</h1>

          <div class="flex gap-4 text-gray-300 text-sm">
            <span>⭐ ${movie.rating}</span>
            <span>${movie.year}</span>
            <span>${movie.runtime} min</span>
          </div>

          <p class="text-gray-400 leading-relaxed">
            ${description}
          </p>

          <!-- 🎬 BUTTONS -->
          <div class="flex gap-4 flex-wrap">
            <a href="${downloadLink}" target="_blank"
              class="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:brightness-110">
               Download (${qualityLabel})
            </a>

            <a href="https://www.imdb.com" target="_blank"
              class="bg-gray-800 px-6 py-3 rounded-lg">
              IMDb
            </a>
          </div>

        </div>
      </div>
    </section>
  `;
}

// ================= SUGGESTIONS =================
function renderMovieSuggestions(suggestions) {
  const container = document.getElementById("movie-suggestions");
  if (!container) return;

  const html = suggestions
    .slice(0, 5)
    .map((movie) => {
      return `
        <a href="details.html?id=${movie.id}" class="block">
          <img src="${movie.medium_cover_image}" class="rounded-lg mb-2"/>
          <p class="text-white text-sm">${movie.title}</p>
        </a>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="mt-16">
      <h2 class="text-xl text-white mb-6">More like this</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        ${html}
      </div>
    </div>
  `;
}

async function getMovieSuggestions(id) {
  const container = document.getElementById("movie-suggestions");
  try {
    const res = await fetch(`${movieSuggestion_API}?movie_id=${id}`);
    const data = await res.json();
    renderMovieSuggestions(data?.data?.movies || []);
  } catch (e) {
    console.error(e);
    if (container) container.innerHTML = "";
  }
}

async function getMovieDetails() {
  const id = getMovieIdFromUrl();
  const detailContainer = document.getElementById("movie-detail");
  if (!id) return;

  try {
    const res = await fetch(`${DETAIL_API_URL}?movie_id=${id}`);
    const data = await res.json();

    const movie = data?.data?.movie;
    if (!movie) throw new Error("Movie not found");

    renderMovieDetail(movie);
    getMovieSuggestions(id);
  } catch (error) {
    console.error(error);
    if (detailContainer) {
      detailContainer.innerHTML = `
        <div class="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-secondary/20 bg-surface-container p-8 text-on-surface-variant">
          <p class="text-sm">Something went wrong loading this movie. Please try again.</p>
        </div>
      `;
    }
  }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const detailContainer = document.getElementById("movie-detail");

  if (detailContainer) {
    getMovieDetails();
    return;
  }

  getMovies();

  // SEARCH
  const searchSmall = document.getElementById("searchInputSmall");
  const searchLarge = document.getElementById("searchInputLarge");

  let debounceTimer;

  function handleSearch(e) {
    const value = e.target.value.toLowerCase();

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      if (searchSmall && searchSmall !== e.target) searchSmall.value = value;
      if (searchLarge && searchLarge !== e.target) searchLarge.value = value;

      filterMovies(value);
    }, 300);
  }

  if (searchSmall) searchSmall.addEventListener("input", handleSearch);
  if (searchLarge) searchLarge.addEventListener("input", handleSearch);

  // FILTERS
  if (genreSelect) {
    genreSelect.addEventListener("change", (e) => {
      currentGenre = e.target.value;
      currentPage = 1;
      getMovies(currentPage, currentGenre, currentRating, currentSearch);
    });
  }

  if (ratingSelect) {
    ratingSelect.addEventListener("change", (e) => {
      currentRating = Number(e.target.value) || 0;
      currentPage = 1;
      getMovies(currentPage, currentGenre, currentRating, currentSearch);
    });
  }
});