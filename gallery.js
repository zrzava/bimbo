document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById("gallery");
    const titleElement = document.title;
    const params = new URLSearchParams(window.location.search);
    const photoId = params.get("photo") || "";

    let allPhotos = [];
    let loadedPhotos = 0;
    const photosPerLoad = 20;
    let isLoading = false;
    let currentPage = 1; // Tracking current page for pagination
    let canLoadMore = false; // Flag to control automatic loading after "Show more" click

    // Funkce pro aktualizaci titulku stránky
    function updatePageTitle() {
        if (photoId) {
            document.title = `Photo from Zrzava.com`;
        } else {
            document.title = `Gallery on Zrzava.com`;
        }
    }

    // Funkce pro extrakci obrázků z příspěvků
    function extractImages(post) {
        let photos = [];

        if (post.photos) {
            post.photos.forEach(photo => {
                photos.push({
                    id: post.id,
                    url: photo.original_size.url
                });
            });
        }

        if (post.body) {
            let regex = /<img[^>]+src="([^">]+)"/g;
            let match;
            while (match = regex.exec(post.body)) {
                photos.push({
                    id: post.id,
                    url: match[1]
                });
            }
        }

        if (post.reblogged_from_post && post.reblogged_from_post.photos) {
            post.reblogged_from_post.photos.forEach(photo => {
                photos.push({
                    id: post.id,
                    url: photo.original_size.url
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
                ["bimbois.tumblr.com"].map(blog => fetch(`https://api.tumblr.com/v2/blog/${blog}/posts/photo?api_key=YuwtkxS7sYF0DOW41yK2rBeZaTgcZWMHHNhi1TNXht3Pf7Lkdf&limit=${photosPerLoad}&offset=${(page - 1) * photosPerLoad}`))
            );
            let data = await Promise.all(responses.map(res => res.json()));

            data.forEach(blogData => {
                blogData.response.posts.forEach(post => {
                    const photos = extractImages(post);
                    allPhotos.push(...photos);
                });
            });

            displayPhotos();
            updatePageTitle();
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
            img.loading = "lazy"; // Lazy loading fotky
            img.alt = "Photo from Zrzava.com";
            img.classList.add("gallery-image");
            img.addEventListener("click", () => {
                openModal(photo.url, visiblePhotos.indexOf(photo)); // Otevření modálního okna při kliknutí na fotku
            });

            galleryContainer.appendChild(img);
        });

        loadedPhotos += photosPerLoad;

        // Pokud už byly všechny fotky načteny, přidáme "Show more" tlačítko
        if (loadedPhotos < allPhotos.length) {
            showShowMoreButton();
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
            canLoadMore = true; // Povolit automatické načítání fotek při scrollování
            fetchTumblrPhotos(currentPage);
            showMoreButton.remove(); // Smažeme tlačítko, jakmile klikneme
        });
    }

    // Funkce pro otevření modálního okna
function openModal(imageUrl, currentIndex) {
    const modal = document.getElementById("photo-modal");
    const modalImage = document.getElementById("modal-image");
    const closeModal = document.getElementById("close-modal");

    modalImage.src = imageUrl;
    modal.style.display = "block";

    // Dynamické nastavení maximální výšky fotky na 93% výšky okna
    const modalHeight = window.innerHeight * 0.93; // 93% výšky okna
    modalImage.style.maxHeight = `${modalHeight}px`;
    modalImage.style.width = "auto"; // Šířka se přizpůsobí, aby byl zachován poměr stran
    modalImage.style.objectFit = "contain"; // Fotka se přizpůsobí bez deformace

    // Centrování fotky do středu okna
    modalImage.style.margin = "auto"; // Vycentrování horizontálně i vertikálně

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
        const visiblePhotos = allPhotos;
        const previousIndex = (currentIndex - 1 + visiblePhotos.length) % visiblePhotos.length;
        openModal(visiblePhotos[previousIndex].url, previousIndex);
    }

    // Funkce pro zobrazení další fotky
    function showNextPhoto(currentIndex) {
        const visiblePhotos = allPhotos;
        const nextIndex = (currentIndex + 1) % visiblePhotos.length;
        openModal(visiblePhotos[nextIndex].url, nextIndex);
    }

    // Debounce pro efektivní scrollování
    let debounceTimer;
    function onScroll() {
        if (canLoadMore && window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            if (loadedPhotos < allPhotos.length && !isLoading) {
                currentPage++;
                fetchTumblrPhotos(currentPage); // Načíst další fotky pro novou stránku
            }
        }
    }

    // Přidání scroll listeneru
    window.addEventListener("scroll", onScroll);

    // Načítání dat
    fetchTumblrPhotos();
});
