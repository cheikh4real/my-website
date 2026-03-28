// Converted from React to Vanilla JS
class StaggeredMenu {
  constructor() {
    this.open = false;
    this.busy = false;

    // DOM Elements
    this.wrapper = document.querySelector(".staggered-menu-wrapper");
    if (!this.wrapper) return;

    this.toggleBtn = this.wrapper.querySelector(".sm-toggle");
    this.panel = this.wrapper.querySelector(".staggered-menu-panel");
    this.preLayers = this.wrapper.querySelectorAll(".sm-prelayer");
    this.icon = this.wrapper.querySelector(".sm-icon");
    this.plusH = this.wrapper.querySelector(
      ".sm-icon-line:not(.sm-icon-line-v)",
    );
    this.plusV = this.wrapper.querySelector(".sm-icon-line-v");
    this.textInner = this.wrapper.querySelector(".sm-toggle-textInner");

    // Animation Timelines
    this.openTl = null;
    this.closeTween = null;

    if (!this.toggleBtn) return;

    this.init();
    this.bindEvents();
  }

  init() {
    // Set initial GSAP states
    gsap.set([this.panel, ...this.preLayers], { xPercent: 100 });
    gsap.set(this.plusH, {
      xPercent: -50,
      yPercent: -50,
      transformOrigin: "50% 50%",
      rotate: 0,
    });
    gsap.set(this.plusV, {
      xPercent: -50,
      yPercent: -50,
      transformOrigin: "50% 50%",
      rotate: 90,
    });
    gsap.set(this.icon, { rotate: 0, transformOrigin: "50% 50%" });
    gsap.set(this.textInner, { yPercent: 0 });
  }

  bindEvents() {
    this.toggleBtn.addEventListener("click", () => this.toggle());

    // Close when clicking outside
    document.addEventListener("mousedown", (e) => {
      if (
        this.open &&
        !this.panel.contains(e.target) &&
        !this.toggleBtn.contains(e.target)
      ) {
        this.close();
      }
    });

    // Close when clicking a link inside the menu
    const links = this.panel.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        this.close();
      });
    });
  }

  toggle() {
    if (this.open) this.close();
    else this.playOpen();
  }

  playOpen() {
    if (this.busy) return;
    this.busy = true;
    this.open = true;
    this.wrapper.setAttribute("data-open", "true");
    this.toggleBtn.setAttribute("aria-expanded", "true");

    if (this.closeTween) this.closeTween.kill();

    const tl = gsap.timeline({
      onComplete: () => {
        this.busy = false;
      },
    });

    // Animate Prelayers
    this.preLayers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.5, ease: "power4.out" },
        i * 0.07,
      );
    });

    const panelInsertTime = this.preLayers.length * 0.07 + 0.08;
    tl.fromTo(
      this.panel,
      { xPercent: 100 },
      { xPercent: 0, duration: 0.65, ease: "power4.out" },
      panelInsertTime,
    );

    // Animate Icon & Text
    gsap.to(this.icon, { rotate: 135, duration: 0.8, ease: "power4.out" });
    gsap.to(this.textInner, {
      yPercent: -50,
      duration: 0.5,
      ease: "power4.out",
    });

    this.openTl = tl;
  }

  close() {
    if (this.openTl) this.openTl.kill();

    const all = [...this.preLayers, this.panel];

    this.closeTween = gsap.to(all, {
      xPercent: 100,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        this.busy = false;
        this.open = false;
        this.wrapper.removeAttribute("data-open");
        this.toggleBtn.setAttribute("aria-expanded", "false");
      },
    });

    // Animate Icon & Text (Back to normal)
    gsap.to(this.icon, { rotate: 0, duration: 0.35, ease: "power3.inOut" });
    gsap.to(this.textInner, { yPercent: 0, duration: 0.5, ease: "power4.out" });
  }
}

// Initialize the menu
new StaggeredMenu();
