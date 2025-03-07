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
        // Pokud příspěvek obsahuje fotky, přidej je
        if (post.photos) {
            post.photos.forEach(photo => {
                photos.push({
                    id: post.id,
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

            console.log("📡 API response:", JSON.stringify(data, null, 2));

            allPhotos = data.flatMap(blogData => blogData.response.posts.flatMap(extractImages));

            console.log("✅ Photos fetched:", allPhotos);

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
    }

    // Zobrazení fotek v galerii
    function displayPhotos() {
        galleryContainer.innerHTML = "";

        const visiblePhotos = getFilteredPhotos().slice(0, loadedPhotos + photosPerLoad);
        visiblePhotos.forEach(photo => {
            let img = document.createElement("img");
            img.src = photo.url;
            img.loading = "lazy";
            img.alt = `Photo from #${tagFilter}`;
            img.classList.add("gallery-image");
            img.addEventListener("click", () => {
                window.location.href = `index.html?tag=${tagFilter}&photo=${photo.id}`;
            });

            galleryContainer.appendChild(img);
        });

        loadedPhotos += photosPerLoad;

        if (loadedPhotos < getFilteredPhotos().length) {
            let showMoreButton = document.createElement("button");
            showMoreButton.textContent = "Show more";
            showMoreButton.addEventListener("click", displayPhotos);
            galleryContainer.appendChild(showMoreButton);
        }
    }

    // Zobrazení samostatné fotky v modálním okně
    function displaySinglePhoto() {
        if (!photoId) {
            console.error("❌ No photoId in URL");
            return;
        }

        console.log("📸 Looking for photo with ID:", photoId);

        let photo = allPhotos.find(p => p.id === photoId);

        if (!photo) {
            console.error(`❌ Photo with ID ${photoId} not found in allPhotos`);
            return;
        }

        // Vytvoření modálního okna pro zobrazení fotky
        let modal = document.createElement("div");
        modal.id = "photo-modal";
        modal.classList.add("modal");

        let img = document.createElement("img");
        img.src = photo.url;
        img.alt = `Photo from #${tagFilter}`;
        img.classList.add("modal-image");
        modal.appendChild(img);

        // Navigace pro předchozí a následující fotku
        let navContainer = document.createElement("div");
        navContainer.classList.add("photo-navigation");

        let prevPhotoIndex = allPhotos.findIndex(p => p.id === photoId) - 1;
        if (prevPhotoIndex >= 0) {
            let prevLink = document.createElement("a");
            prevLink.href = `index.html?tag=${tagFilter}&photo=${allPhotos[prevPhotoIndex].id}`;
            prevLink.textContent = "← Previous";
            navContainer.appendChild(prevLink);
        }

        let backLink = document.createElement("a");
        backLink.href = `index.html?tag=${tagFilter}`;
        backLink.textContent = "Back to Gallery";
        navContainer.appendChild(backLink);

        let nextPhotoIndex = allPhotos.findIndex(p => p.id === photoId) + 1;
        if (nextPhotoIndex < allPhotos.length) {
            let nextLink = document.createElement("a");
            nextLink.href = `index.html?tag=${tagFilter}&photo=${allPhotos[nextPhotoIndex].id}`;
            nextLink.textContent = "Next →";
            navContainer.appendChild(nextLink);
        }

        modal.appendChild(navContainer);
        document.body.appendChild(modal);

        // Zavření modálního okna při kliknutí na fotku
        modal.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
    }

    // Načítání dat
    if (photoId) {
        displaySinglePhoto();
    } else {
        fetchTumblrPhotos();
    }
});
