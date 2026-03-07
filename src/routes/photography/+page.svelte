<script>
    import { lazyLoad } from "$lib/utils/lazyload";

    export let data;

    const albumDefs = [
        { id: 'all', label: 'All' },
        { id: 'nature', label: 'Nature' },
        { id: 'feathers-fur', label: 'Feathers & Fur' },
        { id: 'architecture', label: 'Architecture' },
    ];

    $: albums = albumDefs.map(album => ({
        ...album,
        images: album.id === 'all' ? data.images : data.images.filter(img => img.tags.includes(album.id))
    }));

    let activeAlbum = null;
    let lightboxIndex = null;

    $: filteredImages = activeAlbum === 'all'
        ? data.images
        : activeAlbum
            ? data.images.filter(img => img.tags.includes(activeAlbum))
            : [];

    $: activeAlbumLabel = albumDefs.find(a => a.id === activeAlbum)?.label ?? '';

    $: if (typeof document !== 'undefined') {
        document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    }

    function openAlbum(id) {
        activeAlbum = id;
        lightboxIndex = null;
    }

    function closeAlbum() {
        activeAlbum = null;
        lightboxIndex = null;
    }

    function openLightbox(index) {
        lightboxIndex = index;
    }

    function closeLightbox() {
        lightboxIndex = null;
    }

    function prev() {
        if (lightboxIndex > 0) lightboxIndex--;
    }

    function next() {
        if (lightboxIndex < filteredImages.length - 1) lightboxIndex++;
    }

    function handleKeydown(e) {
        if (lightboxIndex === null) return;
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'Escape') closeLightbox();
    }

    let touchStartX = 0;

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
    }

    function handleTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
            if (dx < 0) next();
            else prev();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
    <title>Photography</title>
</svelte:head>

<div class="block pb-5">
    {#if activeAlbum === null}
        <div class="columns is-justify-content-center mt-2">
            <div class="column is-8">
                <h1 class="is-size-2 mb-6 mt-6">Photography</h1>
                <hr />
                <p class="content is-size-4">
                    As an amateur photographer, I enjoy capturing landscapes and
                    cityscapes. These are a few shots I've taken over the years with
                    various cameras, including the Canon 6D, 7D Mark II, and Fuji
                    XT20. I usually do my post-processing in Adobe Lightroom. Just a
                    heads-up—I'm colorblind, so please excuse any color correction
                    quirks.
                </p>
            </div>
        </div>

        <div class="columns is-justify-content-center">
            <div class="column is-10">
                <div class="columns is-multiline">
                    {#each albums as album}
                        <div class="column is-4-desktop is-6-tablet is-12-mobile">
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div class="album-card" on:click={() => openAlbum(album.id)}>
                                <div class="album-stack">
                                    {#if album.images[2]}
                                        <div class="stack-layer stack-back">
                                            <img src={album.images[2].url} alt="" />
                                        </div>
                                    {/if}
                                    {#if album.images[1]}
                                        <div class="stack-layer stack-mid">
                                            <img src={album.images[1].url} alt="" />
                                        </div>
                                    {/if}
                                    {#if album.images[0]}
                                        <div class="stack-layer stack-front">
                                            <img src={album.images[0].url} alt="" />
                                        </div>
                                    {/if}
                                </div>
                                <div class="album-info">
                                    <span class="album-label">{album.label}</span>
                                    <span class="album-count">{album.images.length} photos</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {:else}
        <div class="columns is-justify-content-center">
            <div class="column is-10">
                <div class="album-header">
                    <button class="back-btn" on:click={closeAlbum}>← Albums</button>
                    <span class="album-title">{activeAlbumLabel}</span>
                </div>
            </div>
        </div>

        <div class="columns is-multiline is-gapless">
            {#each filteredImages as image, i (image.url)}
                <div class="column is-4-desktop is-6-tablet is-12-mobile">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <figure class="thumbnail" on:click={() => openLightbox(i)}>
                        <img use:lazyLoad={image.url} alt="" />
                    </figure>
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if lightboxIndex !== null}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="lightbox"
        on:click={closeLightbox}
        on:touchstart={handleTouchStart}
        on:touchend={handleTouchEnd}
    >
        <button class="lightbox-close" on:click|stopPropagation={closeLightbox} aria-label="Close">✕</button>

        <button
            class="lightbox-nav lightbox-prev"
            on:click|stopPropagation={prev}
            disabled={lightboxIndex === 0}
            aria-label="Previous"
        >‹</button>

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <figure class="lightbox-figure" on:click|stopPropagation>
            <img src={filteredImages[lightboxIndex].url} alt="" />
        </figure>

        <button
            class="lightbox-nav lightbox-next"
            on:click|stopPropagation={next}
            disabled={lightboxIndex === filteredImages.length - 1}
            aria-label="Next"
        >›</button>

        <span class="lightbox-counter">{lightboxIndex + 1} / {filteredImages.length}</span>
    </div>
{/if}

<style scoped lang="scss">
    /* Album card */
    .album-card {
        cursor: pointer;
        padding: 1rem;

        &:hover .stack-front {
            transform: rotate(-1deg) translateY(-6px);
        }

        &:hover .stack-mid {
            transform: rotate(3deg) translateY(-2px);
        }

        &:hover .stack-back {
            transform: rotate(-6deg) translateY(4px);
        }
    }

    .album-stack {
        position: relative;
        width: 100%;
        padding-bottom: 70%;
        margin-bottom: 1rem;
    }

    .stack-layer {
        position: absolute;
        inset: 8px;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        transition: transform 0.3s ease;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
    }

    .stack-back {
        transform: rotate(-4deg);
        z-index: 1;
    }

    .stack-mid {
        transform: rotate(2deg);
        z-index: 2;
    }

    .stack-front {
        transform: rotate(-1deg);
        z-index: 3;
    }

    .album-info {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 0 0.5rem;
    }

    .album-label {
        font-size: 1.1rem;
        font-weight: 600;
    }

    .album-count {
        font-size: 0.85rem;
        color: #888;
    }

    /* Grid view header */
    .album-header {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-bottom: 1.5rem;
    }

    .back-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        color: #888;
        padding: 0;
        transition: color 0.2s;

        &:hover {
            color: inherit;
        }
    }

    .album-title {
        font-size: 1.4rem;
        font-weight: 600;
    }

    /* Thumbnail grid */
    .thumbnail {
        position: relative;
        overflow: hidden;
        aspect-ratio: 1;
        cursor: pointer;
        margin: 0;
        background: #111;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0;
            transition: opacity 0.6s ease, transform 0.3s ease;
            display: block;
        }

        &:hover img {
            transform: scale(1.05);
        }
    }

    /* Lightbox */
    .lightbox {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .lightbox-figure {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 90vw;
        max-height: 90vh;

        img {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            display: block;
        }
    }

    .lightbox-close {
        position: absolute;
        top: 1rem;
        right: 1.25rem;
        background: none;
        border: none;
        color: #fff;
        font-size: 2rem;
        cursor: pointer;
        line-height: 1;
        opacity: 0.7;
        transition: opacity 0.2s;

        &:hover {
            opacity: 1;
        }
    }

    .lightbox-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        font-size: 3rem;
        line-height: 1;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background 0.2s;
        border-radius: 4px;

        &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.25);
        }

        &:disabled {
            opacity: 0.2;
            cursor: default;
        }
    }

    .lightbox-prev {
        left: 1rem;
    }

    .lightbox-next {
        right: 1rem;
    }

    .lightbox-counter {
        position: absolute;
        bottom: 1.25rem;
        left: 50%;
        transform: translateX(-50%);
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
        letter-spacing: 0.05em;
    }
</style>
