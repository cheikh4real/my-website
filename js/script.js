let video;
let scrollPositionOnTransition = 0;

const sequences = [
  {
    loop: "assets/videos/LivingRoom_Loop.webm",
    transition: "assets/videos/Living2Kitchen.webm",
    reverseTransition: "assets/videos/Living2Kitchen_reversed.webm",
  },
  {
    loop: "assets/videos/Kitchen_Loop.webm",
    transition: "assets/videos/Kitchen2Diner.webm",
    reverseTransition: "assets/videos/Diner2Kitchen_reversed.webm",
  },
  {
    loop: "assets/videos/Diner_Loop.webm",
    transition: null,
    reverseTransition: "assets/videos/Diner2Kitchen_reversed.webm",
  },
];

let currentIndex = 0;
let isTransitionPlaying = false;
let lastScrollY = window.scrollY;
let scrollLocked = false;
let isSkipping = false;

const LOADER_FALLBACK_MS = 5000;
const TEXT_REVEAL_DELAY_MS = 180;
const TEXT_OUT_DURATION_MS = 320;
const SCROLL_DELTA_THRESHOLD = 2;
const sceneText = [
  {
    title: "Créer des céramiques uniques",
    body: "Depuis sa création en 1991, la Société Algérienne de Revêtement s’est toujours engagée à offrir un produit de qualité accompagné d’un excellent service adapté aux besoins de ses clients.",
  },
  {
    title: "Découvrez notre entreprise de fabrication",
    body: "En choisissant la Société Algérienne de revêtement, vous faites le choix d’une entreprise qui place ses clients au coeur de ses préoccupations.",
  },
  {
    title: "Découvrez nos produits",
    body: "Notre succès passe par la constante innovation de nos processus de management et de production, et nous a permis de nous hisser au rang des céramistes de référence en Algérie.",
  },
];

let textContainer;
let textTitle;
let textBody;
let textSwapTimer;
let scrollButton;
let hasInitialTextReveal = false;

function setTransitionScrollLock(locked) {
  scrollLocked = locked;
  document.body.classList.toggle("is-transition-lock", locked);
}
// helper: is element mostly visible in viewport (threshold 0..1)
function isMostlyVisible(el, threshold = 0.9) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const height = rect.height || window.innerHeight;
  const visibleTop = Math.max(0, rect.top);
  const visibleBottom = Math.min(window.innerHeight, rect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  return visibleHeight / height >= threshold;
}

// debug helpers for manual testing from console
window.forceReverse = function (index) {
  console.log("forceReverse", index);
  playReverseTransition(index);
};
window.forceForward = function (index) {
  console.log("forceForward", index);
  playTransition(index);
};

// =========================
// Initialize when DOM is ready
// =========================
document.addEventListener("DOMContentLoaded", () => {
  video = document.getElementById("bgVideo");
  const loader = document.getElementById("loader");
  const loaderVideo = document.getElementById("loaderVideo");
  textContainer = document.querySelector(".text");
  textTitle = document.querySelector(".text h2");
  textBody = document.querySelector(".text p");
  scrollButton = document.querySelector(".scroll-skipping");

  if (scrollButton) {
    scrollButton.addEventListener("click", () => {
      isSkipping = true;
      const nextSection = document.querySelector(".second-section");
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          isSkipping = false;
        }, 1000);
      }
    });
  }

  startLoaderSequence(loader, loaderVideo);

  console.log("Video element:", video);
  if (video) {
    console.log("Starting first video...");
    playLoop(currentIndex);
  } else {
    console.error("Video element not found!");
  }
});

function updateSceneText(index) {
  if (!textTitle || !textBody) return;

  const scene = sceneText[index];
  if (!scene) return;

  textTitle.textContent = scene.title;
  textBody.textContent = scene.body;

  if (!textContainer) return;

  // Keep text hidden until loader is fully gone and first reveal runs.
  if (!hasInitialTextReveal) return;

  clearTimeout(textSwapTimer);
  textContainer.classList.remove("text-animate-in", "text-animate-out");
  if (scrollButton)
    scrollButton.classList.remove("btn-animate-in", "btn-animate-out");

  // Reveal happens after transition by playing only the "in" animation.
  textSwapTimer = setTimeout(() => {
    void textContainer.offsetWidth;
    textContainer.classList.add("text-animate-in");
    if (scrollButton) {
      void scrollButton.offsetWidth;
      scrollButton.classList.add("btn-animate-in");
    }
  }, TEXT_REVEAL_DELAY_MS);
}

function animateTextOutBeforeTransition(onDone) {
  if (!textContainer || !hasInitialTextReveal) {
    onDone();
    return;
  }

  clearTimeout(textSwapTimer);
  textContainer.classList.remove("text-animate-in", "text-animate-out");
  void textContainer.offsetWidth;
  textContainer.classList.add("text-animate-out");

  if (scrollButton) {
    scrollButton.classList.remove("btn-animate-in", "btn-animate-out");
    void scrollButton.offsetWidth;
    scrollButton.classList.add("btn-animate-out");
  }

  setTimeout(() => {
    try {
      onDone();
    } catch (error) {
      console.error("Transition start failed:", error);
      isTransitionPlaying = false;
      setTransitionScrollLock(false);
    }
  }, TEXT_OUT_DURATION_MS);
}

function triggerForwardTransition() {
  if (isTransitionPlaying || scrollLocked || !video) return;
  if (currentIndex >= sequences.length - 1) return;

  console.log("Triggering transition from index:", currentIndex);
  setTransitionScrollLock(true);
  animateTextOutBeforeTransition(() => {
    playTransition(currentIndex);
  });
}

function triggerReverseTransition() {
  if (isTransitionPlaying || scrollLocked || !video) return;
  if (currentIndex <= 0) return;

  const showcase = document.querySelector(".showcase");
  const fullyVisible = isMostlyVisible(video, 0.98);
  if (!fullyVisible && currentIndex === sequences.length - 1) {
    const showcaseTop = showcase ? showcase.offsetTop : 0;
    window.scrollTo({ top: showcaseTop, behavior: "smooth" });
    return;
  }
  if (!fullyVisible) return;

  const prev = currentIndex - 1;
  console.log("Triggering reverse transition to index:", prev);
  setTransitionScrollLock(true);
  animateTextOutBeforeTransition(() => {
    playReverseTransition(prev);
  });
}
function triggerInitialTextReveal() {
  if (!textContainer) return;

  hasInitialTextReveal = true;
  textContainer.classList.remove("text-animate-out", "text-animate-in");
  void textContainer.offsetWidth;
  textContainer.classList.add("text-animate-in");

  if (scrollButton) {
    scrollButton.classList.remove("btn-animate-out", "btn-animate-in");
    void scrollButton.offsetWidth;
    scrollButton.classList.add("btn-animate-in");
  }
}
function startLoaderSequence(loader, loaderVideo) {
  if (!loader) {
    triggerInitialTextReveal();
    document.querySelector(".header").classList.add("animate-in");
    return;
  }

  document.body.classList.add("is-loading");

  let finished = false;
  const endLoading = () => {
    if (finished) return;
    finished = true;

    loader.classList.add("slide-up");

    // Trigger text reveal at 75% of loader transition (750ms)
    setTimeout(() => {
      triggerInitialTextReveal();
      document.querySelector(".header").classList.add("animate-in");
    }, 750);

    loader.addEventListener(
      "transitionend",
      () => {
        loader.remove();
        document.body.classList.remove("is-loading");
      },
      { once: true },
    );
  };

  const fallbackTimer = setTimeout(() => {
    endLoading();
  }, LOADER_FALLBACK_MS);

  if (!loaderVideo) {
    return;
  }

  loaderVideo.addEventListener(
    "ended",
    () => {
      clearTimeout(fallbackTimer);
      endLoading();
    },
    { once: true },
  );

  loaderVideo.addEventListener(
    "error",
    () => {
      clearTimeout(fallbackTimer);
      endLoading();
    },
    { once: true },
  );

  const playPromise = loaderVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      clearTimeout(fallbackTimer);
      setTimeout(() => {
        endLoading();
      }, 1200);
    });
  }
}
// =========================
// Loop player
// =========================
function playLoop(index) {
  if (!video) {
    console.error("Video element is null");
    return;
  }
  if (index >= sequences.length) {
    console.warn("Index out of range");
    return;
  }

  const videoSrc = sequences[index].loop;
  console.log("Playing loop:", videoSrc);
  video.src = videoSrc;
  video.loop = true;
  video.currentTime = 0;

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Video playing successfully");
      })
      .catch((error) => {
        console.error("Autoplay was prevented:", error);
      });
  }
  updateSceneText(index);
  isTransitionPlaying = false;
  setTransitionScrollLock(false);
}

// =========================
// Transition player (forward)
// =========================
function playTransition(index) {
  if (!video) {
    console.error("Video element is null");
    return;
  }
  if (!sequences[index].transition) {
    console.log("No transition for index:", index);
    isTransitionPlaying = false;
    setTransitionScrollLock(false);
    return;
  }

  const transitionSrc = sequences[index].transition;
  console.log("Playing transition:", transitionSrc);

  isTransitionPlaying = true;
  scrollPositionOnTransition = window.scrollY;
  setTransitionScrollLock(true);
  video.onended = null;
  video.onerror = null;
  video.loop = false;
  video.playbackRate = 1;
  video.src = transitionSrc;
  video.currentTime = 0;

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Transition playing successfully");
      })
      .catch((error) => {
        console.error("Autoplay prevented on transition:", error);
        isTransitionPlaying = false;
        setTransitionScrollLock(false);
      });
  }

  video.onended = () => {
    console.log("Transition ended, moving to next video");
    isTransitionPlaying = false;
    setTransitionScrollLock(false);
    currentIndex++;
    if (currentIndex < sequences.length) {
      playLoop(currentIndex);
    }
  };

  video.onerror = (e) => {
    console.error("Video error during transition:", e);
    isTransitionPlaying = false;
    setTransitionScrollLock(false);
    playLoop(currentIndex);
  };
}

// =========================
// Reverse transition player (scroll up)
// =========================
function playReverseTransition(prevIndex) {
  if (!video) {
    console.error("Video element is null");
    return;
  }

  const src =
    sequences[prevIndex].reverseTransition || sequences[prevIndex].transition;
  console.log(
    "playReverseTransition called with prevIndex=",
    prevIndex,
    "src=",
    src,
  );
  if (!src) {
    console.log("No reverse transition available for index:", prevIndex);
    currentIndex = prevIndex;
    isTransitionPlaying = false;
    setTransitionScrollLock(false);
    playLoop(currentIndex);
    return;
  }

  console.log("Playing reverse transition:", src);

  isTransitionPlaying = true;
  scrollPositionOnTransition = window.scrollY;
  setTransitionScrollLock(true);
  video.loop = false;
  video.src = src;
  // robustly load and play
  try {
    video.pause();
  } catch (e) {}
  video.src = src;
  try {
    video.load();
  } catch (e) {}

  // If there is a dedicated reversed file, play from start. Otherwise try negative playback.
  if (sequences[prevIndex].reverseTransition) {
    console.log("Using dedicated reverse file");
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.error("Play failed for reverse file:", err);
        isTransitionPlaying = false;
        setTransitionScrollLock(false);
      });
    }
  } else {
    console.log(
      "No reverse file; attempting negative playback of forward transition",
    );
    video.onloadedmetadata = () => {
      if (video.duration && "playbackRate" in video) {
        try {
          video.currentTime = Math.max(0, video.duration - 0.05);
          video.playbackRate = -1;
        } catch (e) {
          console.warn("Could not set negative playbackRate", e);
        }
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Play failed for reversed-forward:", err);
          isTransitionPlaying = false;
          setTransitionScrollLock(false);
        });
      }
    };
  }

  video.onended = () => {
    console.log("Reverse transition ended, moving back to loop");
    isTransitionPlaying = false;
    setTransitionScrollLock(false);
    currentIndex = prevIndex;
    try {
      video.playbackRate = 1;
    } catch (e) {}
    playLoop(currentIndex);
  };

  video.onerror = (e) => {
    console.error("Video error during reverse:", e);
    isTransitionPlaying = false;
    setTransitionScrollLock(false);
    currentIndex = prevIndex;
    try {
      video.playbackRate = 1;
    } catch (e) {}
    playLoop(currentIndex);
  };
}

// =========================
// Scroll listener
// =========================
window.addEventListener("scroll", () => {
  if (document.body.classList.contains("is-loading")) return;
  const currentScroll = window.scrollY;

  if (isSkipping) {
    lastScrollY = currentScroll;
    return;
  }

  // Keep direction baseline fresh while transition lock is active.
  if (isTransitionPlaying || scrollLocked || !video) {
    lastScrollY = currentScroll;
    return;
  }

  const delta = currentScroll - lastScrollY;
  if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) {
    lastScrollY = currentScroll;
    return;
  }

  const scrollingDown = delta > 0;

  if (scrollingDown) {
    console.log(
      "Scrolling down, currentIndex:",
      currentIndex,
      "isTransitionPlaying:",
      isTransitionPlaying,
    );
  }

  if (scrollingDown && currentIndex < sequences.length - 1) {
    // Only trigger if video is mostly visible (prevent triggering when skipping past)
    if (isMostlyVisible(video, 0.75)) {
      triggerForwardTransition();
    }
  } else if (delta < 0 && currentIndex > 0) {
    // only start reverse when video mostly fills viewport
    const showcase = document.querySelector(".showcase");
    let fullyVisible = false;
    if (video) {
      const rect = video.getBoundingClientRect();
      fullyVisible = isMostlyVisible(video, 0.98);
      console.log(
        "visibility check rect=",
        rect,
        "fullyVisible=",
        fullyVisible,
      );

      // if we're on the diner loop and not fully visible yet, auto-scroll to the showcase
      if (!fullyVisible && currentIndex === sequences.length - 1) {
        const showcaseTop = showcase ? showcase.offsetTop : 0;
        console.log(
          "auto-scrolling to showcase top to show video before reverse:",
          showcaseTop,
        );
        window.scrollTo({ top: showcaseTop, behavior: "smooth" });
        lastScrollY = currentScroll;
        return;
      }
    }

    if (!fullyVisible) {
      console.log("Video not yet covering viewport, skipping reverse");
    } else {
      triggerReverseTransition();
    }
  }

  lastScrollY = currentScroll;
});

// Wheel handler: makes scene transitions reliable even when native scroll deltas are inconsistent.
window.addEventListener(
  "wheel",
  (event) => {
    if (document.body.classList.contains("is-loading")) return;
    if (!video) return;
    if (!isMostlyVisible(video, 0.75)) return;
    if (Math.abs(event.deltaY) < 3) return;

    if (event.deltaY > 0) {
      if (currentIndex < sequences.length - 1) {
        event.preventDefault();
        triggerForwardTransition();
      }
      return;
    }

    if (event.deltaY < 0 && currentIndex > 0) {
      event.preventDefault();
      triggerReverseTransition();
    }
  },
  { passive: false },
);

// --- World-Class SplitText Implementation (Moved for Section Redesign) ---
document.addEventListener("DOMContentLoaded", () => {
  // Register plugins at the top of the listener
  if (typeof gsap !== "undefined" && typeof SplitText !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const targets = document.querySelectorAll(".split-lines");
    let allSplits = [];

    const runSplit = () => {
      // Clean up previous instances on resize
      allSplits.forEach((s) => s.revert());
      allSplits = [];

      targets.forEach((target) => {
        // 1. The "Outer" split creates the mask/window (overflow: hidden)
        const parentSplit = new SplitText(target, {
          type: "lines",
          linesClass: "split-line-wrapper",
        });

        // 2. The "Inner" split creates the actual text that will move
        const childSplit = new SplitText(target, {
          type: "lines",
          linesClass: "split-line-inner",
        });

        allSplits.push(parentSplit, childSplit);

        // 3. The Animation: Rise from the bottom of the mask
        gsap.from(childSplit.lines, {
          yPercent: 100,
          opacity: 0,
          duration: 0.6,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: target,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      });
    };

    // Initialize after fonts load to get correct line calculations
    if (document.fonts) {
      document.fonts.ready.then(runSplit);
    } else {
      runSplit();
    }

    window.addEventListener("resize", runSplit);
  }
});
