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
    let loadedPhotos = 0;
    const photosPerLoad = 20;
    let isLoading = false;

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
                    id: post.id,  // Používáme post.id jako pevné ID fotky
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
                    id: post.id,  // Používáme post.id jako pevné ID fotky
                    url: match[1],
                    tags: post.tags
                });
            }
        }

        if (post.reblogged_from_post && post.reblogged_from_post.photos) {
            post.reblogged_from_post.photos.forEach(photo => {
                photos.push({
                    id: post.id,  // Používáme post.id jako pevné ID fotky
                    url: photo.original_size.url,
                    tags: post.tags
                });
            });
        }

        return photos;
    }

    // Načítání fotek z Tumblr API
    async function fetchTumblrPhotos() {
        if (isLoading) return;
        isLoading = true;

        try {
            let responses = await Promise.all(
                blogs.map(blog => fetch(`https://api.tumblr.com/v2/blog/${blog}/posts/photo?api_key=YuwtkxS7sYF0DOW41yK2rBeZaTgcZWMHHNhi1TNXht3Pf7Lkdf&limit=20`))
            );
            let data = await Promise.all(responses.map(res => res.json()));

            allPhotos = data.flatMap(blogData => blogData.response.posts.flatMap(extractImages));

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

    // Zobrazení filtrů s počtem fotek
    function updateFilters() {
        filtersContainer.innerHTML = "";
        Object.keys(hashtags).forEach(tag => {
            const count = allPhotos.filter(photo => photo.tags.includes(tag)).length;
            if (count > 0) {
                let filterLink = document.createElement("a");
                filterLink.href = `index.html?tag=${tag}`;
                filterLink.textContent = `${tag.charAt(0).toUpperCase() + tag.slice(1)} (${count})`;
                filtersContainer.appendChild(filterLink);
                filtersContainer.appendChild(document.createTextNode(" • "));
            }
        });

        let gabbieLink = document.createElement("a");
        gabbieLink.href = "https://zrzava.com/?shop=pictures";
        gabbieLink.textContent = "Gabbie's Photos";
        filtersContainer.appendChild(gabbieLink);
    }

    // Zobrazení fotek v galerii
    function displayPhotos() {
        galleryContainer.innerHTML = "";

        const visiblePhotos = getFilteredPhotos().slice(0, loadedPhotos + photosPerLoad);
        visiblePhotos.forEach(photo => {
            let img = document.createElement("img");
            img.src = photo.url;
            img.loading = "lazy"; // Lazy loading fotky
            img.alt = `Photo from #${tagFilter}`;
            img.classList.add("gallery-image");
            img.addEventListener("click", () => {
                openModal(photo.id); // Otevření modálního okna při kliknutí na fotku
            });

            galleryContainer.appendChild(img);
        });

        loadedPhotos += photosPerLoad;
    }

    // Funkce pro otevření modálního okna
    function openModal(photoId) {
        const modal = document.getElementById("photo-modal");
        const modalImage = document.getElementById("modal-image");
        const closeModal = document.getElementById("close-modal");

        const photo = allPhotos.find(p => p.id === photoId); // Najdeme fotku podle jejího ID

        if (!photo) return;

        modalImage.src = photo.url;
        modal.style.display = "block";

        // Nastavení maximální výšky fotky na 95vh a její centrování
        modalImage.style.maxHeight = "95vh";
        modalImage.style.objectFit = "contain"; // Ujistí se, že fotka nebude deformována
        modal.style.display = "flex"; // Nastaví modální okno do flexboxu pro centrování fotky
        modal.style.alignItems = "center"; // Vertikální centrování
        modal.style.justifyContent = "center"; // Horizontální centrování

        // Změna URL v prohlížeči s ID fotky
        history.pushState(null, "", `?photo=${photoId}`);

        // Zavření modálního okna při kliknutí na křížek
        closeModal.addEventListener("click", () => {
            modal.style.display = "none";
            history.pushState(null, "", window.location.pathname); // Reset URL při zavření okna
        });

        // Zavření modálního okna při kliknutí mimo okno
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
                history.pushState(null, "", window.location.pathname); // Reset URL při zavření okna
            }
        });

        // Ovládání fotek pomocí šipek
        document.addEventListener("keydown", (event) => {
            if (modal.style.display === "block") {
                if (event.key === "ArrowLeft") {
                    changePhoto(-1);
                } else if (event.key === "ArrowRight") {
                    changePhoto(1);
                } else if (event.key === "Escape") {
                    modal.style.display = "none";
                    history.pushState(null, "", window.location.pathname); // Reset URL při zavření okna
                }
            }
        });
    }

    // Funkce pro změnu fotky (na základě směru)
    function changePhoto(direction) {
        const currentIndex = allPhotos.findIndex(p => p.id === photoId);
        if (currentIndex === -1) return;

        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < allPhotos.length) {
            const nextPhoto = allPhotos[nextIndex];
            openModal(nextPhoto.id); // Otevře novou fotku
        }
    }

    // Debounce pro efektivní scrollování
    let debounceTimer;
    function onScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            if (loadedPhotos < getFilteredPhotos().length && !isLoading) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    displayPhotos(); // Načíst další fotky s debounce
                }, 200);
            }
        }
    }

    // Přidání scroll listeneru
    window.addEventListener("scroll", onScroll);

    // Načítání dat
    fetchTumblrPhotos();
});
