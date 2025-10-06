// js/dom.js (FINAL AND COMPLETE VERSION)

// This file contains references to all DOM elements used in the application.

export const globalHeader = document.getElementById('global-header');
export const globalHomeBtn = document.getElementById('global-home-btn');
export const logoutBtn = document.getElementById('logout-btn');
export const activityLogBtn = document.getElementById('activity-log-btn');
export const notesBtn = document.getElementById('notes-btn');
export const announcementsBtn = document.getElementById('announcements-btn');
export const userNameDisplay = document.getElementById('user-name-display');
export const headerUserAvatar = document.getElementById('header-user-avatar');
export const userProfileHeaderBtn = document.getElementById('user-profile-header-btn');
export const loginContainer = document.getElementById('login-container');
export const mainMenuContainer = document.getElementById('main-menu-container');
export const lecturesContainer = document.getElementById('lectures-container');
export const qbankContainer = document.getElementById('qbank-container');
export const listContainer = document.getElementById('list-container');
export const quizContainer = document.getElementById('quiz-container');
export const activityLogContainer = document.getElementById('activity-log-container');
export const notesContainer = document.getElementById('notes-container');
export const libraryContainer = document.getElementById('library-container');
export const leaderboardContainer = document.getElementById('leaderboard-container');
export const osceContainer = document.getElementById('osce-container');
export const osceQuizContainer = document.getElementById('osce-quiz-container');
export const learningModeContainer = document.getElementById('learning-mode-container');
export const studyPlannerContainer = document.getElementById('study-planner-container');
export const theoryContainer = document.getElementById('theory-container');

// Login Form
export const loginForm = document.getElementById('login-form');
export const usernameInput = document.getElementById('username-input');
export const passwordInput = document.getElementById('password-input');
export const loginError = document.getElementById('login-error');
export const loginSubmitBtn = document.getElementById('login-submit-btn');

// Main Menu
export const lecturesBtn = document.getElementById('lectures-btn');
export const qbankBtn = document.getElementById('qbank-btn');
export const radioBtn = document.getElementById('radio-btn');
export const libraryBtn = document.getElementById('library-btn');
export const osceBtn = document.getElementById('osce-btn');
export const leaderboardBtn = document.getElementById('leaderboard-btn');
export const plannerBtn = document.getElementById('planner-btn');
export const lastLectureRibbon = document.getElementById('last-lecture-ribbon');
export const lastQuizRibbon = document.getElementById('last-quiz-ribbon');
export const learningModeBtn = document.getElementById('learning-mode-btn');
export const theoryModeBtn = document.getElementById('theory-mode-btn');

// Lectures
export const lectureSearchInput = document.getElementById('lecture-search-input');
export const lecturesList = document.getElementById('lectures-list');

// QBank
export const mockExamBtn = document.getElementById('mock-exam-btn');
export const simulationExamBtn = document.getElementById('simulation-exam-btn');
export const browseChapterBtn = document.getElementById('browse-chapter-btn');
export const browseSourceBtn = document.getElementById('browse-source-btn');
export const qbankSearchInput = document.getElementById('qbank-search-input');
export const qbankSearchResults = document.getElementById('qbank-search-results');

// List (Browse)
export const listTitle = document.getElementById('list-title');
export const listItems = document.getElementById('list-items');

// Quiz
export const quizHeader = document.getElementById('quiz-header');
export const quizTitle = document.getElementById('quiz-title');
export const quizTimer = document.getElementById('quiz-timer');
export const quizScore = document.getElementById('quiz-score');
export const progressBar = document.getElementById('progress-bar');
export const progressText = document.getElementById('progress-text');
export const questionCard = document.getElementById('question-card');
export const questionText = document.getElementById('question-text');
export const questionImageContainer = document.getElementById('question-image-container');
export const answerOptions = document.getElementById('answer-options');
export const quizNavigation = document.getElementById('quiz-navigation');
export const prevQuestionBtn = document.getElementById('prev-question-btn');
export const nextQuestionBtn = document.getElementById('next-question-btn');
export const hintBtn = document.getElementById('hint-btn');
export const flagBtn = document.getElementById('flag-btn');
export const bookmarkBtn = document.getElementById('bookmark-btn');
export const noteTakingBtn = document.getElementById('note-taking-btn');
export const navigatorBtn = document.getElementById('navigator-btn');
export const rationaleContainer = document.getElementById('rationale-container');
export const rationaleText = document.getElementById('rationale-text');
export const resultsContainer = document.getElementById('quiz-results-container');
export const finalScore = document.getElementById('final-score');
export const finalPercentage = document.getElementById('final-percentage');
export const restartQuizBtn = document.getElementById('restart-quiz-btn');
export const reviewMistakesBtn = document.getElementById('review-mistakes-btn');
export const backToMenuBtn = document.getElementById('back-to-menu-btn');

// Activity Log
export const activityLogList = document.getElementById('activity-log-list');
export const activityChart = document.getElementById('activity-chart');
export const allSummary = document.getElementById('all-summary');
export const quizSummary = document.getElementById('quiz-summary');
export const lectureSummary = document.getElementById('lecture-summary');
export const clearLogBtn = document.getElementById('clear-log-btn');

// Notes
export const notesList = document.getElementById('notes-list');

// Library
export const libraryList = document.getElementById('library-list');

// Leaderboard
export const leaderboardList = document.getElementById('leaderboard-list');
export const currentUserRankDiv = document.getElementById('current-user-rank-div');
export const leaderboardLoader = document.getElementById('leaderboard-loader');

// OSCE
export const osceSlayerBtn = document.getElementById('osce-slayer-btn');
export const customOsceBtn = document.getElementById('custom-osce-btn');
export const osceCaseCount = document.getElementById('osce-case-count');
export const chapterSelectOsce = document.getElementById('chapter-select-osce');
export const sourceSelectOsce = document.getElementById('source-select-osce');
export const osceError = document.getElementById('osce-error');
export const osceQuizTitle = document.getElementById('osce-quiz-title');
export const osceTimer = document.getElementById('osce-timer');
export const osceScore = document.getElementById('osce-score');
export const osceTotal = document.getElementById('osce-total');
export const osceCaseDetails = document.getElementById('osce-case-details');
export const osceCaseTitle = document.getElementById('osce-case-title');
export const osceCaseDescription = document.getElementById('osce-case-description');
export const osceCaseImage = document.getElementById('osce-case-image');
export const osceCaseAudio = document.getElementById('osce-case-audio');
export const osceQuestionArea = document.getElementById('osce-question-area');
export const osceProgressText = document.getElementById('osce-progress-text');
export const osceQuestionText = document.getElementById('osce-question-text');
export const osceAnswerOptions = document.getElementById('osce-answer-options');
export const osceEssayContainer = document.getElementById('osce-essay-container');
export const osceEssayAnswer = document.getElementById('osce-essay-answer');
export const osceNavigation = document.getElementById('osce-navigation');
export const oscePrevBtn = document.getElementById('osce-prev-btn');
export const osceNextBtn = document.getElementById('osce-next-btn');
export const osceNavigatorBtn = document.getElementById('osce-navigator-btn');
export const osceResultsContainer = document.getElementById('osce-results-container');

// Learning Mode
export const learningModeControls = document.getElementById('learning-mode-controls');
export const learningModeViewer = document.getElementById('learning-mode-viewer');
export const learningBrowseAllBtn = document.getElementById('learning-browse-all-btn');
export const learningStudyMistakesBtn = document.getElementById('learning-study-mistakes-btn');
export const learningStudyBookmarkedBtn = document.getElementById('learning-study-bookmarked-btn');
export const learningSearchInput = document.getElementById('learning-search-input');
export const learningTitle = document.getElementById('learning-title');
export const learningProgress = document.getElementById('learning-progress');
export const learningCard = document.getElementById('learning-card');
export const learningQuestion = document.getElementById('learning-question');
export const learningImageContainer = document.getElementById('learning-image-container');
export const learningShowAnswerBtn = document.getElementById('learning-show-answer-btn');
export const learningAnswerContainer = document.getElementById('learning-answer-container');
export const learningAnswer = document.getElementById('learning-answer');
export const learningRationale = document.getElementById('learning-rationale');
export const learningPrevBtn = document.getElementById('learning-prev-btn');
export const learningNextBtn = document.getElementById('learning-next-btn');

// Study Planner
export const studyPlannerLoader = document.getElementById('study-planner-loader');
export const plannerDashboard = document.getElementById('planner-dashboard');
export const createNewPlanBtn = document.getElementById('create-new-plan-btn');
export const planList = document.getElementById('plan-list');
export const activePlanView = document.getElementById('active-plan-view');
export const planName = document.getElementById('plan-name');
export const planDateRange = document.getElementById('plan-date-range');
export const backToPlansBtn = document.getElementById('back-to-plans-btn');
export const calendarGrid = document.getElementById('calendar-grid');
export const performanceInsightsContainer = document.getElementById('performance-insights-container');
export const strengthsList = document.getElementById('strengths-list');
export const weaknessesList = document.getElementById('weaknesses-list');

// Theory Bank
export const theoryControls = document.getElementById('theory-controls');
export const theoryViewer = document.getElementById('theory-viewer');
export const theoryFlashcardModeBtn = document.getElementById('theory-flashcard-mode-btn');
export const theoryExamModeBtn = document.getElementById('theory-exam-mode-btn');
export const theoryBrowseByChapterBtn = document.getElementById('theory-browse-by-chapter-btn');
export const theoryBrowseBySourceBtn = document.getElementById('theory-browse-by-source-btn');
export const theorySearchInput = document.getElementById('theory-search-input');
export const theorySearchBtn = document.getElementById('theory-search-btn');
export const theorySessionTitle = document.getElementById('theory-session-title');
export const theoryTimerContainer = document.getElementById('theory-timer-container');
export const theoryTimer = document.getElementById('theory-timer');
export const theoryProgress = document.getElementById('theory-progress');
export const theoryQuestionText = document.getElementById('theory-question-text');
export const theoryShowAnswerBtn = document.getElementById('theory-show-answer-btn');
export const theoryStatusNotCoveredBtn = document.getElementById('theory-status-not-covered-btn');
export const theoryStatusPartiallyCoveredBtn = document.getElementById('theory-status-partially-covered-btn');
export const theoryStatusFullyCoveredBtn = document.getElementById('theory-status-fully-covered-btn');
export const theoryNoteBtn = document.getElementById('theory-note-btn');
export const theoryAnswerContainer = document.getElementById('theory-answer-container');
export const theoryAnswerText = document.getElementById('theory-answer-text');
export const theoryKeywords = document.getElementById('theory-keywords');
export const theoryPrevBtn = document.getElementById('theory-prev-btn');
export const theoryNextBtn = document.getElementById('theory-next-btn');

// --- NEW: Matching Bank Elements ---
export const matchingModeBtn = document.getElementById('matching-mode-btn');
export const matchingMenuContainer = document.getElementById('matching-menu-container');
export const matchingContainer = document.getElementById('matching-container');
export const matchingSetCount = document.getElementById('matching-set-count');
export const matchingTimerInput = document.getElementById('matching-timer-input');
export const chapterSelectMatching = document.getElementById('chapter-select-matching');
export const sourceSelectMatching = document.getElementById('source-select-matching');
export const startMatchingExamBtn = document.getElementById('start-matching-exam-btn');
export const matchingError = document.getElementById('matching-error');
export const matchingExamTitle = document.getElementById('matching-exam-title');
export const matchingTimer = document.getElementById('matching-timer');
export const matchingScore = document.getElementById('matching-score');
export const matchingTotal = document.getElementById('matching-total');
export const premisesContainer = document.getElementById('premises-container');
export const answersContainer = document.getElementById('answers-container');
export const matchingCheckAnswersBtn = document.getElementById('matching-check-answers-btn');
export const matchingNextSetBtn = document.getElementById('matching-next-set-btn');
export const matchingSetIndicator = document.getElementById('matching-set-indicator');


// Modals
export const modalBackdrop = document.getElementById('modal-backdrop');
export const confirmationModal = document.getElementById('confirmation-modal');
export const modalTitle = document.getElementById('modal-title');
export const modalMessage = document.getElementById('modal-message');
export const modalCustomContent = document.getElementById('modal-custom-content');
export const modalButtons = document.getElementById('modal-buttons');
export const modalCancelBtn = document.getElementById('modal-cancel-btn');
export const modalConfirmBtn = document.getElementById('modal-confirm-btn');
export const imageViewerModal = document.getElementById('image-viewer-modal');
export const imageViewerCloseBtn = document.getElementById('image-viewer-close-btn');
export const modalImage = document.getElementById('modal-image');
export const noteModal = document.getElementById('note-modal');
export const noteModalTitle = document.getElementById('note-modal-title');
export const noteTextarea = document.getElementById('note-textarea');
export const noteCancelBtn = document.getElementById('note-cancel-btn');
export const noteSaveBtn = document.getElementById('note-save-btn');
export const questionNavigatorModal = document.getElementById('question-navigator-modal');
export const navigatorCloseBtn = document.getElementById('navigator-close-btn');
export const navigatorGrid = document.getElementById('navigator-grid');
export const osceNavigatorModal = document.getElementById('osce-navigator-modal');
export const osceNavigatorCloseBtn = document.getElementById('osce-navigator-close-btn');
export const osceNavigatorContent = document.getElementById('osce-navigator-content');
export const clearLogModal = document.getElementById('clear-log-modal');
export const clearLogCancelBtn = document.getElementById('clear-log-cancel-btn');
export const clearLogQuizBtn = document.getElementById('clear-log-quiz-btn');
export const clearLogAllBtn = document.getElementById('clear-log-all-btn');
export const announcementsModal = document.getElementById('announcements-modal');
export const announcementsCloseBtn = document.getElementById('announcements-close-btn');
export const announcementsList = document.getElementById('announcements-list');

// User Card / Profile Modal
export const userCardModal = document.getElementById('user-card-modal');
export const userCardCloseBtn = document.getElementById('user-card-close-btn');
export const cardUserAvatar = document.getElementById('card-user-avatar');
export const changeAvatarBtn = document.getElementById('change-avatar-btn');
export const userCardView = document.getElementById('user-card-view');
export const cardUserName = document.getElementById('card-user-name');
export const cardUserNickname = document.getElementById('card-user-nickname');
export const cardQuizScore = document.getElementById('card-quiz-score');
export const cardDaysLeft = document.getElementById('card-days-left');
export const userCardEdit = document.getElementById('user-card-edit');
export const editNickname = document.getElementById('edit-nickname');
export const editExamDate = document.getElementById('edit-exam-date');
export const editProfileBtn = document.getElementById('edit-profile-btn');
export const saveProfileBtn = document.getElementById('save-profile-btn');
export const messengerBtn = document.getElementById('messenger-btn');

// Messenger Modal
export const messengerModal = document.getElementById('messenger-modal');
export const messengerCloseBtn = document.getElementById('messenger-close-btn');
export const messengerBody = document.getElementById('messenger-body');
export const messageInput = document.getElementById('message-input');
export const sendMessageBtn = document.getElementById('send-message-btn');
export const messengerError = document.getElementById('messenger-error');

// Create Plan Modal
export const createPlanModal = document.getElementById('create-plan-modal');
export const newPlanName = document.getElementById('new-plan-name');
export const newPlanStartDate = document.getElementById('new-plan-start-date');
export const newPlanEndDate = document.getElementById('new-plan-end-date');
export const createPlanError = document.getElementById('create-plan-error');
export const cancelCreatePlanBtn = document.getElementById('cancel-create-plan-btn');
export const confirmCreatePlanBtn = document.getElementById('confirm-create-plan-btn');

// Registration Modal
export const registrationModal = document.getElementById('registration-modal');
export const registrationForm = document.getElementById('registration-form');
export const showRegisterLink = document.getElementById('show-register-link');
export const registerCancelBtn = document.getElementById('register-cancel-btn');
export const registerSubmitBtn = document.getElementById('register-submit-btn');
export const registrationError = document.getElementById('registration-error');
export const registrationSuccess = document.getElementById('registration-success');
export const registerName = document.getElementById('register-name');
export const registerUsername = document.getElementById('register-username');
export const registerEmail = document.getElementById('register-email');
export const registerMobile = document.getElementById('register-mobile');
export const registerPassword = document.getElementById('register-password');
export const registerConfirmPassword = document.getElementById('register-confirm-password');
export const registerCountry = document.getElementById('register-country');
export const registerStudyType = document.getElementById('register-study-type');
export const registerExamDate = document.getElementById('register-exam-date');

// Subscription Status in User Card
export const cardSubscriptionStatus = document.getElementById('card-subscription-status');
export const cardSubscriptionExpiry = document.getElementById('card-subscription-expiry');
