<script>
    import { lazyLoad } from "$lib/utils/lazyload";

    export let data;
</script>

<svelte:head>
    <title>Photography</title>
</svelte:head>

<div class="block pb-5">
    <div class="columns is-justify-content-center mt-2">
        <div class="column is-8">
            <h1 class="is-size-2 mb-6 mt-6">Photography</h1>
            <hr />

            <p class="content is-size-4">
                As an amateur photographer, I enjoy capturing landscapes and
                cityscapes. These are a few shots I’ve taken over the years with
                various cameras, including the Canon 6D, 7D Mark II, and Fuji
                XT20. I usually do my post-processing in Adobe Lightroom. Just a
                heads-up—I’m colorblind, so please excuse any color correction
                quirks.
            </p>
        </div>
    </div>

    {#each data.images as image}
        <figure>
            <img use:lazyLoad={image} />
        </figure>
    {/each}
</div>

<style scoped lang="scss">
    figure {
        margin-bottom: 8em;
        margin-top: 5em;
        min-height: 200px;
        text-align: center;
    }
    img {
        opacity: 0;
        transition:
            opacity 5s ease,
            transform 0.4s ease-in-out;
        max-width: 100%;
        max-height: 80vh;
        box-shadow:
            0px 0px 20px 0px rgba(0, 0, 0, 0.3),
            0px 40px 50px -40px rgba(0, 0, 0, 0.8);

        &:hover {
            transform: scale(1.1);

            box-shadow:
                0px 0px 30px 0px rgba(0, 0, 0, 0.25),
                0px 90px 80px -70px rgba(0, 0, 0, 0.6);
        }
    }
</style>
