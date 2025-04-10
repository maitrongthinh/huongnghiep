/**
 * Tích hợp hệ thống tạo kế hoạch học tập với giao diện người dùng
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Khởi tạo hệ thống tạo kế hoạch học tập
    const systemInitialized = await initLearningPathGenerator();
    if (!systemInitialized) {
        console.error('Không thể khởi tạo hệ thống tạo kế hoạch học tập');
        return;
    }
    
    // Lấy ID nghề nghiệp từ URL (nếu có)
    const urlParams = new URLSearchParams(window.location.search);
    const careerId = urlParams.get('career') ? parseInt(urlParams.get('career')) : null;
    
    // Nếu có ID nghề nghiệp, hiển thị các lộ trình học tập cho nghề nghiệp đó
    if (careerId) {
        displayLearningPathsForCareer(careerId);
    }
    
    // Xử lý form tạo kế hoạch học tập
    const createPlanForm = document.getElementById('create-plan-form');
    if (createPlanForm) {
        createPlanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const selectedCareerId = parseInt(document.getElementById('career-select').value);
            const durationPreference = document.querySelector('input[name="duration"]:checked').value;
            const methodPreference = document.querySelector('input[name="method"]:checked').value;
            
            const preferences = {
                duration: durationPreference,
                method: methodPreference
            };
            
            createAndDisplayPersonalizedPlan(selectedCareerId, preferences);
        });
    }
    
    // Xử lý form tùy chỉnh kế hoạch học tập
    const customizePlanForm = document.getElementById('customize-plan-form');
    if (customizePlanForm) {
        customizePlanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const pathId = parseInt(document.getElementById('path-select').value);
            const customTitle = document.getElementById('custom-title').value;
            const customDescription = document.getElementById('custom-description').value;
            
            // Thu thập thông tin tùy chỉnh các bước
            const stepCustomizations = [];
            const stepElements = document.querySelectorAll('.step-customization');
            
            stepElements.forEach(stepElement => {
                const stepId = parseInt(stepElement.getAttribute('data-step-id'));
                const activities = Array.from(stepElement.querySelectorAll('.activity-input'))
                    .map(input => input.value)
                    .filter(value => value.trim() !== '');
                
                if (activities.length > 0) {
                    stepCustomizations.push({
                        step_id: stepId,
                        activities: activities
                    });
                }
            });
            
            const customizations = {
                title: customTitle,
                description: customDescription,
                steps: stepCustomizations
            };
            
            createAndDisplayCustomPlan(pathId, customizations);
        });
    }
    
    // Xử lý nút lưu kế hoạch học tập
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('save-plan-btn')) {
            const planContainer = e.target.closest('.learning-plan');
            if (planContainer) {
                const planData = planContainer.getAttribute('data-plan');
                if (planData) {
                    saveLearningPlan(JSON.parse(planData));
                    e.target.textContent = 'Đã lưu';
                    e.target.disabled = true;
                }
            }
        }
    });
});

/**
 * Hiển thị các lộ trình học tập cho một nghề nghiệp
 */
function displayLearningPathsForCareer(careerId) {
    const pathsContainer = document.getElementById('learning-paths-container');
    if (!pathsContainer) return;
    
    // Lấy thông tin nghề nghiệp
    const career = getCareerDetails(careerId);
    if (!career) {
        pathsContainer.innerHTML = `
            <div class="no-results">
                <p>Không tìm thấy thông tin nghề nghiệp.</p>
                <a href="careers.html" class="btn btn-primary">Quay lại trang nghề nghiệp</a>
            </div>
        `;
        return;
    }
    
    // Lấy các lộ trình học tập cho nghề nghiệp
    const learningPaths = getLearningPathsForCareer(careerId);
    
    if (!learningPaths || learningPaths.length === 0) {
        pathsContainer.innerHTML = `
            <div class="career-header">
                <h2>${career.title}</h2>
                <p>${career.description}</p>
            </div>
            <div class="no-results">
                <p>Chưa có lộ trình học tập cho nghề nghiệp này.</p>
                <button class="btn btn-primary create-new-path-btn" data-career-id="${careerId}">Tạo lộ trình mới</button>
            </div>
        `;
        return;
    }
    
    // Hiển thị thông tin nghề nghiệp và các lộ trình học tập
    let html = `
        <div class="career-header">
            <h2>${career.title}</h2>
            <p>${career.description}</p>
        </div>
        <div class="learning-paths-list">
            <h3>Các lộ trình học tập</h3>
    `;
    
    learningPaths.forEach(path => {
        html += `
            <div class="learning-path-card">
                <h4>${path.title}</h4>
                <p>${path.description}</p>
                <div class="path-meta">
                    <span><i class="fas fa-clock"></i> Thời gian: ${path.duration}</span>
                    <span><i class="fas fa-list-ol"></i> Số bước: ${path.steps.length}</span>
                </div>
                <button class="btn btn-primary view-path-btn" data-path-id="${path.path_id}">Xem chi tiết</button>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="create-plan-container">
            <h3>Tạo kế hoạch học tập cá nhân hóa</h3>
            <form id="create-plan-form">
                <input type="hidden" id="career-select" value="${careerId}">
                
                <div class="form-group">
                    <label>Thời gian học tập mong muốn:</label>
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="duration" value="short" checked>
                            Ngắn hạn (1-2 năm)
                        </label>
                        <label>
                            <input type="radio" name="duration" value="medium">
                            Trung hạn (3-4 năm)
                        </label>
                        <label>
                            <input type="radio" name="duration" value="long">
                            Dài hạn (4+ năm)
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Phương thức học tập:</label>
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="method" value="formal" checked>
                            Chính quy (Đại học, Cao đẳng)
                        </label>
                        <label>
                            <input type="radio" name="method" value="self">
                            Tự học / Chuyển ngành
                        </label>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary">Tạo kế hoạch học tập</button>
            </form>
        </div>
    `;
    
    pathsContainer.innerHTML = html;
    
    // Thêm sự kiện cho các nút xem chi tiết
    const viewButtons = pathsContainer.querySelectorAll('.view-path-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pathId = parseInt(this.getAttribute('data-path-id'));
            displayLearningPathDetails(pathId);
        });
    });
}

/**
 * Hiển thị chi tiết lộ trình học tập
 */
function displayLearningPathDetails(pathId) {
    const pathInfo = getLearningPathById(pathId);
    if (!pathInfo) return;
    
    const path = pathInfo.path;
    
    // Tạo modal hiển thị chi tiết lộ trình học tập
    const modalHtml = `
        <div class="learning-path-modal" id="learning-path-modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="learning-path-header">
                    <h2>${path.title}</h2>
                    <p>${path.description}</p>
                    <div class="path-meta">
                        <span><i class="fas fa-clock"></i> Thời gian: ${path.duration}</span>
                        <span><i class="fas fa-list-ol"></i> Số bước: ${path.steps.length}</span>
                    </div>
                </div>
                
                <div class="learning-path-steps">
                    ${path.steps.map((step, index) => `
                        <div class="learning-step">
                            <div class="step-header">
                                <div class="step-number">${index + 1}</div>
                                <h3>${step.title}</h3>
                            </div>
                            <div class="step-content">
                                <p>${step.description}</p>
                                <p><strong>Thời gian:</strong> ${step.duration}</p>
                                
                                <div class="step-activities">
                                    <h4>Hoạt động</h4>
                                    <ul>
                                        ${step.activities.map(activity => `<li>${activity}</li>`).join('')}
                                    </ul>
                                </div>
                                
                                ${step.resources && step.resources.length > 0 ? `
                                    <div class="step-resources">
                                        <h4>Tài nguyên</h4>
                                        <ul>
                                            ${step.resources.map(resource => `
                                                <li>
                                                    <a href="${resource.url}" target="_blank">
                                                        ${resource.title} <span class="resource-type">(${getResourceTypeText(resource.type)})</span>
                                                    </a>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="learning-path-actions">
                    <button class="btn btn-secondary customize-path-btn" data-path-id="${pathId}">Tùy chỉnh lộ trình</button>
                    <button class="btn btn-primary save-plan-btn" data-path-id="${pathId}">Lưu kế hoạch học tập</button>
                </div>
            </div>
        </div>
    `;
    
    // Thêm modal vào trang
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    const modal = document.getElementById('learning-path-modal');
    
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
    
    // Xử lý nút tùy chỉnh lộ trình
    const customizeBtn = modal.querySelector('.customize-path-btn');
    customizeBtn.addEventListener('click', function() {
        modal.remove();
        showCustomizationForm(pathId);
    });
    
    // Xử lý nút lưu kế hoạch học tập
    const saveBtn = modal.querySelector('.save-plan-btn');
    saveBtn.addEventListener('click', function() {
        saveLearningPlan(pathInfo);
        this.textContent = 'Đã lưu';
        this.disabled = true;
    });
}

/**
 * Hiển thị form tùy chỉnh lộ trình học tập
 */
function showCustomizationForm(pathId) {
    const pathInfo = getLearningPathById(pathId);
    if (!pathInfo) return;
    
    const path = pathInfo.path;
    
    // Tạo modal form tùy chỉnh
    const modalHtml = `
        <div class="customize-path-modal" id="customize-path-modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <div class="customize-path-header">
                    <h2>Tùy chỉnh lộ trình học tập</h2>
                    <p>Điều chỉnh lộ trình học tập theo nhu cầu cá nhân của bạn</p>
                </div>
                
                <form id="customize-plan-form">
                    <input type="hidden" id="path-select" value="${pathId}">
                    
                    <div class="form-group">
                        <label for="custom-title">Tiêu đề lộ trình:</label>
                        <input type="text" id="custom-title" value="${path.title}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="custom-description">Mô tả lộ trình:</label>
                        <textarea id="custom-description" rows="3" required>${path.description}</textarea>
                    </div>
                    
                    <div class="customize-steps">
                        <h3>Tùy chỉnh các bước:</h3>
                        
                        ${path.steps.map((step, index) => `
                            <div class="step-customization" data-step-id="${step.step_id}">
                                <h4>${step.title}</h4>
                                <p>${step.description}</p>
                                
                                <div class="form-group">
                                    <label>Hoạt động (thêm, xóa hoặc chỉnh sửa):</label>
                                    <div class="activities-container">
                                        ${step.activities.map((activity, actIndex) => `
                                            <div class="activity-item">
                                                <input type="text" class="activity-input" value="${activity}">
                                                <button type="button" class="remove-activity-btn">Xóa</button>
                                            </div>
                                        `).join('')}
                                        <button type="button" class="add-activity-btn" data-step-id="${step.step_id}">Thêm hoạt động</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary add-step-btn">Thêm bước mới</button>
                        <button type="submit" class="btn btn-primary">Tạo kế hoạch tùy chỉnh</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Thêm modal vào trang
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    const modal = document.getElementById('customize-path-modal');
    
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
    
    // Xử lý nút thêm hoạt động
    const addActivityBtns = modal.querySelectorAll('.add-activity-btn');
    addActivityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const stepId = this.getAttribute('data-step-id');
            const activitiesContainer = this.parentElement;
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <input type="text" class="activity-input" placeholder="Nhập hoạt động mới">
                <button type="button" class="remove-activity-btn">Xóa</button>
            `;
            
            activitiesContainer.insertBefore(activityItem, this);
            
            // Thêm sự kiện cho nút xóa
            const removeBtn = activityItem.querySelector('.remove-activity-btn');
            removeBtn.addEventListener('click', function() {
                activityItem.remove();
            });
        });
    });
    
    // Xử lý nút xóa hoạt động
    const removeActivityBtns = modal.querySelectorAll('.remove-activity-btn');
    removeActivityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
    
    // Xử lý nút thêm bước mới
    const addStepBtn = modal.querySelector('.add-step-btn');
    addStepBtn.addEventListener('click', function() {
        const stepsContainer = modal.querySelector('.customize-steps');
        const newStepId = Date.now(); // Tạo ID tạm thời
        
        const newStepHtml = `
            <div class="step-customization new-step" data-step-id="${newStepId}">
                <div class="form-group">
                    <label>Tiêu đề bước:</label>
                    <input type="text" class="step-title-input" placeholder="Nhập tiêu đề bước" required>
                </div>
                
                <div class="form-group">
                    <label>Mô tả bước:</label>
                    <textarea class="step-description-input" rows="2" placeholder="Nhập mô tả bước" required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Thời gian:</label>
                    <input type="text" class="step-duration-input" placeholder="Ví dụ: 6 tháng, 1 năm" required>
                </div>
                
                <div class="form-group">
                    <label>Hoạt động:</label>
                    <div class="activities-container">
                        <div class="activity-item">
                            <input type="text" class="activity-input" placeholder="Nhập hoạt động">
                            <button type="button" class="remove-activity-btn">Xóa</button>
                        </div>
                        <button type="button" class="add-activity-btn" data-step-id="${newStepId}">Thêm hoạt động</button>
                    </div>
                </div>
                
                <button type="button" class="remove-step-btn">Xóa bước này</button>
            </div>
        `;
        
        stepsContainer.insertAdjacentHTML('beforeend', newStepHtml);
        
        // Thêm sự kiện cho nút thêm hoạt động
        const newAddActivityBtn = stepsContainer.querySelector(`.add-activity-btn[data-step-id="${newStepId}"]`);
        newAddActivityBtn.addEventListener('click', function() {
            const activitiesContainer = this.parentElement;
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <input type="text" class="activity-input" placeholder="Nhập hoạt động mới">
                <button type="button" class="remove-activity-btn">Xóa</button>
            `;
            
            activitiesContainer.insertBefore(activityItem, this);
            
            // Thêm sự kiện cho nút xóa
            const removeBtn = activityItem.querySelector('.remove-activity-btn');
            removeBtn.addEventListener('click', function() {
                activityItem.remove();
            });
        });
        
        // Thêm sự kiện cho nút xóa hoạt động
        const newRemoveActivityBtns = stepsContainer.querySelectorAll(`.new-step[data-step-id="${newStepId}"] .remove-activity-btn`);
        newRemoveActivityBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                this.parentElement.remove();
            });
        });
        
        // Thêm sự kiện cho nút xóa bước
        const removeStepBtn = stepsContainer.querySelector(`.new-step[data-step-id="${newStepId}"] .remove-step-btn`);
        removeStepBtn.addEventListener('click', function() {
            this.parentElement.remove();
        });
    });
    
    // Xử lý form tùy chỉnh
    const customizeForm = modal.querySelector('#customize-plan-form');
    customizeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const customTitle = document.getElementById('custom-title').value;
        const customDescription = document.getElementById('custom-description').value;
        
        // Thu thập thông tin tùy chỉnh các bước
        const stepCustomizations = [];
        const existingStepElements = modal.querySelectorAll('.step-customization:not(.new-step)');
        
        existingStepElements.forEach(stepElement => {
            const stepId = parseInt(stepElement.getAttribute('data-step-id'));
            const activities = Array.from(stepElement.querySelectorAll('.activity-input'))
                .map(input => input.value)
                .filter(value => value.trim() !== '');
            
            if (activities.length > 0) {
                stepCustomizations.push({
                    step_id: stepId,
                    activities: activities
                });
            }
        });
        
        // Thu thập thông tin các bước mới
        const newSteps = [];
        const newStepElements = modal.querySelectorAll('.new-step');
        
        newStepElements.forEach(stepElement => {
            const title = stepElement.querySelector('.step-title-input').value;
            const description = stepElement.querySelector('.step-description-input').value;
            const duration = stepElement.querySelector('.step-duration-input').value;
            const activities = Array.from(stepElement.querySelectorAll('.activity-input'))
                .map(input => input.value)
                .filter(value => value.trim() !== '');
            
            if (title && description && duration && activities.length > 0) {
                newSteps.push({
                    title: title,
                    description: description,
                    duration: duration,
                    activities: activities,
                    resources: []
                });
            }
        });
        
        const customizations = {
            title: customTitle,
            description: customDescription,
            steps: stepCustomizations,
            newSteps: newSteps
        };
        
        createAndDisplayCustomPlan(pathId, customizations);
        modal.remove();
    });
}

/**
 * Tạo và hiển thị kế hoạch học tập cá nhân hóa
 */
function createAndDisplayPersonalizedPlan(careerId, preferences) {
    const personalizedPlan = createPersonalizedLearningPlan(careerId, preferences);
    if (!personalizedPlan) return;
    
    const career = getCareerDetails(careerId);
    if (!career) return;
    
    const planInfo = {
        career_id: careerId,
        career_title: career.title,
        path: personalizedPlan
    };
    
    displayLearningPlan(planInfo, 'Kế hoạch học tập cá nhân hóa');
}

/**
 * Tạo và hiển thị kế hoạch học tập tùy chỉnh
 */
function createAndDisplayCustomPlan(pathId, customizations) {
    const customPlan = createCustomLearningPlan(pathId, customizations);
    if (!customPlan) return;
    
    displayLearningPlan(customPlan, 'Kế hoạch học tập tùy chỉnh');
}

/**
 * Hiển thị kế hoạch học tập
 */
function displayLearningPlan(planInfo, planType) {
    const planContainer = document.getElementById('learning-plan-container');
    if (!planContainer) return;
    
    const path = planInfo.path;
    
    let html = `
        <div class="learning-plan" data-plan='${JSON.stringify(planInfo)}'>
            <div class="plan-header">
                <h2>${path.title}</h2>
                <span class="plan-type">${planType}</span>
                <p>${path.description}</p>
                <div class="plan-meta">
                    <span><i class="fas fa-briefcase"></i> Nghề nghiệp: ${planInfo.career_title}</span>
                    <span><i class="fas fa-clock"></i> Thời gian: ${path.duration}</span>
                    <span><i class="fas fa-list-ol"></i> Số bước: ${path.steps.length}</span>
                </div>
            </div>
            
            <div class="learning-plan-steps">
                ${path.steps.map((step, index) => `
                    <div class="learning-step">
                        <div class="step-header">
                            <div class="step-number">${index + 1}</div>
                            <h3>${step.title}</h3>
                        </div>
                        <div class="step-content">
                            <p>${step.description}</p>
                            <p><strong>Thời gian:</strong> ${step.duration}</p>
                            
                            <div class="step-activities">
                                <h4>Hoạt động</h4>
                                <ul>
                                    ${step.activities.map(activity => `<li>${activity}</li>`).join('')}
                                </ul>
                            </div>
                            
                            ${step.resources && step.resources.length > 0 ? `
                                <div class="step-resources">
                                    <h4>Tài nguyên</h4>
                                    <ul>
                                        ${step.resources.map(resource => `
                                            <li>
                                                <a href="${resource.url}" target="_blank">
                                                    ${resource.title} <span class="resource-type">(${getResourceTypeText(resource.type)})</span>
                                                </a>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="plan-actions">
                <button class="btn btn-secondary print-plan-btn">In kế hoạch</button>
                <button class="btn btn-primary save-plan-btn">Lưu kế hoạch học tập</button>
            </div>
        </div>
    `;
    
    planContainer.innerHTML = html;
    planContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Xử lý nút in kế hoạch
    const printBtn = planContainer.querySelector('.print-plan-btn');
    printBtn.addEventListener('click', function() {
        window.print();
    });
    
    // Xử lý nút lưu kế hoạch
    const saveBtn = planContainer.querySelector('.save-plan-btn');
    saveBtn.addEventListener('click', function() {
        saveLearningPlan(planInfo);
        this.textContent = 'Đã lưu';
        this.disabled = true;
    });
}

/**
 * Lưu kế hoạch học tập vào hồ sơ người dùng
 */
function saveLearningPlan(planInfo) {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!auth.isLoggedIn()) {
        if (confirm('Bạn cần đăng nhập để lưu kế hoạch học tập. Bạn có muốn đăng nhập ngay bây giờ không?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Lấy danh sách kế hoạch học tập đã lưu
    let savedPlans = JSON.parse(localStorage.getItem('savedLearningPlans') || '[]');
    
    // Tạo bản ghi kế hoạch học tập
    const planRecord = {
        id: Date.now(),
        career_id: planInfo.career_id,
        career_title: planInfo.career_title,
        path_id: planInfo.path.path_id,
        path_title: planInfo.path.title,
        savedAt: new Date().toISOString()
    };
    
    // Thêm kế hoạch vào danh sách
    savedPlans.push(planRecord);
    
    // Lưu danh sách mới
    localStorage.setItem('savedLearningPlans', JSON.stringify(savedPlans));
    
    // Hiển thị thông báo
    utils.showNotification('Đã lưu kế hoạch học tập vào hồ sơ của bạn!');
}

/**
 * Chuyển đổi loại tài nguyên thành văn bản hiển thị
 */
function getResourceTypeText(type) {
    const typeMap = {
        'book': 'Sách',
        'online_course': 'Khóa học trực tuyến',
        'website': 'Website',
        'video': 'Video',
        'tutorial': 'Hướng dẫn',
        'tool': 'Công cụ',
        'community': 'Cộng đồng',
        'platform': 'Nền tảng',
        'internship': 'Thực tập',
        'event': 'Sự kiện',
        'journal': 'Tạp chí',
        'organization': 'Tổ chức',
        'institution': 'Cơ sở đào tạo',
        'network': 'Mạng lưới',
        'guide': 'Hướng dẫn',
        'competition': 'Cuộc thi',
        'course': 'Khóa học'
    };
    
    return typeMap[type] || type;
}
