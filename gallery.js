document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById("gallery");
    const filtersContainer = document.getElementById("filters");
    const params = new URLSearchParams(window.location.search);
    const tagFilter = params.get("tag") || "";

    const blogs = ["bimbois.tumblr.com"];
    let allPhotos = [];
    let loadedPhotos = 0;
    const photosPerLoad = 20;
    let isLoading = false;

    // 📡 Fetch Tumblr posts
    async function fetchTumblrPhotos() {
        if (isLoading) return;
        isLoading = true;

        try {
            let responses = await Promise.all(
                blogs.map(blog => fetch(`https://api.tumblr.com/v2/blog/${blog}/posts?api_key=YuwtkxS7sYF0DOW41yK2rBeZaTgcZWMHHNhi1TNXht3Pf7Lkdf&tag=${tagFilter}`))
            );
            let data = await Promise.all(responses.map(res => res.json()));

            console.log("📡 API response:", JSON.stringify(data, null, 2));

            allPhotos = data.flatMap(blogData => blogData.response.posts.flatMap(extractImages));

            console.log("✅ Photos fetched:", allPhotos);

            displayPhotos();
        } catch (error) {
            console.error("❌ Error fetching Tumblr data:", error);
        }

        isLoading = false;
    }

    // 📷 Extract images from different post sources
    function extractImages(post) {
        let images = [];

        // 1️⃣ Standardní fotky v `photos`
        if (post.photos) {
            images.push(...post.photos.map(photo => ({
                id: post.id,
                url: photo.original_size.url
            })));
        }

        // 2️⃣ Fotky z `body` (HTML parsing)
        if (post.body) {
            let imgMatches = post.body.match(/<img.*?src=["'](.*?)["']/g);
            if (imgMatches) {
                images.push(...imgMatches.map(imgTag => ({
                    id: post.id,
                    url: imgTag.match(/src=["'](.*?)["']/)[1]
                })));
            }
        }

        // 3️⃣ Fotky z `trail` (reblogy)
        if (post.trail) {
            post.trail.forEach(trailItem => {
                if (trailItem.content) {
                    let imgMatches = trailItem.content.match(/<img.*?src=["'](.*?)["']/g);
                    if (imgMatches) {
                        images.push(...imgMatches.map(imgTag => ({
                            id: post.id,
                            url: imgTag.match(/src=["'](.*?)["']/)[1]
                        })));
                    }
                }
            });
        }

        return images;
    }

    // 🖼 Zobrazení fotek
    function displayPhotos() {
        galleryContainer.innerHTML = "";

        const visiblePhotos = allPhotos.slice(0, loadedPhotos + photosPerLoad);
        visiblePhotos.forEach(photo => {
            let img = document.createElement("img");
            img.src = photo.url;
            img.loading = "lazy";
            img.classList.add("gallery-image");

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

    fetchTumblrPhotos();
});
