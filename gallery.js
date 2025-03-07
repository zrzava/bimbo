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

    // Funkce pro extrakci obrázků z příspěvků
    function extractImages(post) {
        let photos = [];

        // Pokud příspěvek obsahuje fotky z photo (hlavní fotky)
        if (post.photos) {
            post.photos.forEach(photo => {
                photos.push({
                    id: post.id,
                    url: photo.original_size.url,
                    source: 'photo', // přidáno pro označení, že jde o hlavní fotku
                    tags: post.tags
                });
            });
        }

        // Pokud příspěvek obsahuje obrázky v těle textu (body)
        if (post.body) {
            let regex = /<img[^>]+src="([^">]+)"/g;
            let match;
            while (match = regex.exec(post.body)) {
                photos.push({
                    id: post.id,
                    url: match[1],
                    source: 'body', // označení, že fotka je z těla
                    tags: post.tags
                });
            }
        }

        // Pokud je příspěvek reblog, přidej fotky z reblogu
        if (post.reblogged_from_post && post.reblogged_from_post.photos) {
            post.reblogged_from_post.photos.forEach(photo => {
                photos.push({
                    id: post.id,
                    url: photo.original_size.url,
                    source: 'reblog', // označení, že fotka pochází z reblogu
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

        let prevPhotoIndex = allPhotos.findIndex(p => p.id === photoId) - 1;
        if (prevPhotoIndex >= 0) {
            let prevPhoto = allPhotos[prevPhotoIndex];
            let prevLink = document.createElement("a");
            prevLink.href = `index.html?tag=${tagFilter}&photo=${prevPhoto.id}`;
            prevLink.textContent = "← Previous";
            navContainer.insertBefore(prevLink, backLink);
        }

        let nextPhotoIndex = allPhotos.findIndex(p => p.id === photoId) + 1;
        if (nextPhotoIndex < allPhotos.length) {
            let nextPhoto = allPhotos[nextPhotoIndex];
            let nextLink = document.createElement("a");
            nextLink.href = `index.html?tag=${tagFilter}&photo=${nextPhoto.id}`;
            nextLink.textContent = "Next →";
            navContainer.appendChild(nextLink);
        }

        galleryContainer.appendChild(navContainer);
    }

    // Načítání dat
    if (photoId) {
        displaySinglePhoto();
    } else {
        fetchTumblrPhotos();
    }
});
