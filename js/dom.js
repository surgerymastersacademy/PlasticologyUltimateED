// js/dom.js (FINAL VERSION - v4 LAYOUT SUPPORT)

// --- 1. HEADER & NAVIGATION (New Sidebar/Mobile Nav) ---
export const appHeader = document.getElementById('app-header');
export const globalHomeBtn = document.getElementById('global-home-btn'); // Dashboard Title
export const headerUserAvatar = document.getElementById('header-user-avatar');
export const userNameDisplay = document.getElementById('user-name-display');
export const userProfileHeaderBtn = document.getElementById('user-profile-header-btn'); // Top Right Profile
export const radioBtn = document.getElementById('radio-btn');
export const radioCloseBtn = document.getElementById('radio-close-btn');
export const radioBannerContainer = document.getElementById('radio-banner-container');
export const announcementsBtn = document.getElementById('announcements-btn');
export const messengerBtn = document.getElementById('messenger-btn');
export const helpBtn = document.getElementById('help-btn'); // Tour button

// --- Sidebar Buttons (Desktop) ---
export const navHomeBtn = document.getElementById('nav-home-btn');
export const navLecturesBtn = document.getElementById('nav-lectures-btn');
export const navQbankBtn = document.getElementById('nav-qbank-btn');
export const navLearningBtn = document.getElementById('nav-learning-btn');
export const navMatchingBtn = document.getElementById('nav-matching-btn');
export const navTheoryBtn = document.getElementById('nav-theory-btn');
export const navOsceBtn = document.getElementById('nav-osce-btn');
export const navLibraryBtn = document.getElementById('nav-library-btn');
export const navPlannerBtn = document.getElementById('nav-planner-btn');
export const navNotesBtn = document.getElementById('nav-notes-btn');
export const navStatsBtn = document.getElementById('nav-stats-btn'); // Activity Log
export const navLeaderboardBtn = document.getElementById('nav-leaderboard-btn');
export const navLogoutBtn = document.getElementById('nav-logout-btn');

// --- Mobile Bottom Nav ---
export const mobileHomeBtn = document.getElementById('mobile-home-btn');
export const mobileQbankBtn = document.getElementById('mobile-qbank-btn');
export const mobileMenuBtn = document.getElementById('mobile-menu-btn');
export const mobileNotesBtn = document.getElementById('mobile-notes-btn');
export const mobileProfileBtn = document.getElementById('mobile-profile-btn');
export const mobileMenuModal = document.getElementById('mobile-menu-modal');

// --- 2. DASHBOARD (Welcome & Quick Actions) ---
// Note: main-menu-container is reused as the Dashboard container ID
export const mainMenuContainer = document.getElementById('main-menu-container'); 
export const streakContainer = document.getElementById('streak-container');
export const streakCount = document.getElementById('streak-count');
export const announcementBanner = document.getElementById('announcement-banner');
export const lastLectureRibbon = document.getElementById('last-lecture-ribbon');
export const lastQuizRibbon = document.getElementById('last-quiz-ribbon');

// Quick Action Buttons
export const quickLecturesBtn = document.getElementById('quick-lectures-btn');
export const quickQbankBtn = document.getElementById('quick-qbank-btn');
export const quickMatchingBtn = document.getElementById('quick-matching-btn');
export const quickLibraryBtn = document.getElementById('quick-library-btn');
export const quickOsceBtn = document.getElementById('quick-osce-btn');
export const quickTheoryBtn = document.getElementById('quick-theory-btn');

// --- 3. MAIN CONTAINERS (Features) ---
export const loginContainer = document.getElementById('login-container');
export const lecturesContainer = document.getElementById('lectures-container');
export const qbankContainer = document.getElementById('qbank-container');
export const matchingContainer = document.getElementById('matching-container');
export const libraryContainer = document.getElementById('library-container');
export const studyPlannerContainer = document.getElementById('study-planner-container');
export const notesContainer = document.getElementById('notes-container');
export const activityLogContainer = document.getElementById('activity-log-container');
export const leaderboardContainer = document.getElementById('leaderboard-container');
export const osceContainer = document.getElementById('osce-container');
export const learningModeContainer = document.getElementById('learning-mode-container');
export const theoryContainer = document.getElementById('theory-container');

// Full Screen Views (Quiz/Game)
export const quizContainer = document.getElementById('quiz-container');
export const osceQuizContainer = document.getElementById('osce-quiz-container');
export const learningModeViewer = document.getElementById('learning-mode-viewer');
export const theoryViewer = document.getElementById('theory-viewer');
export const listContainer = document.getElementById('list-container');

// --- 4. FEATURE SPECIFIC ELEMENTS ---

// Login
export const loginForm = document.getElementById('login-form');
export const loginLoader = document.getElementById('login-loader');
export const loginLoadingText = document.getElementById('login-loading-text');
export const loginError = document.getElementById('login-error');
export const usernameInput = document.getElementById('username');
export const passwordInput = document.getElementById('password');
export const loginSubmitBtn = document.getElementById('login-submit-btn');
export const showRegisterLink = document.getElementById('show-register-link');
export const freeTestBtn = document.getElementById('free-test-btn');
export const pwaInstallBanner = document.getElementById('pwa-install-banner');
export const pwaInstallBtn = document.getElementById('pwa-install-btn');

// Lectures
export const lecturesBackBtn = document.getElementById('lectures-back-btn');
export const lectureSearchInput = document.getElementById('lecture-search-input');
export const lecturesLoader = document.getElementById('lectures-loader');
export const lecturesList = document.getElementById('lectures-list');

// QBank
export const qbankBackBtn = document.getElementById('qbank-back-btn');
export const qbankSearchInput = document.getElementById('qbank-search-input');
export const qbankSearchBtn = document.getElementById('qbank-search-btn');
export const qbankSearchError = document.getElementById('qbank-search-error');
export const qbankSearchResultsContainer = document.getElementById('qbank-search-results-container');
export const qbankSearchResultsInfo = document.getElementById('qbank-search-results-info');
export const qbankSearchQCount = document.getElementById('qbank-search-q-count');
export const qbankStartSearchQuizBtn = document.getElementById('qbank-start-search-quiz-btn');
export const qbankClearSearchBtn = document.getElementById('qbank-clear-search-btn');
export const qbankMainContent = document.getElementById('qbank-main-content');

// QBank Tabs & Panels
export const qbankTabCreate = document.getElementById('qbank-tab-create');
export const qbankTabPractice = document.getElementById('qbank-tab-practice');
export const qbankTabBrowse = document.getElementById('qbank-tab-browse');
export const qbankPanelCreate = document.getElementById('qbank-panel-create');
export const qbankPanelPractice = document.getElementById('qbank-panel-practice');
export const qbankPanelBrowse = document.getElementById('qbank-panel-browse');

// QBank Mock & Simulation
export const loader = document.getElementById('loader');
export const loadingText = document.getElementById('loading-text');
export const mockQCountInput = document.getElementById('mock-q-count');
export const customTimerInput = document.getElementById('custom-timer-input');
export const toggleCustomOptionsBtn = document.getElementById('toggle-custom-options-btn');
export const customExamOptions = document.getElementById('custom-exam-options');
export const chapterSelectMock = document.getElementById('chapter-select-mock');
export const sourceSelectMock = document.getElementById('source-select-mock');
export const selectAllSourcesMock = document.getElementById('select-all-sources-mock');
export const selectAllChaptersMock = document.getElementById('select-all-chapters-mock');
export const startMockBtn = document.getElementById('start-mock-btn');
export const mockError = document.getElementById('mock-error');

// Simulation Mode (New)
export const toggleSimulationOptionsBtn = document.getElementById('toggle-simulation-options-btn');
export const simulationCustomOptions = document.getElementById('simulation-custom-options');
export const sourceSelectSim = document.getElementById('source-select-sim');
export const chapterSelectSim = document.getElementById('chapter-select-sim');
export const selectAllSourcesSim = document.getElementById('select-all-sources-sim');
export const selectAllChaptersSim = document.getElementById('select-all-chapters-sim');
export const startSimulationBtn = document.getElementById('start-simulation-btn');
export const simulationError = document.getElementById('simulation-error');

// QBank Practice & Browse
export const practiceMistakesBtn = document.getElementById('practice-mistakes-btn');
export const practiceBookmarkedBtn = document.getElementById('practice-bookmarked-btn');
export const browseByChapterBtn = document.getElementById('browse-by-chapter-btn');
export const browseBySourceBtn = document.getElementById('browse-by-source-btn');

// Quiz View (Active)
export const endQuizBtn = document.getElementById('end-quiz-btn');
export const quizTitle = document.getElementById('quiz-title');
export const timerDisplay = document.getElementById('timer');
export const navigatorBtn = document.getElementById('navigator-btn');
export const quizNoteBtn = document.getElementById('quiz-note-btn');
export const scoreProgressText = document.getElementById('score-progress-text');
export const scoreBarCorrect = document.getElementById('score-bar-correct');
export const scoreBarIncorrect = document.getElementById('score-bar-incorrect');
export const scoreBarAnswered = document.getElementById('score-bar-answered');
export const progressText = document.getElementById('progress-text');
export const sourceText = document.getElementById('source-text');
export const questionImageContainer = document.getElementById('question-image-container');
export const questionText = document.getElementById('question-text');
export const answerButtons = document.getElementById('answer-buttons-quiz');
export const questionContainer = document.getElementById('question-container');
export const controlsContainer = document.getElementById('controls-container');
export const previousBtn = document.getElementById('previous-btn');
export const bookmarkBtn = document.getElementById('bookmark-btn');
export const flagBtn = document.getElementById('flag-btn');
export const hintBtn = document.getElementById('hint-btn');
export const nextSkipBtn = document.getElementById('next-skip-btn');
export const hintText = document.getElementById('hint-text');
export const resultsContainer = document.getElementById('results-container');
export const resultsTitle = document.getElementById('results-title');
export const resultsScoreText = document.getElementById('results-score-text');
export const resultsHomeBtn = document.getElementById('results-home-btn');
export const restartBtn = document.getElementById('restart-btn');
export const reviewIncorrectBtn = document.getElementById('review-incorrect-btn');
export const reviewSimulationBtn = document.getElementById('review-simulation-btn');

// List Container (Generic Browse)
export const listBackBtn = document.getElementById('list-back-btn');
export const listTitle = document.getElementById('list-title');
export const listItems = document.getElementById('list-items');

// Matching Bank
export const matchingMenuContainer = document.getElementById('matching-menu-container');
export const matchingBackBtn = document.getElementById('matching-back-btn');
export const matchingSetCountInput = document.getElementById('matching-set-count');
export const matchingTimerInput = document.getElementById('matching-timer-input');
export const chapterSelectMatching = document.getElementById('chapter-select-matching');
export const sourceSelectMatching = document.getElementById('source-select-matching');
export const startMatchingBtn = document.getElementById('start-matching-btn');
export const matchingError = document.getElementById('matching-error');
export const matchingGameContainer = document.getElementById('matching-game-container');
export const endMatchingBtn = document.getElementById('end-matching-btn');
export const matchingProgress = document.getElementById('matching-progress');
export const matchingTimer = document.getElementById('matching-timer');
export const matchingScore = document.getElementById('matching-score');
export const matchingPremisesArea = document.getElementById('matching-premises-area');
export const matchingAnswersArea = document.getElementById('matching-answers-area');
export const matchingSubmitBtn = document.getElementById('matching-submit-btn');
export const matchingNextBtn = document.getElementById('matching-next-btn');

// Library
export const libraryBackBtn = document.getElementById('library-back-btn');
export const libraryLoader = document.getElementById('library-loader');
export const libraryList = document.getElementById('library-list');

// Leaderboard
export const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
export const leaderboardLoader = document.getElementById('leaderboard-loader');
export const currentUserRankDiv = document.getElementById('current-user-rank');
export const leaderboardList = document.getElementById('leaderboard-list');

// Planner
export const studyPlannerBackBtn = document.getElementById('study-planner-back-btn');
export const studyPlannerLoader = document.getElementById('study-planner-loader');
export const performanceInsightsContainer = document.getElementById('performance-insights-container');
export const strengthsList = document.getElementById('strengths-list');
export const weaknessesList = document.getElementById('weaknesses-list');
export const plannerDashboard = document.getElementById('planner-dashboard');
export const showCreatePlanModalBtn = document.getElementById('show-create-plan-modal-btn');
export const studyPlansList = document.getElementById('study-plans-list');
export const activePlanView = document.getElementById('active-plan-view');
export const activePlanName = document.getElementById('active-plan-name');
export const backToPlansDashboardBtn = document.getElementById('back-to-plans-dashboard-btn');
export const planDaysRemaining = document.getElementById('plan-days-remaining');
export const planTasksToday = document.getElementById('plan-tasks-today');
export const planProgressBar = document.getElementById('plan-progress-bar');
export const studyPlanDaysContainer = document.getElementById('study-plan-days-container');

// Notes & Activity
export const notesBackBtn = document.getElementById('notes-back-btn');
export const notesFilterQuizzes = document.getElementById('notes-filter-quizzes');
export const notesFilterLectures = document.getElementById('notes-filter-lectures');
export const notesFilterTheory = document.getElementById('notes-filter-theory');
export const notesList = document.getElementById('notes-list');
export const activityBackBtn = document.getElementById('activity-back-btn');
export const clearLogBtn = document.getElementById('clear-log-btn');
export const logFilterAll = document.getElementById('log-filter-all');
export const logFilterQuizzes = document.getElementById('log-filter-quizzes');
export const logFilterLectures = document.getElementById('log-filter-lectures');
export const allSummary = document.getElementById('all-summary');
export const allLecturesProgress = document.getElementById('all-lectures-progress');
export const allQuestionsProgress = document.getElementById('all-questions-progress');
export const quizSummary = document.getElementById('quiz-summary');
export const totalCorrectAnswers = document.getElementById('total-correct-answers');
export const totalIncorrectAnswers = document.getElementById('total-incorrect-answers');
export const overallAccuracy = document.getElementById('overall-accuracy');
export const lectureSummary = document.getElementById('lecture-summary');
export const lecturesViewedCount = document.getElementById('lectures-viewed-count');
export const chaptersStartedCount = document.getElementById('chapters-started-count');
export const activityChartCanvas = document.getElementById('activity-chart');
export const activityLogList = document.getElementById('activity-log-list');

// OSCE
export const osceBackBtn = document.getElementById('osce-back-btn');
export const startOsceSlayerBtn = document.getElementById('start-osce-slayer-btn');
export const osceCaseCountInput = document.getElementById('osce-case-count');
export const osceTimePerQInput = document.getElementById('osce-time-per-q');
export const toggleOsceOptionsBtn = document.getElementById('toggle-osce-options-btn');
export const customOsceOptions = document.getElementById('custom-osce-options');
export const chapterSelectOsce = document.getElementById('chapter-select-osce');
export const sourceSelectOsce = document.getElementById('source-select-osce');
export const startCustomOsceBtn = document.getElementById('start-custom-osce-btn');
export const osceError = document.getElementById('osce-error');
export const endOsceQuizBtn = document.getElementById('end-osce-quiz-btn');
export const osceQuizTitle = document.getElementById('osce-quiz-title');
export const osceTimer = document.getElementById('osce-timer');
export const osceScoreDisplay = document.getElementById('osce-score');
export const osceCaseTitle = document.getElementById('osce-case-title');
export const osceCaseImageContainer = document.getElementById('osce-case-image-container');
export const osceCaseDescription = document.getElementById('osce-case-description');
export const osceProgressText = document.getElementById('osce-progress-text');
export const osceQuestionImageContainer = document.getElementById('osce-question-image-container');
export const osceQuestionText = document.getElementById('osce-question-text');
export const osceAnswerArea = document.getElementById('osce-answer-area');
export const osceModelAnswerArea = document.getElementById('osce-model-answer-area');
export const osceSelfCorrectionArea = document.getElementById('osce-self-correction-area');
export const oscePreviousBtn = document.getElementById('osce-previous-btn');
export const osceNavigatorBtn = document.getElementById('osce-navigator-btn');
export const osceNextBtn = document.getElementById('osce-next-btn');

// Theory
export const theoryBackBtn = document.getElementById('theory-back-btn');
export const theoryControls = document.getElementById('theory-controls');
export const theorySearchInput = document.getElementById('theory-search-input');
export const theorySearchBtn = document.getElementById('theory-search-btn');
export const theoryFlashcardModeBtn = document.getElementById('theory-flashcard-mode-btn');
export const theoryExamModeBtn = document.getElementById('theory-exam-mode-btn');
export const theoryBrowseByChapterBtn = document.getElementById('theory-browse-by-chapter-btn');
export const theoryBrowseBySourceBtn = document.getElementById('theory-browse-by-source-btn');
export const theoryViewer = document.getElementById('theory-viewer');
export const theoryEndBtn = document.getElementById('theory-end-btn');
export const theoryTitle = document.getElementById('theory-title');
export const theoryTimer = document.getElementById('theory-timer');
export const theoryProgressText = document.getElementById('theory-progress-text');
export const theorySourceText = document.getElementById('theory-source-text');
export const theoryImgContainer = document.getElementById('theory-img-container');
export const theoryQuestionText = document.getElementById('theory-question-text');
export const theoryAnswerContainer = document.getElementById('theory-answer-container');
export const theoryAnswerText = document.getElementById('theory-answer-text');
export const theoryShowAnswerBtn = document.getElementById('theory-show-answer-btn');
export const theoryPrevBtn = document.getElementById('theory-prev-btn');
export const theoryNoteBtn = document.getElementById('theory-note-btn');
export const theoryStatusBtn = document.getElementById('theory-status-btn');
export const theoryNextBtn = document.getElementById('theory-next-btn');

// Learning Mode
export const learningModeControls = document.getElementById('learning-mode-controls');
export const learningModeBackBtn = document.getElementById('learning-mode-back-btn');
export const learningSearchInput = document.getElementById('learning-search-input');
export const learningSearchBtn = document.getElementById('learning-search-btn');
export const learningSearchError = document.getElementById('learning-search-error');
export const learningBrowseByChapterBtn = document.getElementById('learning-browse-by-chapter-btn');
export const learningBrowseBySourceBtn = document.getElementById('learning-browse-by-source-btn');
export const learningModeViewer = document.getElementById('learning-mode-viewer');
export const endLearningBtn = document.getElementById('end-learning-btn');
export const learningTitle = document.getElementById('learning-title');
export const learningProgressText = document.getElementById('learning-progress-text');
export const learningSourceText = document.getElementById('learning-source-text');
export const learningImageContainer = document.getElementById('learning-image-container');
export const learningQuestionText = document.getElementById('learning-question-text');
export const learningAnswerButtons = document.getElementById('learning-answer-buttons');
export const learningPreviousBtn = document.getElementById('learning-previous-btn');
export const learningNextBtn = document.getElementById('learning-next-btn');

// --- 5. MODALS ---
export const modalBackdrop = document.getElementById('modal-backdrop');
export const onboardingModal = document.getElementById('onboarding-modal');
export const startTourBtn = document.getElementById('start-tour-btn');
export const skipTourBtn = document.getElementById('skip-tour-btn');
export const tourTooltip = document.getElementById('tour-tooltip');
export const tourTitle = document.getElementById('tour-title');
export const tourStepCount = document.getElementById('tour-step-count');
export const tourText = document.getElementById('tour-text');
export const tourEndBtn = document.getElementById('tour-end-btn');
export const tourNextBtn = document.getElementById('tour-next-btn');

export const registrationModal = document.getElementById('registration-modal');
export const registrationForm = document.getElementById('registration-form');
export const registerName = document.getElementById('register-name');
export const registerUsername = document.getElementById('register-username');
export const registerEmail = document.getElementById('register-email');
export const registerMobile = document.getElementById('register-mobile');
export const registerPassword = document.getElementById('register-password');
export const registerConfirmPassword = document.getElementById('register-confirm-password');
export const registerCountry = document.getElementById('register-country');
export const registerStudyType = document.getElementById('register-study-type');
export const registerExamDate = document.getElementById('register-exam-date');
export const registrationError = document.getElementById('registration-error');
export const registrationSuccess = document.getElementById('registration-success');
export const registerCancelBtn = document.getElementById('register-cancel-btn');
export const registerSubmitBtn = document.getElementById('register-submit-btn');

export const confirmationModal = document.getElementById('confirmation-modal');
export const modalTitle = document.getElementById('modal-title');
export const modalText = document.getElementById('modal-text');
export const modalCancelBtn = document.getElementById('modal-cancel-btn');
export const modalConfirmBtn = document.getElementById('modal-confirm-btn');

export const questionNavigatorModal = document.getElementById('question-navigator-modal');
export const navigatorGrid = document.getElementById('navigator-grid');
export const navigatorCloseBtn = document.getElementById('navigator-close-btn');

export const osceNavigatorModal = document.getElementById('osce-navigator-modal');
export const osceNavigatorContent = document.getElementById('osce-navigator-content');
export const osceNavigatorCloseBtn = document.getElementById('osce-navigator-close-btn');

export const imageViewerModal = document.getElementById('image-viewer-modal');
export const modalImage = document.getElementById('modal-image');
export const imageViewerCloseBtn = document.getElementById('image-viewer-close-btn');

export const noteModal = document.getElementById('note-modal');
export const noteModalTitle = document.getElementById('note-modal-title');
export const noteTextarea = document.getElementById('note-textarea');
export const noteCancelBtn = document.getElementById('note-cancel-btn');
export const noteSaveBtn = document.getElementById('note-save-btn');

export const clearLogModal = document.getElementById('clear-log-modal');
export const clearQuizLogsBtn = document.getElementById('clear-quiz-logs-btn');
export const clearLectureLogsBtn = document.getElementById('clear-lecture-logs-btn');
export const clearAllLogsBtn = document.getElementById('clear-all-logs-btn');
export const clearLogCancelBtn = document.getElementById('clear-log-cancel-btn');

export const announcementsModal = document.getElementById('announcements-modal');
export const announcementsList = document.getElementById('announcements-list');
export const announcementsCloseBtn = document.getElementById('announcements-close-btn');

export const userCardModal = document.getElementById('user-card-modal');
export const userCardCloseBtn = document.getElementById('user-card-close-btn');
export const userAvatar = document.getElementById('user-avatar');
export const cardUserName = document.getElementById('card-user-name');
export const cardUserNickname = document.getElementById('card-user-nickname');
export const editProfileBtn = document.getElementById('edit-profile-btn');
export const profileDetailsView = document.getElementById('profile-details-view');
export const cardSubscriptionStatus = document.getElementById('card-subscription-status');
export const cardSubscriptionExpiry = document.getElementById('card-subscription-expiry');
export const cardQuizScore = document.getElementById('card-quiz-score');
export const cardExamDate = document.getElementById('card-exam-date');
export const cardDaysLeft = document.getElementById('card-days-left');
export const profileEditView = document.getElementById('profile-edit-view');
export const editNickname = document.getElementById('edit-nickname');
export const editExamDate = document.getElementById('edit-exam-date');
export const avatarSelectionGrid = document.getElementById('avatar-selection-grid');
export const profileEditError = document.getElementById('profile-edit-error');
export const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
export const saveProfileBtn = document.getElementById('save-profile-btn');

export const messengerModal = document.getElementById('messenger-modal');
export const messengerCloseBtn = document.getElementById('messenger-close-btn');
export const messagesList = document.getElementById('messages-list');
export const messageInput = document.getElementById('message-input');
export const sendMessageBtn = document.getElementById('send-message-btn');
export const messengerError = document.getElementById('messenger-error');

export const createPlanModal = document.getElementById('create-plan-modal');
export const newPlanName = document.getElementById('new-plan-name');
export const newPlanStartDate = document.getElementById('new-plan-start-date');
export const newPlanEndDate = document.getElementById('new-plan-end-date');
export const createPlanError = document.getElementById('create-plan-error');
export const cancelCreatePlanBtn = document.getElementById('cancel-create-plan-btn');
export const confirmCreatePlanBtn = document.getElementById('confirm-create-plan-btn');

export const iosInstallModal = document.getElementById('ios-install-modal');
export const iosInstallCloseBtn = document.getElementById('ios-install-close-btn');
