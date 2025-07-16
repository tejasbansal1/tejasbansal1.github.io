// Mobile menu toggle

document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  menuToggle.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent click from bubbling to document
    mobileMenu.classList.toggle('hidden');
  });

  // Auto-close mobile menu on link click
  const mobileMenuLinks = mobileMenu.querySelectorAll('a');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Only handle anchor links (not external)
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        mobileMenu.classList.add('hidden');
        setTimeout(() => {
          window.location.hash = href;
        }, 150); // Adjust delay as needed for your animation
      } else {
        // For external links, just close the menu
        mobileMenu.classList.add('hidden');
      }
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    // If menu is open and click is outside both menu and toggle button
    if (!mobileMenu.classList.contains('hidden') &&
        !mobileMenu.contains(event.target) &&
        !menuToggle.contains(event.target)) {
      mobileMenu.classList.add('hidden');
    }
  });
}); 