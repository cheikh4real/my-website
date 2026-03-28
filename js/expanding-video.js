document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
    return;

  gsap.registerPlugin(ScrollTrigger);

  // --- 3rd Section: Expanding Video Animation ---
  const expandVideo = document.querySelector(".expanding-video");
  const videoWrapper = document.querySelector(".video-wrapper");

  // Check if wrapper is visible/active before running video logic
  if (
    expandVideo &&
    videoWrapper &&
    getComputedStyle(videoWrapper).display !== "none"
  ) {
    // Ensure video is playing
    expandVideo.muted = true;
    expandVideo.play().catch(() => {});

    // --- Video Switching Logic ---
    const videoButtons = document.querySelectorAll(".video-btn");
    const videoOverlay = document.querySelector(".video-overlay-content");

    videoButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const newSrc = btn.getAttribute("data-video");
        if (!newSrc || expandVideo.src.includes(newSrc)) return;

        // Fade out, change source, fade in
        gsap.to(expandVideo, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            expandVideo.src = newSrc;
            expandVideo.muted = true;
            expandVideo.play().catch(() => {});
            gsap.to(expandVideo, { opacity: 1, duration: 0.4 });
          },
        });

        // Update active button state
        videoButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Create a master timeline that handles both expansion and text reveal
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: videoWrapper,
        start: "center center",
        end: "+=200%", // Total scroll distance for the whole sequence
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    // 1. Expand the video to fill the screen
    masterTl.to(expandVideo, {
      scale: 1,
      x: 0,
      y: 0,
      opacity: 1,
      borderRadius: 0,
      ease: "power2.inOut",
    });

    // 2. Reveal the overlay content (only after the video is full width)
    if (videoOverlay) {
      masterTl.fromTo(
        videoOverlay,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, ease: "power2.out" },
      );
    }
  }
});
