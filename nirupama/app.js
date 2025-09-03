// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initAnimatedCounters();
    initSmoothScrolling();
    initScrollAnimations();
    initMobileMenu();
    initParallaxEffect();
});

// Animated Counters for Stats
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-target'));
        const increment = target / 200;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                if (target >= 1000) {
                    counter.textContent = Math.ceil(current).toLocaleString() + '+';
                } else {
                    counter.textContent = Math.ceil(current) + '+';
                }
                requestAnimationFrame(updateCounter);
            } else {
                if (target >= 1000) {
                    counter.textContent = target.toLocaleString() + '+';
                } else {
                    counter.textContent = target + '+';
                }
            }
        };
        
        updateCounter();
    };

    // Intersection Observer for counters
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                if (!counter.classList.contains('animated')) {
                    counter.classList.add('animated');
                    animateCounter(counter);
                }
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Smooth Scrolling for Navigation Links - Fixed to handle external links properly
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default for internal links (starting with #)
            const href = this.getAttribute('href');
            
            if (href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href;
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
            // External links (like Discord invite) will work normally without preventDefault
        });
    });

    // Also handle smooth scrolling for buttons with # hrefs
    const internalButtons = document.querySelectorAll('button[data-target], a.btn[href^="#"]');
    internalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const target = this.getAttribute('href') || this.getAttribute('data-target');
            if (target && target.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(target);
                if (targetSection) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    const animateOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    };

    const scrollObserver = new IntersectionObserver(animateOnScroll, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Elements to animate on scroll
    const elementsToAnimate = document.querySelectorAll(
        '.feature-card, .stat-card, .section-header, .discord-widget-container, .kofi-widget-container'
    );

    elementsToAnimate.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        scrollObserver.observe(element);
    });
}

// Mobile Menu Toggle
function initMobileMenu() {
    const nav = document.querySelector('.nav');
    const navMenu = document.querySelector('.nav-menu');
    
    // Add mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
    `;
    
    // Insert before nav menu
    nav.insertBefore(mobileMenuBtn, navMenu);
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });
}

// Parallax Effect for Background Shapes
function initParallaxEffect() {
    const shapes = document.querySelectorAll('.floating-shape');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.2;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.1;
            shape.style.transform = `translateY(${parallax * speed}px) rotate(${scrolled * 0.05}deg)`;
        });
    });
}

// Header Background on Scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    const scrolled = window.pageYOffset;
    
    if (scrolled > 100) {
        header.style.background = 'rgba(10, 10, 10, 0.95)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'rgba(10, 10, 10, 0.8)';
        header.style.backdropFilter = 'blur(20px)';
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Animate hero elements
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(50px)';
        heroContent.style.transition = 'opacity 1s ease, transform 1s ease';
        
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);
    }
});

// Add hover effects for feature cards
document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Add glow effect
            card.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.3)';
        });
        
        card.addEventListener('mouseleave', () => {
            // Remove glow effect
            card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        });
    });
});

// Ensure external links work properly - specifically for Discord invite
document.addEventListener('DOMContentLoaded', () => {
    // Force external links to open in new tab and work properly
    const externalLinks = document.querySelectorAll('a[href^="https://discord.com"], a[href^="http"]');
    externalLinks.forEach(link => {
        // Make sure target is set to _blank
        if (!link.hasAttribute('target')) {
            link.setAttribute('target', '_blank');
        }
        
        // Add rel for security
        link.setAttribute('rel', 'noopener noreferrer');
        
        // Ensure click works
        link.addEventListener('click', function(e) {
            // Don't prevent default for external links
            console.log('Opening external link:', this.href);
        });
    });
});

// Typing animation for hero subtitle (optional enhancement)
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Add some Easter eggs
let clickCount = 0;
document.querySelector('.bot-avatar')?.addEventListener('click', function() {
    clickCount++;
    if (clickCount === 5) {
        this.style.animation = 'spin 2s linear infinite';
        setTimeout(() => {
            this.style.animation = 'pulse 2s ease-in-out infinite';
        }, 4000);
        clickCount = 0;
    }
});

// CSS for spin animation (injected via JS)
const spinKeyframes = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = spinKeyframes;
document.head.appendChild(styleSheet);

// Performance optimization: Throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply throttling to scroll events
const throttledScrollHandler = throttle(() => {
    // Any heavy scroll computations can go here
}, 16);

window.addEventListener('scroll', throttledScrollHandler);

// Add console message for developers
console.log(`
🤖 Nirupama Discord Bot Website
Created by Stromy (Alt255)
Built with modern web technologies

Features:
- Glassmorphism design
- Smooth animations
- Responsive layout
- Accessible navigation

Want to contribute? Check out the GitHub repo!
`);

// Error handling for iframe loading
document.querySelectorAll('iframe').forEach(iframe => {
    iframe.addEventListener('load', function() {
        console.log('Iframe loaded successfully:', this.src);
    });
    
    iframe.addEventListener('error', function() {
        console.warn('Failed to load iframe:', this.src);
        const fallback = document.createElement('div');
        fallback.className = 'iframe-fallback glass';
        fallback.style.padding = '2rem';
        fallback.style.textAlign = 'center';
        fallback.style.borderRadius = '12px';
        fallback.innerHTML = `
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Content temporarily unavailable</p>
            <a href="${this.src}" target="_blank" class="btn btn-secondary">
                Open in new tab
            </a>
        `;
        this.parentNode.replaceChild(fallback, this);
    });
});

// Debug function to check if sections exist
function debugSections() {
    const sections = ['#home', '#features', '#community', '#support'];
    sections.forEach(section => {
        const element = document.querySelector(section);
        console.log(`Section ${section}:`, element ? 'Found' : 'Missing');
    });
}

// Call debug function
setTimeout(debugSections, 1000);
