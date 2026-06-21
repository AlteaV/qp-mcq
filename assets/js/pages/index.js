document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Mobile Menu Toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
      const icon = mobileNav.classList.contains('active') ? 'x' : 'menu';
      mobileMenuToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
      lucide.createIcons();
    });
  }

  // Theme Toggle Logic
  const themeToggleDesktop = document.getElementById('theme-toggle-desktop');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  
  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      updateThemeIcons('sun');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      updateThemeIcons('moon');
    }
  }

  function updateThemeIcons(iconName) {
    if (themeToggleDesktop) themeToggleDesktop.innerHTML = `<i data-lucide="${iconName}"></i>`;
    if (themeToggleMobile) themeToggleMobile.innerHTML = `<i data-lucide="${iconName}"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Load saved theme or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setTheme(true);
  } else {
    setTheme(false);
  }

  // Toggle handlers
  const handleThemeToggle = () => {
    const isDark = document.body.classList.contains('dark-theme');
    setTheme(!isDark);
  };

  if (themeToggleDesktop) themeToggleDesktop.addEventListener('click', handleThemeToggle);
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', handleThemeToggle);

  // Navbar Scroll Effect
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Scroll Reveal Animation
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  document.querySelectorAll('.scroll-reveal').forEach((element) => {
    observer.observe(element);
  });

  // Close mobile menu when clicking a link
  document.querySelectorAll('.mobile-nav-links a:not(.btn)').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
        mobileMenuToggle.innerHTML = `<i data-lucide="menu"></i>`;
        lucide.createIcons();
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navHeight = document.querySelector('.navbar').offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: targetPosition - navHeight - 20,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});
