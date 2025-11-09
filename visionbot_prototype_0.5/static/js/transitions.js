// Page Transition Handler
function navigateWithTransition(url, text = 'Loading...') {
    // Create transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.innerHTML = `
        <div class="transition-content">
            <div class="transition-spinner"></div>
            <div class="transition-text">${text}</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Trigger transition
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
    
    // Navigate after transition
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Add smooth navigation to all nav links
document.addEventListener('DOMContentLoaded', function() {
    // Handle navigation links
    const navLinks = document.querySelectorAll('a[href^="/"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const text = href === '/app' ? 'Starting Analysis...' : 'Loading...';
            navigateWithTransition(href, text);
        });
    });
});