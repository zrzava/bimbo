document.addEventListener("DOMContentLoaded", async () => {
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

    async function fetchTumblrPhotos() {
        if (isLoading) return;
        isLoading = true;

        try {
            let responses = await Promise.all(
                blogs.map(blog => fetch(`https://api.tumblr.com/v2/blog/${blog}/posts/photo?api_key=YuwtkxS7sYF0DOW41yK2rBeZaTgcZWMHHNhi1TNXht3Pf7Lkdf${tagFilter ? `&tag=${tagFilter}` : ""}`))
            );
            let data = await Promise.all(responses.map(res => res.json()));

            allPhotos = data.flatMap(blogData =>
                blogData.response.posts?.flatMap(post =>
                    post.photos?.map(photo => ({
                        id: post.id,
                        url: photo.original_size.url,
                        tags: post.tags || []
                    }))
                ) || []
            );

            if (allPhotos.length === 0) {
                console.warn("❌ No photos found!");
            }

            console.log("✅ Photos fetched:", allPhotos);

            updateFilters();
            displayPhotos();
        } catch (error) {
            console.error("Error fetching Tumblr data:", error);
        }

        isLoading = false;
    }

    function updateFilters() {
        filtersContainer.innerHTML = "";

        Object.keys(hashtags).forEach(tag => {
            const count = allPhotos.filter(photo => photo.tags.includes(tag)).length;
            if (count > 0) {
                let filterLink = document.createElement("a");
                filterLink.href = `index.html?tag=${tag}`;
                filterLink.textContent = `${tag} (${count})`;
                filtersContainer.appendChild(filterLink);
                filtersContainer.appendChild(document.createTextNode(" • "));
            }
        });

        let gabbieLink = document.createElement("a");
        gabbieLink.href = "https://zrzava.com/?shop=pictures";
        gabbieLink.textContent = "Gabbie's Photos";
        filtersContainer.appendChild(gabbieLink);
    }

    function displayPhotos() {
        galleryContainer.innerHTML = "";

        const visiblePhotos = allPhotos.slice(0, loadedPhotos + photosPerLoad);
        visiblePhotos.forEach(photo => {
            let img = document.createElement("img");
            img.src = photo.url;
            img.loading = "lazy";
            img.alt = "Photo";
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

    if (photoId) {
        console.log("🔍 Displaying single photo:", photoId);
    } else {
        await fetchTumblrPhotos();
    }
});
