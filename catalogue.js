document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Entrance Animations
    const heroTl = gsap.timeline({
      defaults: { ease: "expo.out", duration: 2 },
    });

    heroTl
      .from(".hero-title .line", {
        y: 100,
        opacity: 0,
        stagger: 0.15,
        skewY: 2,
      })
      .from(
        ".hero-rail",
        {
          xPercent: 10,
          opacity: 0,
          duration: 2.5,
        },
        "-=1.5",
      )
      .from(
        ".hero-copy__body, .eyebrow, .hero-copy__divider, .hero-rail__label, .hero-stamp",
        {
          y: 30,
          opacity: 0,
          stagger: 0.1,
        },
        "-=1.8",
      );

    const horizontalMainTrack = document.querySelector(
      ".horizontal-main-track",
    );
    const panels = gsap.utils.toArray(".epanel");
    const viewportWidth = window.innerWidth;

    // Dimensions constants
    const INITIAL_WIDTH = 144;
    const EXPANDED_WIDTH = 574;
    const WIDTH_DELTA = EXPANDED_WIDTH - INITIAL_WIDTH;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".catalogue-shell",
        start: "top top",
        end: () => `+=${window.innerHeight * 10}`,
        pin: true,
        scrub: true, // Fixed: Locked to scroll position to prevent "bounce"
        invalidateOnRefresh: true,
      },
    });

    // Get total scroll distance for mapping
    const getScrollDist = () => horizontalMainTrack.scrollWidth - viewportWidth;
    const scrollDist = getScrollDist(); // Calculate once to stabilize mapping

    // PHASE 1: Main Horizontal Scroll
    // Total Timeline progress mapped to 20 units
    tl.to(
      ".horizontal-main-track",
      {
        x: -scrollDist,
        ease: "none",
        duration: 20,
      },
      0,
    );

    // Sub-animation for Hero Rail
    tl.to(".hero-rail", { x: "5vw", ease: "none", duration: 4 }, 0);
    tl.to(".parallax-img", { yPercent: 15, ease: "none", duration: 4 }, 0);

    panels.forEach((panel, i) => {
      const img = panel.querySelector(".epanel__img");
      const bg = panel.querySelector(".epanel__bg");
      const content = panel.querySelector(".epanel__content");
      const panelLabelElement = panel.querySelector(".epanel__label"); // Renamed to avoid conflict
      const title = panel.querySelector(".epanel__title");
      const desc = panel.querySelector(".epanel__description");
      const cta = panel.querySelector(".epanel__cta");
      const panelNumber = panel.querySelector(".epanel__number");

      /**
       * TRIGGER CALCULATION (Pixels)
       * Panel Left Edge in track = viewportWidth (hero) + (i * 144)
       */
      const panelLeftInTrack = viewportWidth + i * INITIAL_WIDTH;

      // Adjusted logic to ensure startTime < endTime
      // Starts expanding as the panel enters from the right (left edge at 85% of viewport)
      const trackXStart = 0.85 * viewportWidth - panelLeftInTrack;

      // Fully expanded when the panel reaches its focus point (left edge at 45% of viewport)
      const trackXEnd = 0.45 * viewportWidth - panelLeftInTrack;

      // Map pixel track movement to timeline units (0-20)
      const mapPos = (px) =>
        gsap.utils.mapRange(0, -getScrollDist(), 0, 20, px);

      const startTime = mapPos(trackXStart);
      const endTime = mapPos(trackXEnd);
      const duration = endTime - startTime;

      // 1. Expansion: Grow width and shift X to expand both ways
      // We use a small overlap window to prevent gaps
      tl.to(
        panel,
        {
          width: EXPANDED_WIDTH,
          x: X_SHIFT,
          duration: duration,
          ease: "none",
        },
        startTime,
      );

      // 2. Vertical Shift: Image height 521px -> 399px
      // And move it to the top (marginTop 10vh -> 0)
      tl.to(
        bg,
        { height: 399, marginTop: 0, duration: duration, ease: "none" },
        startTime,
      );

      tl.to(
        panelNumber,
        { marginTop: "2vh", duration: duration, ease: "none" },
        startTime,
      );

      // Expand bottom content area
      tl.to(
        content,
        { height: "calc(100vh - 399px)", duration: duration, ease: "none" },
        startTime,
      );

      // 3. Visual FX
      tl.to(
        img,
        { scale: 1.08, xPercent: -5, duration: duration, ease: "none" },
        startTime,
      );

      // 4. Content Reveal
      tl.to(
        panelLabelElement,
        { opacity: 1, y: 0, duration: 0.8 },
        startTime + duration * 0.2,
      );

      tl.to(
        title,
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        startTime + duration * 0.4,
      );

      tl.to(
        desc,
        { opacity: 1, y: 0, duration: 0.8 },
        startTime + duration * 0.6,
      );

      tl.to(
        cta,
        { opacity: 1, y: 0, duration: 0.8 },
        startTime + duration * 0.8,
      );

      // 5. Reset: When the panel leaves the 0% mark, reset it to avoid stacking issues
      const resetTime = mapPos(0 - panelLeftInTrack - WIDTH_DELTA);
      if (resetTime > 0 && resetTime < 20) {
        tl.to(
          panel,
          { width: INITIAL_WIDTH, duration: 0.1, ease: "none" },
          resetTime,
        ); // Removed x:0
        // Reset to small height and lowered position (6vh height, 90vh margin-top)
        tl.to(
          bg,
          { height: "6vh", marginTop: "90vh", duration: 0.1, ease: "none" },
          resetTime,
        );
        tl.to(
          panelNumber,
          { marginTop: "90vh", duration: 0.1, ease: "none" },
          resetTime,
        );
        tl.to(
          content,
          { height: "calc(10vh - 6vh)", duration: 0.1, ease: "none" },
          resetTime,
        );
        tl.to(
          [panelLabelElement, title, desc, cta],
          { opacity: 0, y: 40, duration: 0.1, ease: "none" },
          resetTime,
        );
      }
    });
  }
});
