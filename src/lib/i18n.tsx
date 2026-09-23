import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useLanguageConfig } from "@/lib/language-config";

export type Lang = string;
/** Bilingual by default; extra languages are optional keys (ko, ja, zh...). */
export type Localized = { vi: string; en: string } & Partial<Record<string, string>>;

const STORAGE_KEY = "talenthub-lang";

const dict = {
  "nav.home": { vi: "Trang chủ", en: "Home" },
  "nav.jobs": { vi: "Việc làm", en: "Jobs" },
  "nav.about": { vi: "Về chúng tôi", en: "About us" },
  "nav.news": { vi: "Tin tức", en: "News" },
  "nav.contact": { vi: "Liên hệ", en: "Contact" },
  "admin.nav.news": { vi: "Tin tức", en: "News" },
  "admin.nav.users": { vi: "Người dùng", en: "Users" },
  "nav.admin": { vi: "Bảng điều khiển", en: "Dashboard" },
  "nav.apply": { vi: "Ứng tuyển ngay", en: "Apply now" },
  "brand.name": { vi: "TalentHub", en: "TalentHub" },
  "brand.tagline": {
    vi: "Hệ thống tuyển dụng doanh nghiệp",
    en: "Enterprise recruitment system",
  },

  "home.eyebrow": { vi: "Chúng tôi đang tuyển", en: "We are hiring" },
  "home.title": {
    vi: "Nơi những người giỏi nhất xây dựng điều đáng giá",
    en: "Where great people build things that matter",
  },
  "home.subtitle": {
    vi: "Hơn 400 đồng nghiệp tại Hà Nội, Đà Nẵng và TP. Hồ Chí Minh đang cùng nhau tạo ra sản phẩm phục vụ hàng triệu người dùng mỗi ngày.",
    en: "More than 400 colleagues across Hanoi, Da Nang and Ho Chi Minh City are building products used by millions every day.",
  },
  "home.search.keyword": {
    vi: "Vị trí, kỹ năng hoặc từ khóa",
    en: "Role, skill or keyword",
  },
  "home.search.button": { vi: "Tìm việc làm", en: "Search jobs" },
  "home.stats.openings": { vi: "Vị trí đang tuyển", en: "Open roles" },
  "home.stats.people": { vi: "Nhân sự toàn hệ thống", en: "People on the team" },
  "home.stats.offices": { vi: "Văn phòng", en: "Offices" },
  "home.stats.tenure": { vi: "Thâm niên trung bình", en: "Average tenure" },
  "home.culture.eyebrow": { vi: "Văn hóa", en: "Culture" },
  "home.culture.title": {
    vi: "Bốn nguyên tắc định hình cách chúng tôi làm việc",
    en: "Four principles that shape how we work",
  },
  "home.benefits.eyebrow": { vi: "Phúc lợi", en: "Benefits" },
  "home.benefits.title": {
    vi: "Chăm lo cho bạn và gia đình",
    en: "Looking after you and your family",
  },
  "home.jobs.eyebrow": { vi: "Vị trí nổi bật", en: "Featured roles" },
  "home.jobs.title": { vi: "Cơ hội đang mở", en: "Openings right now" },
  "home.jobs.all": { vi: "Xem tất cả vị trí", en: "See all roles" },
  "home.cta.title": {
    vi: "Không thấy vị trí phù hợp?",
    en: "Can't find the right role?",
  },
  "home.cta.body": {
    vi: "Gửi hồ sơ của bạn, đội ngũ tuyển dụng sẽ liên hệ khi có vị trí phù hợp.",
    en: "Send us your profile and our team will reach out when something fits.",
  },
  "home.cta.button": { vi: "Gửi hồ sơ tự do", en: "Submit an open application" },

  "jobs.title": { vi: "Vị trí đang tuyển", en: "Open positions" },
  "jobs.subtitle": {
    vi: "Lọc theo ngành nghề, địa điểm và hình thức làm việc để tìm vị trí phù hợp.",
    en: "Filter by industry, location and work type to find your fit.",
  },
  "jobs.filter.department": { vi: "Ngành nghề", en: "Industry" },
  "jobs.filter.location": { vi: "Nơi làm việc", en: "Work location" },
  "jobs.sort.label": { vi: "Sắp xếp", en: "Sort by" },
  "jobs.sort.relevant": { vi: "Liên quan nhất", en: "Most relevant" },
  "jobs.sort.newest": { vi: "Mới nhất", en: "Newest" },
  "jobs.sort.salaryDesc": { vi: "Lương cao → thấp", en: "Salary high to low" },
  "jobs.sort.salaryAsc": { vi: "Lương thấp → cao", en: "Salary low to high" },
  "jobs.filter.type": { vi: "Hình thức", en: "Work type" },
  "jobs.filter.all": { vi: "Tất cả", en: "All" },
  "jobs.filter.reset": { vi: "Xóa bộ lọc", en: "Clear filters" },
  "jobs.count": { vi: "vị trí phù hợp", en: "matching roles" },
  "jobs.empty": {
    vi: "Không có vị trí nào khớp với bộ lọc hiện tại.",
    en: "No roles match the current filters.",
  },
  "jobs.detail": { vi: "Xem chi tiết", en: "View details" },
  "jobs.deadline": { vi: "Hạn nộp", en: "Deadline" },
  "jobs.posted": { vi: "Đăng ngày", en: "Posted" },
  "jobs.salary": { vi: "Mức lương", en: "Salary" },
  "jobs.back": { vi: "Quay lại danh sách", en: "Back to all jobs" },
  "jobs.section.about": { vi: "Mô tả công việc", en: "About the role" },
  "jobs.section.requirements": { vi: "Yêu cầu", en: "Requirements" },
  "jobs.section.benefits": { vi: "Quyền lợi", en: "What you get" },
  "jobs.notfound": {
    vi: "Không tìm thấy vị trí này.",
    en: "This position could not be found.",
  },

  "apply.title": { vi: "Ứng tuyển vị trí", en: "Apply for" },
  "apply.step.profile": { vi: "Thông tin cá nhân", en: "Your details" },
  "apply.step.cv": { vi: "Hồ sơ & CV", en: "Resume & CV" },
  "apply.step.extra": { vi: "Câu hỏi riêng cho vị trí", en: "Role questions" },
  "apply.field.fullName": { vi: "Họ và tên", en: "Full name" },
  "apply.field.email": { vi: "Email", en: "Email" },
  "apply.field.phone": { vi: "Số điện thoại", en: "Phone number" },
  "apply.field.location": { vi: "Nơi ở hiện tại", en: "Current location" },
  "apply.field.linkedin": { vi: "LinkedIn (không bắt buộc)", en: "LinkedIn (optional)" },
  "apply.field.coverLetter": { vi: "Thư giới thiệu", en: "Cover letter" },
  "apply.field.coverLetterHint": {
    vi: "Vì sao bạn phù hợp với vị trí này?",
    en: "Why are you a good fit for this role?",
  },
  "apply.cv.label": { vi: "Tải lên CV", en: "Upload your CV" },
  "apply.cv.hint": {
    vi: "Kéo thả tệp vào đây hoặc bấm để chọn. PDF, DOC, DOCX — tối đa 5MB.",
    en: "Drag and drop a file here or click to browse. PDF, DOC, DOCX — max 5MB.",
  },
  "apply.cv.remove": { vi: "Xóa tệp", en: "Remove file" },
  "apply.cv.invalidType": {
    vi: "Chỉ chấp nhận tệp PDF, DOC hoặc DOCX.",
    en: "Only PDF, DOC or DOCX files are accepted.",
  },
  "apply.cv.tooLarge": {
    vi: "Tệp vượt quá 5MB.",
    en: "The file is larger than 5MB.",
  },
  "apply.cv.required": { vi: "Vui lòng tải lên CV.", en: "Please upload your CV." },
  "apply.submit": { vi: "Gửi hồ sơ ứng tuyển", en: "Submit application" },
  "apply.required": { vi: "Bắt buộc", en: "Required" },
  "apply.success.title": { vi: "Đã nhận hồ sơ của bạn", en: "Application received" },
  "apply.success.body": {
    vi: "Cảm ơn bạn. Đội ngũ tuyển dụng sẽ phản hồi trong vòng 5 ngày làm việc.",
    en: "Thank you. Our recruiting team will respond within 5 working days.",
  },
  "apply.success.more": { vi: "Xem các vị trí khác", en: "Browse other roles" },
  "apply.demoNote": {
    vi: "Đây là bản giao diện mẫu — hồ sơ chưa được lưu trữ.",
    en: "This is a design preview — applications are not stored yet.",
  },

  "about.title": { vi: "Về chúng tôi", en: "About us" },
  "about.subtitle": {
    vi: "Một đội ngũ tin vào sản phẩm tốt, quy trình gọn và con người tử tế.",
    en: "A team that believes in good products, lean process and decent people.",
  },
  "about.story.title": { vi: "Câu chuyện", en: "Our story" },
  "about.team.title": { vi: "Đội ngũ dẫn dắt", en: "Leadership team" },
  "about.life.title": { vi: "Môi trường làm việc", en: "Life at TalentHub" },

  "admin.title": { vi: "Tổng quan tuyển dụng", en: "Recruiting overview" },
  "admin.subtitle": {
    vi: "Cập nhật đến hôm nay",
    en: "Updated as of today",
  },
  "admin.nav.overview": { vi: "Tổng quan", en: "Overview" },
  "admin.nav.jobs": { vi: "Tin tuyển dụng", en: "Job postings" },
  "admin.nav.candidates": { vi: "Ứng viên", en: "Candidates" },
  "admin.backToSite": { vi: "Về cổng việc làm", en: "Back to career site" },
  "admin.kpi.openJobs": { vi: "Tin đang tuyển", en: "Open postings" },
  "admin.kpi.newCandidates": { vi: "Ứng viên mới (7 ngày)", en: "New candidates (7d)" },
  "admin.kpi.interviews": { vi: "Phỏng vấn tuần này", en: "Interviews this week" },
  "admin.kpi.hires": { vi: "Đã tuyển trong quý", en: "Hires this quarter" },
  "admin.chart.title": { vi: "Lượt ứng tuyển theo tuần", en: "Applications per week" },
  "admin.funnel.title": { vi: "Phễu tuyển dụng", en: "Hiring funnel" },
  "admin.activity.title": { vi: "Hoạt động gần đây", en: "Recent activity" },
  "admin.jobs.title": { vi: "Tin tuyển dụng", en: "Job postings" },
  "admin.jobs.new": { vi: "Tạo tin mới", en: "New posting" },
  "admin.jobs.edit": { vi: "Chỉnh sửa tin", en: "Edit posting" },
  "admin.jobs.search": { vi: "Tìm theo tên vị trí", en: "Search by job title" },
  "admin.jobs.col.title": { vi: "Vị trí", en: "Position" },
  "admin.jobs.col.department": { vi: "Ngành nghề", en: "Industry" },
  "admin.jobs.col.location": { vi: "Địa điểm", en: "Location" },
  "admin.jobs.col.applicants": { vi: "Ứng viên", en: "Applicants" },
  "admin.jobs.col.status": { vi: "Trạng thái", en: "Status" },
  "admin.jobs.col.deadline": { vi: "Hạn nộp", en: "Deadline" },
  "admin.candidates.title": { vi: "Ứng viên", en: "Candidates" },
  "admin.candidates.search": { vi: "Tìm theo tên hoặc email", en: "Search by name or email" },
  "admin.candidates.col.name": { vi: "Ứng viên", en: "Candidate" },
  "admin.candidates.col.job": { vi: "Vị trí ứng tuyển", en: "Applied for" },
  "admin.candidates.col.stage": { vi: "Giai đoạn", en: "Stage" },
  "admin.candidates.col.rating": { vi: "Đánh giá", en: "Rating" },
  "admin.candidates.col.applied": { vi: "Ngày nộp", en: "Applied" },
  "admin.candidates.filter.job": { vi: "Vị trí", en: "Position" },
  "admin.candidates.filter.stage": { vi: "Giai đoạn", en: "Stage" },
  "admin.candidates.profile": { vi: "Hồ sơ ứng viên", en: "Candidate profile" },
  "admin.candidates.cv": { vi: "Tệp CV", en: "CV file" },
  "admin.candidates.notes": { vi: "Ghi chú nội bộ", en: "Internal notes" },
  "admin.candidates.changeStage": { vi: "Chuyển giai đoạn", en: "Move to stage" },
  "admin.candidates.empty": {
    vi: "Không có ứng viên nào khớp bộ lọc.",
    en: "No candidates match the filters.",
  },
  "admin.demoNote": {
    vi: "Dữ liệu minh họa — chưa kết nối cơ sở dữ liệu.",
    en: "Sample data — not connected to a database yet.",
  },

  "admin.nav.settings": { vi: "Cấu hình giao diện", en: "Site settings" },
  "admin.nav.forms": { vi: "Biểu mẫu ứng tuyển", en: "Application form" },
  "settings.title": { vi: "Cấu hình giao diện", en: "Site settings" },
  "settings.subtitle": {
    vi: "Chọn bố cục trang chủ, màu sắc, hình ảnh và nội dung hiển thị.",
    en: "Choose the home layout, colours, images and copy.",
  },
  "settings.layout.title": { vi: "Bố cục trang chủ", en: "Home layout" },
  "settings.layout.current": { vi: "Đang dùng", en: "In use" },
  "settings.palette.title": { vi: "Bảng màu", en: "Colour palette" },
  "settings.palette.custom": { vi: "Tự chọn màu", en: "Custom colours" },
  "settings.palette.primary": { vi: "Màu chủ đạo", en: "Primary colour" },
  "settings.palette.accent": { vi: "Màu nhấn", en: "Accent colour" },
  "settings.images.title": { vi: "Hình ảnh", en: "Images" },
  "settings.images.hero": { vi: "Ảnh bìa trang chủ", en: "Home cover image" },
  "settings.images.culture": { vi: "Ảnh văn hóa công ty", en: "Culture image" },
  "settings.images.logo": { vi: "Logo", en: "Logo" },
  "settings.images.customUrl": { vi: "Hoặc dán đường dẫn ảnh", en: "Or paste an image URL" },
  "settings.copy.title": { vi: "Nội dung trang chủ", en: "Home copy" },
  "settings.copy.brand": { vi: "Tên thương hiệu", en: "Brand name" },
  "settings.copy.eyebrow": { vi: "Dòng chữ nhỏ phía trên", en: "Eyebrow line" },
  "settings.copy.headline": { vi: "Tiêu đề chính", en: "Headline" },
  "settings.copy.subtitle": { vi: "Mô tả ngắn", en: "Short description" },
  "settings.copy.cta": { vi: "Chữ trên nút tìm việc", en: "Search button label" },
  "settings.tab.brand": { vi: "Thương hiệu", en: "Brand" },
  "settings.brand.title": { vi: "Nhận diện thương hiệu", en: "Brand identity" },
  "settings.brand.name": { vi: "Tên công ty", en: "Company name" },
  "settings.brand.tagline": { vi: "Slogan ngắn", en: "Short tagline" },
  "settings.brand.logo": { vi: "Logo công ty", en: "Company logo" },
  "settings.brand.upload": { vi: "Tải logo lên", en: "Upload logo" },
  "settings.brand.uploadHint": {
    vi: "PNG, SVG hoặc JPG, tối đa 1MB.",
    en: "PNG, SVG or JPG, up to 1MB.",
  },
  "settings.brand.uploadTooLarge": {
    vi: "Tệp quá lớn, vui lòng chọn ảnh dưới 1MB.",
    en: "File is too large, please pick an image under 1MB.",
  },
  "settings.brand.uploadInvalid": {
    vi: "Định dạng không hỗ trợ. Dùng PNG, SVG hoặc JPG.",
    en: "Unsupported format. Use PNG, SVG or JPG.",
  },
  "settings.brand.removeLogo": { vi: "Bỏ logo, dùng chữ cái đầu", en: "Remove logo, use initials" },
  "settings.brand.preview": { vi: "Xem trước", en: "Preview" },
  "settings.brand.quota": {
    vi: "Không đủ dung lượng lưu trên trình duyệt. Hãy dùng logo nhẹ hơn.",
    en: "Not enough browser storage. Please use a lighter logo.",
  },
  "settings.tab.layout": { vi: "Bố cục", en: "Layout" },
  "settings.tab.palette": { vi: "Màu sắc", en: "Colours" },
  "settings.tab.images": { vi: "Hình ảnh", en: "Images" },
  "settings.tab.content": { vi: "Nội dung chữ", en: "Content" },
  "settings.block.hero": { vi: "Phần mở đầu", en: "Hero section" },
  "settings.block.stats": { vi: "Dải số liệu", en: "Stats band" },
  "settings.block.culture": { vi: "Văn hóa", en: "Culture" },
  "settings.block.benefits": { vi: "Phúc lợi", en: "Benefits" },
  "settings.block.jobs": { vi: "Việc làm nổi bật", en: "Featured jobs" },
  "settings.block.cta": { vi: "Kêu gọi ứng tuyển", en: "Call to action" },
  "settings.block.show": { vi: "Hiện trên trang chủ", en: "Show on home page" },
  "settings.field.eyebrow": { vi: "Dòng chữ nhỏ", en: "Eyebrow line" },
  "settings.field.title": { vi: "Tiêu đề", en: "Heading" },
  "settings.field.description": { vi: "Mô tả (không bắt buộc)", en: "Description (optional)" },
  "settings.field.body": { vi: "Nội dung", en: "Body text" },
  "settings.field.label": { vi: "Nhãn", en: "Label" },
  "settings.field.value": { vi: "Con số", en: "Value" },
  "settings.field.icon": { vi: "Biểu tượng", en: "Icon" },
  "settings.field.allLabel": { vi: "Chữ liên kết xem tất cả", en: "See-all link label" },
  "settings.field.count": { vi: "Số vị trí hiển thị", en: "Number of roles shown" },
  "settings.field.buttonLabel": { vi: "Chữ trên nút", en: "Button label" },
  "settings.field.autoCount": {
    vi: "Tự đếm số vị trí đang tuyển",
    en: "Count open roles automatically",
  },
  "settings.item.add": { vi: "Thêm mục", en: "Add item" },
  "settings.item.remove": { vi: "Xóa mục", en: "Remove item" },
  "settings.item.up": { vi: "Lên", en: "Move up" },
  "settings.item.down": { vi: "Xuống", en: "Move down" },
  "settings.item.new": { vi: "Mục mới", en: "New item" },
  "settings.preview": { vi: "Xem trang chủ", en: "View home page" },
  "settings.reset": { vi: "Khôi phục mặc định", en: "Restore defaults" },
  "settings.saved": { vi: "Đã lưu cấu hình giao diện.", en: "Site settings saved." },
  "settings.resetDone": { vi: "Đã khôi phục mặc định.", en: "Defaults restored." },
  "settings.storageNote": {
    vi: "Cấu hình lưu trên trình duyệt này.",
    en: "Settings are stored in this browser.",
  },

  "settings.tab.jobsPage": { vi: "Trang việc làm", en: "Jobs page" },
  "settings.jobs.filterLayout": { vi: "Kiểu bộ lọc", en: "Filter layout" },
  "settings.jobs.layout.sidebar": { vi: "Cột bộ lọc bên trái", en: "Left filter column" },
  "settings.jobs.layout.bar": { vi: "Thanh lọc ngang", en: "Horizontal filter bar" },
  "settings.jobs.filters": { vi: "Bộ lọc hiển thị", en: "Visible filters" },
  "settings.jobs.card": { vi: "Thông tin trên thẻ tin", en: "Job card details" },
  "settings.jobs.pageSize": { vi: "Số tin mỗi trang", en: "Jobs per page" },

  "jobs.filter.title": { vi: "Bộ lọc", en: "Filters" },
  "jobs.filter.salary": { vi: "Mức lương", en: "Salary" },
  "jobs.filter.experience": { vi: "Kinh nghiệm", en: "Experience" },
  "admin.nav.taxonomies": { vi: "Danh mục", en: "Catalogues" },
  "taxonomy.title": { vi: "Danh mục dùng chung", en: "Shared catalogues" },
  "taxonomy.note": {
    vi: "Khai báo sẵn để chọn nhanh khi đăng tin. Danh mục lưu trên trình duyệt này.",
    en: "Predefined options for job postings. Stored in this browser.",
  },
  "taxonomy.departments": { vi: "Ngành nghề", en: "Industries" },
  "taxonomy.workTypes": { vi: "Hình thức làm việc", en: "Work types" },
  "taxonomy.salaries": { vi: "Mức lương", en: "Salary ranges" },
  "taxonomy.experiences": { vi: "Kinh nghiệm", en: "Experience levels" },
  "taxonomy.locations": { vi: "Nơi làm việc", en: "Work locations" },
  "taxonomy.add": { vi: "Thêm mục", en: "Add item" },
  "taxonomy.empty": { vi: "Chưa có mục nào.", en: "No items yet." },
  "taxonomy.usage": { vi: "tin đang dùng", en: "postings use this" },
  "taxonomy.reset": { vi: "Khôi phục danh mục mặc định", en: "Restore default catalogues" },
  "taxonomy.resetDone": {
    vi: "Đã khôi phục danh mục mặc định.",
    en: "Default catalogues restored.",
  },
  "taxonomy.moveUp": { vi: "Lên trên", en: "Move up" },
  "taxonomy.moveDown": { vi: "Xuống dưới", en: "Move down" },
  "taxonomy.remove": { vi: "Xóa mục", en: "Remove item" },
  "taxonomy.custom": { vi: "Nhập giá trị khác…", en: "Enter a custom value…" },
  "taxonomy.saveToCatalogue": { vi: "Lưu vào danh mục", en: "Save to catalogue" },
  "taxonomy.saved": { vi: "Đã thêm vào danh mục.", en: "Added to the catalogue." },
  "settings.jobs.filter.salary": { vi: "Mức lương", en: "Salary" },
  "settings.jobs.filter.experience": { vi: "Kinh nghiệm", en: "Experience" },
  "jobs.filter.level": { vi: "Cấp bậc", en: "Level" },
  "jobs.filter.status": { vi: "Trạng thái", en: "Status" },
  "jobs.filter.keyword": { vi: "Từ khóa", en: "Keyword" },
  "jobs.found": { vi: "Tìm thấy", en: "Found" },
  "jobs.featured": { vi: "Nổi bật", en: "Featured" },
  "jobs.loadMore": { vi: "Xem thêm vị trí", en: "Load more roles" },
  "jobs.headcount": { vi: "Số lượng tuyển", en: "Openings" },
  "jobs.experience": { vi: "Kinh nghiệm", en: "Experience" },
  "jobs.languages": { vi: "Ngôn ngữ", en: "Languages" },
  "jobs.contact": { vi: "Liên hệ tuyển dụng", en: "Recruiter contact" },
  "jobs.status.open": { vi: "Đang tuyển", en: "Open" },
  "jobs.status.paused": { vi: "Tạm dừng", en: "Paused" },
  "jobs.status.closed": { vi: "Đã đóng", en: "Closed" },

  "admin.jobs.delete": { vi: "Xóa tin", en: "Delete posting" },
  "admin.jobs.deleted": { vi: "Đã xóa tin tuyển dụng.", en: "Job posting deleted." },
  "admin.jobs.saved": { vi: "Đã lưu tin tuyển dụng.", en: "Job posting saved." },
  "admin.jobs.reset": { vi: "Khôi phục tin mẫu", en: "Restore sample jobs" },
  "admin.jobs.resetDone": { vi: "Đã khôi phục tin mẫu.", en: "Sample jobs restored." },
  "admin.jobs.col.featured": { vi: "Nổi bật", en: "Featured" },
  "admin.jobs.group.basic": { vi: "Thông tin chung", en: "Basics" },
  "admin.jobs.group.details": { vi: "Chi tiết tuyển dụng", en: "Hiring details" },
  "admin.jobs.group.content": { vi: "Nội dung tin", en: "Posting content" },
  "admin.jobs.field.summary": { vi: "Mô tả ngắn", en: "Short summary" },
  "admin.jobs.field.description": { vi: "Mô tả công việc", en: "Job description" },
  "admin.jobs.field.requirements": { vi: "Yêu cầu", en: "Requirements" },
  "admin.jobs.field.benefits": { vi: "Quyền lợi", en: "Benefits" },
  "admin.jobs.field.salary": { vi: "Mức lương", en: "Salary" },
  "admin.jobs.field.workType": { vi: "Hình thức", en: "Work type" },
  "admin.jobs.field.level": { vi: "Cấp bậc", en: "Level" },
  "admin.jobs.field.headcount": { vi: "Số lượng tuyển", en: "Headcount" },
  "admin.jobs.field.experience": { vi: "Kinh nghiệm", en: "Experience" },
  "admin.jobs.field.languages": { vi: "Ngôn ngữ", en: "Languages" },
  "admin.jobs.field.contactName": { vi: "Người phụ trách", en: "Recruiter name" },
  "admin.jobs.field.contactEmail": { vi: "Email liên hệ", en: "Contact email" },
  "admin.jobs.field.featured": { vi: "Đánh dấu nổi bật", en: "Mark as featured" },
  "admin.jobs.storageNote": {
    vi: "Tin tuyển dụng lưu trên trình duyệt này.",
    en: "Job postings are stored in this browser.",
  },
  "common.vi": { vi: "Tiếng Việt", en: "Vietnamese" },
  "common.en": { vi: "Tiếng Anh", en: "English" },
  "common.close": { vi: "Đóng", en: "Close" },

  "common.save": { vi: "Lưu", en: "Save" },
  "common.cancel": { vi: "Hủy", en: "Cancel" },
  "common.download": { vi: "Tải xuống", en: "Download" },
  "footer.rights": { vi: "Bảo lưu mọi quyền.", en: "All rights reserved." },
  "footer.links": { vi: "Liên kết nhanh", en: "Quick links" },
  "footer.contact": { vi: "Liên hệ", en: "Contact" },
  "company.title": { vi: "Thông tin công ty", en: "Company information" },
  "company.intro": { vi: "Giới thiệu ngắn", en: "Short introduction" },
  "company.locations": { vi: "Địa chỉ / chi nhánh", en: "Addresses / offices" },
  "company.location.name": { vi: "Tên chi nhánh", en: "Office name" },
  "company.location.address": { vi: "Địa chỉ", en: "Address" },
  "company.location.add": { vi: "Thêm địa chỉ", en: "Add address" },
  "company.email": { vi: "Email tuyển dụng", en: "Careers email" },
  "company.phone": { vi: "Số điện thoại", en: "Phone number" },
  "company.website": { vi: "Website", en: "Website" },
  "company.legalName": { vi: "Tên pháp nhân", en: "Legal name" },
  "company.taxId": { vi: "Mã số thuế", en: "Tax ID" },
  "company.social": { vi: "Mạng xã hội", en: "Social links" },
  "company.copyright": { vi: "Dòng bản quyền (tùy chọn)", en: "Copyright line (optional)" },
  "company.optional": {
    vi: "Để trống những mục không muốn hiển thị.",
    en: "Leave blank any field you do not want to show.",
  },
  "company.social.note": {
    vi: "Icon mạng xã hội chỉ hiển thị khi có đường dẫn.",
    en: "Social icons only appear when a link is filled in.",
  },
  "home.social.title": { vi: "Kết nối với chúng tôi", en: "Connect with us" },

  "settings.tab.languages": { vi: "Ngôn ngữ", en: "Languages" },
  "languages.title": { vi: "Ngôn ngữ hiển thị & nhập liệu", en: "Display & input languages" },
  "languages.desc": {
    vi: "Chọn các ngôn ngữ dùng cho toàn hệ thống. Mỗi ngôn ngữ sẽ là một tab khi nhập nội dung.",
    en: "Pick the languages used across the system. Each one becomes a tab when entering content.",
  },
  "languages.fallback": { vi: "Ngôn ngữ mặc định", en: "Default language" },
  "languages.required": { vi: "Luôn bật", en: "Always on" },
  "admin.jobs.field.locations": { vi: "Nơi làm việc", en: "Work locations" },
  "admin.jobs.field.locationsHint": {
    vi: "Chọn một hoặc nhiều nơi làm việc.",
    en: "Select one or more work locations.",
  },
  "admin.jobs.field.locationCustom": { vi: "Thêm nơi làm việc khác", en: "Add another location" },
} satisfies Record<string, Localized>;

export type TranslationKey = keyof typeof dict;

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  tr: (value: Localized) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { enabled, fallback } = useLanguageConfig();
  const [lang, setLangState] = useState<Lang>("vi");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && enabled.includes(stored)) setLangState(stored);
    else setLangState(fallback);
  }, [enabled, fallback]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key) => {
        const entry = dict[key] as Localized;
        return entry[lang] || entry[fallback] || entry.vi || entry.en;
      },
      tr: (value) => {
        if (!value) return "";
        return value[lang] || value[fallback] || value.vi || value.en || "";
      },
    }),
    [lang, fallback, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
