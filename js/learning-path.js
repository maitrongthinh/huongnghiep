/**
 * Hệ thống tạo kế hoạch học tập cá nhân hóa
 */

// Lớp LearningPathGenerator chính
class LearningPathGenerator {
    constructor() {
        this.learningPaths = [];
        this.initialized = false;
    }

    // Khởi tạo hệ thống với dữ liệu lộ trình học tập
    async initialize() {
        try {
            const response = await fetch('../data/learning-paths.json');
            const data = await response.json();
            this.learningPaths = data.learning_paths;
            this.initialized = true;
            console.log('Hệ thống tạo kế hoạch học tập đã được khởi tạo với', this.learningPaths.length, 'lộ trình nghề nghiệp');
            return true;
        } catch (error) {
            console.error('Lỗi khi khởi tạo hệ thống tạo kế hoạch học tập:', error);
            return false;
        }
    }

    // Kiểm tra xem hệ thống đã được khởi tạo chưa
    isInitialized() {
        return this.initialized;
    }

    // Lấy tất cả lộ trình học tập
    getAllLearningPaths() {
        return this.learningPaths;
    }

    // Lấy lộ trình học tập cho một nghề nghiệp cụ thể
    getLearningPathsForCareer(careerId) {
        const careerPath = this.learningPaths.find(path => path.career_id === careerId);
        return careerPath ? careerPath.paths : [];
    }

    // Lấy thông tin chi tiết về một lộ trình học tập cụ thể
    getLearningPathById(pathId) {
        for (const careerPath of this.learningPaths) {
            const path = careerPath.paths.find(p => p.path_id === pathId);
            if (path) {
                return {
                    career_id: careerPath.career_id,
                    career_title: careerPath.career_title,
                    path: path
                };
            }
        }
        return null;
    }

    // Tạo kế hoạch học tập cá nhân hóa dựa trên nghề nghiệp và sở thích
    createPersonalizedLearningPlan(careerId, preferences) {
        if (!this.initialized) return null;
        
        // Lấy lộ trình học tập cho nghề nghiệp
        const careerPaths = this.getLearningPathsForCareer(careerId);
        if (!careerPaths || careerPaths.length === 0) return null;
        
        // Nếu không có sở thích cụ thể, trả về lộ trình đầu tiên
        if (!preferences) return careerPaths[0];
        
        // Chọn lộ trình phù hợp nhất dựa trên sở thích
        let bestPath = careerPaths[0];
        let bestScore = 0;
        
        for (const path of careerPaths) {
            let score = 0;
            
            // Tính điểm dựa trên thời gian học tập
            if (preferences.duration === 'short' && path.duration.includes('1-2')) {
                score += 2;
            } else if (preferences.duration === 'medium' && path.duration.includes('3-4')) {
                score += 2;
            } else if (preferences.duration === 'long' && (path.duration.includes('4') || path.duration.includes('5') || path.duration.includes('6'))) {
                score += 2;
            }
            
            // Tính điểm dựa trên phương thức học tập
            if (preferences.method === 'formal' && path.title.includes('Đại học')) {
                score += 3;
            } else if (preferences.method === 'self' && (path.title.includes('Tự học') || path.title.includes('Chuyển ngành'))) {
                score += 3;
            }
            
            // Cập nhật lộ trình tốt nhất
            if (score > bestScore) {
                bestScore = score;
                bestPath = path;
            }
        }
        
        return bestPath;
    }

    // Tạo kế hoạch học tập tùy chỉnh dựa trên lộ trình có sẵn
    createCustomLearningPlan(pathId, customizations) {
        if (!this.initialized) return null;
        
        // Lấy lộ trình gốc
        const pathInfo = this.getLearningPathById(pathId);
        if (!pathInfo) return null;
        
        const originalPath = pathInfo.path;
        
        // Tạo bản sao của lộ trình để tùy chỉnh
        const customPath = JSON.parse(JSON.stringify(originalPath));
        
        // Áp dụng các tùy chỉnh
        if (customizations) {
            // Tùy chỉnh tiêu đề
            if (customizations.title) {
                customPath.title = customizations.title;
            }
            
            // Tùy chỉnh mô tả
            if (customizations.description) {
                customPath.description = customizations.description;
            }
            
            // Tùy chỉnh các bước
            if (customizations.steps) {
                for (const stepCustomization of customizations.steps) {
                    const stepIndex = customPath.steps.findIndex(step => step.step_id === stepCustomization.step_id);
                    if (stepIndex !== -1) {
                        // Cập nhật hoạt động
                        if (stepCustomization.activities) {
                            customPath.steps[stepIndex].activities = stepCustomization.activities;
                        }
                        
                        // Cập nhật tài nguyên
                        if (stepCustomization.resources) {
                            customPath.steps[stepIndex].resources = stepCustomization.resources;
                        }
                        
                        // Cập nhật thời gian
                        if (stepCustomization.duration) {
                            customPath.steps[stepIndex].duration = stepCustomization.duration;
                        }
                    }
                }
            }
            
            // Thêm các bước mới
            if (customizations.newSteps) {
                // Tìm step_id lớn nhất hiện tại
                const maxStepId = Math.max(...customPath.steps.map(step => step.step_id));
                
                // Thêm các bước mới với step_id tăng dần
                for (let i = 0; i < customizations.newSteps.length; i++) {
                    const newStep = customizations.newSteps[i];
                    newStep.step_id = maxStepId + i + 1;
                    customPath.steps.push(newStep);
                }
                
                // Sắp xếp lại các bước theo step_id
                customPath.steps.sort((a, b) => a.step_id - b.step_id);
            }
        }
        
        return {
            career_id: pathInfo.career_id,
            career_title: pathInfo.career_title,
            path: customPath
        };
    }

    // Tạo kế hoạch học tập hoàn toàn mới
    createNewLearningPath(careerTitle, pathData) {
        if (!pathData) return null;
        
        // Tạo ID mới cho lộ trình
        const newPathId = this._generateNewPathId();
        
        // Tạo lộ trình mới
        const newPath = {
            path_id: newPathId,
            title: pathData.title || `Lộ trình học ${careerTitle}`,
            description: pathData.description || `Lộ trình học tập cá nhân hóa cho ${careerTitle}`,
            duration: pathData.duration || "Tùy chỉnh",
            steps: []
        };
        
        // Thêm các bước
        if (pathData.steps && Array.isArray(pathData.steps)) {
            for (let i = 0; i < pathData.steps.length; i++) {
                const step = pathData.steps[i];
                newPath.steps.push({
                    step_id: i + 1,
                    title: step.title || `Bước ${i + 1}`,
                    description: step.description || "",
                    duration: step.duration || "Tùy chỉnh",
                    activities: step.activities || [],
                    resources: step.resources || []
                });
            }
        }
        
        return newPath;
    }

    // Phương thức helper để tạo ID mới cho lộ trình
    _generateNewPathId() {
        // Tìm path_id lớn nhất hiện tại
        let maxPathId = 0;
        for (const careerPath of this.learningPaths) {
            for (const path of careerPath.paths) {
                if (path.path_id > maxPathId) {
                    maxPathId = path.path_id;
                }
            }
        }
        
        return maxPathId + 1;
    }
}

// Khởi tạo hệ thống tạo kế hoạch học tập toàn cục
const learningPathGenerator = new LearningPathGenerator();

// Hàm khởi tạo hệ thống tạo kế hoạch học tập
async function initLearningPathGenerator() {
    if (!learningPathGenerator.isInitialized()) {
        return await learningPathGenerator.initialize();
    }
    return true;
}

// Hàm lấy lộ trình học tập cho một nghề nghiệp
function getLearningPathsForCareer(careerId) {
    return learningPathGenerator.getLearningPathsForCareer(careerId);
}

// Hàm lấy thông tin chi tiết về một lộ trình học tập
function getLearningPathById(pathId) {
    return learningPathGenerator.getLearningPathById(pathId);
}

// Hàm tạo kế hoạch học tập cá nhân hóa
function createPersonalizedLearningPlan(careerId, preferences) {
    return learningPathGenerator.createPersonalizedLearningPlan(careerId, preferences);
}

// Hàm tạo kế hoạch học tập tùy chỉnh
function createCustomLearningPlan(pathId, customizations) {
    return learningPathGenerator.createCustomLearningPlan(pathId, customizations);
}

// Hàm tạo kế hoạch học tập hoàn toàn mới
function createNewLearningPath(careerTitle, pathData) {
    return learningPathGenerator.createNewLearningPath(careerTitle, pathData);
}
