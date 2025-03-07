document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById("gallery");
    const filtersContainer = document.getElementById("filters");
    const titleElement = document.title;
    const params = new URLSearchParams(window.location.search);
    const tagFilter = params.get("tag") || "";
    const photoId = params.get("photo") || "";

    const hashtags = {
        "bimbo girl": { description: "Sexy and glamorous bimbo looks.", keywords: "bimbo, blonde, sexy, glamour" },
        "transgirl": { description: "Beautiful and confident trans women.", keywords: "trans, transgirls, mtf, transgender" },
        "smoking girl": { description: "Beautiful smoking girls.", keywords: "smoking girl, smoking fetish, smoking, cigarette" },
        "details": { description: "Close-up shots and detailed captures.", keywords: "details, fashion, accessories" }
    };

    const blogs = ["bimbois.tumblr.com"];
    let allPhotos = [];
    let filteredPhotos = [];
    let loadedPhotos = 0;
    const photosPerLoad = 20;
    let isLoading = false;
    let currentPage = 1; // Tracking current page for pagination
    let loadAutomatically = false; // Flag to track if we should load photos automatically

    // Funkce pro extrakci obrázků z příspěvků
    function extractImages(post) {
        let photos = [];

        if (post.photos) {
            post.photos.forEach(photo => {
                photos.push({
                    id: post.id,
                    url: photo.original_size.url,
                    tags: post.tags
                });
            });
        }

        if (post.body) {
            let regex = /<img[^>]+src="([^">]+)"/g;
            let match;
            while (match = regex.exec(post.body)) {
                photos.push({
                    id: post.id,
                    url: match[1],
                    tags: post.tags
                });
            }
        }

        if (post.reblogged_from_post && post.reblogged_from_post.photos) {
            post.reblogged_from_post.photos.forEach(photo => {
                photos.push({
                    id: post.id,
                    url: photo.original_size.url,
                    tags: post.tags
                });
            });
        }

        return photos;
    }

    // Načítání fotek z Tumblr API s stránkováním
    async function fetchTumblrPhotos(page = 1) {
        if (isLoading) return;
        isLoading = true;

        try {
            let responses = await Promise.all(
                blogs.map(blog => fetch(`https://api.tumblr.com/v2/blog/${blog}/posts/photo?api_key=YuwtkxS7sYF0DOW41yK2rBeZaTgcZWMHHNhi1TNXht3Pf7Lkdf&limit=${photosPerLoad}&offset=${(page - 1) * photosPerLoad}`))
            );
            let data = await Promise.all(responses.map(res => res.json()));

            data.forEach(blogData => {
                blogData.response.posts.forEach(post => {
                    const photos = extractImages(post);
                    allPhotos.push(...photos);
                });
            });

            // Filtrování fotek podle aktuálního filtru
            filteredPhotos = getFilteredPhotos();
            updateFilters();
            displayPhotos();
            updatePageTitle();
            updateMetaTags();
        } catch (error) {
            console.error("❌ Error fetching Tumblr data:", error);
        }

        isLoading = false;
    }

    // Filtrování fotek podle tagu
    function getFilteredPhotos() {
        if (!tagFilter) return allPhotos;
        return allPhotos.filter(photo => photo.tags.includes(tagFilter));
    }

    // Zobrazení filtrů
    function updateFilters() {
        filtersContainer.innerHTML = "";
        Object.keys(hashtags).forEach(tag => {
            let filterLink = document.createElement("a");
            filterLink.href = `index.html?tag=${tag}`;
            filterLink.textContent = `${tag.charAt(0).toUpperCase() + tag.slice(1)}`; // Zobrazí tag
            filtersContainer.appendChild(filterLink);
            filtersContainer.appendChild(document.createTextNode(" • "));
        });

        let gabbieLink = document.createElement("a");
        gabbieLink.href = "https://zrzava.com/?shop=pictures";
        gabbieLink.textContent = "Gabbie's Photos";
        filtersContainer.appendChild(gabbieLink);
    }

    // Zobrazení fotek v galerii
    function displayPhotos() {
        galleryContainer.innerHTML = "";

        const visiblePhotos = filteredPhotos.slice(0, loadedPhotos + photosPerLoad);
        visiblePhotos.forEach(photo => {
            let img = document.createElement("img");
            img.src = photo.url;
            img.loading = "lazy"; // Lazy loading fotky
            img.alt = `Photo from #${tagFilter}`;
            img.classList.add("gallery-image");
            img.addEventListener("click", () => {
                openModal(photo.url, visiblePhotos.indexOf(photo)); // Otevření modálního okna při kliknutí na fotku
            });

            galleryContainer.appendChild(img);
        });

        loadedPhotos += photosPerLoad;

        // Pokud už byly všechny fotky načteny, přidáme "Show more" tlačítko
        if (loadedPhotos < filteredPhotos.length && !loadAutomatically) {
            showShowMoreButton();
        } else if (loadedPhotos < filteredPhotos.length) {
            autoLoadMorePhotos();
        }
    }

    // Funkce pro zobrazení tlačítka "Show more"
    function showShowMoreButton() {
        let showMoreButton = document.createElement("button");
        showMoreButton.textContent = "Show more";
        showMoreButton.classList.add("show-more-button");
        galleryContainer.appendChild(showMoreButton);

        showMoreButton.addEventListener("click", () => {
            currentPage++;
            loadAutomatically = true; // Po kliknutí nastavíme automatické načítání
            fetchTumblrPhotos(currentPage);
            showMoreButton.remove(); // Smažeme tlačítko, jakmile klikneme
        });
    }

    // Funkce pro automatické načítání fotek při scrollování
    function autoLoadMorePhotos() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            if (loadedPhotos < filteredPhotos.length && !isLoading) {
                currentPage++;
                fetchTumblrPhotos(currentPage); // Načíst další fotky pro novou stránku, které odpovídají filtru
            }
        }
    }

    // Přidání scroll listeneru pro automatické načítání
    window.addEventListener("scroll", autoLoadMorePhotos);

    // Načítání dat
    fetchTumblrPhotos();
});
