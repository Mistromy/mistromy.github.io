// Boot sequence messages from the application data
const bootMessages = [
    "Booting Nirupama Discord Bot v2.0...",
    "Loading personality modules...",
    "Initializing ship compatibility engine...",
    "Connecting to magic 8ball oracle...",
    "Starting AI chat services...",
    "All systems operational.",
    "Ready to serve your Discord server!"
];

// DOM Elements
let bootScreen;
let mainTerminal;
let bootMessagesContainer;
let bootComplete;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTerminal();
    startBootSequence();
    initInviteLinks();
});

function initializeTerminal() {
    bootScreen = document.getElementById('boot-screen');
    mainTerminal = document.getElementById('main-terminal');
    bootMessagesContainer = document.getElementById('boot-messages');
    bootComplete = document.getElementById('boot-complete');
    
    // Initialize navigation
    initSmoothScrolling();
    
    // Add click listener to boot screen
    bootScreen.addEventListener('click', enterMainTerminal);
}

function initInviteLinks() {
    // Ensure all invite links work properly
    const inviteLinks = document.querySelectorAll('.invite-link, .btn-invite');
    inviteLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Ensure the link opens in a new tab
            const url = this.getAttribute('href');
            if (url && url.includes('discord.com')) {
                console.log('Opening Discord invite:', url);
                showTerminalMessage("Opening Discord invite in new tab...");
                // The target="_blank" and rel="noopener noreferrer" should handle this
                return true; // Allow default behavior
            }
        });
    });
    
    // Add visual feedback when hovering over invite links
    inviteLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            showTerminalMessage("Ready to invite Nirupama to your server!");
        });
    });
}

function startBootSequence() {
    let messageIndex = 0;
    
    function displayNextMessage() {
        if (messageIndex < bootMessages.length) {
            const messageElement = document.createElement('p');
            messageElement.textContent = `[${getCurrentTime()}] ${bootMessages[messageIndex]}`;
            messageElement.className = 'boot-message';
            bootMessagesContainer.appendChild(messageElement);
            
            // Scroll to bottom
            bootMessagesContainer.scrollTop = bootMessagesContainer.scrollHeight;
            
            messageIndex++;
            
            // Random delay between 300-800ms for realistic boot feeling
            const delay = Math.random() * 500 + 300;
            setTimeout(displayNextMessage, delay);
        } else {
            // Show boot complete message
            setTimeout(() => {
                bootComplete.classList.remove('hidden');
                // Auto-enter terminal after 3 seconds if no click
                setTimeout(enterMainTerminal, 3000);
            }, 1000);
        }
    }
    
    // Start the sequence after a brief delay
    setTimeout(displayNextMessage, 500);
}

function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

function enterMainTerminal() {
    bootScreen.classList.add('fade-out');
    
    setTimeout(() => {
        bootScreen.classList.add('hidden');
        mainTerminal.classList.remove('hidden');
        mainTerminal.classList.add('fade-in');
        
        // Start typewriter effect for welcome message
        startTypewriterEffect();
        
        // Initialize terminal features
        initTerminalFeatures();
    }, 1000);
}

function startTypewriterEffect() {
    const elements = document.querySelectorAll('.section-content p');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.animation = 'typing 2s steps(40, end)';
        }, index * 200);
    });
}

function initTerminalFeatures() {
    // Add terminal prompt animation
    addTerminalPrompts();
    
    // Initialize stats counter
    initStatsAnimation();
    
    // Add keyboard navigation
    initKeyboardNavigation();
    
    // Add easter eggs
    initEasterEggs();
    
    // Initialize invite button interactions
    initInviteButtonInteractions();
}

function initInviteButtonInteractions() {
    const quickInviteBtn = document.querySelector('.btn-invite');
    if (quickInviteBtn) {
        quickInviteBtn.addEventListener('click', function(e) {
            // Add click feedback animation
            this.style.transform = 'translateY(1px)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            showTerminalMessage("Launching Discord authorization...");
        });
    }
    
    // Add deploy script simulation
    const inviteSection = document.getElementById('invite');
    if (inviteSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    simulateDeployScript();
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(inviteSection);
    }
}

function simulateDeployScript() {
    setTimeout(() => {
        const deployBox = document.querySelector('.deploy-box');
        if (deployBox) {
            deployBox.style.animation = 'pulse 1s ease-in-out';
        }
    }, 1000);
}

function addTerminalPrompts() {
    // Add blinking cursor to command prompts
    const prompts = document.querySelectorAll('.prompt');
    prompts.forEach(prompt => {
        const cursor = document.createElement('span');
        cursor.className = 'blinking-cursor';
        cursor.textContent = '█';
        cursor.style.marginLeft = '5px';
        prompt.appendChild(cursor);
    });
}

function initStatsAnimation() {
    // Animate stats when they come into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    });
    
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
}

function animateStats() {
    // Simulate loading stats
    const statsOutput = document.querySelector('.stats-output');
    const originalContent = statsOutput.innerHTML;
    
    statsOutput.innerHTML = '<p>Scanning system resources...<span class="blinking-cursor">█</span></p>';
    
    setTimeout(() => {
        statsOutput.innerHTML = originalContent;
        
        // Add some random blinking to the online status
        const onlineStatus = document.querySelector('.status-online');
        if (onlineStatus) {
            setInterval(() => {
                onlineStatus.style.opacity = onlineStatus.style.opacity === '0.5' ? '1' : '0.5';
            }, 1500);
        }
    }, 2000);
}

function initSmoothScrolling() {
    // Handle navigation clicks
    const navLinks = document.querySelectorAll('.cmd-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Add terminal-style navigation feedback
                showTerminalFeedback(`Navigating to ${targetId.substring(1)}...`);
                
                setTimeout(() => {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Highlight the target section briefly
                    highlightSection(targetSection);
                }, 300);
            }
        });
    });
}

function showTerminalFeedback(message) {
    // Create temporary feedback in nav area
    const navPrompt = document.querySelector('.nav-prompt');
    const originalText = navPrompt.textContent;
    
    navPrompt.textContent = message;
    navPrompt.style.color = '#ffff00';
    
    setTimeout(() => {
        navPrompt.textContent = originalText;
        navPrompt.style.color = '#00ffff';
    }, 800);
}

function highlightSection(section) {
    const originalBorderColor = section.style.borderColor;
    section.style.borderColor = '#ffff00';
    section.style.boxShadow = '0 0 10px #ffff00';
    
    setTimeout(() => {
        section.style.borderColor = originalBorderColor || '#00ff00';
        section.style.boxShadow = 'none';
    }, 1500);
}

function initKeyboardNavigation() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + key combinations
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case '1':
                    e.preventDefault();
                    navigateToSection('#about');
                    break;
                case '2':
                    e.preventDefault();
                    navigateToSection('#features');
                    break;
                case '3':
                    e.preventDefault();
                    navigateToSection('#stats');
                    break;
                case '4':
                    e.preventDefault();
                    navigateToSection('#invite');
                    break;
                case '5':
                    e.preventDefault();
                    navigateToSection('#community');
                    break;
                case '6':
                    e.preventDefault();
                    navigateToSection('#support');
                    break;
                case 'i':
                    e.preventDefault();
                    // Quick invite with keyboard shortcut
                    const inviteUrl = 'https://discord.com/oauth2/authorize?client_id=1209887142839586836&permissions=8&integration_type=0&scope=bot';
                    window.open(inviteUrl, '_blank', 'noopener,noreferrer');
                    showTerminalMessage("Discord invite opened in new tab (Ctrl+I)");
                    break;
            }
        }
        
        // Easter egg: Konami code
        handleKonamiCode(e);
    });
}

function navigateToSection(sectionId) {
    const section = document.querySelector(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        highlightSection(section);
    }
}

// Konami code easter egg
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

function handleKonamiCode(e) {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.length === konamiSequence.length && 
        konamiCode.every((key, index) => key === konamiSequence[index])) {
        activateMatrixMode();
        konamiCode = [];
    }
}

function activateMatrixMode() {
    // Matrix digital rain effect
    const body = document.body;
    
    // Create matrix canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '10000';
    canvas.style.pointerEvents = 'none';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    const characters = '01ニルパマ';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    body.appendChild(canvas);
    
    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    const matrixInterval = setInterval(drawMatrix, 33);
    
    // Stop after 5 seconds
    setTimeout(() => {
        clearInterval(matrixInterval);
        body.removeChild(canvas);
        showTerminalMessage("Matrix mode deactivated. Welcome back to the terminal.");
    }, 5000);
    
    showTerminalMessage("Matrix mode activated! The code is everywhere...");
}

function initEasterEggs() {
    // Click counter for robot ASCII
    let robotClickCount = 0;
    const robotAscii = document.querySelector('.robot-ascii');
    
    if (robotAscii) {
        robotAscii.addEventListener('click', function() {
            robotClickCount++;
            
            if (robotClickCount === 3) {
                this.style.color = '#ff0000';
                showTerminalMessage("Robot is angry! Click 2 more times to calm it down.");
            } else if (robotClickCount === 5) {
                this.style.color = '#00ffff';
                showTerminalMessage("Robot is happy again!");
                robotClickCount = 0;
            } else if (robotClickCount === 1) {
                showTerminalMessage("Robot says: Beep boop!");
            }
        });
    }
    
    // Add help command
    addHelpCommand();
    
    // Add secret admin command
    addAdminCommand();
}

function addHelpCommand() {
    // Listen for help command in console
    let helpTyped = '';
    document.addEventListener('keypress', function(e) {
        helpTyped += e.key;
        if (helpTyped.includes('help')) {
            showHelpMessage();
            helpTyped = '';
        }
        if (helpTyped.length > 10) {
            helpTyped = helpTyped.slice(-10);
        }
    });
}

function addAdminCommand() {
    let adminTyped = '';
    document.addEventListener('keypress', function(e) {
        adminTyped += e.key;
        if (adminTyped.includes('sudo')) {
            showTerminalMessage("sudo: command not found. Nice try though! 😉");
            adminTyped = '';
        }
        if (adminTyped.length > 10) {
            adminTyped = adminTyped.slice(-10);
        }
    });
}

function showHelpMessage() {
    const helpText = `
    NIRUPAMA TERMINAL - HELP COMMANDS
    ================================
    Ctrl+1-6: Quick navigation
    Ctrl+I: Quick Discord invite
    Click robot 5 times: Easter egg
    Konami code: Matrix mode
    Type 'help': Show this message
    Type 'sudo': Secret message
    Click any command link: Navigate
    `;
    
    showTerminalMessage(helpText);
}

function showTerminalMessage(message) {
    // Create a temporary terminal message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000;
        border: 2px solid #00ff00;
        padding: 15px;
        color: #00ff00;
        font-family: 'Courier New', monospace;
        z-index: 9999;
        max-width: 300px;
        animation: slideIn 0.5s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    messageDiv.innerHTML = `<pre>${message}</pre>`;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideIn 0.5s ease-out reverse';
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 500);
    }, 3000);
}

// Handle window resize for responsive canvas
window.addEventListener('resize', function() {
    // Update any canvas elements if needed
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
});

// Add console welcome message
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    NIRUPAMA TERMINAL v2.0                   ║
║                                                              ║
║  Welcome to the retro terminal interface!                   ║
║  Created by Stromy (Alt255) with love for the community.    ║
║                                                              ║
║  Easter eggs and keyboard shortcuts available!              ║
║  Type 'help' while focused on page for commands.            ║
║  Press Ctrl+I for quick Discord invite!                     ║
╚══════════════════════════════════════════════════════════════╝
`);

// Performance optimization
function debounce(func, wait) {
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

// Optimized scroll handler
const optimizedScrollHandler = debounce(() => {
    // Any scroll-based animations or updates can go here
}, 16);

window.addEventListener('scroll', optimizedScrollHandler);

// Initialize accessibility features
function initAccessibility() {
    // Add skip link for keyboard users
    const skipLink = document.createElement('a');
    skipLink.href = '#main-terminal';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: fixed;
        top: -100px;
        left: 20px;
        background: #00ff00;
        color: #000;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 10001;
        transition: top 0.3s ease;
        font-family: 'Courier New', monospace;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '20px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-100px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Initialize accessibility features when DOM loads
document.addEventListener('DOMContentLoaded', initAccessibility);

// Handle iframe loading states
document.addEventListener('DOMContentLoaded', function() {
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach(iframe => {
        iframe.addEventListener('load', function() {
            console.log('Iframe loaded successfully:', this.src);
        });
        
        iframe.addEventListener('error', function() {
            console.warn('Failed to load iframe:', this.src);
            // Create fallback content
            const fallback = document.createElement('div');
            fallback.style.cssText = `
                padding: 20px;
                text-align: center;
                border: 1px dashed #ff0000;
                color: #ff0000;
                font-family: 'Courier New', monospace;
                background: #330000;
            `;
            fallback.innerHTML = `
                <p>Content temporarily unavailable</p>
                <a href="${this.src}" target="_blank" style="color: #ffff00;" rel="noopener noreferrer">Open in new tab</a>
            `;
            this.parentNode.replaceChild(fallback, this);
        });
    });
});

// Add ARIA labels and improve accessibility
document.addEventListener('DOMContentLoaded', function() {
    // Add ARIA labels to navigation
    const navLinks = document.querySelectorAll('.cmd-link');
    navLinks.forEach((link, index) => {
        const sectionName = link.textContent.replace('[', '').replace(']', '');
        link.setAttribute('aria-label', `Navigate to ${sectionName} section`);
    });
    
    // Add ARIA label to invite buttons
    const inviteButtons = document.querySelectorAll('.invite-link, .btn-invite');
    inviteButtons.forEach(button => {
        button.setAttribute('aria-label', 'Invite Nirupama Discord bot to your server');
    });
});

// Add focus management for better keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        // Ensure focus is visible
        document.activeElement.style.outline = '2px solid #ffff00';
        document.activeElement.style.outlineOffset = '2px';
    }
});

// Remove outline when clicking (mouse users)
document.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
        e.target.style.outline = 'none';
    }
});