<svelte:head>
    <title>About Me</title>
</svelte:head>

<section class="container pb-5">
    <article>
        <h1 class="is-size-1-tablet is-size-3-mobile mb-6 mt-6">About Me</h1>
        <hr />
        <p class="is-size-3 content">
            I'm Jassim Abdul Latheef, I try to make things all the time and
            break things occassionally. I'm an entrepreneur, currently working
            at <a
                href="https://www.glance.care"
                target="_blank"
                title="Glance Care Website"
            >
                Glance Care
            </a> as a co-founder and CTO.
        </p>
        <p>
            I've always been curious, and I'm lucky to have found a job that
            lets me turn that curiosity into something meaningful. I get to help
            people improve their lives, bit by bit, while doing what I love.
        </p>
        <p>
            I design and build products, and I enjoy every part of the process.
            Here's my philosophy: humanity has reached incredible heights of
            convenience and efficiency because people kept innovating and
            solving problems. Everything we take for granted today is the result
            of someone's effort to make things better. I believe it's our
            responsibility to keep pushing humanity forward and making it even
            better.
        </p>
        <hr />
        <p>
            Professionally, I had the opportunity to work with some amazing
            people and companies. I've worked with startups, agencies, and
            enterprises, and I've learned a lot from each experience. I've
            worked on projects ranging from small websites to large-scale
            applications on various capacities, and I've had the chance to work
            with a wide range of technologies and tools.
        </p>
        <hr />
        <div class="social-links">
            <a href="https://x.com/_al_jassim" target="_blank" class="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>@_al_jassim</span>
            </a>
            <a href="https://www.linkedin.com/in/jassimabdullatheef/" target="_blank" class="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>jassimabdullatheef</span>
            </a>
            <a href="mailto:hi@jsm.sh" class="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span>hi@jsm.sh</span>
            </a>
        </div>
    </article>
</section>

<style>
    .social-links {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .social-link {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        color: inherit;
        opacity: 0.75;
        transition: opacity 0.2s;
    }

    .social-link:hover {
        opacity: 1;
    }
</style>
