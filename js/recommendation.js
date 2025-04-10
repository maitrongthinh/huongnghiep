/**
 * Hệ thống gợi ý nghề nghiệp dựa trên kết quả bài kiểm tra tính cách
 */

// Lớp RecommendationSystem chính
class CareerRecommendationSystem {
    constructor() {
        this.careers = [];
        this.initialized = false;
    }

    // Khởi tạo hệ thống với dữ liệu nghề nghiệp
    async initialize() {
        try {
            const response = await fetch('../data/careers.json');
            const data = await response.json();
            this.careers = data.careers;
            this.initialized = true;
            console.log('Hệ thống gợi ý đã được khởi tạo với', this.careers.length, 'nghề nghiệp');
            return true;
        } catch (error) {
            console.error('Lỗi khi khởi tạo hệ thống gợi ý:', error);
            return false;
        }
    }

    // Kiểm tra xem hệ thống đã được khởi tạo chưa
    isInitialized() {
        return this.initialized;
    }

    // Lấy tất cả nghề nghiệp
    getAllCareers() {
        return this.careers;
    }

    // Lấy thông tin chi tiết về một nghề nghiệp theo ID
    getCareerById(id) {
        return this.careers.find(career => career.id === id);
    }

    // Lấy thông tin chi tiết về một nghề nghiệp theo tên
    getCareerByTitle(title) {
        return this.careers.find(career => career.title.toLowerCase() === title.toLowerCase());
    }

    // Tìm kiếm nghề nghiệp theo từ khóa
    searchCareers(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.careers.filter(career => 
            career.title.toLowerCase().includes(lowerKeyword) || 
            career.description.toLowerCase().includes(lowerKeyword)
        );
    }

    // Gợi ý nghề nghiệp dựa trên kết quả MBTI
    recommendByMBTI(mbtiType) {
        if (!this.initialized) return [];
        
        const matchedCareers = this.careers.filter(career => 
            career.personality_match.mbti.includes(mbtiType)
        );
        
        return this._sortByRelevance(matchedCareers);
    }

    // Gợi ý nghề nghiệp dựa trên kết quả Big Five
    recommendByBigFive(bigFiveResult) {
        if (!this.initialized) return [];
        
        // Chuyển đổi điểm số phần trăm thành mức độ (thấp, trung bình, cao)
        const getLevelFromScore = (score) => {
            if (score < 40) return "thấp";
            if (score < 70) return "trung bình";
            return "cao";
        };
        
        const personalityLevels = {
            openness: getLevelFromScore(bigFiveResult.openness),
            conscientiousness: getLevelFromScore(bigFiveResult.conscientiousness),
            extraversion: getLevelFromScore(bigFiveResult.extraversion),
            agreeableness: getLevelFromScore(bigFiveResult.agreeableness),
            neuroticism: getLevelFromScore(bigFiveResult.neuroticism)
        };
        
        // Tính điểm phù hợp cho mỗi nghề nghiệp
        const scoredCareers = this.careers.map(career => {
            let matchScore = 0;
            const match = career.personality_match.big_five;
            
            // Tính điểm cho mỗi đặc điểm tính cách
            if (match.openness === personalityLevels.openness) matchScore += 2;
            if (match.conscientiousness === personalityLevels.conscientiousness) matchScore += 2;
            if (match.extraversion === personalityLevels.extraversion) matchScore += 2;
            if (match.agreeableness === personalityLevels.agreeableness) matchScore += 2;
            if (match.neuroticism === personalityLevels.neuroticism) matchScore += 2;
            
            return { career, matchScore };
        });
        
        // Sắp xếp theo điểm phù hợp và trả về danh sách nghề nghiệp
        return scoredCareers
            .sort((a, b) => b.matchScore - a.matchScore)
            .filter(item => item.matchScore >= 6) // Chỉ lấy những nghề có ít nhất 3 đặc điểm phù hợp
            .map(item => item.career);
    }

    // Gợi ý nghề nghiệp dựa trên kết quả Holland Codes
    recommendByHolland(hollandResult) {
        if (!this.initialized) return [];
        
        // Lấy 3 mã Holland hàng đầu
        const topCodes = hollandResult.topCodes || 
                        (hollandResult.hollandCode ? hollandResult.hollandCode.split('') : []);
        
        // Tính điểm phù hợp cho mỗi nghề nghiệp
        const scoredCareers = this.careers.map(career => {
            let matchScore = 0;
            const careerCodes = career.personality_match.holland;
            
            // Tính điểm dựa trên sự trùng khớp và thứ tự của mã Holland
            topCodes.forEach((code, index) => {
                const codeUpper = code.toUpperCase();
                if (careerCodes.includes(codeUpper)) {
                    // Cho điểm cao hơn nếu mã trùng khớp ở vị trí ưu tiên cao hơn
                    matchScore += 3 - index;
                }
            });
            
            return { career, matchScore };
        });
        
        // Sắp xếp theo điểm phù hợp và trả về danh sách nghề nghiệp
        return scoredCareers
            .sort((a, b) => b.matchScore - a.matchScore)
            .filter(item => item.matchScore > 0)
            .map(item => item.career);
    }

    // Gợi ý nghề nghiệp dựa trên kết hợp các bài kiểm tra
    recommendCombined(mbtiType, bigFiveResult, hollandResult) {
        if (!this.initialized) return [];
        
        // Lấy các gợi ý riêng lẻ
        const mbtiRecommendations = this.recommendByMBTI(mbtiType);
        const bigFiveRecommendations = this.recommendByBigFive(bigFiveResult);
        const hollandRecommendations = this.recommendByHolland(hollandResult);
        
        // Tạo bản đồ điểm số cho mỗi nghề nghiệp
        const careerScores = new Map();
        
        // Hàm helper để thêm điểm cho mỗi nghề nghiệp
        const addScoreToCareer = (career, score) => {
            const id = career.id;
            if (careerScores.has(id)) {
                careerScores.set(id, careerScores.get(id) + score);
            } else {
                careerScores.set(id, score);
            }
        };
        
        // Thêm điểm cho các nghề nghiệp từ mỗi phương pháp gợi ý
        mbtiRecommendations.forEach((career, index) => {
            // Nghề nghiệp ở vị trí cao hơn nhận được điểm cao hơn
            addScoreToCareer(career, mbtiRecommendations.length - index);
        });
        
        bigFiveRecommendations.forEach((career, index) => {
            addScoreToCareer(career, bigFiveRecommendations.length - index);
        });
        
        hollandRecommendations.forEach((career, index) => {
            addScoreToCareer(career, hollandRecommendations.length - index);
        });
        
        // Tạo danh sách nghề nghiệp với điểm số
        const scoredCareers = [];
        careerScores.forEach((score, id) => {
            const career = this.getCareerById(parseInt(id));
            if (career) {
                scoredCareers.push({ career, score });
            }
        });
        
        // Sắp xếp theo điểm số và trả về danh sách nghề nghiệp
        return scoredCareers
            .sort((a, b) => b.score - a.score)
            .map(item => item.career);
    }

    // Gợi ý nghề nghiệp dựa trên kỹ năng
    recommendBySkills(skills) {
        if (!this.initialized || !skills || skills.length === 0) return [];
        
        const lowerSkills = skills.map(skill => skill.toLowerCase());
        
        // Tính điểm phù hợp cho mỗi nghề nghiệp
        const scoredCareers = this.careers.map(career => {
            let matchScore = 0;
            const careerSkills = career.skills.map(skill => skill.toLowerCase());
            
            // Tính số kỹ năng trùng khớp
            lowerSkills.forEach(skill => {
                if (careerSkills.some(careerSkill => careerSkill.includes(skill))) {
                    matchScore++;
                }
            });
            
            return { career, matchScore };
        });
        
        // Sắp xếp theo điểm phù hợp và trả về danh sách nghề nghiệp
        return scoredCareers
            .sort((a, b) => b.matchScore - a.matchScore)
            .filter(item => item.matchScore > 0)
            .map(item => item.career);
    }

    // Gợi ý nghề nghiệp dựa trên trình độ học vấn
    recommendByEducation(education) {
        if (!this.initialized || !education) return [];
        
        const lowerEducation = education.toLowerCase();
        
        // Tìm các nghề nghiệp có yêu cầu học vấn phù hợp
        const matchedCareers = this.careers.filter(career => 
            career.education.some(edu => edu.toLowerCase().includes(lowerEducation))
        );
        
        return this._sortByRelevance(matchedCareers);
    }

    // Gợi ý nghề nghiệp liên quan đến một nghề nghiệp cụ thể
    getRelatedCareers(careerId) {
        if (!this.initialized) return [];
        
        const career = this.getCareerById(careerId);
        if (!career || !career.related_careers) return [];
        
        return career.related_careers
            .map(id => this.getCareerById(id))
            .filter(career => career !== undefined);
    }

    // Phương thức helper để sắp xếp nghề nghiệp theo mức độ liên quan
    _sortByRelevance(careers) {
        // Trong triển khai thực tế, có thể thêm logic sắp xếp phức tạp hơn
        return careers;
    }
}

// Khởi tạo hệ thống gợi ý toàn cục
const recommendationSystem = new CareerRecommendationSystem();

// Hàm khởi tạo hệ thống gợi ý
async function initRecommendationSystem() {
    if (!recommendationSystem.isInitialized()) {
        return await recommendationSystem.initialize();
    }
    return true;
}

// Hàm gợi ý nghề nghiệp dựa trên kết quả MBTI
function getCareerRecommendationsByMBTI(mbtiType) {
    return recommendationSystem.recommendByMBTI(mbtiType);
}

// Hàm gợi ý nghề nghiệp dựa trên kết quả Big Five
function getCareerRecommendationsByBigFive(bigFiveResult) {
    return recommendationSystem.recommendByBigFive(bigFiveResult);
}

// Hàm gợi ý nghề nghiệp dựa trên kết quả Holland Codes
function getCareerRecommendationsByHolland(hollandResult) {
    return recommendationSystem.recommendByHolland(hollandResult);
}

// Hàm gợi ý nghề nghiệp dựa trên kết hợp các bài kiểm tra
function getCombinedCareerRecommendations(mbtiType, bigFiveResult, hollandResult) {
    return recommendationSystem.recommendCombined(mbtiType, bigFiveResult, hollandResult);
}

// Hàm tìm kiếm nghề nghiệp theo từ khóa
function searchCareers(keyword) {
    return recommendationSystem.searchCareers(keyword);
}

// Hàm lấy thông tin chi tiết về một nghề nghiệp
function getCareerDetails(id) {
    return recommendationSystem.getCareerById(id);
}

// Hàm lấy danh sách nghề nghiệp liên quan
function getRelatedCareers(careerId) {
    return recommendationSystem.getRelatedCareers(careerId);
}
