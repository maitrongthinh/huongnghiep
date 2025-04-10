/**
 * Tích hợp kết quả bài kiểm tra tính cách với hệ thống gợi ý nghề nghiệp
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Khởi tạo hệ thống gợi ý
    const systemInitialized = await initRecommendationSystem();
    if (!systemInitialized) {
        console.error('Không thể khởi tạo hệ thống gợi ý nghề nghiệp');
        return;
    }
    
    // Kiểm tra xem có kết quả bài kiểm tra nào được lưu không
    const mbtiResult = localStorage.getItem('mbtiResult');
    const bigFiveResult = localStorage.getItem('bigFiveResult');
    const hollandResult = localStorage.getItem('hollandResult');
    
    // Hiển thị gợi ý nghề nghiệp nếu có kết quả bài kiểm tra
    if (mbtiResult || bigFiveResult || hollandResult) {
        displayPersonalizedRecommendations();
    }
    
    // Xử lý tìm kiếm nghề nghiệp
    const searchForm = document.getElementById('career-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const keyword = document.getElementById('career-search-input').value.trim();
            if (keyword) {
                const results = searchCareers(keyword);
                displaySearchResults(results);
            }
        });
    }
    
    // Xử lý hiển thị chi tiết nghề nghiệp
    const careerDetailLinks = document.querySelectorAll('.career-detail-link');
    careerDetailLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const careerId = parseInt(this.getAttribute('data-id'));
            displayCareerDetails(careerId);
        });
    });
});

/**
 * Hiển thị gợi ý nghề nghiệp cá nhân hóa dựa trên kết quả bài kiểm tra
 */
function displayPersonalizedRecommendations() {
    const recommendationsContainer = document.getElementById('personalized-recommendations');
    if (!recommendationsContainer) return;
    
    // Lấy kết quả bài kiểm tra từ localStorage
    let mbtiType = null;
    let bigFiveResult = null;
    let hollandResult = null;
    
    try {
        const mbtiData = localStorage.getItem('mbtiResult');
        if (mbtiData) {
            const mbtiResultObj = JSON.parse(mbtiData);
            mbtiType = mbtiResultObj.type;
        }
        
        const bigFiveData = localStorage.getItem('bigFiveResult');
        if (bigFiveData) {
            bigFiveResult = JSON.parse(bigFiveData);
        }
        
        const hollandData = localStorage.getItem('hollandResult');
        if (hollandData) {
            hollandResult = JSON.parse(hollandData);
        }
    } catch (error) {
        console.error('Lỗi khi đọc kết quả bài kiểm tra:', error);
        return;
    }
    
    // Lấy gợi ý nghề nghiệp dựa trên kết quả bài kiểm tra
    let recommendations = [];
    
    if (mbtiType && bigFiveResult && hollandResult) {
        // Nếu có cả ba kết quả, sử dụng phương pháp kết hợp
        recommendations = getCombinedCareerRecommendations(mbtiType, bigFiveResult, hollandResult);
    } else if (mbtiType) {
        // Nếu chỉ có kết quả MBTI
        recommendations = getCareerRecommendationsByMBTI(mbtiType);
    } else if (bigFiveResult) {
        // Nếu chỉ có kết quả Big Five
        recommendations = getCareerRecommendationsByBigFive(bigFiveResult);
    } else if (hollandResult) {
        // Nếu chỉ có kết quả Holland
        recommendations = getCareerRecommendationsByHolland(hollandResult);
    }
    
    // Hiển thị gợi ý nghề nghiệp
    if (recommendations.length > 0) {
        displayRecommendations(recommendations, recommendationsContainer);
    } else {
        recommendationsContainer.innerHTML = `
            <div class="no-results">
                <p>Chưa có gợi ý nghề nghiệp nào. Vui lòng làm các bài kiểm tra tính cách để nhận gợi ý phù hợp.</p>
                <a href="tests.html" class="btn btn-primary">Làm bài kiểm tra</a>
            </div>
        `;
    }
}

/**
 * Hiển thị danh sách nghề nghiệp được gợi ý
 */
function displayRecommendations(careers, container) {
    // Giới hạn số lượng nghề nghiệp hiển thị
    const displayCareers = careers.slice(0, 12);
    
    let html = `
        <h3>Nghề nghiệp phù hợp với bạn</h3>
        <div class="career-grid">
    `;
    
    displayCareers.forEach(career => {
        html += `
            <div class="career-card">
                <h4>${career.title}</h4>
                <p>${career.description.substring(0, 100)}...</p>
                <div class="career-meta">
                    <span><i class="fas fa-graduation-cap"></i> ${career.education[0]}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${career.salary_range}</span>
                </div>
                <a href="#" class="career-detail-link" data-id="${career.id}">Xem chi tiết</a>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="view-more-container">
            <a href="careers.html" class="btn btn-secondary">Xem tất cả nghề nghiệp</a>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Thêm sự kiện cho các liên kết chi tiết
    const detailLinks = container.querySelectorAll('.career-detail-link');
    detailLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const careerId = parseInt(this.getAttribute('data-id'));
            displayCareerDetails(careerId);
        });
    });
}

/**
 * Hiển thị kết quả tìm kiếm nghề nghiệp
 */
function displaySearchResults(careers) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    if (careers.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>Không tìm thấy nghề nghiệp phù hợp với từ khóa của bạn.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <h3>Kết quả tìm kiếm (${careers.length})</h3>
        <div class="career-grid">
    `;
    
    careers.forEach(career => {
        html += `
            <div class="career-card">
                <h4>${career.title}</h4>
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
    
    resultsContainer.innerHTML = html;
    
    // Thêm sự kiện cho các liên kết chi tiết
    const detailLinks = resultsContainer.querySelectorAll('.career-detail-link');
    detailLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const careerId = parseInt(this.getAttribute('data-id'));
            displayCareerDetails(careerId);
        });
    });
    
    // Cuộn đến kết quả tìm kiếm
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hiển thị chi tiết nghề nghiệp
 */
function displayCareerDetails(careerId) {
    const career = getCareerDetails(careerId);
    if (!career) return;
    
    // Lấy danh sách nghề nghiệp liên quan
    const relatedCareers = getRelatedCareers(careerId);
    
    // Tạo modal hiển thị chi tiết nghề nghiệp
    const modalHtml = `
        <div class="career-detail-modal" id="career-detail-modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="career-detail-header">
                    <h2>${career.title}</h2>
                    <p>${career.description}</p>
                </div>
                
                <div class="career-detail-grid">
                    <div class="detail-section">
                        <h3>Yêu cầu học vấn</h3>
                        <ul>
                            ${career.education.map(edu => `<li>${edu}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Kỹ năng cần thiết</h3>
                        <ul>
                            ${career.skills.map(skill => `<li>${skill}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Thông tin khác</h3>
                        <p><strong>Mức lương:</strong> ${career.salary_range}</p>
                        <p><strong>Triển vọng nghề nghiệp:</strong> ${career.job_outlook}</p>
                        <p><strong>Môi trường làm việc:</strong> ${career.work_environment}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Tính cách phù hợp</h3>
                        <p><strong>MBTI:</strong> ${career.personality_match.mbti.join(', ')}</p>
                        <p><strong>Big Five:</strong></p>
                        <ul>
                            <li>Cởi mở: ${career.personality_match.big_five.openness}</li>
                            <li>Tận tâm: ${career.personality_match.big_five.conscientiousness}</li>
                            <li>Hướng ngoại: ${career.personality_match.big_five.extraversion}</li>
                            <li>Dễ chịu: ${career.personality_match.big_five.agreeableness}</li>
                            <li>Lo âu: ${career.personality_match.big_five.neuroticism}</li>
                        </ul>
                        <p><strong>Holland Codes:</strong> ${career.personality_match.holland.join(', ')}</p>
                    </div>
                </div>
                
                ${relatedCareers.length > 0 ? `
                    <div class="related-careers">
                        <h3>Nghề nghiệp liên quan</h3>
                        <div class="related-careers-grid">
                            ${relatedCareers.map(related => `
                                <div class="related-career-item">
                                    <h4>${related.title}</h4>
                                    <p>${related.description.substring(0, 80)}...</p>
                                    <a href="#" class="related-career-link" data-id="${related.id}">Xem chi tiết</a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="career-actions">
                    <a href="learning-path.html?career=${careerId}" class="btn btn-primary">Tạo kế hoạch học tập</a>
                    <button class="btn btn-secondary save-career">Lưu nghề nghiệp này</button>
                </div>
            </div>
        </div>
    `;
    
    // Thêm modal vào trang
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    const modal = document.getElementById('career-detail-modal');
    
    // Hiển thị modal
    modal.style.display = 'block';
    
    // Xử lý đóng modal
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        modal.remove();
    });
    
    // Xử lý click bên ngoài modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            modal.remove();
        }
    });
    
    // Xử lý các liên kết nghề nghiệp liên quan
    const relatedLinks = modal.querySelectorAll('.related-career-link');
    relatedLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const relatedId = parseInt(this.getAttribute('data-id'));
            modal.remove();
            displayCareerDetails(relatedId);
        });
    });
    
    // Xử lý nút lưu nghề nghiệp
    const saveBtn = modal.querySelector('.save-career');
    saveBtn.addEventListener('click', function() {
        saveCareerToProfile(career);
        this.textContent = 'Đã lưu';
        this.disabled = true;
    });
}

/**
 * Lưu nghề nghiệp vào hồ sơ người dùng
 */
function saveCareerToProfile(career) {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!auth.isLoggedIn()) {
        if (confirm('Bạn cần đăng nhập để lưu nghề nghiệp. Bạn có muốn đăng nhập ngay bây giờ không?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Lấy danh sách nghề nghiệp đã lưu
    let savedCareers = JSON.parse(localStorage.getItem('savedCareers') || '[]');
    
    // Kiểm tra xem nghề nghiệp đã được lưu chưa
    if (!savedCareers.some(saved => saved.id === career.id)) {
        // Thêm nghề nghiệp vào danh sách
        savedCareers.push({
            id: career.id,
            title: career.title,
            savedAt: new Date().toISOString()
        });
        
        // Lưu danh sách mới
        localStorage.setItem('savedCareers', JSON.stringify(savedCareers));
        
        // Hiển thị thông báo
        utils.showNotification('Đã lưu nghề nghiệp vào hồ sơ của bạn!');
    } else {
        utils.showNotification('Nghề nghiệp này đã được lưu trước đó!');
    }
}
