/**
 * Tích hợp tất cả các thành phần của trang web
 */

// Đối tượng xác thực người dùng
const auth = {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    isLoggedIn: function() {
        return localStorage.getItem('user') !== null;
    },
    
    // Lấy thông tin người dùng hiện tại
    getCurrentUser: function() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // Đăng nhập
    login: function(email, password) {
        // Trong môi trường thực tế, đây sẽ là một API call đến server
        // Đối với demo, chúng ta sẽ kiểm tra với dữ liệu lưu trong localStorage
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Lưu thông tin người dùng vào localStorage (không bao gồm mật khẩu)
            const userInfo = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            localStorage.setItem('user', JSON.stringify(userInfo));
            return true;
        }
        
        return false;
    },
    
    // Đăng ký
    register: function(name, email, password) {
        // Trong môi trường thực tế, đây sẽ là một API call đến server
        // Đối với demo, chúng ta sẽ lưu vào localStorage
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Kiểm tra xem email đã tồn tại chưa
        if (users.some(u => u.email === email)) {
            return false;
        }
        
        // Tạo người dùng mới
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password // Trong thực tế, mật khẩu phải được mã hóa
        };
        
        // Thêm vào danh sách người dùng
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Tự động đăng nhập
        const userInfo = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        return true;
    },
    
    // Đăng xuất
    logout: function() {
        localStorage.removeItem('user');
    }
};

// Đối tượng tiện ích
const utils = {
    // Hiển thị thông báo
    showNotification: function(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Hiển thị thông báo
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Ẩn thông báo sau 3 giây
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    // Định dạng ngày tháng
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Lưu dữ liệu vào localStorage
    saveData: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // Lấy dữ liệu từ localStorage
    getData: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
};

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', async function() {
    // Khởi tạo các hệ thống
    await initRecommendationSystem();
    await initLearningPathGenerator();
    
    // Cập nhật giao diện người dùng dựa trên trạng thái đăng nhập
    updateUIBasedOnAuthState();
    
    // Xử lý đăng nhập/đăng xuất
    setupAuthHandlers();
    
    // Xử lý tìm kiếm
    setupSearchHandlers();
    
    // Xử lý điều hướng
    setupNavigationHandlers();
    
    // Xử lý trang hiện tại
    handleCurrentPage();
});

/**
 * Cập nhật giao diện người dùng dựa trên trạng thái đăng nhập
 */
function updateUIBasedOnAuthState() {
    const isLoggedIn = auth.isLoggedIn();
    const authButtons = document.querySelector('.auth-buttons');
    const userMenuContainer = document.querySelector('.user-menu-container');
    
    if (!authButtons || !userMenuContainer) return;
    
    if (isLoggedIn) {
        // Hiển thị menu người dùng
        const user = auth.getCurrentUser();
        
        authButtons.style.display = 'none';
        userMenuContainer.style.display = 'block';
        
        const userNameElement = userMenuContainer.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
    } else {
        // Hiển thị nút đăng nhập/đăng ký
        authButtons.style.display = 'flex';
        userMenuContainer.style.display = 'none';
    }
}

/**
 * Thiết lập xử lý đăng nhập/đăng xuất
 */
function setupAuthHandlers() {
    // Xử lý form đăng nhập
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (auth.login(email, password)) {
                utils.showNotification('Đăng nhập thành công!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                utils.showNotification('Email hoặc mật khẩu không đúng!', 'error');
            }
        });
    }
    
    // Xử lý form đăng ký
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (password !== confirmPassword) {
                utils.showNotification('Mật khẩu xác nhận không khớp!', 'error');
                return;
            }
            
            if (auth.register(name, email, password)) {
                utils.showNotification('Đăng ký thành công!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                utils.showNotification('Email đã tồn tại!', 'error');
            }
        });
    }
    
    // Xử lý nút đăng xuất
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            auth.logout();
            utils.showNotification('Đã đăng xuất!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }
}

/**
 * Thiết lập xử lý tìm kiếm
 */
function setupSearchHandlers() {
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const keyword = document.getElementById('search-input').value.trim();
            if (keyword) {
                window.location.href = `careers.html?search=${encodeURIComponent(keyword)}`;
            }
        });
    }
}

/**
 * Thiết lập xử lý điều hướng
 */
function setupNavigationHandlers() {
    // Xử lý menu di động
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
    
    // Đánh dấu menu hiện tại
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Xử lý trang hiện tại
 */
function handleCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Xử lý trang chủ
    if (currentPage === '' || currentPage === 'index.html') {
        handleHomePage();
    }
    
    // Xử lý trang bài kiểm tra
    else if (currentPage === 'tests.html') {
        handleTestsPage();
    }
    
    // Xử lý trang nghề nghiệp
    else if (currentPage === 'careers.html') {
        handleCareersPage();
    }
    
    // Xử lý trang kế hoạch học tập
    else if (currentPage === 'learning-path.html') {
        handleLearningPathPage();
    }
    
    // Xử lý trang theo dõi tiến độ
    else if (currentPage === 'progress.html') {
        handleProgressPage();
    }
}

/**
 * Xử lý trang chủ
 */
function handleHomePage() {
    // Hiển thị kết quả bài kiểm tra gần đây
    displayRecentTestResults();
    
    // Hiển thị nghề nghiệp đã lưu
    displaySavedCareers();
    
    // Hiển thị kế hoạch học tập đã lưu
    displaySavedLearningPlans();
}

/**
 * Hiển thị kết quả bài kiểm tra gần đây
 */
function displayRecentTestResults() {
    const recentResultsContainer = document.getElementById('recent-test-results');
    if (!recentResultsContainer) return;
    
    // Kiểm tra xem có kết quả bài kiểm tra nào không
    const mbtiResult = localStorage.getItem('mbtiResult');
    const bigFiveResult = localStorage.getItem('bigFiveResult');
    const hollandResult = localStorage.getItem('hollandResult');
    
    if (!mbtiResult && !bigFiveResult && !hollandResult) {
        recentResultsContainer.innerHTML = `
            <div class="no-results">
                <p>Bạn chưa làm bài kiểm tra nào. Hãy làm bài kiểm tra để khám phá bản thân!</p>
                <a href="tests.html" class="btn btn-primary">Làm bài kiểm tra</a>
            </div>
        `;
        return;
    }
    
    let html = '<div class="test-results-grid">';
    
    // Hiển thị kết quả MBTI
    if (mbtiResult) {
        const result = JSON.parse(mbtiResult);
        html += `
            <div class="test-result-card">
                <div class="result-header mbti">
                    <h3>MBTI</h3>
                    <div class="result-type">${result.type}</div>
                </div>
                <div class="result-content">
                    <p>${result.description.substring(0, 100)}...</p>
                </div>
                <a href="tests/mbti-result.html" class="btn btn-secondary">Xem chi tiết</a>
            </div>
        `;
    }
    
    // Hiển thị kết quả Big Five
    if (bigFiveResult) {
        const result = JSON.parse(bigFiveResult);
        html += `
            <div class="test-result-card">
                <div class="result-header big-five">
                    <h3>Big Five</h3>
                    <div class="result-type">Phân tích tính cách</div>
                </div>
                <div class="result-content">
                    <p>Openness: ${result.openness}%<br>
                    Conscientiousness: ${result.conscientiousness}%<br>
                    Extraversion: ${result.extraversion}%<br>
                    Agreeableness: ${result.agreeableness}%<br>
                    Neuroticism: ${result.neuroticism}%</p>
                </div>
                <a href="tests/big-five-result.html" class="btn btn-secondary">Xem chi tiết</a>
            </div>
        `;
    }
    
    // Hiển thị kết quả Holland
    if (hollandResult) {
        const result = JSON.parse(hollandResult);
        html += `
            <div class="test-result-card">
                <div class="result-header holland">
                    <h3>Holland Codes</h3>
                    <div class="result-type">${result.hollandCode}</div>
                </div>
                <div class="result-content">
                    <p>
                        ${result.topCodes.map(code => {
                            const codeNames = {
                                'realistic': 'Thực tế',
                                'investigative': 'Nghiên cứu',
                                'artistic': 'Nghệ thuật',
                                'social': 'Xã hội',
                                'enterprising': 'Quản lý',
                                'conventional': 'Tổ chức'
                            };
                            return `${codeNames[code]}: ${result.percentages[code]}%`;
                        }).join('<br>')}
                    </p>
                </div>
                <a href="tests/holland-result.html" class="btn btn-secondary">Xem chi tiết</a>
            </div>
        `;
    }
    
    html += '</div>';
    recentResultsContainer.innerHTML = html;
}

/**
 * Hiển thị nghề nghiệp đã lưu
 */
function displaySavedCareers() {
    const savedCareersContainer = document.getElementById('saved-careers');
    if (!savedCareersContainer) return;
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!auth.isLoggedIn()) {
        savedCareersContainer.innerHTML = `
            <div class="no-results">
                <p>Vui lòng đăng nhập để xem nghề nghiệp đã lưu.</p>
                <a href="login.html" class="btn btn-primary">Đăng nhập</a>
            </div>
        `;
        return;
    }
    
    // Lấy danh sách nghề nghiệp đã lưu
    const savedCareers = JSON.parse(localStorage.getItem('savedCareers') || '[]');
    
    if (savedCareers.length === 0) {
        savedCareersContainer.innerHTML = `
            <div class="no-results">
                <p>Bạn chưa lưu nghề nghiệp nào.</p>
                <a href="careers.html" class="btn btn-primary">Khám phá nghề nghiệp</a>
            </div>
        `;
        return;
    }
    
    let html = `
        <h3>Nghề nghiệp đã lưu</h3>
        <div class="saved-careers-grid">
    `;
    
    savedCareers.forEach(career => {
        html += `
            <div class="saved-career-card">
                <h4>${career.title}</h4>
                <p>Đã lưu: ${utils.formatDate(career.savedAt)}</p>
                <a href="careers.html?id=${career.id}" class="btn btn-secondary">Xem chi tiết</a>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="view-more-container">
            <a href="careers.html" class="btn btn-primary">Xem tất cả nghề nghiệp</a>
        </div>
    `;
    
    savedCareersContainer.innerHTML = html;
}

/**
 * Hiển thị kế hoạch học tập đã lưu
 */
function displaySavedLearningPlans() {
    const savedPlansContainer = document.getElementById('saved-learning-plans');
    if (!savedPlansContainer) return;
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!auth.isLoggedIn()) {
        savedPlansContainer.innerHTML = `
            <div class="no-results">
                <p>Vui lòng đăng nhập để xem kế hoạch học tập đã lưu.</p>
                <a href="login.html" class="btn btn-primary">Đăng nhập</a>
            </div>
        `;
        return;
    }
    
    // Lấy danh sách kế hoạch học tập đã lưu
    const savedPlans = JSON.parse(localStorage.getItem('savedLearningPlans') || '[]');
    
    if (savedPlans.length === 0) {
        savedPlansContainer.innerHTML = `
            <div class="no-results">
                <p>Bạn chưa lưu kế hoạch học tập nào.</p>
                <a href="learning-path.html" class="btn btn-primary">Tạo kế hoạch học tập</a>
            </div>
        `;
        return;
    }
    
    let html = `
        <h3>Kế hoạch học tập đã lưu</h3>
        <div class="saved-plans-grid">
    `;
    
    savedPlans.forEach(plan => {
        html += `
            <div class="saved-plan-card">
                <h4>${plan.path_title}</h4>
                <p>Nghề nghiệp: ${plan.career_title}</p>
                <p>Đã lưu: ${utils.formatDate(plan.savedAt)}</p>
                <a href="learning-path.html?path=${plan.path_id}" class="btn btn-secondary">Xem chi tiết</a>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="view-more-container">
            <a href="learning-path.html" class="btn btn-primary">Tạo kế hoạch học tập mới</a>
        </div>
    `;
    
    savedPlansContainer.innerHTML = html;
}

/**
 * Xử lý trang bài kiểm tra
 */
function handleTestsPage() {
    // Không cần xử lý đặc biệt vì các trang bài kiểm tra đã có JavaScript riêng
}

/**
 * Xử lý trang nghề nghiệp
 */
function handleCareersPage() {
    // Lấy tham số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get('search');
    const careerId = urlParams.get('id') ? parseInt(urlParams.get('id')) : null;
    
    // Nếu có ID nghề nghiệp, hiển thị chi tiết nghề nghiệp
    if (careerId) {
        displayCareerDetails(careerId);
    }
    // Nếu có từ khóa tìm kiếm, hiển thị kết quả tìm kiếm
    else if (searchKeyword) {
        const results = searchCareers(searchKeyword);
        displaySearchResults(results);
    }
    // Nếu không có tham số, hiển thị tất cả nghề nghiệp
    else {
        displayAllCareers();
    }
}

/**
 * Hiển thị tất cả nghề nghiệp
 */
function displayAllCareers() {
    const careersContainer = document.getElementById('careers-container');
    if (!careersContainer) return;
    
    // Khởi tạo hệ thống gợi ý nếu chưa được khởi tạo
    if (!recommendationSystem.isInitialized()) {
        initRecommendationSystem().then(() => {
            displayAllCareers();
        });
        return;
    }
    
    const careers = recommendationSystem.getAllCareers();
    
    if (!careers || careers.length === 0) {
        careersContainer.innerHTML = `
            <div class="no-results">
                <p>Không tìm thấy thông tin nghề nghiệp.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="careers-header">
            <h2>Khám phá nghề nghiệp</h2>
            <p>Tìm hiểu về các nghề nghiệp khác nhau và yêu cầu của chúng</p>
            
            <div class="search-container">
                <form id="career-search-form">
                    <input type="text" id="career-search-input" placeholder="Tìm kiếm nghề nghiệp...">
                    <button type="submit" class="btn btn-primary">Tìm kiếm</button>
                </form>
            </div>
        </div>
        
        <div class="careers-grid">
    `;
    
    careers.forEach(career => {
        html += `
            <div class="career-card">
                <h3>${career.title}</h3>
                <p>${career.description.substring(0, 100)}...</p>
                <div class="career-meta">
                    <span><i class="fas fa-graduation-cap"></i> ${career.education[0]}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${career.salary_range}</span>
                </div>
                <a href="#" class="career-detail-link" data-id="${career.id}">Xem chi tiết</a>
            </div>
        `;
    });
    
    html += '</div>';
    
    careersContainer.innerHTML = html;
    
    // Thêm sự kiện cho các liên kết chi tiết
    const detailLinks = careersContainer.querySelectorAll('.career-detail-link');
    detailLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const careerId = parseInt(this.getAttribute('data-id'));
            displayCareerDetails(careerId);
        });
    });
    
    // Thêm sự kiện cho form tìm kiếm
    const searchForm = careersContainer.querySelector('#career-search-form');
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const keyword = document.getElementById('career-search-input').value.trim();
        if (keyword) {
            const results = searchCareers(keyword);
            displaySearchResults(results);
        }
    });
}

/**
 * Xử lý trang kế hoạch học tập
 */
function handleLearningPathPage() {
    // Lấy tham số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const careerId = urlParams.get('career') ? parseInt(urlParams.get('career')) : null;
    const pathId = urlParams.get('path') ? parseInt(urlParams.get('path')) : null;
    
    // Nếu có ID lộ trình, hiển thị chi tiết lộ trình
    if (pathId) {
        displayLearningPathDetails(pathId);
    }
    // Nếu có ID nghề nghiệp, hiển thị các lộ trình cho nghề nghiệp đó
    else if (careerId) {
        displayLearningPathsForCareer(careerId);
    }
    // Nếu không có tham số, hiển thị trang tạo kế hoạch học tập
    else {
        displayLearningPathCreator();
    }
}

/**
 * Hiển thị trang tạo kế hoạch học tập
 */
function displayLearningPathCreator() {
    const learningPathContainer = document.getElementById('learning-path-container');
    if (!learningPathContainer) return;
    
    // Khởi tạo hệ thống tạo kế hoạch học tập nếu chưa được khởi tạo
    if (!learningPathGenerator.isInitialized()) {
        initLearningPathGenerator().then(() => {
            displayLearningPathCreator();
        });
        return;
    }
    
    // Lấy danh sách nghề nghiệp
    const careers = recommendationSystem.getAllCareers();
    
    if (!careers || careers.length === 0) {
        learningPathContainer.innerHTML = `
            <div class="no-results">
                <p>Không tìm thấy thông tin nghề nghiệp.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="learning-path-header">
            <h2>Tạo kế hoạch học tập</h2>
            <p>Chọn nghề nghiệp bạn quan tâm để xem các lộ trình học tập</p>
        </div>
        
        <div class="career-selection">
            <h3>Chọn nghề nghiệp</h3>
            <div class="careers-grid">
    `;
    
    careers.forEach(career => {
        html += `
            <div class="career-card">
                <h3>${career.title}</h3>
                <p>${career.description.substring(0, 100)}...</p>
                <a href="learning-path.html?career=${career.id}" class="btn btn-primary">Xem lộ trình học tập</a>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div class="saved-learning-plans">
            <h3>Kế hoạch học tập đã lưu</h3>
    `;
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!auth.isLoggedIn()) {
        html += `
            <div class="no-results">
                <p>Vui lòng đăng nhập để xem kế hoạch học tập đã lưu.</p>
                <a href="login.html" class="btn btn-primary">Đăng nhập</a>
            </div>
        `;
    } else {
        // Lấy danh sách kế hoạch học tập đã lưu
        const savedPlans = JSON.parse(localStorage.getItem('savedLearningPlans') || '[]');
        
        if (savedPlans.length === 0) {
            html += `
                <div class="no-results">
                    <p>Bạn chưa lưu kế hoạch học tập nào.</p>
                </div>
            `;
        } else {
            html += `<div class="saved-plans-grid">`;
            
            savedPlans.forEach(plan => {
                html += `
                    <div class="saved-plan-card">
                        <h4>${plan.path_title}</h4>
                        <p>Nghề nghiệp: ${plan.career_title}</p>
                        <p>Đã lưu: ${utils.formatDate(plan.savedAt)}</p>
                        <a href="learning-path.html?path=${plan.path_id}" class="btn btn-secondary">Xem chi tiết</a>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
    }
    
    html += `
        </div>
    `;
    
    learningPathContainer.innerHTML = html;
}

/**
 * Xử lý trang theo dõi tiến độ
 */
function handleProgressPage() {
    const progressContainer = document.getElementById('progress-container');
    if (!progressContainer) return;
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!auth.isLoggedIn()) {
        progressContainer.innerHTML = `
            <div class="no-results">
                <p>Vui lòng đăng nhập để xem tiến độ của bạn.</p>
                <a href="login.html" class="btn btn-primary">Đăng nhập</a>
            </div>
        `;
        return;
    }
    
    // Lấy thông tin người dùng
    const user = auth.getCurrentUser();
    
    // Lấy kết quả bài kiểm tra
    const mbtiResult = localStorage.getItem('mbtiResult');
    const bigFiveResult = localStorage.getItem('bigFiveResult');
    const hollandResult = localStorage.getItem('hollandResult');
    
    // Lấy nghề nghiệp đã lưu
    const savedCareers = JSON.parse(localStorage.getItem('savedCareers') || '[]');
    
    // Lấy kế hoạch học tập đã lưu
    const savedPlans = JSON.parse(localStorage.getItem('savedLearningPlans') || '[]');
    
    // Tính toán tiến độ
    const testProgress = calculateTestProgress(mbtiResult, bigFiveResult, hollandResult);
    const careerProgress = calculateCareerProgress(savedCareers);
    const learningProgress = calculateLearningProgress(savedPlans);
    
    let html = `
        <div class="progress-header">
            <h2>Theo dõi tiến độ</h2>
            <p>Xem tiến độ của bạn trong quá trình khám phá nghề nghiệp và lập kế hoạch học tập</p>
        </div>
        
        <div class="progress-overview">
            <div class="progress-card">
                <h3>Khám phá bản thân</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${testProgress}%"></div>
                </div>
                <p>${testProgress}% hoàn thành</p>
                <a href="tests.html" class="btn btn-secondary">Làm bài kiểm tra</a>
            </div>
            
            <div class="progress-card">
                <h3>Khám phá nghề nghiệp</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${careerProgress}%"></div>
                </div>
                <p>${careerProgress}% hoàn thành</p>
                <a href="careers.html" class="btn btn-secondary">Khám phá nghề nghiệp</a>
            </div>
            
            <div class="progress-card">
                <h3>Lập kế hoạch học tập</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${learningProgress}%"></div>
                </div>
                <p>${learningProgress}% hoàn thành</p>
                <a href="learning-path.html" class="btn btn-secondary">Tạo kế hoạch học tập</a>
            </div>
        </div>
        
        <div class="progress-details">
            <div class="test-progress">
                <h3>Bài kiểm tra đã làm</h3>
                <div class="test-progress-grid">
                    <div class="test-item ${mbtiResult ? 'completed' : ''}">
                        <h4>MBTI</h4>
                        <p>${mbtiResult ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</p>
                        <a href="tests/mbti.html" class="btn btn-secondary">${mbtiResult ? 'Làm lại' : 'Làm bài'}</a>
                    </div>
                    
                    <div class="test-item ${bigFiveResult ? 'completed' : ''}">
                        <h4>Big Five</h4>
                        <p>${bigFiveResult ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</p>
                        <a href="tests/big-five.html" class="btn btn-secondary">${bigFiveResult ? 'Làm lại' : 'Làm bài'}</a>
                    </div>
                    
                    <div class="test-item ${hollandResult ? 'completed' : ''}">
                        <h4>Holland Codes</h4>
                        <p>${hollandResult ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</p>
                        <a href="tests/holland.html" class="btn btn-secondary">${hollandResult ? 'Làm lại' : 'Làm bài'}</a>
                    </div>
                </div>
            </div>
            
            <div class="saved-items">
                <h3>Nghề nghiệp đã lưu</h3>
                ${savedCareers.length > 0 ? `
                    <div class="saved-careers-grid">
                        ${savedCareers.map(career => `
                            <div class="saved-career-card">
                                <h4>${career.title}</h4>
                                <p>Đã lưu: ${utils.formatDate(career.savedAt)}</p>
                                <a href="careers.html?id=${career.id}" class="btn btn-secondary">Xem chi tiết</a>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-results">
                        <p>Bạn chưa lưu nghề nghiệp nào.</p>
                        <a href="careers.html" class="btn btn-primary">Khám phá nghề nghiệp</a>
                    </div>
                `}
                
                <h3>Kế hoạch học tập đã lưu</h3>
                ${savedPlans.length > 0 ? `
                    <div class="saved-plans-grid">
                        ${savedPlans.map(plan => `
                            <div class="saved-plan-card">
                                <h4>${plan.path_title}</h4>
                                <p>Nghề nghiệp: ${plan.career_title}</p>
                                <p>Đã lưu: ${utils.formatDate(plan.savedAt)}</p>
                                <a href="learning-path.html?path=${plan.path_id}" class="btn btn-secondary">Xem chi tiết</a>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-results">
                        <p>Bạn chưa lưu kế hoạch học tập nào.</p>
                        <a href="learning-path.html" class="btn btn-primary">Tạo kế hoạch học tập</a>
                    </div>
                `}
            </div>
        </div>
    `;
    
    progressContainer.innerHTML = html;
}

/**
 * Tính toán tiến độ làm bài kiểm tra
 */
function calculateTestProgress(mbtiResult, bigFiveResult, hollandResult) {
    let completed = 0;
    const total = 3;
    
    if (mbtiResult) completed++;
    if (bigFiveResult) completed++;
    if (hollandResult) completed++;
    
    return Math.round((completed / total) * 100);
}

/**
 * Tính toán tiến độ khám phá nghề nghiệp
 */
function calculateCareerProgress(savedCareers) {
    // Giả sử mục tiêu là lưu ít nhất 5 nghề nghiệp
    const target = 5;
    const completed = Math.min(savedCareers.length, target);
    
    return Math.round((completed / target) * 100);
}

/**
 * Tính toán tiến độ lập kế hoạch học tập
 */
function calculateLearningProgress(savedPlans) {
    // Giả sử mục tiêu là tạo ít nhất 3 kế hoạch học tập
    const target = 3;
    const completed = Math.min(savedPlans.length, target);
    
    return Math.round((completed / target) * 100);
}
