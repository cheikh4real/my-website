document.addEventListener("DOMContentLoaded", () => {
  const aboutTitle = document.querySelector(".about-title");
  const aboutBottomLead =
    document.querySelector(".about-bottom > p:not(.about-description)") ||
    document.querySelector(".about-bottom > p");
  const aboutDescription = document.querySelector(".about-description");
  const whyTitle = document.querySelector(".why-title");
  const whyText = document.querySelector(".why-text");
  const aboutTitleWrap = document.querySelector(".about-title-wrap");
  const aboutParticles = Array.from(
    document.querySelectorAll(".about-title-particles .about-particle"),
  );
  const textTargets = [aboutBottomLead, aboutDescription, whyTitle, whyText].filter(
    Boolean,
  );
  const targets = [aboutTitle, ...textTargets].filter(Boolean);
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let particlesInteractive = false;

  if (!targets.length) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    // Fail-safe: keep content visible when animation libs are unavailable.
    targets.forEach((el) => {
      el.style.opacity = "1";
    });
    aboutParticles.forEach((particle) => {
      particle.style.opacity = "0.75";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const splitAvailable = typeof SplitText !== "undefined";
  if (splitAvailable) {
    gsap.registerPlugin(SplitText);
  }

  const parseStart = (threshold = 0.1, rootMargin = "-100px") => {
    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
    const sign =
      marginValue === 0
        ? ""
        : marginValue < 0
          ? `-=${Math.abs(marginValue)}${marginUnit}`
          : `+=${marginValue}${marginUnit}`;

    return `top ${startPct}%${sign}`;
  };

  const getSplitTargets = (splitInstance, splitType) => {
    if (!splitInstance) return [];

    if (splitType.includes("chars") && splitInstance.chars.length) {
      return splitInstance.chars;
    }
    if (splitType.includes("words") && splitInstance.words.length) {
      return splitInstance.words;
    }
    if (splitType.includes("lines") && splitInstance.lines.length) {
      return splitInstance.lines;
    }

    return splitInstance.chars || splitInstance.words || splitInstance.lines || [];
  };

  const runFallbackAnimation = (el, options) => {
    const start = parseStart(options.threshold, options.rootMargin);
    gsap.fromTo(
      el,
      { ...options.from },
      {
        ...options.to,
        duration: options.duration,
        ease: options.ease,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
        onComplete: () => {
          options.onComplete?.();
        },
      },
    );
  };

  const animateTextNoBlur = (el, config = {}) => {
    if (!el || !el.textContent.trim()) return;

    const options = {
      delay: 50,
      duration: 1.25,
      ease: "power3.out",
      splitType: "chars",
      from: { opacity: 0, y: 40 },
      to: { opacity: 1, y: 0 },
      threshold: 0.1,
      rootMargin: "-100px",
      ...config,
    };

    gsap.set(el, { opacity: 1 });

    if (!splitAvailable) {
      runFallbackAnimation(el, options);
      return;
    }

    let splitInstance;
    try {
      splitInstance = new SplitText(el, {
        type: options.splitType,
        smartWrap: true,
        autoSplit: options.splitType.includes("lines"),
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
      });
    } catch (_) {
      runFallbackAnimation(el, options);
      return;
    }

    const splitTargets = getSplitTargets(splitInstance, options.splitType);
    const start = parseStart(options.threshold, options.rootMargin);

    gsap.fromTo(
      splitTargets,
      { ...options.from },
      {
        ...options.to,
        duration: options.duration,
        ease: options.ease,
        stagger: options.delay / 1000,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
        onComplete: () => {
          options.onComplete?.();
        },
        willChange: "transform, opacity",
        force3D: true,
      },
    );
  };

  const animateTitleWithBlur = () => {
    if (!aboutTitle || !aboutTitle.textContent.trim()) return;

    gsap.set(aboutTitle, { opacity: 1 });

    const titleOptions = {
      duration: 1.5,
      ease: "power4.out",
      threshold: 0.1,
      rootMargin: "-100px",
    };

    if (!splitAvailable) {
      runFallbackAnimation(aboutTitle, {
        ...titleOptions,
        from: { y: 80, opacity: 0, filter: "blur(12px)" },
        to: { y: 0, opacity: 1, filter: "blur(0px)" },
        onComplete: () => gsap.set(aboutTitle, { clearProps: "filter,willChange" }),
      });
      return;
    }

    let splitTitle;
    try {
      splitTitle = new SplitText(aboutTitle, {
        type: "words,chars",
        smartWrap: true,
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
      });
    } catch (_) {
      runFallbackAnimation(aboutTitle, {
        ...titleOptions,
        from: { y: 80, opacity: 0, filter: "blur(12px)" },
        to: { y: 0, opacity: 1, filter: "blur(0px)" },
        onComplete: () => gsap.set(aboutTitle, { clearProps: "filter,willChange" }),
      });
      return;
    }

    const words = splitTitle.words.length ? splitTitle.words : splitTitle.chars;
    const start = parseStart(titleOptions.threshold, titleOptions.rootMargin);

    gsap.fromTo(
      words,
      { y: 100, opacity: 0, filter: "blur(15px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: titleOptions.duration,
        stagger: 0.1,
        ease: titleOptions.ease,
        scrollTrigger: {
          trigger: aboutTitle,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
        onComplete: () => {
          gsap.set(words, { clearProps: "filter,willChange" });
        },
        willChange: "transform, opacity, filter",
        force3D: true,
      },
    );
  };

  const initTitleParticles = () => {
    if (!aboutParticles.length || !aboutTitle) return;

    const start = parseStart(0.1, "-100px");

    gsap.fromTo(
      aboutParticles,
      {
        opacity: 0,
        scale: 0.65,
        x: (_, particle) => Number.parseFloat(particle.dataset.fromX || "0"),
        y: (_, particle) => Number.parseFloat(particle.dataset.fromY || "0"),
      },
      {
        opacity: 0.82,
        scale: 1,
        x: 0,
        y: 0,
        duration: 1.35,
        stagger: {
          each: 0.04,
          from: "center",
        },
        ease: "power4.out",
        scrollTrigger: {
          trigger: aboutTitle,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
        onComplete: () => {
          particlesInteractive = true;
        },
        willChange: "transform, opacity",
        force3D: true,
      },
    );
  };

  const bindInvertedParticleParallax = () => {
    if (!aboutTitleWrap || !aboutParticles.length) return;

    const maxShift = 10;

    const handleMove = (event) => {
      if (!particlesInteractive) return;

      const rect = aboutTitleWrap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      aboutParticles.forEach((particle) => {
        const depth = Number.parseFloat(particle.dataset.depth || "1");
        gsap.to(particle, {
          // Inverted movement: cursor left -> particles move right
          x: -normalizedX * maxShift * depth,
          y: -normalizedY * maxShift * depth * 0.7,
          duration: 0.35,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    };

    const resetParticles = () => {
      if (!particlesInteractive) return;
      gsap.to(aboutParticles, {
        x: 0,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    aboutTitleWrap.addEventListener("mousemove", handleMove);
    aboutTitleWrap.addEventListener("mouseleave", resetParticles);
  };

  const startAnimations = () => {
    if (prefersReducedMotion) {
      targets.forEach((el) => {
        gsap.set(el, { opacity: 1, clearProps: "transform,filter" });
      });
      aboutParticles.forEach((particle) => {
        gsap.set(particle, { opacity: 0.82, scale: 1, x: 0, y: 0 });
      });
      particlesInteractive = false;
      return;
    }

    animateTitleWithBlur();
    initTitleParticles();
    bindInvertedParticleParallax();

    animateTextNoBlur(aboutBottomLead, {
      splitType: "words",
      delay: 30,
      duration: 1.05,
      from: { opacity: 0, y: 28 },
      to: { opacity: 1, y: 0 },
      threshold: 0.2,
      rootMargin: "-40px",
      onComplete: () => gsap.set(aboutBottomLead, { clearProps: "willChange" }),
    });

    animateTextNoBlur(aboutDescription, {
      splitType: "words",
      delay: 18,
      duration: 1,
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0 },
      threshold: 0.24,
      rootMargin: "-30px",
      onComplete: () => gsap.set(aboutDescription, { clearProps: "willChange" }),
    });

    animateTextNoBlur(whyTitle, {
      splitType: "words",
      delay: 34,
      duration: 1.08,
      from: { opacity: 0, y: 34 },
      to: { opacity: 1, y: 0 },
      threshold: 0.32,
      rootMargin: "-20px",
      onComplete: () => gsap.set(whyTitle, { clearProps: "willChange" }),
    });

    animateTextNoBlur(whyText, {
      splitType: "words",
      delay: 18,
      duration: 0.95,
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0 },
      threshold: 0.34,
      rootMargin: "-10px",
      onComplete: () => gsap.set(whyText, { clearProps: "willChange" }),
    });
  };

  if (document.fonts && document.fonts.status !== "loaded") {
    document.fonts.ready.then(startAnimations).catch(startAnimations);
  } else {
    startAnimations();
  }
});
