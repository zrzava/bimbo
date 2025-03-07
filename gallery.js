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

    // Funkce pro aktualizaci titulku stránky
    function updatePageTitle() {
        if (photoId && tagFilter) {
            document.title = `Photo from #${tagFilter} on Zrzava.com`;
        } else if (tagFilter) {
            document.title = `Gallery of #${tagFilter} on Zrzava.com`;
        } else {
            document.title = `Gallery on Zrzava.com`;
        }
    }

    // Funkce pro aktualizaci meta tagů
    function updateMetaTags() {
        const metaDescription = document.querySelector("meta[name='description']");
        const metaKeywords = document.querySelector("meta[name='keywords']");
        if (hashtags[tagFilter]) {
            metaDescription.content = hashtags[tagFilter].description;
            metaKeywords.content = hashtags[tagFilter].keywords;
        } else {
            metaDescription.content = "Explore beautiful bimbo galleries on Zrzava.com.";
            metaKeywords.content = "gallery, photos, fashion, lifestyle";
        }
    }

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
    }

    // Funkce pro otevření modálního okna
    function openModal(imageUrl, currentIndex) {
        const modal = document.getElementById("photo-modal");
        const modalImage = document.getElementById("modal-image");
        const closeModal = document.getElementById("close-modal");

        modalImage.src = imageUrl;
        modal.style.display = "block";
        
        // Nastavení maximální výšky fotky na 90vh
        modalImage.style.maxHeight = "90vh";
        modalImage.style.objectFit = "contain"; // Ujistí se, že fotka nebude deformována

        // Zavření modálního okna při kliknutí na křížek
        closeModal.addEventListener("click", () => {
            modal.style.display = "none";
        });

        // Zavření modálního okna při kliknutí mimo okno
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });

        // Posun na předchozí nebo následující fotku při kliknutí na okraj
        modalImage.addEventListener("click", (event) => {
            if (event.offsetX < modalImage.width / 2) {
                debounceMovePhoto(currentIndex, "prev"); // Levý okraj pro předchozí fotku
            } else {
                debounceMovePhoto(currentIndex, "next"); // Pravý okraj pro další fotku
            }
        });

        // Posun na předchozí nebo následující fotku pomocí kláves
        window.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                debounceMovePhoto(currentIndex, "prev");
            } else if (event.key === "ArrowRight") {
                debounceMovePhoto(currentIndex, "next");
            } else if (event.key === "Escape") {
                modal.style.display = "none"; // Zavření okna při Escape
            }
        });
    }

    // Debounce pro efektivní posouvání mezi fotkami
    let debounceTimerModal;
    const debounceDelay = 200; // Časová prodleva mezi změnami fotek

    function debounceMovePhoto(currentIndex, direction) {
        clearTimeout(debounceTimerModal); // Zastavit předchozí volání

        debounceTimerModal = setTimeout(() => {
            if (direction === "prev") {
                showPreviousPhoto(currentIndex); // Zobrazení předchozí fotky
            } else if (direction === "next") {
                showNextPhoto(currentIndex); // Zobrazení následující fotky
            }
        }, debounceDelay); // Prodleva mezi akcemi
    }

    // Funkce pro zobrazení předchozí fotky
    function showPreviousPhoto(currentIndex) {
        const visiblePhotos = filteredPhotos;
        const previousIndex = (currentIndex - 1 + visiblePhotos.length) % visiblePhotos.length;
        openModal(visiblePhotos[previousIndex].url, previousIndex);
    }

    // Funkce pro zobrazení další fotky
    function showNextPhoto(currentIndex) {
        const visiblePhotos = filteredPhotos;
        const nextIndex = (currentIndex + 1) % visiblePhotos.length;
        openModal(visiblePhotos[nextIndex].url, nextIndex);
    }

    // Debounce pro efektivní scrollování
    let debounceTimer;
    function onScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            if (loadedPhotos < filteredPhotos.length && !isLoading) {
                currentPage++;
                fetchTumblrPhotos(currentPage); // Načíst další fotky pro novou stránku, které odpovídají filtru
            }
        }
    }

    // Přidání scroll listeneru
    window.addEventListener("scroll", onScroll);

    // Načítání dat
    fetchTumblrPhotos();
});
