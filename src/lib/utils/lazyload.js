
let options = {
    root: null,
    rootMargin: "0px",
    threshold: 0
}

// Helper function to check if element intersects viewport (matches IntersectionObserver threshold 0)
/**
 * @param {HTMLElement} element
 * @returns {boolean}
 */
const isIntersectingViewport = (element) => {
    if (typeof window === 'undefined') {
        return false;
    }
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= windowHeight &&
        rect.left <= windowWidth
    );
}

/**
 * @param {HTMLImageElement} image
 * @param {string} src
 * @returns {{destroy: () => void}}
 */
export const lazyLoad = (image, src) => {
    const loaded = () => {
        //image.classList.add('visible')                          // doesn't work in REPL
			  image.style.opacity = "1"                                 // REPL hack to apply loading animation
    }
    
    const loadImage = () => {
        console.log('an image has loaded')                  // console log for REPL
        image.src = src                                     // replace placeholder src with the image src on observe
        if (image.complete) {                               // check if instantly loaded
            loaded()        
        } else {
            image.addEventListener('load', loaded)          // if the image isn't loaded yet, add an event listener
        }
    }
    
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            loadImage()
            observer.unobserve(image)                       // stop observing once loaded
        }
    }, options)
    
    // Check if image is already intersecting viewport when action is initialized
    // This handles the case when navigating from another page
    if (typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
            if (isIntersectingViewport(image)) {
                loadImage()
            } else {
                observer.observe(image)                         // intersection observer
            }
        })
    } else {
        // Fallback for SSR
        observer.observe(image)
    }

    return {
        destroy() {
            observer.unobserve(image)                       // clean up the observer
            image.removeEventListener('load', loaded)       // clean up the event listener
        }
    }
}
