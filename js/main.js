// Main JavaScript file for Hướng Nghiệp Tương Lai website

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Testimonials slider functionality
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    if (testimonialsSlider) {
        // Clone testimonials for infinite scroll effect
        const testimonials = document.querySelectorAll('.testimonial');
        testimonials.forEach(testimonial => {
            const clone = testimonial.cloneNode(true);
            testimonialsSlider.appendChild(clone);
        });

        // Auto scroll functionality
        let scrollPosition = 0;
        const scrollSpeed = 1;
        const scrollInterval = 30;

        function autoScroll() {
            scrollPosition += scrollSpeed;
            if (scrollPosition >= testimonialsSlider.scrollWidth / 2) {
                scrollPosition = 0;
            }
            testimonialsSlider.scrollLeft = scrollPosition;
        }

        // Start auto scroll with interval
        const scrollTimer = setInterval(autoScroll, scrollInterval);

        // Pause auto scroll on hover
        testimonialsSlider.addEventListener('mouseenter', () => {
            clearInterval(scrollTimer);
        });

        // Resume auto scroll on mouse leave
        testimonialsSlider.addEventListener('mouseleave', () => {
            clearInterval(scrollTimer);
            const newScrollTimer = setInterval(autoScroll, scrollInterval);
        });
    }

    // Mobile menu toggle
    const createMobileMenu = () => {
        const header = document.querySelector('header');
        if (!header) return;

        // Create mobile menu button
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.classList.add('mobile-menu-btn');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Insert button before nav
        const nav = header.querySelector('nav');
        if (nav) {
            header.insertBefore(mobileMenuBtn, nav);
            
            // Add toggle functionality
            mobileMenuBtn.addEventListener('click', () => {
                nav.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (nav.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }
    };

    // Call mobile menu function for screens under 768px
    if (window.innerWidth < 768) {
        createMobileMenu();
    }

    // Recreate mobile menu on window resize
    window.addEventListener('resize', () => {
        const existingBtn = document.querySelector('.mobile-menu-btn');
        if (window.innerWidth < 768 && !existingBtn) {
            createMobileMenu();
        } else if (window.innerWidth >= 768 && existingBtn) {
            existingBtn.remove();
            document.querySelector('nav').classList.remove('active');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form validation
    const validateForm = (form) => {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                
                // Create or update error message
                let errorMsg = input.nextElementSibling;
                if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                    errorMsg = document.createElement('div');
                    errorMsg.classList.add('error-message');
                    input.parentNode.insertBefore(errorMsg, input.nextSibling);
                }
                errorMsg.textContent = 'Trường này là bắt buộc';
            } else {
                input.classList.remove('error');
                const errorMsg = input.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.remove();
                }
            }
        });
        
        return isValid;
    };

    // Apply validation to all forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    });

    // Newsletter form handling
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput && emailInput.value.trim()) {
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.classList.add('success-message');
                successMsg.textContent = 'Cảm ơn bạn đã đăng ký nhận tin!';
                
                // Replace form with success message
                this.innerHTML = '';
                this.appendChild(successMsg);
            }
        });
    }

    // Add active class to current navigation item
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// User authentication functions (placeholders for future implementation)
const auth = {
    // Register new user
    register: function(userData) {
        // This will be implemented with actual backend integration
        console.log('Registering user:', userData);
        return new Promise((resolve) => {
            // Simulate API call
            setTimeout(() => {
                localStorage.setItem('user', JSON.stringify(userData));
                resolve({ success: true });
            }, 1000);
        });
    },
    
    // Login user
    login: function(credentials) {
        // This will be implemented with actual backend integration
        console.log('Logging in user:', credentials);
        return new Promise((resolve) => {
            // Simulate API call
            setTimeout(() => {
                // For demo purposes only
                const demoUser = {
                    email: credentials.email,
                    name: 'Học sinh Demo'
                };
                localStorage.setItem('user', JSON.stringify(demoUser));
                resolve({ success: true });
            }, 1000);
        });
    },
    
    // Logout user
    logout: function() {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },
    
    // Check if user is logged in
    isLoggedIn: function() {
        return localStorage.getItem('user') !== null;
    },
    
    // Get current user
    getCurrentUser: function() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

// Update UI based on authentication status
function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        authButtons.innerHTML = `
            <div class="user-menu">
                <span class="user-name">Xin chào, ${user.name}</span>
                <div class="user-dropdown">
                    <a href="profile.html">Hồ sơ cá nhân</a>
                    <a href="results.html">Kết quả bài kiểm tra</a>
                    <a href="#" id="logout-btn">Đăng xuất</a>
                </div>
            </div>
        `;
        
        // Add logout functionality
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    } else {
        authButtons.innerHTML = `
            <a href="login.html" class="btn btn-login">Đăng nhập</a>
            <a href="register.html" class="btn btn-register">Đăng ký</a>
        `;
    }
}

// Call updateAuthUI when DOM is loaded
document.addEventListener('DOMContentLoaded', updateAuthUI);

// Utility functions
const utils = {
    // Show notification
    showNotification: function(message, type = 'success') {
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide and remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    // Format date
    formatDate: function(date) {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }
};
