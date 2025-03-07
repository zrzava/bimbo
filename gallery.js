document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById("gallery");
    const filtersContainer = document.getElementById("filters");
    const params = new URLSearchParams(window.location.search);
    const tagFilter = params.get("tag") || "";
    const photoId = params.get("photo") || "";

    const blogs = ["bimbois.tumblr.com"];
    let allPhotos = [];
    let loadedPhotos = 0;
    const photosPerLoad = 20;
    let isLoading = false;

    // Načtení fotek z Tumblr API
    async function fetchTumblrPhotos() {
        if (isLoading) return;
        isLoading = true;

        try {
            let responses = await Promise.all(
                blogs.map(blog => fetch(`https://api.tumblr.com/v2/blog/${blog}/posts?api_key=YuwtkxS7sYF0DOW41yK2rBeZaTgcZWMHHNhi1TNXht3Pf7Lkdf&tag=${tagFilter}`))
            );
            let data = await Promise.all(responses.map(res => res.json()));

            allPhotos = data.flatMap(blogData =>
                (blogData.response?.posts || []).flatMap(post => {
                    let images = [];

                    // 1️⃣ Fotky z "photos" příspěvků
                    if (post.type === "photo" && post.photos) {
                        images.push(
                            ...post.photos.map(photo => ({
                                id: post.id,
                                url: photo.original_size.url,
                                tags: post.tags || []
                            }))
                        );
                    }

                    // 2️⃣ Extrakce obrázků z HTML obsahu "body"
                    if (post.body) {
                        let matches = [...post.body.matchAll(/<img.*?src=["'](.*?)["']/g)];
                        images.push(
                            ...matches.map(match => ({
                                id: post.id,
                                url: match[1],
                                tags: post.tags || []
                            }))
                        );
                    }

                    return images;
                })
            );

            console.log("✅ Photos fetched:", allPhotos);
            displayPhotos();
        } catch (error) {
            console.error("❌ Error fetching Tumblr data:", error);
        }

        isLoading = false;
    }

    // Zobrazení fotek v galerii
    function displayPhotos() {
        galleryContainer.innerHTML = "";

        const visiblePhotos = allPhotos.slice(0, loadedPhotos + photosPerLoad);
        visiblePhotos.forEach(photo => {
            let img = document.createElement("img");
            img.src = photo.url;
            img.loading = "lazy";
            img.alt = "Tumblr Photo";
            img.classList.add("gallery-image");
            galleryContainer.appendChild(img);
        });

        loadedPhotos += photosPerLoad;
    }

    fetchTumblrPhotos();
});
