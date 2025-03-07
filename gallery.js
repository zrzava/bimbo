document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById("gallery");
    const filtersContainer = document.getElementById("filters");
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

    // Nastavení title podle URL parametrů
    function updatePageTitle() {
        if (photoId && tagFilter) {
            document.title = `Photo from #${tagFilter} on Zrzava.com`;
        } else if (tagFilter) {
            document.title = `Gallery of #${tagFilter} on Zrzava.com`;
        } else {
            document.title = `Gallery on Zrzava.com`;
        }
    }

    // Aktualizace meta tagů
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

    // Načtení fotek z Tumblr API
    async function fetchTumblrPhotos() {
        if (isLoading) return;
        isLoading = true;

        try {
            let responses = await Promise.all(
                blogs.map(blog => {
                    let apiUrl = `https://api.tumblr.com/v2/blog/${blog}/posts/photo?api_key=YuwtkxS7sYF0DOW41yK2rBeZaTgcZWMHHNhi1TNXht3Pf7Lkdf${tagFilter ? `&tag=${tagFilter}` : ""}`;
                    console.log(`🔗 Fetching: ${apiUrl}`);
                    return fetch(apiUrl);
                })
            );

            let data = await Promise.all(responses.map(res => res.json()));

            data.forEach((blogData, index) => {
                console.log(`📡 API response for ${blogs[index]}:`, blogData);
            });

            allPhotos = data.flatMap(blogData =>
                (blogData.response?.posts || []).flatMap(post =>
                    (post.photos || []).map(photo => ({
                        id: post.id,
                        url: photo.original_size.url,
                        tags: post.tags || []
                    }))
                )
            );

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

        const visiblePhotos = allPhotos.slice(0, loadedPhotos + photosPerLoad);
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

        if (loadedPhotos < allPhotos.length) {
            let showMoreButton = document.createElement("button");
            showMoreButton.textContent = "Show more";
            showMoreButton.addEventListener("click", displayPhotos);
            galleryContainer.appendChild(showMoreButton);
        }
    }

    // Zobrazení samostatné fotky
    function displaySinglePhoto() {
        if (!photoId) return;
        let photo = allPhotos.find(p => p.id === photoId);
        if (!photo) return;

        galleryContainer.innerHTML = "";

        let img = document.createElement("img");
        img.src = photo.url;
        img.style.maxHeight = "90vh";
        img.alt = `Photo from #${tagFilter}`;
        galleryContainer.appendChild(img);

        let navContainer = document.createElement("div");
        navContainer.classList.add("photo-navigation");

        let backLink = document.createElement("a");
        backLink.href = `index.html?tag=${tagFilter}`;
        backLink.textContent = "Back to Gallery";
        navContainer.appendChild(backLink);

        let prevPhoto = allPhotos[allPhotos.findIndex(p => p.id === photoId) - 1];
        if (prevPhoto) {
            let prevLink = document.createElement("a");
            prevLink.href = `index.html?tag=${tagFilter}&photo=${prevPhoto.id}`;
            prevLink.textContent = "← Previous";
            navContainer.insertBefore(prevLink, backLink);
        }

        let nextPhoto = allPhotos[allPhotos.findIndex(p => p.id === photoId) + 1];
        if (nextPhoto) {
            let nextLink = document.createElement("a");
            nextLink.href = `index.html?tag=${tagFilter}&photo=${nextPhoto.id}`;
            nextLink.textContent = "Next →";
            navContainer.appendChild(nextLink);
        }

        galleryContainer.appendChild(navContainer);
    }

    let debounceTimer;
    window.addEventListener("scroll", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                displayPhotos();
            }
        }, 200);
    });

    if (photoId) {
        displaySinglePhoto();
    } else {
        fetchTumblrPhotos();
    }
});
