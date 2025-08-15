document.addEventListener('DOMContentLoaded', () => {
    // --- URL FOR GOOGLE SHEETS ---
    // تأكد من تحديث هذا الرابط بالرابط الذي حصلت عليه بعد نشر Google Apps Script
    const API_URL = 'https://script.google.com/macros/s/AKfycbzx8gRgbYZw8Rrg348q2dlsRd7yQ9IXUNUPBDUf-Q5Wb9LntLuKY-ozmnbZOOuQsDU_3w/exec'; // تأكد من تحديث هذا الرابط بالرابط الصحيح بعد النشر

    // --- START: NEW SIMULATION SETTINGS ---
    const SIMULATION_Q_COUNT = 100; // The number of questions for the simulation
    const SIMULATION_TOTAL_TIME_MINUTES = 120; // The total time in minutes for the simulation
    // --- END: NEW SIMULATION SETTINGS ---

    // --- REFACTORED: Centralized Application State ---
    const appState = {
        // Content Data
        allQuestions: [],
        allOsceCases: [],
        allOsceQuestions: [],
        groupedLectures: {},
        mcqBooks: [],
        allAnnouncements: [],
        userRoles: {}, // ADDED: To store user roles/permissions
        allChaptersNames: [], // ADDED: To store all chapter names for study planner

        // User Data
        currentUser: null,
        userCardData: null, // ADDED: To store user's profile card data
        viewedLectures: new Set(),
        bookmarkedQuestions: new Set(),
        fullActivityLog: [],
        userQuizNotes: [],
        userLectureNotes: [],
        userMessages: [], // ADDED: To store user's messages
        studyPlannerData: null, // ADDED: To store user's study plan

        // Navigation
        navigationHistory: [],

        // Current Quiz State
        currentQuiz: {
            questions: [],
            originalQuestions: [],
            userAnswers: [],
            originalUserAnswers: [],
            currentQuestionIndex: 0,
            score: 0,
            timerInterval: null,
            simulationTimerInterval: null, // ADDED
            flaggedIndices: new Set(),
            isReviewMode: false,
            isSimulationMode: false, // ADDED
            isPracticingMistakes: false,
            timePerQuestion: 45, // Default time
        },

        // Current OSCE State
        currentOsce: {
            cases: [],
            caseIndex: 0,
            questionIndex: 0,
            timerInterval: null,
            userAnswers: {},
            score: 0,
            totalQuestions: 0,
        },

        // ADDED: Current Learning Mode State
        currentLearning: {
            questions: [],
            currentIndex: 0,
            title: ''
        },

        // UI State
        activityChartInstance: null,
        currentNote: { type: null, itemId: null, itemTitle: null },
        modalConfirmAction: null,
        qbankSearchResults: [], // To store search results
    };

    const DEFAULT_TIME_PER_QUESTION = 45;

    // --- DOM ELEMENTS ---
    const globalHeader = document.getElementById('global-header');
    const globalHomeBtn = document.getElementById('global-home-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const activityLogBtn = document.getElementById('activity-log-btn');
    const notesBtn = document.getElementById('notes-btn');
    const announcementsBtn = document.getElementById('announcements-btn');
    const userNameDisplay = document.getElementById('user-name-display');
    const headerUserAvatar = document.getElementById('header-user-avatar'); // ADDED
    const userProfileHeaderBtn = document.getElementById('user-profile-header-btn'); // ADDED
    const loginContainer = document.getElementById('login-container');
    const mainMenuContainer = document.getElementById('main-menu-container');
    const lecturesContainer = document.getElementById('lectures-container');
    const qbankContainer = document.getElementById('qbank-container');
    const listContainer = document.getElementById('list-container');
    const quizContainer = document.getElementById('quiz-container');
    const activityLogContainer = document.getElementById('activity-log-container');
    const notesContainer = document.getElementById('notes-container');
    const libraryContainer = document.getElementById('library-container');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const loginForm = document.getElementById('login-form');
    const loginLoader = document.getElementById('login-loader');
    const loginLoadingText = document.getElementById('login-loading-text');
    const loginError = document.getElementById('login-error');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const freeTestBtn = document.getElementById('free-test-btn');
    const lecturesBtn = document.getElementById('lectures-btn');
    const qbankBtn = document.getElementById('qbank-btn');
    const libraryBtn = document.getElementById('library-btn');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const lastLectureRibbon = document.getElementById('last-lecture-ribbon');
    const lastQuizRibbon = document.getElementById('last-quiz-ribbon');
    const libraryBackBtn = document.getElementById('library-back-btn');
    const libraryLoader = document.getElementById('library-loader');
    const libraryList = document.getElementById('library-list');
    const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
    const leaderboardLoader = document.getElementById('leaderboard-loader');
    const leaderboardList = document.getElementById('leaderboard-list');
    const currentUserRankDiv = document.getElementById('current-user-rank');
    const lecturesBackBtn = document.getElementById('lectures-back-btn');
    const lectureSearchInput = document.getElementById('lecture-search-input');
    const lecturesLoader = document.getElementById('lectures-loader');
    const lecturesList = document.getElementById('lectures-list');
    const notesBackBtn = document.getElementById('notes-back-btn');
    const notesFilterQuizzes = document.getElementById('notes-filter-quizzes');
    const notesFilterLectures = document.getElementById('notes-filter-lectures');
    const notesList = document.getElementById('notes-list');
    const activityBackBtn = document.getElementById('activity-back-btn');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const allSummary = document.getElementById('all-summary');
    const quizSummary = document.getElementById('quiz-summary');
    const lectureSummary = document.getElementById('lecture-summary');
    const allLecturesProgress = document.getElementById('all-lectures-progress');
    const allQuestionsProgress = document.getElementById('all-questions-progress');
    const totalCorrectAnswers = document.getElementById('total-correct-answers');
    const totalIncorrectAnswers = document.getElementById('total-incorrect-answers');
    const overallAccuracy = document.getElementById('overall-accuracy');
    const lecturesViewedCount = document.getElementById('lectures-viewed-count');
    const chaptersStartedCount = document.getElementById('chapters-started-count');
    const activityLogList = document.getElementById('activity-log-list');
    const logFilterAll = document.getElementById('log-filter-all');
    const logFilterQuizzes = document.getElementById('log-filter-quizzes');
    const logFilterLectures = document.getElementById('log-filter-lectures');
    const activityChartCanvas = document.getElementById('activity-chart');
    const qbankBackBtn = document.getElementById('qbank-back-btn');
    const loader = document.getElementById('loader');
    const loadingText = document.getElementById('loading-text');
    const mockQCountInput = document.getElementById('mock-q-count');
    const customTimerInput = document.getElementById('custom-timer-input');
    const toggleCustomOptionsBtn = document.getElementById('toggle-custom-options-btn');
    const customExamOptions = document.getElementById('custom-exam-options');
    const chapterSelectMock = document.getElementById('chapter-select-mock');
    const sourceSelectMock = document.getElementById('source-select-mock');
    const startMockBtn = document.getElementById('start-mock-btn');
    const mockError = document.getElementById('mock-error');
    const browseByChapterBtn = document.getElementById('browse-by-chapter-btn');
    const browseBySourceBtn = document.getElementById('browse-by-source-btn');
    const practiceMistakesBtn = document.getElementById('practice-mistakes-btn');
    const listBackBtn = document.getElementById('list-back-btn');
    const listTitle = document.getElementById('list-title');
    const listItems = document.getElementById('list-items');
    const quizTitle = document.getElementById('quiz-title');
    const timerDisplay = document.getElementById('timer');
    const progressText = document.getElementById('progress-text');
    const sourceText = document.getElementById('source-text');
    const questionText = document.getElementById('question-text');
    const questionImageContainer = document.getElementById('question-image-container');
    const answerButtons = document.getElementById('answer-buttons-quiz');
    const questionContainer = document.getElementById('question-container');
    const controlsContainer = document.getElementById('controls-container');
    const hintBtn = document.getElementById('hint-btn');
    const hintText = document.getElementById('hint-text');
    const previousBtn = document.getElementById('previous-btn');
    const nextSkipBtn = document.getElementById('next-skip-btn');
    const flagBtn = document.getElementById('flag-btn');
    const quizNoteBtn = document.getElementById('quiz-note-btn');
    const endQuizBtn = document.getElementById('end-quiz-btn');
    const scoreProgressText = document.getElementById('score-progress-text');
    const scoreBarCorrect = document.getElementById('score-bar-correct');
    const scoreBarIncorrect = document.getElementById('score-bar-incorrect');
    const resultsContainer = document.getElementById('results-container');
    const resultsTitle = document.getElementById('results-title');
    const resultsScoreText = document.getElementById('results-score-text');
    const scoreText = document.getElementById('score-text');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const restartBtn = document.getElementById('restart-btn');
    const resultsHomeBtn = document.getElementById('results-home-btn');
    const reviewIncorrectBtn = document.getElementById('review-incorrect-btn');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const questionNavigatorModal = document.getElementById('question-navigator-modal');
    const navigatorBtn = document.getElementById('navigator-btn');
    const navigatorGrid = document.getElementById('navigator-grid');
    const navigatorCloseBtn = document.getElementById('navigator-close-btn');
    const imageViewerModal = document.getElementById('image-viewer-modal');
    const modalImage = document.getElementById('modal-image');
    const imageViewerCloseBtn = document.getElementById('image-viewer-close-btn');
    const noteModal = document.getElementById('note-modal');
    const noteModalTitle = document.getElementById('note-modal-title');
    const noteTextarea = document.getElementById('note-textarea');
    const noteSaveBtn = document.getElementById('note-save-btn');
    const noteCancelBtn = document.getElementById('note-cancel-btn');
    const clearLogModal = document.getElementById('clear-log-modal');
    const clearQuizLogsBtn = document.getElementById('clear-quiz-logs-btn');
    const clearLectureLogsBtn = document.getElementById('clear-lecture-logs-btn');
    const clearAllLogsBtn = document.getElementById('clear-all-logs-btn');
    const clearLogCancelBtn = document.getElementById('clear-log-cancel-btn');
    const announcementsModal = document.getElementById('announcements-modal');
    const announcementsList = document.getElementById('announcements-list');
    const announcementsCloseBtn = document.getElementById('announcements-close-btn');
    const osceBtn = document.getElementById('osce-btn');
    const osceContainer = document.getElementById('osce-container');
    const osceQuizContainer = document.getElementById('osce-quiz-container');
    const osceBackBtn = document.getElementById('osce-back-btn');
    const startOsceSlayerBtn = document.getElementById('start-osce-slayer-btn');
    const osceCaseCountInput = document.getElementById('osce-case-count');
    const osceTimePerQInput = document.getElementById('osce-time-per-q');
    const toggleOsceOptionsBtn = document.getElementById('toggle-osce-options-btn');
    const customOsceOptions = document.getElementById('custom-osce-options');
    const chapterSelectOsce = document.getElementById('chapter-select-osce');
    const sourceSelectOsce = document.getElementById('source-select-osce');
    const startCustomOsceBtn = document.getElementById('start-custom-osce-btn');
    const osceError = document.getElementById('osce-error');
    const endOsceQuizBtn = document.getElementById('end-osce-quiz-btn');
    const osceQuizTitle = document.getElementById('osce-quiz-title');
    const osceTimer = document.getElementById('osce-timer');
    const osceCaseTitle = document.getElementById('osce-case-title');
    const osceCaseImageContainer = document.getElementById('osce-case-image-container');
    const osceCaseDescription = document.getElementById('osce-case-description');
    const osceProgressText = document.getElementById('osce-progress-text');
    const osceQuestionImageContainer = document.getElementById('osce-question-image-container');
    const osceQuestionText = document.getElementById('osce-question-text');
    const osceAnswerArea = document.getElementById('osce-answer-area');
    const osceModelAnswerArea = document.getElementById('osce-model-answer-area');
    const oscePreviousBtn = document.getElementById('osce-previous-btn');
    const osceNextBtn = document.getElementById('osce-next-btn');
    const radioBtn = document.getElementById('radio-btn');
    const radioCloseBtn = document.getElementById('radio-close-btn');
    const osceScoreDisplay = document.getElementById('osce-score');
    const osceNavigatorBtn = document.getElementById('osce-navigator-btn');
    const osceNavigatorModal = document.getElementById('osce-navigator-modal');
    const osceNavigatorContent = document.getElementById('osce-navigator-content');
    const osceNavigatorCloseBtn = document.getElementById('osce-navigator-close-btn');
    const osceSelfCorrectionArea = document.getElementById('osce-self-correction-area');
    const radioBannerContainer = document.getElementById('radio-banner-container');

    const learningModeBtn = document.getElementById('learning-mode-btn');
    const learningModeContainer = document.getElementById('learning-mode-container');
    const learningModeControls = document.getElementById('learning-mode-controls');
    const learningModeViewer = document.getElementById('learning-mode-viewer');
    const learningModeBackBtn = document.getElementById('learning-mode-back-btn');
    const learningBrowseByChapterBtn = document.getElementById('learning-browse-by-chapter-btn');
    const learningBrowseBySourceBtn = document.getElementById('learning-browse-by-source-btn');
    const endLearningBtn = document.getElementById('end-learning-btn');
    const learningTitle = document.getElementById('learning-title');
    const learningProgressText = document.getElementById('learning-progress-text');
    const learningSourceText = document.getElementById('learning-source-text');
    const learningImageContainer = document.getElementById('learning-image-container');
    const learningQuestionText = document.getElementById('learning-question-text');
    const learningAnswerButtons = document.getElementById('learning-answer-buttons');
    const learningPreviousBtn = document.getElementById('learning-previous-btn');
    const learningNextBtn = document.getElementById('learning-next-btn');
    const learningSearchInput = document.getElementById('learning-search-input');
    const learningSearchBtn = document.getElementById('learning-search-btn');
    const learningSearchError = document.getElementById('learning-search-error');
    const qbankSearchInput = document.getElementById('qbank-search-input');
    const qbankSearchQCount = document.getElementById('qbank-search-q-count');
    const qbankSearchBtn = document.getElementById('qbank-search-btn');
    const qbankSearchError = document.getElementById('qbank-search-error');
    const qbankSearchResultsContainer = document.getElementById('qbank-search-results-container');
    const qbankSearchResultsInfo = document.getElementById('qbank-search-results-info');
    const qbankStartSearchQuizBtn = document.getElementById('qbank-start-search-quiz-btn');
    const selectAllSourcesMock = document.getElementById('select-all-sources-mock');
    const selectAllChaptersMock = document.getElementById('select-all-chapters-mock');
    const practiceBookmarkedBtn = document.getElementById('practice-bookmarked-btn');
    const bookmarkBtn = document.getElementById('bookmark-btn');

    // --- START: ADD SIMULATION EVENT LISTENER ---
    const startSimulationBtn = document.getElementById('start-simulation-btn');
    const simulationError = document.getElementById('simulation-error');
    // --- END: ADD SIMULATION EVENT LISTENER ---

    // --- ADDED: User Card DOM Elements ---
    const userCardModal = document.getElementById('user-card-modal');
    const userCardCloseBtn = document.getElementById('user-card-close-btn');
    const userAvatar = document.getElementById('user-avatar');
    const cardUserName = document.getElementById('card-user-name');
    const cardUserNickname = document.getElementById('card-user-nickname');
    const cardQuizScore = document.getElementById('card-quiz-score');
    const cardExamDate = document.getElementById('card-exam-date');
    const cardDaysLeft = document.getElementById('card-days-left');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const profileDetailsView = document.getElementById('profile-details-view');
    const profileEditView = document.getElementById('profile-edit-view');
    const editNickname = document.getElementById('edit-nickname');
    const editExamDate = document.getElementById('edit-exam-date');
    const avatarSelectionGrid = document.getElementById('avatar-selection-grid');
    const profileEditError = document.getElementById('profile-edit-error');
    const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');

    // --- ADDED: Messenger DOM Elements ---
    const messengerBtn = document.getElementById('messenger-btn');
    const messengerModal = document.getElementById('messenger-modal');
    const messengerCloseBtn = document.getElementById('messenger-close-btn');
    const messagesList = document.getElementById('messages-list');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const messengerError = document.getElementById('messenger-error');

    // --- ADDED: Study Planner DOM Elements ---
    const studyPlannerBtn = document.getElementById('study-planner-btn');
    const studyPlannerContainer = document.getElementById('study-planner-container');
    const studyPlannerBackBtn = document.getElementById('study-planner-back-btn');
    const studyPlannerLoader = document.getElementById('study-planner-loader');
    const studyPlannerContent = document.getElementById('study-planner-content');
    const studyPlannerInitialSetup = document.getElementById('study-planner-initial-setup');
    const studyPlannerExamDateInput = document.getElementById('study-planner-exam-date-input');
    const studyPlannerGenerateBtn = document.getElementById('study-planner-generate-btn');
    const studyPlannerError = document.getElementById('study-planner-error');
    const studyPlanDaysContainer = document.getElementById('study-plan-days-container');
    const studyPlanAddCustomTaskBtn = document.getElementById('study-plan-add-custom-task-btn');
    const studyPlanCustomTaskInput = document.getElementById('study-plan-custom-task-input');
    const studyPlanCustomTaskDateInput = document.getElementById('study-plan-custom-task-date-input');
    const studyPlanWeaknessesContainer = document.getElementById('study-plan-weaknesses-container');


    // --- FUNCTIONS ---

    function logUserActivity(eventData) {
        if (!API_URL || !appState.currentUser || appState.currentUser.Role === 'Guest') return;

        const now = new Date();
        let newLogEntry = null;
        const payload = {
            ...eventData,
            userId: appState.currentUser.UniqueID,
            userName: appState.currentUser.Name
        };

        if (payload.eventType === 'FinishQuiz') {
            const details = appState.currentQuiz.originalQuestions.map((q, index) => {
                return {
                    qID: q.UniqueID,
                    ans: appState.currentQuiz.originalUserAnswers[index] ? appState.currentQuiz.originalUserAnswers[index].answer : 'No Answer'
                };
            });
            payload.details = JSON.stringify(details);

            newLogEntry = {
                logId: now.toISOString(),
                timestamp: now,
                eventType: 'FinishQuiz',
                title: payload.quizTitle,
                score: payload.score,
                total: payload.totalQuestions,
                isReviewable: true
            };
            // Update study plan progress for quiz completion
            updateStudyPlanProgress('quiz', payload.quizTitle);

        } else if (payload.eventType === 'ViewLecture') {
            newLogEntry = {
                timestamp: now,
                eventType: 'ViewLecture',
                title: payload.lectureName
            };
            // Update study plan progress for lecture completion
            updateStudyPlanProgress('lecture', payload.lectureName);
        }

        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        }).then(() => {
            if (newLogEntry) {
                appState.fullActivityLog.unshift(newLogEntry);
            }
        }).catch(error => console.error('Error logging activity:', error));
    }

    function parseQuestions(data) {
        if (!data) return [];
        return data.filter(row => row.Question && String(row.Question).trim()).map(row => {
            const answerOptions = [];
            if (row.CorrectAnswer && String(row.CorrectAnswer).trim() !== '') answerOptions.push({ text: String(row.CorrectAnswer), isCorrect: true, rationale: row.CorrectRationale || '' });
            if (row.IncorrectAnswer1 && String(row.IncorrectAnswer1).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer1), isCorrect: false, rationale: row.IncorrectRationale1 || '' });
            if (row.IncorrectAnswer2 && String(row.IncorrectAnswer2).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer2), isCorrect: false, rationale: row.IncorrectRationale2 || '' });
            if (row.IncorrectAnswer3 && String(row.IncorrectAnswer3).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer3), isCorrect: false, rationale: row.IncorrectRationale3 || '' });
            return {
                UniqueID: row.UniqueID,
                chapter: (row.Chapter && String(row.Chapter).trim()) ? row.Chapter : 'Uncategorized',
                question: row.Question,
                hint: row.Hint || '',
                source: row.Source || '',
                ImageURL: row.ImageURL || '',
                answerOptions: answerOptions
            };
        });
    }

    function groupLecturesByChapter(lectureData) {
        if (!lectureData) return {};
        const chapters = {};
        lectureData.forEach(row => {
            const chapterName = row.Chapter;
            if (!chapterName || String(chapterName).length < 2) return;
            if (!chapters[chapterName]) {
                chapters[chapterName] = { topics: [], mock: null, icon: '' };
            }
            if (row.LectureName) {
                chapters[chapterName].topics.push({
                    id: row.UniqueID,
                    name: row.LectureName,
                    link: row.LectureURL
                });
            }
            if (row['Mock Name'] && row['Mock Link'] && !chapters[chapterName].mock) { // Ensure both name and link exist
                chapters[chapterName].mock = {
                    link: row['Mock Link'],
                    name: row['Mock Name'] || 'Mock Exam'
                };
            }
            if (row.ChapterIcon && !chapters[chapterName].icon) {
                chapters[chapterName].icon = row.ChapterIcon;
            }
        });
        return chapters;
    }

    function parseOsceCases(data) {
        if (!data) return [];
        return data.filter(row => row.CaseID && row.Title).map(row => ({
            CaseID: row.CaseID,
            Title: row.Title,
            ImageURL: row.ImageURL,
            Hint: row.Hint,
            CaseDescription: row.CaseDescription,
            AudioURL: row.AudioURL,
            Chapter: row.Chapter,
            Source: row.Source
        }));
    }

    function parseOsceQuestions(data) {
        if (!data) return [];
        return data.filter(row => row.QuestionID && row.CaseID).map(row => {
            const answerOptions = [];
            if (row.CorrectAnswer && String(row.CorrectAnswer).trim() !== '') answerOptions.push({ text: String(row.CorrectAnswer), isCorrect: true, rationale: row.CorrectRationale || '' });
            if (row.IncorrectAnswer1 && String(row.IncorrectAnswer1).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer1), isCorrect: false, rationale: row.IncorrectRationale1 || '' });
            if (row.IncorrectAnswer2 && String(row.IncorrectAnswer2).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer2), isCorrect: false, rationale: row.IncorrectRationale2 || '' });
            if (row.IncorrectAnswer3 && String(row.IncorrectAnswer3).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer3), isCorrect: false, rationale: row.IncorrectRationale3 || '' });

            return {
                QuestionID: row.QuestionID,
                CaseID: row.CaseID,
                QuestionType: row.QuestionType,
                QuestionText: row.QuestionText,
                EssayModelAnswer: row.EssayModelAnswer,
                ImageURL: row.ImageURL,
                AudioURL: row.AudioURL,
                answerOptions: answerOptions
            };
        });
    }

    async function loadContentData() {
        loginLoader.classList.remove('hidden');
        loginLoadingText.classList.remove('hidden');
        try {
            const response = await fetch(`${API_URL}?request=contentData&t=${new Date().getTime()}`, {
                method: 'GET',
                mode: 'cors',
                redirect: 'follow'
            });

            if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            appState.allQuestions = parseQuestions(data.questions);
            appState.groupedLectures = groupLecturesByChapter(data.lectures);
            appState.mcqBooks = data.books || [];
            appState.allAnnouncements = data.announcements || [];
            appState.allOsceCases = parseOsceCases(data.osceCases);
            appState.allOsceQuestions = parseOsceQuestions(data.osceQuestions);
            appState.allRoles = data.roles || []; // ADDED: Load roles
            appState.allChaptersNames = data.chaptersNames ? data.chaptersNames.map(c => c.QuizTopics) : []; // ADDED: Load chapter names

            populateAllFilterOptions();
            renderLectures();

            loginLoader.classList.add('hidden');
            loginLoadingText.classList.add('hidden');

        } catch (error) {
            console.error("Error loading content data:", error);
            loginLoadingText.textContent = `Failed to load content. Please ensure the script is deployed correctly and refresh. Error: ${error.message}`;
        }
    }

    async function loadUserData() {
        if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
        try {
            const response = await fetch(`${API_URL}?request=userData&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Could not fetch user data.');

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            appState.fullActivityLog = data.logs || [];
            appState.userQuizNotes = data.quizNotes || [];
            appState.userLectureNotes = data.lectureNotes || [];
            appState.studyPlannerData = data.studyPlan ? JSON.parse(data.studyPlan.Study_Plan) : null; // ADDED: Load study plan
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    function populateFilterOptions(containerElement, items, inputNamePrefix, counts) {
        containerElement.innerHTML = '';
        if (!items || items.length === 0) {
            containerElement.innerHTML = `<p class="text-slate-400 text-sm">No options available.</p>`;
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex items-center';
            const safeId = `${inputNamePrefix}-${item.replace(/[^a-zA-Z0-9]/g, '-')}`;
            const count = counts[item] || 0;
            div.innerHTML = `<input id="${safeId}" name="${inputNamePrefix}" value="${item}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"><label for="${safeId}" class="ml-3 text-sm text-gray-600">${item} (${count} Qs)</label>`;
            containerElement.appendChild(div);
        });
    }

    function populateAllFilterOptions() {
        const sourceCounts = {};
        const chapterCounts = {};

        appState.allQuestions.forEach(q => {
            const source = q.source || 'Uncategorized';
            const chapter = q.chapter || 'Uncategorized';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
            chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
        });

        const sortedSources = Object.keys(sourceCounts).sort();
        const sortedChapters = Object.keys(chapterCounts).sort();

        populateFilterOptions(sourceSelectMock, sortedSources, 'mock-source', sourceCounts);
        populateFilterOptions(chapterSelectMock, sortedChapters, 'mock-chapter', chapterCounts);

        const osceChapters = [...new Set(appState.allOsceCases.map(c => c.Chapter).filter(c => c))].sort();
        const osceSources = [...new Set(appState.allOsceCases.map(c => c.Source).filter(s => s))].sort();
        // We don't have counts for OSCE yet, so we pass an empty object
        populateFilterOptions(chapterSelectOsce, osceChapters, 'osce-chapter', {});
        populateFilterOptions(sourceSelectOsce, osceSources, 'osce-source', {});
    }

    function updateChapterFilter() {
        const selectedSources = [...sourceSelectMock.querySelectorAll('input:checked')].map(el => el.value);

        let relevantQuestions;
        if (selectedSources.length === 0) {
            relevantQuestions = appState.allQuestions;
        } else {
            relevantQuestions = appState.allQuestions.filter(q => selectedSources.includes(q.source || 'Uncategorized'));
        }

        const chapterCounts = {};
        relevantQuestions.forEach(q => {
            const chapter = q.chapter || 'Uncategorized';
            chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
        });

        const sortedChapters = Object.keys(chapterCounts).sort();
        populateFilterOptions(chapterSelectMock, sortedChapters, 'mock-chapter', chapterCounts);
    }

    async function handleLogin(event) {
        event.preventDefault();
        loginError.classList.add('hidden');
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';

        const payload = {
            eventType: 'login',
            username: usernameInput.value,
            password: passwordInput.value
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'cors',
                body: JSON.stringify(payload),
                redirect: 'follow'
            });

            const result = await response.json();

            if (result.success) {
                appState.currentUser = result.user;
                // Set user roles based on the fetched role data
                const userRoleData = appState.allRoles.find(role => role.Role === appState.currentUser.Role);
                appState.userRoles = userRoleData || {}; // Store the role permissions

                updateWatermark(appState.currentUser);
                loadUserProgress();
                await loadUserData();
                await showUserCardModal(true); // Load user card data immediately after login
                updateUserProfileHeader(); // Update header with nickname/avatar
                showMainMenuScreen();
            } else {
                loginError.textContent = result.message || "Invalid username or password.";
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Login API Error:", error);
            loginError.textContent = "An error occurred. Please try again.";
            loginError.classList.remove('hidden');
        } finally {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = 'Log In';
        }
    }

    function showScreen(screenToShow, isGuest = false) {
        // Close all modals first to prevent overlap
        [confirmationModal, questionNavigatorModal, imageViewerModal, noteModal, clearLogModal, announcementsModal, userCardModal, messengerModal, osceNavigatorModal].forEach(modal => {
            if (modal) modal.classList.add('hidden');
        });
        modalBackdrop.classList.add('hidden'); // Hide backdrop for all modals

        // Hide all main content containers
        [loginContainer, mainMenuContainer, lecturesContainer, qbankContainer, listContainer, quizContainer, activityLogContainer, notesContainer, libraryContainer, leaderboardContainer, osceContainer, osceQuizContainer, learningModeContainer, studyPlannerContainer].forEach(screen => { // ADDED studyPlannerContainer
            if (screen) screen.classList.add('hidden');
        });

        // Show the requested screen
        if (screenToShow) screenToShow.classList.remove('hidden');

        const watermarkOverlay = document.getElementById('watermark-overlay');
        if (screenToShow !== loginContainer && !isGuest) {
            globalHeader.classList.remove('hidden');
            watermarkOverlay.classList.remove('hidden');
            userNameDisplay.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            activityLogBtn.classList.remove('hidden');
            notesBtn.classList.remove('hidden');
            userProfileHeaderBtn.classList.remove('hidden'); // Show user profile button
            messengerBtn.classList.remove('hidden'); // Show messenger button
            updateUserProfileHeader(); // Ensure header is updated
            applyRolePermissions(); // Apply role permissions
        } else {
            globalHeader.classList.add('hidden');
            watermarkOverlay.classList.add('hidden');
            userNameDisplay.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            activityLogBtn.classList.add('hidden');
            notesBtn.classList.add('hidden');
            userProfileHeaderBtn.classList.add('hidden'); // Hide user profile button for guests
            messengerBtn.classList.add('hidden'); // Hide messenger button for guests
        }
    }

    async function showMainMenuScreen() {
        showScreen(mainMenuContainer);
        appState.navigationHistory = [showMainMenuScreen];
        displayAnnouncement();
        await fetchAndShowLastActivity();
    }

    function showLecturesScreen() {
        if (!checkPermission('Lectures')) return;
        showScreen(lecturesContainer);
        appState.navigationHistory.push(showLecturesScreen);
        renderLectures();
    }

    function showQbankScreen() {
        if (!checkPermission('MCQBank')) return;
        showScreen(qbankContainer);
        appState.navigationHistory.push(showQbankScreen);
    }

    function showLibraryScreen() {
        if (!checkPermission('Library')) return;
        showScreen(libraryContainer);
        appState.navigationHistory.push(showLibraryScreen);
        renderBooks();
    }

    async function showLeaderboardScreen() {
        if (!checkPermission('LeadersBoard')) return;
        showScreen(leaderboardContainer);
        appState.navigationHistory.push(showLeaderboardScreen);
        leaderboardList.innerHTML = '';
        currentUserRankDiv.innerHTML = '';
        leaderboardLoader.classList.remove('hidden');
        try {
            const response = await fetch(`${API_URL}?request=leaderboard&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard data.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            renderLeaderboard(data.leaderboard, data.currentUserRank);
        } catch (error) {
            console.error("Error loading leaderboard:", error);
            leaderboardList.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        } finally {
            leaderboardLoader.classList.add('hidden');
        }
    }

    function renderLeaderboard(top10, currentUserRank) {
        leaderboardList.innerHTML = '';
        currentUserRankDiv.innerHTML = '';

        if (currentUserRank) {
            currentUserRankDiv.innerHTML = `
                <div class="p-4 bg-blue-100 border-2 border-blue-300 rounded-lg">
                    <h4 class="text-lg font-bold text-center text-blue-800">Your Rank</h4>
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center">
                            <div class="w-10 h-10 flex items-center justify-center text-xl font-bold text-blue-700">${currentUserRank.rank}</div>
                            <p class="font-bold text-slate-800 text-lg ml-4">${currentUserRank.name} (You)</p>
                        </div>
                        <div class="text-right">
                            <p class="font-extrabold text-2xl text-blue-600">${currentUserRank.score}</p>
                            <p class="text-xs text-slate-500">Total Score</p>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!top10 || top10.length === 0) {
            leaderboardList.innerHTML = `<p class="text-center text-slate-500 mt-4">The leaderboard is empty. Start a quiz to get on the board!</p>`;
            return;
        }

        top10.forEach(user => {
            const rank = user.rank;
            let rankIcon = '';
            let rankColor = 'bg-white border-slate-200';
            if (rank === 1) {
                rankIcon = 'fas fa-trophy text-yellow-400';
                rankColor = 'bg-yellow-100 border-yellow-300';
            } else if (rank === 2) {
                rankIcon = 'fas fa-medal text-gray-400';
                rankColor = 'bg-gray-100 border-gray-300';
            } else if (rank === 3) {
                rankIcon = 'fas fa-award text-orange-400';
                rankColor = 'bg-orange-100 border-orange-300';
            }

            const userElement = document.createElement('div');
            userElement.className = `flex items-center p-4 rounded-lg border-2 ${rankColor}`;

            userElement.innerHTML = `
                <div class="w-10 h-10 flex items-center justify-center text-xl font-bold ${rank > 3 ? 'text-slate-600' : ''}">
                    ${rankIcon ? `<i class="${rankIcon}"></i>` : rank}
                </div>
                <div class="flex-grow ml-4">
                    <p class="font-bold text-slate-800 text-lg">${user.name}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-slate-500">Rank ${rank}</p>
                </div>
            `;
            leaderboardList.appendChild(userElement);
        });
    }


    function renderBooks() {
        libraryList.innerHTML = '';
        if (appState.mcqBooks.length === 0) {
            libraryList.innerHTML = `<p class="text-center text-slate-500">No books found in the library.</p>`;
            return;
        }

        appState.mcqBooks.forEach(book => {
            if (!book.Book || !book.Link) return;
            const bookElement = document.createElement('a');
            bookElement.href = book.Link;
            bookElement.target = '_blank';
            bookElement.className = 'flex items-start p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-200';

            // --- START: MODIFIED CODE ---
            let iconHtml;
            // Check if the icon field contains a valid URL
            if (book.icon && (book.icon.startsWith('http://') || book.icon.startsWith('https://'))) {
                // If it's a URL, use an <img> tag
                iconHtml = `<div class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg mr-4 overflow-hidden">
                                <img src="${book.icon}" alt="${book.Book}" class="w-full h-full object-cover">
                            </div>`;
            } else {
                // Otherwise, use a Font Awesome icon (either from the sheet or a default one)
                iconHtml = `<div class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg mr-4">
                                <i class="${book.icon || 'fas fa-book'} text-2xl text-orange-600"></i>
                            </div>`;
            }
            // --- END: MODIFIED CODE ---

            const contentHtml = `<div class="flex-grow">
                                     <h3 class="font-bold text-slate-800 text-lg">${book.Book}</h3>
                                     <p class="text-slate-600 text-sm mt-1">${book.Description || ''}</p>
                                 </div>`;

            const arrowHtml = `<div class="flex-shrink-0 ml-4 self-center">
                                   <i class="fas fa-external-link-alt text-slate-400"></i>
                               </div>`;

            bookElement.innerHTML = iconHtml + contentHtml + arrowHtml;
            libraryList.appendChild(bookElement);
        });
    }

    function renderLectures(filterText = '') {
        lecturesList.innerHTML = '';
        const lowerCaseFilter = filterText.toLowerCase();
        const chapterNames = Object.keys(appState.groupedLectures).sort();
        let chaptersFound = 0;

        if (Object.keys(appState.groupedLectures).length === 0) {
            lecturesLoader.classList.remove('hidden');
            return;
        }
        lecturesLoader.classList.add('hidden');

        chapterNames.forEach(chapterName => {
            const chapterData = appState.groupedLectures[chapterName];
            const isChapterMatch = chapterName.toLowerCase().includes(lowerCaseFilter);
            const isTopicMatch = chapterData.topics.some(topic => topic.name.toLowerCase().includes(lowerCaseFilter));
            if (filterText && !isChapterMatch && !isTopicMatch) return;
            chaptersFound++;
            const details = document.createElement('details');
            details.className = 'bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm';
            details.open = !!filterText;
            const summary = document.createElement('summary');
            summary.className = 'p-4 cursor-pointer hover:bg-slate-50';

            const totalTopics = chapterData.topics.length;
            const viewedTopics = chapterData.topics.filter(topic => appState.viewedLectures.has(topic.link)).length;
            const progressPercentage = totalTopics > 0 ? (viewedTopics / totalTopics) * 100 : 0;

            summary.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="flex items-center font-bold text-slate-800 text-lg">
                        <i class="${chapterData.icon || 'fas fa-layer-group'} mr-3 text-cyan-600 w-5 text-center"></i>
                        ${chapterName}
                    </span>
                    <div class="flex items-center gap-4">
                        <i class="fas fa-chevron-down transition-transform duration-300 text-slate-500"></i>
                    </div>
                </div>
                <div class="mt-2 flex items-center gap-2">
                    <div class="w-full bg-slate-200 rounded-full h-2.5">
                        <div class="bg-cyan-600 h-2.5 rounded-full" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-500">${viewedTopics}/${totalTopics}</span>
                </div>
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'p-4 bg-slate-50 border-t border-slate-200';
            const topicList = document.createElement('ul');
            topicList.className = 'space-y-2';
            chapterData.topics.forEach(topic => {
                const listItem = document.createElement('li');
                listItem.className = 'flex items-center justify-between p-3 rounded-md hover:bg-blue-100 transition-colors group';
                const isViewed = appState.viewedLectures.has(topic.link);

                if (isViewed) {
                    listItem.classList.add('lecture-viewed');
                }

                const controls = document.createElement('div');
                controls.className = 'flex items-center gap-3';

                const icon = document.createElement('i');
                icon.className = `fas ${isViewed ? 'fa-check-circle' : 'fa-play-circle'} mr-3 text-blue-500 view-toggle-icon`;
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleLectureViewed(topic.link, topic.name);
                });

                const noteIcon = document.createElement('i');
                const hasNote = appState.userLectureNotes.some(note => note.LectureID === topic.id);
                noteIcon.className = `fas fa-sticky-note text-slate-400 hover:text-amber-500 note-icon ${hasNote ? 'has-note' : ''}`;
                noteIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openNoteModal('lecture', topic.id, topic.name);
                });

                controls.appendChild(icon);
                controls.appendChild(noteIcon);

                const content = document.createElement('div');
                content.className = "flex-grow";

                if (topic.link) {
                    const link = document.createElement('a');
                    link.href = topic.link;
                    link.target = '_blank';
                    link.className = "lecture-name text-slate-800 font-medium";
                    link.textContent = topic.name;
                    content.appendChild(link);
                } else {
                    const nameSpan = document.createElement('span');
                    nameSpan.className = "lecture-name text-slate-500";
                    nameSpan.textContent = topic.name;
                    content.appendChild(nameSpan);
                }

                listItem.appendChild(controls);
                listItem.appendChild(content);

                topicList.appendChild(listItem);
            });
            contentDiv.appendChild(topicList);
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3';
            const relevantQuestions = appState.allQuestions.filter(q => q.chapter.trim().toLowerCase() === chapterName.trim().toLowerCase());
            if (relevantQuestions.length > 0) {
                const quizButton = document.createElement('button');
                quizButton.className = 'w-full action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2';
                quizButton.innerHTML = `<i class="fas fa-pencil-alt"></i> Test Chapter (${relevantQuestions.length} Qs)`;
                quizButton.addEventListener('click', () => startChapterQuiz(chapterName, relevantQuestions));
                actionsDiv.appendChild(quizButton);
            }
            if (chapterData.mock && chapterData.mock.link) {
                const mockButton = document.createElement('a');
                mockButton.href = chapterData.mock.link;
                mockButton.target = '_blank';
                mockButton.className = 'w-full action-btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2';
                mockButton.innerHTML = `<i class="fas fa-vial"></i> ${chapterData.mock.name}`;
                actionsDiv.appendChild(mockButton);
            }
            if (actionsDiv.hasChildNodes()) {
                contentDiv.appendChild(actionsDiv);
            }
            details.appendChild(summary);
            details.appendChild(contentDiv);
            lecturesList.appendChild(details);
        });
        if (chaptersFound === 0) {
            lecturesList.innerHTML = `<p class="text-center text-slate-500">No lectures found matching your search.</p>`;
        }
    }

    function toggleLectureViewed(lectureLink, lectureName) {
        if (appState.viewedLectures.has(lectureLink)) {
            appState.viewedLectures.delete(lectureLink);
        } else {
            appState.viewedLectures.add(lectureLink);
            logUserActivity({
                eventType: 'ViewLecture',
                lectureName: lectureName
            });
        }
        saveUserProgress();
        renderLectures(lectureSearchInput.value);
    }

    function saveUserProgress() {
        if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
        localStorage.setItem(`viewedLectures_${appState.currentUser.UniqueID}`, JSON.stringify(Array.from(appState.viewedLectures)));
        localStorage.setItem(`bookmarkedQuestions_${appState.currentUser.UniqueID}`, JSON.stringify(Array.from(appState.bookmarkedQuestions)));
    }

    function loadUserProgress() {
        if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
        const savedLectures = localStorage.getItem(`viewedLectures_${appState.currentUser.UniqueID}`);
        if (savedLectures) {
            appState.viewedLectures = new Set(JSON.parse(savedLectures));
        }
        const savedBookmarks = localStorage.getItem(`bookmarkedQuestions_${appState.currentUser.UniqueID}`);
        if (savedBookmarks) {
            appState.bookmarkedQuestions = new Set(JSON.parse(savedBookmarks));
        }
    }

    async function fetchAndShowLastActivity() {
        if (!appState.currentUser || appState.currentUser.Role === 'Guest') return;
        lastLectureRibbon.classList.add('hidden');
        lastQuizRibbon.classList.add('hidden');

        if (appState.fullActivityLog.length === 0) return;

        const lastLecture = appState.fullActivityLog.find(log => log.eventType === 'ViewLecture');
        const lastQuiz = appState.fullActivityLog.find(log => log.eventType === 'FinishQuiz');

        if (lastLecture) {
            lastLectureRibbon.innerHTML = `<i class="fas fa-video mr-2"></i> Last Lecture Viewed: <strong>${lastLecture.title}</strong>`;
            lastLectureRibbon.classList.remove('hidden');
        }
        if (lastQuiz) {
            lastQuizRibbon.innerHTML = `<i class="fas fa-check-double mr-2"></i> Last Quiz: <strong>${lastQuiz.title}</strong> (Score: ${lastQuiz.score}/${lastQuiz.total})`;
            lastQuizRibbon.classList.remove('hidden');
        }
    }

    async function showActivityLog() {
        showScreen(activityLogContainer);
        appState.navigationHistory.push(showActivityLog);
        activityLogList.innerHTML = '<div class="loader"></div>';
        await loadUserData();
        renderFilteredLog('all');
    }

    function renderFilteredLog(filter) {
        activityLogList.innerHTML = '';
        document.querySelectorAll('#activity-log-container .filter-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`log-filter-${filter}`).classList.add('active');

        allSummary.classList.add('hidden');
        quizSummary.classList.add('hidden');
        lectureSummary.classList.add('hidden');

        const logsToDisplay = appState.fullActivityLog.filter(log => {
            if (filter === 'all') return true;
            if (filter === 'quizzes') return log.eventType === 'FinishQuiz';
            if (filter === 'lectures') return log.eventType === 'ViewLecture';
            return false;
        });

        renderActivityChart(logsToDisplay);

        const quizLogs = appState.fullActivityLog.filter(log => log.eventType === 'FinishQuiz');
        let totalCorrect = 0;
        let totalAttemptedInQuizzes = 0;

        quizLogs.forEach(log => {
            const score = parseInt(log.score, 10) || 0;
            const total = parseInt(log.total, 10) || 0;
            totalCorrect += score;
            totalAttemptedInQuizzes += total;
        });
        const totalIncorrect = totalAttemptedInQuizzes - totalCorrect;

        if (filter === 'all') {
            allSummary.classList.remove('hidden');
            const totalLecturesInSystem = Object.values(appState.groupedLectures).reduce((acc, chapter) => acc + chapter.topics.length, 0);
            const viewedLectureCount = new Set(appState.fullActivityLog.filter(l => l.eventType === 'ViewLecture').map(l => l.title)).size;
            allLecturesProgress.textContent = `${viewedLectureCount} / ${totalLecturesInSystem}`;
            allQuestionsProgress.textContent = `${totalAttemptedInQuizzes} / ${appState.allQuestions.length}`;

        } else if (filter === 'quizzes') {
            quizSummary.classList.remove('hidden');
            totalCorrectAnswers.textContent = totalCorrect;
            totalIncorrectAnswers.textContent = totalIncorrect;
            const accuracy = totalAttemptedInQuizzes > 0 ? ((totalCorrect / totalAttemptedInQuizzes) * 100).toFixed(1) : 0;
            overallAccuracy.textContent = `${accuracy}%`;
        } else if (filter === 'lectures') {
            lectureSummary.classList.remove('hidden');
            const viewedLogs = appState.fullActivityLog.filter(log => log.eventType === 'ViewLecture');
            const uniqueViewedLectures = new Set(viewedLogs.map(l => l.title));
            lecturesViewedCount.textContent = uniqueViewedLectures.size;

            const uniqueChapters = new Set();
            viewedLogs.forEach(log => {
                for (const chapterName in appState.groupedLectures) {
                    if (appState.groupedLectures[chapterName].topics.some(t => t.name === log.title)) {
                        uniqueChapters.add(chapterName);
                        break;
                    }
                }
            });
            chaptersStartedCount.textContent = uniqueChapters.size;
        }


        if (logsToDisplay.length === 0) {
            activityLogList.innerHTML = `<p class="text-center text-slate-500">No activity recorded for this filter.</p>`;
            return;
        }

        logsToDisplay.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'p-3 border rounded-lg flex flex-col sm:flex-row justify-between items-center bg-white gap-3';
            const date = new Date(log.timestamp);
            const formattedDate = date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            let mainContent = '';
            if (log.eventType === 'FinishQuiz') {
                mainContent = `
                    <div class="flex-grow text-center sm:text-left">
                        <p class="font-bold text-slate-800">${log.title}</p>
                        <p class="text-sm text-slate-500">${formattedDate}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg ${log.score / log.total >= 0.5 ? 'text-green-600' : 'text-red-600'}">
                            ${log.score} / ${log.total}
                        </p>
                        <p class="text-xs text-slate-500">Score</p>
                    </div>
                `;
                if (log.isReviewable) {
                    const reviewButton = document.createElement('button');
                    reviewButton.innerHTML = `<i class="fas fa-redo-alt mr-2"></i> Review`;
                    reviewButton.className = 'action-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm';
                    reviewButton.onclick = () => startFullQuizReview(log.logId, log.title);
                    logItem.appendChild(reviewButton);
                }
            } else if (log.eventType === 'ViewLecture') {
                mainContent = `
                    <div class="flex-grow text-center sm:text-left">
                        <p class="font-bold text-slate-800">${log.title}</p>
                        <p class="text-sm text-slate-500">${formattedDate}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg text-green-600"><i class="fas fa-video"></i></p>
                        <p class="text-xs text-slate-500">Viewed</p>
                    </div>
                `;
            }
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'flex-grow flex items-center justify-between w-full';
            contentWrapper.innerHTML = mainContent;
            logItem.prepend(contentWrapper);
            activityLogList.appendChild(logItem);
        });
    }

    function renderActivityChart(logs) {
        if (appState.activityChartInstance) {
            appState.activityChartInstance.destroy();
        }
        const labels = [];
        const activityByDay = {};

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
            activityByDay[key] = { lectures: 0, quizzes: 0 };
        }

        logs.forEach(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            if (activityByDay.hasOwnProperty(logDate)) {
                if (log.eventType === 'ViewLecture') {
                    activityByDay[logDate].lectures++;
                } else if (log.eventType === 'FinishQuiz') {
                    activityByDay[logDate].quizzes++;
                }
            }
        });

        const lectureData = Object.values(activityByDay).map(d => d.lectures);
        const quizData = Object.values(activityByDay).map(d => d.quizzes);

        appState.activityChartInstance = new Chart(activityChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Lectures',
                        data: lectureData,
                        backgroundColor: 'rgba(20, 184, 166, 0.6)',
                        borderColor: 'rgb(13, 148, 136)',
                        borderWidth: 1
                    },
                    {
                        label: 'Quizzes',
                        data: quizData,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: 'rgb(37, 99, 235)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
                },
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { display: true, text: 'Your Activity in the Last 7 Days' }
                }
            }
        });
    }

    function showSourceList(isLearningMode = false) {
        showScreen(listContainer);

        if (appState.navigationHistory[appState.navigationHistory.length - 1] !== showSourceList) {
            appState.navigationHistory.push(() => showSourceList(isLearningMode));
        }

        listTitle.textContent = isLearningMode ? "Study by Source" : "Browse by Source";
        listItems.innerHTML = '';
        const sourceGroups = new Map();
        appState.allQuestions.forEach(q => {
            const sourceName = (q.source && q.source.trim()) ? q.source.trim() : "Uncategorized";
            const normalizedKey = sourceName.toLowerCase();
            if (sourceGroups.has(normalizedKey)) {
                sourceGroups.get(normalizedKey).count++;
            } else {
                sourceGroups.set(normalizedKey, { displayName: sourceName, count: 1 });
            }
        });
        const sortedSources = [...sourceGroups.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
        sortedSources.forEach(sourceGroup => {
            const button = document.createElement('button');
            button.innerHTML = `<span>${sourceGroup.displayName}</span> <span class="text-xs font-normal opacity-75">(${sourceGroup.count} Qs)</span>`;
            button.className = 'action-btn w-full p-4 rounded-lg bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 flex flex-col items-center justify-center text-center';
            button.addEventListener('click', () => showChapterList(sourceGroup.displayName, isLearningMode));
            listItems.appendChild(button);
        });
    }

    function showChapterList(sourceFilter = 'All', isLearningMode = false) {
        showScreen(listContainer);

        const prevNav = appState.navigationHistory[appState.navigationHistory.length - 1];
        if (!prevNav || prevNav.toString() !== (() => showChapterList(sourceFilter, isLearningMode)).toString()) {
            appState.navigationHistory.push(() => showChapterList(sourceFilter, isLearningMode));
        }

        listTitle.textContent = sourceFilter === 'All'
            ? (isLearningMode ? "Select Chapters to Study" : "All Chapters")
            : (isLearningMode ? `Select Chapters from ${sourceFilter}` : `Chapters in ${sourceFilter}`);

        listItems.innerHTML = '';

        if (isLearningMode) {
            listItems.className = 'p-4 md:p-6 space-y-3';
        } else {
            listItems.className = 'p-4 md:p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4';
        }

        const questionsToDisplay = (sourceFilter === 'All') ? appState.allQuestions : appState.allQuestions.filter(q => q.source === sourceFilter);
        const chapters = {};
        questionsToDisplay.forEach(q => {
            if (!chapters[q.chapter]) chapters[q.chapter] = [];
            chapters[q.chapter].push(q);
        });
        const sortedChapterNames = Object.keys(chapters).sort();

        if (isLearningMode) {
            // --- Learning Mode: Checkbox List ---
            const selectAllContainer = document.createElement('div');
            selectAllContainer.className = 'flex items-center p-2 border-b';
            selectAllContainer.innerHTML = `
                <input id="select-all-chapters" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                <label for="select-all-chapters" class="ml-3 font-bold text-gray-700">Select All</label>
            `;
            listItems.appendChild(selectAllContainer);

            const chapterListContainer = document.createElement('div');
            chapterListContainer.className = 'max-h-96 overflow-y-auto space-y-2 p-2';
            listItems.appendChild(chapterListContainer);

            sortedChapterNames.forEach(chapterName => {
                const chapterId = `learn-chapter-${chapterName.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const div = document.createElement('div');
                div.className = 'flex items-center';
                div.innerHTML = `
                    <input id="${chapterId}" name="learning-chapter" value="${chapterName}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                    <label for="${chapterId}" class="ml-3 text-sm text-gray-600">${chapterName} (${chapters[chapterName].length} Qs)</label>
                `;
                chapterListContainer.appendChild(div);
            });

            const startButton = document.createElement('button');
            startButton.id = 'start-learning-selection-btn';
            startButton.className = 'action-btn w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg';
            startButton.textContent = 'Start Learning Session';
            listItems.appendChild(startButton);

            const errorP = document.createElement('p');
            errorP.id = 'learning-selection-error';
            errorP.className = 'text-red-500 text-xs italic mt-2 text-center hidden';
            listItems.appendChild(errorP);

            document.getElementById('select-all-chapters').addEventListener('change', (e) => {
                listItems.querySelectorAll('input[name="learning-chapter"]').forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });

            startButton.addEventListener('click', () => {
                const selectedChapters = [...listItems.querySelectorAll('input[name="learning-chapter"]:checked')].map(el => el.value);

                if (selectedChapters.length === 0) {
                    errorP.textContent = 'Please select at least one chapter to study.';
                    errorP.classList.remove('hidden');
                    return;
                }

                errorP.classList.add('hidden');

                let questionsToLearn = [];
                selectedChapters.forEach(chapterName => {
                    questionsToLearn.push(...chapters[chapterName]);
                });

                const title = selectedChapters.length > 1 ? 'Multiple Chapters' : selectedChapters[0];
                launchLearningMode(title, questionsToLearn);
            });

        } else {
            // --- Quiz Mode: Original Button Logic ---
            sortedChapterNames.forEach(chapterName => {
                const button = document.createElement('button');
                button.innerHTML = `<span>${chapterName}</span> <span class="text-xs font-normal opacity-75">(${chapters[chapterName].length} Qs)</span>`;
                button.className = 'action-btn w-full p-4 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 flex flex-col items-center justify-center text-center';
                button.addEventListener('click', () => startChapterQuiz(chapterName, chapters[chapterName]));
                listItems.appendChild(button);
            });
        }
    }

    function startChapterQuiz(chapterName, questionsToUse) {
        const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
        launchQuiz(shuffled, chapterName);
    }

    function handleMockExamStart() {
        mockError.classList.add('hidden');
        const requestedCount = parseInt(mockQCountInput.value, 10);
        if (isNaN(requestedCount) || requestedCount <= 0) {
            mockError.textContent = "Please enter a valid number of questions.";
            mockError.classList.remove('hidden');
            return;
        }
        const customTime = parseInt(customTimerInput.value, 10);
        const selectedChapters = [...chapterSelectMock.querySelectorAll('input:checked')].map(el => el.value);
        const selectedSources = [...sourceSelectMock.querySelectorAll('input:checked')].map(el => el.value);
        let filteredQuestions = appState.allQuestions;
        if (selectedChapters.length > 0) filteredQuestions = filteredQuestions.filter(q => selectedChapters.includes(q.chapter));
        if (selectedSources.length > 0) filteredQuestions = filteredQuestions.filter(q => selectedSources.includes(q.source));
        if (filteredQuestions.length === 0) {
            mockError.textContent = "No questions match the selected filters.";
            mockError.classList.remove('hidden');
            return;
        }
        if (requestedCount > filteredQuestions.length) {
            mockError.textContent = `Only ${filteredQuestions.length} questions match your filters.`;
            mockError.classList.remove('hidden');
            return;
        }
        const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
        const mockQuestions = shuffled.slice(0, requestedCount);

        const config = {
            timePerQuestion: (customTime && customTime > 0) ? customTime : DEFAULT_TIME_PER_QUESTION
        };
        launchQuiz(mockQuestions, "Custom Mock Exam", config);
    }

    function handleStartSimulation() {
        simulationError.classList.add('hidden');
        if (appState.allQuestions.length < SIMULATION_Q_COUNT) {
            simulationError.textContent = `Not enough questions available for a full simulation. (Required: ${SIMULATION_Q_COUNT}, Available: ${appState.allQuestions.length})`;
            simulationError.classList.remove('hidden');
            return;
        }

        const shuffled = [...appState.allQuestions].sort(() => Math.random() - 0.5);
        const simulationQuestions = shuffled.slice(0, SIMULATION_Q_COUNT);
        const totalTimeSeconds = SIMULATION_TOTAL_TIME_MINUTES * 60;

        const config = {
            isSimulation: true,
            totalTimeSeconds: totalTimeSeconds
        };

        launchQuiz(simulationQuestions, "Exam Simulation", config);
    }

    function startSimulationTimer(durationInSeconds) {
        clearInterval(appState.currentQuiz.simulationTimerInterval);
        let timeLeft = durationInSeconds;
        timerDisplay.textContent = formatTime(timeLeft);
        appState.currentQuiz.simulationTimerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(appState.currentQuiz.simulationTimerInterval);
                triggerEndQuiz(true); // Force end due to time up
            }
        }, 1000);
    }

    function launchQuiz(questions, title, config = {}) {
        const {
            timePerQuestion = DEFAULT_TIME_PER_QUESTION,
            isReview = false,
            isMistakePractice = false,
            isSimulation = false,
            totalTimeSeconds = 0,
            pastAnswers = null
        } = config;

        appState.currentQuiz.isReviewMode = isReview;
        appState.currentQuiz.isPracticingMistakes = isMistakePractice;
        appState.currentQuiz.isSimulationMode = isSimulation;

        showScreen(quizContainer);
        appState.currentQuiz.currentQuestionIndex = 0;
        appState.currentQuiz.score = 0;
        appState.currentQuiz.questions = questions;

        if (!appState.currentQuiz.isReviewMode) {
            appState.currentQuiz.originalQuestions = [...questions];
            appState.currentQuiz.userAnswers = new Array(questions.length).fill(null);
            appState.currentQuiz.originalUserAnswers = appState.currentQuiz.userAnswers;
        } else {
            appState.currentQuiz.originalQuestions = [...questions];
            appState.currentQuiz.userAnswers = pastAnswers;
            appState.currentQuiz.originalUserAnswers = pastAnswers;
        }

        appState.currentQuiz.flaggedIndices.clear();
        resultsContainer.classList.add('hidden');
        questionContainer.classList.remove('hidden');
        controlsContainer.classList.remove('hidden');
        quizTitle.textContent = appState.currentQuiz.isReviewMode ? `Review: ${title}` : title;
        totalQuestionsSpan.textContent = appState.currentQuiz.questions.length;

        if (isSimulation) {
            startSimulationTimer(totalTimeSeconds);
        } else {
            appState.currentQuiz.timePerQuestion = timePerQuestion;
        }

        updateScoreBar();
        showQuestion();
    }

    function updateScoreBar() {
        const totalQuestions = appState.currentQuiz.questions.length;
        if (totalQuestions === 0) return;
        const answeredQuestions = appState.currentQuiz.userAnswers.filter(a => a !== null).length;
        const correctCount = appState.currentQuiz.userAnswers.filter(a => a && a.isCorrect).length;
        const incorrectCount = answeredQuestions - correctCount;
        scoreProgressText.textContent = `Score: ${correctCount} / ${answeredQuestions}`;
        scoreBarCorrect.style.width = `${(correctCount / totalQuestions) * 100}%`;
        scoreBarIncorrect.style.width = `${(incorrectCount / totalQuestions) * 100}%`;
    }

    function showQuestion() {
        resetQuizState();
        const currentQuestion = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];

        hintBtn.style.display = appState.currentQuiz.isSimulationMode ? 'none' : 'block';

        if (currentQuestion.ImageURL) {
            const img = document.createElement('img');
            img.src = currentQuestion.ImageURL;
            img.alt = 'Question Image';
            img.className = 'max-h-48 rounded-lg mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity';
            img.addEventListener('click', () => showImageModal(currentQuestion.ImageURL));
            questionImageContainer.appendChild(img);
        }

        questionText.textContent = currentQuestion.question;
        progressText.textContent = `Question ${appState.currentQuiz.currentQuestionIndex + 1} of ${appState.currentQuiz.questions.length}`;
        sourceText.textContent = `Source: ${currentQuestion.source || 'N/A'} | Chapter: ${currentQuestion.chapter || 'N/A'}`;
        previousBtn.disabled = appState.currentQuiz.currentQuestionIndex === 0;
        previousBtn.classList.toggle('opacity-50', appState.currentQuiz.currentQuestionIndex === 0);

        const isLastQuestion = appState.currentQuiz.currentQuestionIndex === appState.currentQuiz.questions.length - 1;

        if (appState.currentQuiz.isReviewMode && isLastQuestion) {
            nextSkipBtn.textContent = 'Finish Review';
        } else if (appState.currentQuiz.isSimulationMode && isLastQuestion) {
            nextSkipBtn.textContent = 'Finish';
        } else {
            nextSkipBtn.textContent = 'Next';
        }

        flagBtn.classList.toggle('flagged', appState.currentQuiz.flaggedIndices.has(appState.currentQuiz.currentQuestionIndex));

        const shuffledAnswers = (appState.currentQuiz.isReviewMode || appState.currentQuiz.isSimulationMode) ? [...currentQuestion.answerOptions] : [...currentQuestion.answerOptions].sort(() => Math.random() - 0.5);

        shuffledAnswers.forEach(answer => {
            const buttonContainer = document.createElement('div');
            const button = document.createElement('button');
            button.textContent = answer.text;
            button.className = 'answer-btn w-full text-left p-4 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-transparent';
            button.dataset.correct = answer.isCorrect;
            button.dataset.text = answer.text;
            button.addEventListener('click', (e) => selectAnswer(e, answer));
            const rationale = document.createElement('p');
            rationale.textContent = answer.rationale;
            rationale.className = 'rationale text-sm mt-2 p-2 rounded-md';
            buttonContainer.appendChild(button);
            buttonContainer.appendChild(rationale);
            answerButtons.appendChild(buttonContainer);
        });

        const userAnswer = appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex];
        if (userAnswer !== null) {
            if (appState.currentQuiz.isSimulationMode) {
                const selectedButton = Array.from(answerButtons.querySelectorAll('button')).find(btn => btn.dataset.text === userAnswer.answer);
                if (selectedButton) {
                    selectedButton.classList.add('bg-blue-200', 'border-blue-400', 'user-choice');
                }
                answerButtons.querySelectorAll('button').forEach(btn => btn.disabled = true);
            } else {
                showAnswerResult();
            }
        }

        if (!appState.currentQuiz.isReviewMode && !appState.currentQuiz.isSimulationMode) {
            startTimer();
        } else if (appState.currentQuiz.isReviewMode) {
            timerDisplay.textContent = 'Review';
        }

        const hasNote = appState.userQuizNotes.some(note => note.QuizID === currentQuestion.UniqueID);
        quizNoteBtn.classList.toggle('has-note', hasNote);
    }

    function startTimer() {
        if (appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] === null) {
            let timeLeft = appState.currentQuiz.timePerQuestion;
            timerDisplay.textContent = formatTime(timeLeft);
            appState.currentQuiz.timerInterval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = formatTime(timeLeft);
                if (timeLeft <= 0) {
                    clearInterval(appState.currentQuiz.timerInterval);
                    handleTimeUp();
                }
            }, 1000);
        } else {
            timerDisplay.textContent = 'Done';
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function handleTimeUp() {
        appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] = { answer: 'No Answer', isCorrect: false };
        showAnswerResult();
        updateScoreBar();
    }

    function resetQuizState() {
        clearInterval(appState.currentQuiz.timerInterval);
        answerButtons.innerHTML = '';
        questionImageContainer.innerHTML = '';
        hintText.classList.add('hidden');
    }

    function selectAnswer(e, selectedAnswer) {
        if (appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] !== null) return;

        clearInterval(appState.currentQuiz.timerInterval);
        const currentQuestion = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];

        const isCorrect = selectedAnswer.isCorrect;
        appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex] = { answer: selectedAnswer.text, isCorrect: isCorrect };

        if (isCorrect) {
            appState.currentQuiz.score++;
            if (appState.currentQuiz.isPracticingMistakes) {
                logCorrectedMistake(currentQuestion.UniqueID);
            }
        } else if (!appState.currentQuiz.isPracticingMistakes && !appState.currentQuiz.isSimulationMode) {
            logIncorrectAnswer(currentQuestion.UniqueID, selectedAnswer.text);
        }

        if (appState.currentQuiz.isSimulationMode) {
            Array.from(answerButtons.querySelectorAll('button')).forEach(btn => {
                btn.disabled = true;
                if (btn.dataset.text === selectedAnswer.text) {
                    btn.classList.add('bg-blue-200', 'border-blue-400', 'user-choice');
                }
            });
            updateScoreBar();
        } else {
            showAnswerResult();
            updateScoreBar();
            if (appState.currentQuiz.userAnswers.every(answer => answer !== null)) {
                setTimeout(showResults, 1000);
            }
        }
    }

    function showAnswerResult() {
        const userAnswer = appState.currentQuiz.userAnswers[appState.currentQuiz.currentQuestionIndex];
        Array.from(answerButtons.children).forEach(buttonContainer => {
            const button = buttonContainer.querySelector('button');
            const rationale = buttonContainer.querySelector('p');
            button.disabled = true;

            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
                rationale.classList.add('bg-green-100', 'visible');
            } else {
                if (userAnswer && button.dataset.text === userAnswer.answer) {
                    button.classList.add('incorrect', 'user-choice');
                } else {
                    button.classList.add('incorrect');
                }
                rationale.classList.add('bg-red-100', 'visible');
            }
        });
        hintBtn.classList.add('hidden');
    }

    function showResults() {
        clearInterval(appState.currentQuiz.timerInterval);
        clearInterval(appState.currentQuiz.simulationTimerInterval); // Stop simulation timer

        questionContainer.classList.add('hidden');
        controlsContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

        const resultTitle = appState.currentQuiz.isSimulationMode ? "Simulation Complete!" : "Quiz Complete!";
        resultsTitle.textContent = resultTitle;

        resultsScoreText.innerHTML = `Your score is <span id="score-text" class="font-bold">${appState.currentQuiz.score}</span> out of <span id="total-questions" class="font-bold">${appState.currentQuiz.originalQuestions.length}</span>.`;

        const incorrectCount = appState.currentQuiz.originalUserAnswers.filter(a => a && !a.isCorrect).length;
        if (incorrectCount > 0) {
            reviewIncorrectBtn.classList.remove('hidden');
            reviewIncorrectBtn.textContent = `Review ${incorrectCount} Incorrect`;
        } else {
            reviewIncorrectBtn.classList.add('hidden');
        }

        if (!appState.currentQuiz.isReviewMode && !appState.currentQuiz.isPracticingMistakes) {
            logUserActivity({
                eventType: 'FinishQuiz',
                quizTitle: quizTitle.textContent,
                score: appState.currentQuiz.score,
                totalQuestions: appState.currentQuiz.originalQuestions.length
            });

            if (appState.currentQuiz.isSimulationMode) {
                appState.currentQuiz.originalQuestions.forEach((q, index) => {
                    const answer = appState.currentQuiz.originalUserAnswers[index];
                    if (answer && !answer.isCorrect) {
                        logIncorrectAnswer(q.UniqueID, answer.answer);
                    }
                });
            }
        }
    }

    function handleNextQuestion() {
        if (appState.currentQuiz.isSimulationMode && appState.currentQuiz.currentQuestionIndex === appState.currentQuiz.questions.length - 1) {
            triggerEndQuiz(true);
            return;
        }

        if (appState.currentQuiz.currentQuestionIndex < appState.currentQuiz.questions.length - 1) {
            appState.currentQuiz.currentQuestionIndex++;
            showQuestion();
        } else if (appState.currentQuiz.isReviewMode) {
            showResults();
        }
    }

    function handlePreviousQuestion() {
        if (appState.currentQuiz.currentQuestionIndex > 0) {
            appState.currentQuiz.currentQuestionIndex--;
            showQuestion();
        }
    }

    function toggleFlag() {
        const index = appState.currentQuiz.currentQuestionIndex;
        appState.currentQuiz.flaggedIndices.has(index) ? appState.currentQuiz.flaggedIndices.delete(index) : appState.currentQuiz.flaggedIndices.add(index);
        flagBtn.classList.toggle('flagged');
    }

    function showImageModal(src) {
        // Close all other modals before opening image viewer
        [confirmationModal, questionNavigatorModal, userCardModal, messengerModal, noteModal, clearLogModal, announcementsModal, osceNavigatorModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
            if (modal) modal.classList.add('hidden');
        });
        imageViewerModal.classList.remove('hidden');
        modalBackdrop.classList.remove('hidden');
    }

    function showConfirmationModal(title, text, onConfirm) {
        // Close all other modals before opening confirmation
        [questionNavigatorModal, imageViewerModal, userCardModal, messengerModal, noteModal, clearLogModal, announcementsModal, osceNavigatorModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
            if (modal) modal.classList.add('hidden');
        });
        appState.modalConfirmAction = onConfirm;
        confirmationModal.querySelector('#modal-title').textContent = title;
        confirmationModal.querySelector('#modal-text').textContent = text;
        confirmationModal.classList.remove('hidden');
        modalBackdrop.classList.remove('hidden');
    }

    function showQuestionNavigator() {
        navigatorGrid.innerHTML = '';
        appState.currentQuiz.questions.forEach((_, index) => {
            const button = document.createElement('button');
            button.textContent = index + 1;
            button.className = 'navigator-btn w-10 h-10 rounded-md font-semibold flex items-center justify-center';
            const answer = appState.currentQuiz.userAnswers[index];
            if (answer === null) button.classList.add('unanswered');
            else if (answer.isCorrect) button.classList.add('correct');
            else button.classList.add('incorrect');
            if (appState.currentQuiz.flaggedIndices.has(index)) {
                const flagIcon = document.createElement('i');
                flagIcon.className = 'fas fa-flag flag-icon';
                button.appendChild(flagIcon);
            }
            button.addEventListener('click', () => {
                appState.currentQuiz.currentQuestionIndex = index;
                showQuestion();
                modalBackdrop.classList.add('hidden');
            });
            navigatorGrid.appendChild(button);
        });
        // Close all other modals before opening navigator
        [confirmationModal, imageViewerModal, userCardModal, messengerModal, noteModal, clearLogModal, announcementsModal, osceNavigatorModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
            if (modal) modal.classList.add('hidden');
        });
        questionNavigatorModal.classList.remove('hidden');
        modalBackdrop.classList.remove('hidden');
    }

    function handleLogout() {
        showConfirmationModal('Log Out?', 'Are you sure you want to log out?', () => {
            appState.currentUser = null;
            appState.navigationHistory = [];
            usernameInput.value = '';
            passwordInput.value = '';
            showScreen(loginContainer);
            modalBackdrop.classList.add('hidden');
        });
    }

    function triggerEndQuiz(isForced = false) {
        if (appState.currentQuiz.isReviewMode) {
            showMainMenuScreen();
            return;
        }
        if (isForced) {
            showResults();
            return;
        }
        showConfirmationModal('End Quiz?', 'Are you sure you want to end the quiz?', () => {
            modalBackdrop.classList.add('hidden');
            showResults();
        });
    }

    function handleBackNavigation() {
        if (appState.navigationHistory.length > 1) {
            appState.navigationHistory.pop();
            const previousPage = appState.navigationHistory[appState.navigationHistory.length - 1];
            previousPage();
        }
    }

    function startFreeTest() {
        if (appState.allQuestions.length === 0) {
            alert("Questions are still loading, please wait a moment.");
            return;
        }
        const shuffled = [...appState.allQuestions].sort(() => 0.5 - Math.random());
        const sampleQuestions = shuffled.slice(0, 10);
        appState.currentUser = { Name: 'Guest', UniqueID: `guest_${Date.now()}`, Role: 'Guest' };
        launchQuiz(sampleQuestions, "Free Sample Test");
    }

    function startIncorrectReview() {
        const incorrectQuestions = appState.currentQuiz.originalQuestions.filter((question, index) => {
            const answer = appState.currentQuiz.originalUserAnswers[index];
            return answer && !answer.isCorrect;
        });
        const pastAnswers = appState.currentQuiz.originalUserAnswers.filter(a => a && !a.isCorrect);
        const config = { isReview: true, pastAnswers: pastAnswers };
        launchQuiz(incorrectQuestions, quizTitle.textContent.replace('Review: ', ''), config);
    }

    async function startFullQuizReview(logId, title) {
        showScreen(quizContainer);
        questionContainer.classList.add('hidden');
        controlsContainer.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        progressText.textContent = 'Loading review...';

        try {
            const response = await fetch(`${API_URL}?request=reviewQuiz&logId=${encodeURIComponent(logId)}&userId=${appState.currentUser.UniqueID}`);
            if (!response.ok) throw new Error('Failed to fetch review data.');

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const reviewQuestions = data.reviewData.map(item => parseQuestions([item.question])[0]);
            const pastAnswers = data.reviewData.map(item => {
                const question = parseQuestions([item.question])[0];
                const correctOption = question.answerOptions.find(opt => opt.isCorrect);
                return {
                    answer: item.userAnswer,
                    isCorrect: item.userAnswer === correctOption.text
                };
            });

            const config = { isReview: true, pastAnswers: pastAnswers };
            launchQuiz(reviewQuestions, title, config);

        } catch (error) {
            console.error("Error starting full quiz review:", error);
            progressText.textContent = `Error: ${error.message}`;
        }
    }

    // --- NOTES FUNCTIONS ---
    function showNotesScreen() {
        showScreen(notesContainer);
        appState.navigationHistory.push(showNotesScreen);
        renderNotes('quizzes');
    }

    function renderNotes(filter) {
        notesList.innerHTML = '';
        document.querySelectorAll('#notes-container .filter-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`notes-filter-${filter}`).classList.add('active');

        const notesToDisplay = filter === 'quizzes' ? appState.userQuizNotes : appState.userLectureNotes;

        if (notesToDisplay.length === 0) {
            notesList.innerHTML = `<p class="text-center text-slate-500">No notes found for this category.</p>`;
            return;
        }

        notesToDisplay.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'p-4 bg-white rounded-lg border border-slate-200 shadow-sm';

            let title = 'Note';
            let itemId = null;
            let noteType = '';

            if (filter === 'quizzes') {
                const question = appState.allQuestions.find(q => q.UniqueID === note.QuizID);
                title = question ? `Note on: ${question.question.substring(0, 50)}...` : 'Note on deleted question';
                itemId = note.QuizID;
                noteType = 'quiz';
            } else {
                const lecture = Object.values(appState.groupedLectures).flatMap(c => c.topics).find(t => t.id === note.LectureID);
                title = lecture ? `Note on: ${lecture.name}` : 'Note on deleted lecture';
                itemId = note.LectureID;
                noteType = 'lecture';
            }

            noteItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-slate-700 flex-grow">${title}</h4>
                    <div class="flex-shrink-0 ml-4">
                        <button class="edit-note-btn text-blue-500 hover:text-blue-700 mr-2" title="Edit Note"><i class="fas fa-edit"></i></button>
                        <button class="delete-note-btn text-red-500 hover:text-red-700" title="Delete Note"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="text-slate-600 mt-2 whitespace-pre-wrap">${note.NoteText}</p>
            `;

            noteItem.querySelector('.edit-note-btn').addEventListener('click', () => {
                openNoteModal(noteType, itemId, title.replace('Note on: ', ''));
            });
            noteItem.querySelector('.delete-note-btn').addEventListener('click', () => {
                handleDeleteNote(noteType, note.UniqueID);
            });

            notesList.appendChild(noteItem);
        });
    }

    function openNoteModal(type, itemId, itemTitle) {
        appState.currentNote = { type, itemId, itemTitle };
        let existingNote;

        if (type === 'quiz') {
            noteModalTitle.textContent = `Note on: ${itemTitle.substring(0, 40)}...`;
            existingNote = appState.userQuizNotes.find(n => n.QuizID === itemId);
        } else { // 'lecture'
            noteModalTitle.textContent = `Note on: ${itemTitle}`;
            existingNote = appState.userLectureNotes.find(n => n.LectureID === itemId);
        }

        noteTextarea.value = existingNote ? existingNote.NoteText : '';
        // Close all other modals before opening note modal
        [confirmationModal, questionNavigatorModal, imageViewerModal, userCardModal, messengerModal, clearLogModal, announcementsModal, osceNavigatorModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
            if (modal) modal.classList.add('hidden');
        });
        modalBackdrop.classList.remove('hidden');
        noteModal.classList.remove('hidden');
    }

    function handleSaveNote() {
        const noteText = noteTextarea.value;
        const { type, itemId } = appState.currentNote;
        const uniqueId = `${appState.currentUser.UniqueID}_${itemId}`;

        const payload = {
            eventType: type === 'quiz' ? 'saveQuizNote' : 'saveLectureNote',
            uniqueId: uniqueId,
            userId: appState.currentUser.UniqueID,
            itemId: itemId,
            noteText: noteText
        };

        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        }).catch(err => console.error("Failed to save note:", err));

        // Update local data for immediate UI feedback
        if (type === 'quiz') {
            const existingNoteIndex = appState.userQuizNotes.findIndex(n => n.QuizID === itemId);
            if (existingNoteIndex > -1) {
                appState.userQuizNotes[existingNoteIndex].NoteText = noteText;
            } else {
                appState.userQuizNotes.push({ UniqueID: uniqueId, QuizID: itemId, NoteText: noteText });
            }
            if (quizContainer.style.display !== 'none') {
                quizNoteBtn.classList.toggle('has-note', noteText.length > 0);
            }
        } else {
            const existingNoteIndex = appState.userLectureNotes.findIndex(n => n.LectureID === itemId);
            if (existingNoteIndex > -1) {
                appState.userLectureNotes[existingNoteIndex].NoteText = noteText;
            } else {
                appState.userLectureNotes.push({ UniqueID: uniqueId, LectureID: itemId, NoteText: noteText });
            }
            renderLectures(lectureSearchInput.value); // Re-render to update icon
        }

        modalBackdrop.classList.add('hidden');
        noteModal.classList.add('hidden');
    }

    function handleDeleteNote(noteType, uniqueId) {
        showConfirmationModal('Delete Note?', 'Are you sure you want to permanently delete this note?', () => {
            const payload = {
                eventType: noteType === 'quiz' ? 'deleteQuizNote' : 'deleteLectureNote',
                uniqueId: uniqueId
            };

            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            }).catch(err => console.error("Failed to delete note:", err));

            // Update local data for immediate UI feedback
            if (noteType === 'quiz') {
                appState.userQuizNotes = appState.userQuizNotes.filter(n => n.UniqueID !== uniqueId);
            } else {
                appState.userLectureNotes = appState.userLectureNotes.filter(n => n.UniqueID !== uniqueId);
            }

            // Re-render the currently visible screen if it's affected
            if (notesContainer.style.display !== 'none') {
                renderNotes(notesFilterQuizzes.classList.contains('active') ? 'quizzes' : 'lectures');
            } else if (lecturesContainer.style.display !== 'none') {
                renderLectures(lectureSearchInput.value);
            } else if (quizContainer.style.display !== 'none') {
                const currentQuestion = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
                const hasNote = appState.userQuizNotes.some(note => note.QuizID === currentQuestion.UniqueID);
                quizNoteBtn.classList.toggle('has-note', hasNote);
            }

            modalBackdrop.classList.add('hidden');
        });
    }

    function handleClearLogs(logType) {
        let eventType = '';
        if (logType === 'quiz') eventType = 'clearQuizLogs';
        else if (logType === 'lecture') eventType = 'clearLectureLogs';
        else if (logType === 'all') eventType = 'clearAllLogs';
        else return;

        const payload = {
            eventType: eventType,
            userId: appState.currentUser.UniqueID
        };

        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        }).catch(err => console.error("Failed to clear logs:", err));

        // Update local data for immediate UI feedback
        if (logType === 'quiz') {
            appState.fullActivityLog = appState.fullActivityLog.filter(log => log.eventType !== 'FinishQuiz');
        } else if (logType === 'lecture') {
            appState.fullActivityLog = appState.fullActivityLog.filter(log => log.eventType !== 'ViewLecture');
        } else {
            appState.fullActivityLog = [];
        }
        renderFilteredLog('all');
        modalBackdrop.classList.add('hidden');
        clearLogModal.classList.add('hidden');
    }

    function updateWatermark(user) {
        const watermarkOverlay = document.getElementById('watermark-overlay');
        if (!user || user.Role === 'Guest') {
            watermarkOverlay.classList.add('hidden');
            return;
        }

        watermarkOverlay.innerHTML = ''; // Clear previous watermark
        const date = new Date().toLocaleDateString('en-GB');

        const watermarkItem = document.createElement('div');
        watermarkItem.className = 'flex flex-col items-end text-slate-900';
        watermarkItem.innerHTML = `
            <img src="https://raw.githubusercontent.com/doctorbishoy/Plasticology-/main/Plasticology%202025%20Logo%20white%20outline.png" alt="Logo" class="h-10 opacity-50" style="filter: invert(1);">
            <span class="font-semibold text-xs">${user.Name}</span>
            <span class="text-xs">${date}</span>
        `;
        watermarkOverlay.appendChild(watermarkItem);
    }

    async function startIncorrectQuestionsQuiz() {
        loader.classList.remove('hidden');
        loadingText.textContent = 'Loading your mistakes...';
        loadingText.classList.remove('hidden');
        try {
            const response = await fetch(`${API_URL}?request=getIncorrectQuestions&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Failed to fetch your mistakes.');

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            if (data.questions.length === 0) {
                showConfirmationModal('All Clear!', 'You have no incorrect questions to practice. Well done!', () => modalBackdrop.classList.add('hidden'));
                return;
            }

            const mistakeQuestions = parseQuestions(data.questions);
            const shuffled = [...mistakeQuestions].sort(() => Math.random() - 0.5);
            launchQuiz(shuffled, "Practice Mistakes", { isMistakePractice: true });

        } catch (error) {
            console.error("Error starting mistake practice:", error);
            mockError.textContent = error.message;
            mockError.classList.remove('hidden');
        } finally {
            loader.classList.add('hidden');
            loadingText.classList.add('hidden');
        }
    }

    async function startBookmarkedQuestionsQuiz() {
        const bookmarkedIds = Array.from(appState.bookmarkedQuestions);
        if (bookmarkedIds.length === 0) {
            showConfirmationModal('No Bookmarks', 'You have not bookmarked any questions yet.', () => modalBackdrop.classList.add('hidden'));
            return;
        }

        const bookmarkedQuestions = appState.allQuestions.filter(q => bookmarkedIds.includes(q.UniqueID));
        const shuffled = [...bookmarkedQuestions].sort(() => Math.random() - 0.5);
        launchQuiz(shuffled, "Bookmarked Questions");
    }

    function logIncorrectAnswer(questionId, userAnswer) {
        const payload = {
            eventType: 'logIncorrectAnswer',
            userId: appState.currentUser.UniqueID,
            questionId: questionId,
            userAnswer: userAnswer
        };
        fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
            .catch(err => console.error("Failed to log incorrect answer:", err));
    }

    function logCorrectedMistake(questionId) {
        const payload = {
            eventType: 'logCorrectedMistake',
            userId: appState.currentUser.UniqueID,
            questionId: questionId
        };
        fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) })
            .catch(err => console.error("Failed to log corrected mistake:", err));
    }

    function displayAnnouncement() {
        const banner = document.getElementById('announcement-banner');
        if (appState.allAnnouncements.length === 0) {
            banner.classList.add('hidden');
            return;
        }

        const latestAnnouncement = appState.allAnnouncements[0];
        const seenAnnouncementId = localStorage.getItem('seenAnnouncementId');

        if (seenAnnouncementId === latestAnnouncement.UniqueID) {
            banner.classList.add('hidden');
            return;
        }

        banner.innerHTML = `
            <div class="mb-4 p-4 bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 rounded-lg relative">
                <div class="flex">
                    <div class="py-1"><i class="fas fa-bullhorn fa-lg mr-4"></i></div>
                    <div>
                        <p class="font-bold">Latest Update</p>
                        <p class="text-sm">${latestAnnouncement.UpdateMessage}</p>
                    </div>
                </div>
                <button id="close-announcement-btn" class="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button>
            </div>
        `;
        banner.classList.remove('hidden');

        document.getElementById('close-announcement-btn').addEventListener('click', () => {
            banner.classList.add('hidden');
            localStorage.setItem('seenAnnouncementId', latestAnnouncement.UniqueID);
        });
    }

    function showAnnouncementsModal() {
        announcementsList.innerHTML = '';
        if (appState.allAnnouncements.length === 0) {
            announcementsList.innerHTML = `<p class="text-center text-slate-500">No announcements right now.</p>`;
        } else {
            appState.allAnnouncements.forEach(ann => {
                const annItem = document.createElement('div');
                annItem.className = 'p-3 border-b';
                const date = new Date(ann.TimeStamp).toLocaleDateString('en-GB');
                annItem.innerHTML = `
                    <p class="font-bold text-slate-700">${ann.UpdateMessage}</p>
                    <p class="text-xs text-slate-400 text-right mt-1">${date}</p>
                `;
                announcementsList.appendChild(annItem);
            });
        }
        // Close all other modals before opening announcements modal
        [confirmationModal, questionNavigatorModal, imageViewerModal, userCardModal, messengerModal, noteModal, clearLogModal, osceNavigatorModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
            if (modal) modal.classList.add('hidden');
        });
        modalBackdrop.classList.remove('hidden');
        announcementsModal.classList.remove('hidden');
    }

    // --- OSCE Functions ---
    function showOsceScreen() {
        if (!checkPermission('OSCEBank')) return;
        showScreen(osceContainer);
        appState.navigationHistory.push(showOsceScreen);
    }

    function startOsceSlayer() {
        const casesWithQuestions = appState.allOsceCases.filter(c => appState.allOsceQuestions.some(q => q.CaseID === c.CaseID));

        if (casesWithQuestions.length === 0) {
            osceError.textContent = "No OSCE cases with questions are available to start.";
            osceError.classList.remove('hidden');
            return;
        }
        const shuffled = [...casesWithQuestions].sort(() => Math.random() - 0.5);

        const totalQuestions = shuffled.reduce((acc, currentCase) => {
            return acc + appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID).length;
        }, 0);

        const totalDuration = totalQuestions * 60; // 1 minute per question
        startOsceQuiz(shuffled, "OSCE Slayer", totalDuration);
    }

    function startCustomOsce() {
        osceError.classList.add('hidden');
        const requestedCount = parseInt(osceCaseCountInput.value, 10);
        if (isNaN(requestedCount) || requestedCount <= 0) {
            osceError.textContent = "Please enter a valid number of cases.";
            osceError.classList.remove('hidden');
            return;
        }

        const timePerQ = parseInt(osceTimePerQInput.value, 10) || 1; // Default to 1 minute
        const timePerQSeconds = timePerQ * 60;

        const selectedChapters = [...chapterSelectOsce.querySelectorAll('input:checked')].map(el => el.value);
        const selectedSources = [...sourceSelectOsce.querySelectorAll('input:checked')].map(el => el.value);

        let filteredCases = appState.allOsceCases;
        if (selectedChapters.length > 0) filteredCases = filteredCases.filter(c => selectedChapters.includes(c.Chapter));
        if (selectedSources.length > 0) filteredCases = filteredCases.filter(c => selectedSources.includes(c.Source));

        const casesWithQuestions = filteredCases.filter(c => appState.allOsceQuestions.some(q => q.CaseID === c.CaseID));

        if (casesWithQuestions.length === 0) {
            osceError.textContent = "No cases with questions match the selected filters.";
            osceError.classList.remove('hidden');
            return;
        }
        if (requestedCount > casesWithQuestions.length) {
            osceError.textContent = `Only ${casesWithQuestions.length} cases match your filters.`;
            osceError.classList.remove('hidden');
            return;
        }

        const shuffled = [...casesWithQuestions].sort(() => Math.random() - 0.5);
        const mockCases = shuffled.slice(0, requestedCount);

        const totalQuestions = mockCases.reduce((acc, currentCase) => {
            return acc + appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID).length;
        }, 0);

        const totalDuration = totalQuestions * timePerQSeconds;
        startOsceQuiz(mockCases, "Custom OSCE", totalDuration);
    }

    function startOsceQuiz(cases, title, totalDuration) {
        appState.currentOsce.cases = cases;
        appState.currentOsce.caseIndex = 0;
        appState.currentOsce.questionIndex = 0;
        appState.currentOsce.userAnswers = {};
        appState.currentOsce.score = 0;
        appState.currentOsce.totalQuestions = cases.reduce((acc, c) => acc + appState.allOsceQuestions.filter(q => q.CaseID === c.CaseID).length, 0);

        showScreen(osceQuizContainer);
        resultsContainer.classList.add('hidden'); // Hide results from previous quiz
        osceQuizTitle.textContent = title;
        startOsceTimer(totalDuration);
        updateOsceScoreDisplay();
        renderOsceQuestion();
    }

    function renderOsceQuestion() {
        const { cases, caseIndex, questionIndex } = appState.currentOsce;
        const currentCase = cases[caseIndex];
        const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID);
        const currentQuestion = caseQuestions[questionIndex];

        if (!currentQuestion) {
            console.error("OSCE Error: Could not find a question for the current case/index.", { case: currentCase, index: questionIndex });
            handleOsceNext();
            return;
        }

        // Render Case Info
        osceCaseTitle.textContent = currentCase.Title;
        osceCaseDescription.textContent = currentCase.CaseDescription;
        osceCaseImageContainer.innerHTML = '';
        if (currentCase.ImageURL) {
            const img = document.createElement('img');
            img.src = currentCase.ImageURL;
            img.alt = 'Case Image';
            img.className = 'max-h-64 rounded-lg mx-auto mb-4 cursor-pointer';
            img.addEventListener('click', () => showImageModal(currentCase.ImageURL));
            osceCaseImageContainer.appendChild(img);
        }

        // Render Question Info
        osceProgressText.textContent = `Case ${caseIndex + 1}/${cases.length} - Question ${questionIndex + 1}/${caseQuestions.length}`;
        osceQuestionText.textContent = currentQuestion.QuestionText;
        osceQuestionImageContainer.innerHTML = '';
        if (currentQuestion.ImageURL) {
            const img = document.createElement('img');
            img.src = currentQuestion.ImageURL;
            img.alt = 'Question Image';
            img.className = 'max-h-48 rounded-lg mx-auto mb-4 cursor-pointer';
            img.addEventListener('click', () => showImageModal(currentQuestion.ImageURL));
            osceQuestionImageContainer.appendChild(img);
        }

        // Render Answer Area
        osceAnswerArea.innerHTML = '';
        osceModelAnswerArea.innerHTML = '';
        osceModelAnswerArea.classList.add('hidden');
        osceSelfCorrectionArea.innerHTML = '';
        osceSelfCorrectionArea.classList.add('hidden');

        const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;
        const userAnswer = appState.currentOsce.userAnswers[answerKey];

        if (currentQuestion.QuestionType === 'MCQ') {
            const shuffledAnswers = [...currentQuestion.answerOptions].sort(() => Math.random() - 0.5);
            shuffledAnswers.forEach(answer => {
                const button = document.createElement('button');
                button.textContent = answer.text;
                button.className = 'answer-btn w-full text-left p-4 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-transparent';
                button.dataset.correct = answer.isCorrect;
                button.dataset.text = answer.text;
                button.addEventListener('click', () => selectOsceAnswer(answer));
                osceAnswerArea.appendChild(button);
            });
            if (userAnswer) {
                showOsceMcqResult();
            }
        } else { // Essay or default
            if (userAnswer) {
                osceModelAnswerArea.innerHTML = `<p class="font-semibold">Model Answer:</p><p>${currentQuestion.EssayModelAnswer}</p>`;
                osceModelAnswerArea.classList.remove('hidden');
                osceSelfCorrectionArea.innerHTML = `<p class="text-center font-bold text-slate-600">You marked this as ${userAnswer.isCorrect ? 'Correct' : 'Incorrect'}.</p>`;
                osceSelfCorrectionArea.classList.remove('hidden');
            } else {
                const showAnswerBtn = document.createElement('button');
                showAnswerBtn.textContent = 'Show Model Answer';
                showAnswerBtn.className = 'action-btn bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700';
                showAnswerBtn.onclick = () => {
                    osceModelAnswerArea.innerHTML = `<p class="font-semibold">Model Answer:</p><p>${currentQuestion.EssayModelAnswer}</p>`;
                    osceModelAnswerArea.classList.remove('hidden');
                    showAnswerBtn.classList.add('hidden');
                    osceSelfCorrectionArea.classList.remove('hidden');
                    osceSelfCorrectionArea.innerHTML = `
                        <p class="text-center font-semibold mb-2">Did you get it right?</p>
                        <div class="flex justify-center gap-4">
                            <button class="self-correct-btn action-btn bg-green-500 text-white font-bold py-2 px-4 rounded-lg" data-correct="true">Correct</button>
                            <button class="self-correct-btn action-btn bg-red-500 text-white font-bold py-2 px-4 rounded-lg" data-correct="false">Incorrect</button>
                        </div>
                    `;
                    osceSelfCorrectionArea.querySelectorAll('.self-correct-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => handleOsceSelfCorrection(e.target.dataset.correct === 'true'));
                    });
                };
                osceAnswerArea.appendChild(showAnswerBtn);
            }
        }

        // Update button states
        oscePreviousBtn.disabled = caseIndex === 0 && questionIndex === 0;
        osceNextBtn.textContent = (caseIndex === cases.length - 1 && questionIndex === caseQuestions.length - 1) ? 'Finish' : 'Next';
    }

    function selectOsceAnswer(selectedAnswer) {
        const { cases, caseIndex, questionIndex } = appState.currentOsce;
        const currentCase = cases[caseIndex];
        const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID);
        const currentQuestion = caseQuestions[questionIndex];
        if (!currentQuestion) return;

        const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;
        if (appState.currentOsce.userAnswers[answerKey]) return; // Already answered

        appState.currentOsce.userAnswers[answerKey] = { answer: selectedAnswer.text, isCorrect: selectedAnswer.isCorrect };
        if (selectedAnswer.isCorrect) {
            appState.currentOsce.score++;
        }
        updateOsceScoreDisplay();
        showOsceMcqResult();
    }

    function showOsceMcqResult() {
        const { cases, caseIndex, questionIndex, userAnswers } = appState.currentOsce;
        const currentCase = cases[caseIndex];
        const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID);
        const currentQuestion = caseQuestions[questionIndex];
        const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;
        const userAnswer = userAnswers[answerKey];

        Array.from(osceAnswerArea.querySelectorAll('.answer-btn')).forEach(button => {
            button.disabled = true;
            if (button.dataset.correct === 'true') {
                button.classList.add('correct');
            } else if (userAnswer && button.dataset.text === userAnswer.answer) {
                button.classList.add('incorrect', 'user-choice');
            }
        });
    }

    function handleOsceSelfCorrection(isCorrect) {
        const { cases, caseIndex, questionIndex } = appState.currentOsce;
        const currentCase = cases[caseIndex];
        const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID);
        const currentQuestion = caseQuestions[questionIndex];
        const answerKey = `${currentCase.CaseID}_${currentQuestion.QuestionID}`;

        if (appState.currentOsce.userAnswers[answerKey]) return; // Already answered

        appState.currentOsce.userAnswers[answerKey] = { answer: isCorrect ? 'Correct' : 'Incorrect', isCorrect: isCorrect };
        if (isCorrect) {
            appState.currentOsce.score++;
        }
        updateOsceScoreDisplay();
        osceSelfCorrectionArea.innerHTML = `<p class="text-center font-bold text-slate-600">Your answer has been recorded.</p>`;
    }

    function updateOsceScoreDisplay() {
        const { score, totalQuestions } = appState.currentOsce;
        osceScoreDisplay.textContent = `Score: ${score}/${totalQuestions}`;
    }

    function startOsceTimer(durationInSeconds) {
        clearInterval(appState.currentOsce.timerInterval);
        let timeLeft = durationInSeconds;
        osceTimer.textContent = formatTime(timeLeft);
        appState.currentOsce.timerInterval = setInterval(() => {
            timeLeft--;
            osceTimer.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(appState.currentOsce.timerInterval);
                endOsceQuiz(true); // Force end due to time up
            }
        }, 1000);
    }

    function handleOsceNext() {
        const { cases, caseIndex, questionIndex } = appState.currentOsce;
        const currentCase = cases[caseIndex];
        const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === currentCase.CaseID);

        if (questionIndex < caseQuestions.length - 1) {
            appState.currentOsce.questionIndex++;
        } else if (caseIndex < cases.length - 1) {
            appState.currentOsce.caseIndex++;
            appState.currentOsce.questionIndex = 0;
        } else {
            endOsceQuiz(true); // Force end as it's the last question
            return;
        }
        renderOsceQuestion();
    }

    function handleOscePrevious() {
        if (appState.currentOsce.questionIndex > 0) {
            appState.currentOsce.questionIndex--;
        } else if (appState.currentOsce.caseIndex > 0) {
            appState.currentOsce.caseIndex--;
            const prevCase = appState.currentOsce.cases[appState.currentOsce.caseIndex];
            const prevCaseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === prevCase.CaseID);
            appState.currentOsce.questionIndex = prevCaseQuestions.length - 1;
        }
        renderOsceQuestion();
    }

    function endOsceQuiz(isForced = false) {
        clearInterval(appState.currentOsce.timerInterval);
        if (isForced) {
            showOsceResults();
        } else {
            showConfirmationModal('End OSCE?', 'Are you sure you want to end this OSCE session?', () => {
                modalBackdrop.classList.add('hidden');
                showOsceResults();
            });
        }
    }

    function showOsceResults() {
        showScreen(quizContainer);

        questionContainer.classList.add('hidden');
        controlsContainer.classList.add('hidden');

        resultsContainer.classList.remove('hidden');

        resultsTitle.textContent = "OSCE Complete!";
        resultsScoreText.innerHTML = `Your score is <span id="score-text" class="font-bold">${appState.currentOsce.score}</span> out of <span id="total-questions" class="font-bold">${appState.currentOsce.totalQuestions}</span>.`;

        restartBtn.classList.add('hidden');
        reviewIncorrectBtn.classList.add('hidden');
    }

    function showOsceNavigator() {
        osceNavigatorContent.innerHTML = '';
        appState.currentOsce.cases.forEach((caseItem, caseIdx) => {
            const caseDiv = document.createElement('div');
            caseDiv.className = 'border-b pb-2';
            const caseTitle = document.createElement('h4');
            caseTitle.className = 'font-bold text-slate-700';
            caseTitle.textContent = `Case ${caseIdx + 1}: ${caseItem.Title}`;
            caseDiv.appendChild(caseTitle);

            const questionsGrid = document.createElement('div');
            questionsGrid.className = 'grid grid-cols-5 sm:grid-cols-8 gap-2 mt-2';

            const caseQuestions = appState.allOsceQuestions.filter(q => q.CaseID === caseItem.CaseID);
            caseQuestions.forEach((q, qIdx) => {
                const button = document.createElement('button');
                button.textContent = qIdx + 1;
                button.className = 'navigator-btn w-10 h-10 rounded-md font-semibold flex items-center justify-center';
                const answerKey = `${caseItem.CaseID}_${q.QuestionID}`;
                const answer = appState.currentOsce.userAnswers[answerKey];

                if (!answer) {
                    button.classList.add('unanswered');
                } else if (answer.isCorrect) {
                    button.classList.add('correct');
                } else {
                    button.classList.add('incorrect');
                }

                button.addEventListener('click', () => {
                    appState.currentOsce.caseIndex = caseIdx;
                    appState.currentOsce.questionIndex = qIdx;
                    renderOsceQuestion();
                    modalBackdrop.classList.add('hidden');
                });
                questionsGrid.appendChild(button);
            });
            caseDiv.appendChild(questionsGrid);
            osceNavigatorContent.appendChild(caseDiv);
        });

        // Close all other modals before opening OSCE navigator
        [confirmationModal, questionNavigatorModal, imageViewerModal, userCardModal, messengerModal, noteModal, clearLogModal, announcementsModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
            if (modal) modal.classList.add('hidden');
        });
        modalBackdrop.classList.remove('hidden');
        osceNavigatorModal.classList.remove('hidden');
    }

    // --- ADDED: Learning Mode Functions ---
    function showLearningModeBrowseScreen() {
        if (!checkPermission('LerningMode')) return;
        showScreen(learningModeContainer);
        learningModeControls.classList.remove('hidden');
        learningModeViewer.classList.add('hidden');
        appState.navigationHistory.push(showLearningModeBrowseScreen);
    }

    function launchLearningMode(title, questions) {
        showScreen(learningModeContainer);

        appState.currentLearning.questions = questions;
        appState.currentLearning.currentIndex = 0;
        appState.currentLearning.title = title;

        learningModeControls.classList.add('hidden');
        learningModeViewer.classList.remove('hidden');
        learningTitle.textContent = `Studying: ${title}`;

        showLearningQuestion();
    }

    function showLearningQuestion() {
        const { questions, currentIndex } = appState.currentLearning;
        const currentQuestion = questions[currentIndex];

        learningImageContainer.innerHTML = '';
        if (currentQuestion.ImageURL) {
            const img = document.createElement('img');
            img.src = currentQuestion.ImageURL;
            img.alt = 'Question Image';
            img.className = 'max-h-48 rounded-lg mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity';
            img.addEventListener('click', () => showImageModal(currentQuestion.ImageURL));
            learningImageContainer.appendChild(img);
        }

        learningQuestionText.textContent = currentQuestion.question;
        learningProgressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
        learningSourceText.textContent = `Source: ${currentQuestion.source || 'N/A'} | Chapter: ${currentQuestion.chapter || 'N/A'}`;

        learningAnswerButtons.innerHTML = '';
        currentQuestion.answerOptions.forEach(answer => {
            const answerDiv = document.createElement('div');
            const button = document.createElement('button');
            button.textContent = answer.text;
            button.className = 'learning-answer-btn w-full text-left p-4 rounded-lg';
            button.disabled = true;

            if (answer.isCorrect) {
                button.classList.add('correct');
                const rationale = document.createElement('p');
                rationale.className = 'learning-rationale';
                rationale.textContent = answer.rationale || 'No rationale provided for this answer.';
                answerDiv.appendChild(button);
                answerDiv.appendChild(rationale);
            } else {
                answerDiv.appendChild(button);
            }

            learningAnswerButtons.appendChild(answerDiv);
        });

        learningPreviousBtn.disabled = currentIndex === 0;
        learningPreviousBtn.classList.toggle('opacity-50', currentIndex === 0);

        learningNextBtn.disabled = currentIndex === questions.length - 1;
        learningNextBtn.classList.toggle('opacity-50', currentIndex === questions.length - 1);
    }

    function handleLearningNext() {
        if (appState.currentLearning.currentIndex < appState.currentLearning.questions.length - 1) {
            appState.currentLearning.currentIndex++;
            showLearningQuestion();
        }
    }

    function handleLearningPrevious() {
        if (appState.currentLearning.currentIndex > 0) {
            appState.currentLearning.currentIndex--;
            showLearningQuestion();
        }
    }

    function handleLearningSearch() {
        const searchTerm = learningSearchInput.value.trim().toLowerCase();
        if (searchTerm.length < 3) {
            learningSearchError.textContent = 'Please enter at least 3 characters to search.';
            learningSearchError.classList.remove('hidden');
            return;
        }
        learningSearchError.classList.add('hidden');

        const filteredQuestions = appState.allQuestions.filter(q =>
            q.question.toLowerCase().includes(searchTerm) ||
            q.answerOptions.some(opt => opt.text.toLowerCase().includes(searchTerm))
        );

        if (filteredQuestions.length === 0) {
            learningSearchError.textContent = `No questions found for "${learningSearchInput.value}".`;
            learningSearchError.classList.remove('hidden');
        } else {
            launchLearningMode(`Search Results for "${learningSearchInput.value}"`, filteredQuestions);
        }
    }

    function handleQBankSearch() {
        const searchTerm = qbankSearchInput.value.trim().toLowerCase();
        const errorEl = qbankSearchError;
        errorEl.classList.add('hidden');
        qbankSearchResultsContainer.classList.add('hidden');

        if (searchTerm.length < 3) {
            errorEl.textContent = 'Please enter at least 3 characters to search.';
            errorEl.classList.remove('hidden');
            return;
        }

        const filteredQuestions = appState.allQuestions.filter(q =>
            q.question.toLowerCase().includes(searchTerm) ||
            q.answerOptions.some(opt => opt.text.toLowerCase().includes(searchTerm))
        );

        appState.qbankSearchResults = filteredQuestions; // Store results

        if (filteredQuestions.length === 0) {
            errorEl.textContent = `No questions found for "${qbankSearchInput.value}".`;
            errorEl.classList.remove('hidden');
        } else {
            const sources = [...new Set(filteredQuestions.map(q => q.source || 'N/A'))].join(', ');
            qbankSearchResultsInfo.textContent = `Found ${filteredQuestions.length} questions for "${qbankSearchInput.value}". Sources: ${sources}`;
            qbankSearchResultsContainer.classList.remove('hidden');
        }
    }

    function startSearchedQuiz() {
        const requestedCount = parseInt(qbankSearchQCount.value, 10);
        const errorEl = qbankSearchError;
        errorEl.classList.add('hidden');

        const questionsToUse = appState.qbankSearchResults;

        if (isNaN(requestedCount) || requestedCount <= 0) {
            // If input is empty, use all questions
            const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
            launchQuiz(shuffled, `Quiz for "${qbankSearchInput.value}"`);
        } else {
            if (requestedCount > questionsToUse.length) {
                errorEl.textContent = `Only ${questionsToUse.length} questions found. Please request a smaller number.`;
                errorEl.classList.remove('hidden');
            } else {
                const shuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
                const quizQuestions = shuffled.slice(0, requestedCount);
                launchQuiz(quizQuestions, `Quiz for "${qbankSearchInput.value}"`);
            }
        }
    }

    // --- START: NEW USER CARD FUNCTIONS ---
    const AVATAR_BASE_URL = "https://api.dicebear.com/7.x/initials/svg?seed=";
    const AVATAR_OPTIONS = [
        "User", "Avatar", "Profile", "Person", "Guest", "Student", "Doctor", "Nurse",
        "Medical", "Health", "Science", "Knowledge", "Book", "Study", "Exam", "Quiz",
        "Success", "Champion", "Winner", "Learner"
    ]; // Example seeds for avatars

    async function showUserCardModal(isLoginFlow = false) {
        if (!appState.currentUser || appState.currentUser.Role === 'Guest') {
            showConfirmationModal('Guest Mode', 'Please log in to access your profile card.', () => modalBackdrop.classList.add('hidden'));
            return;
        }

        // Close all other modals before opening user card modal
        if (!isLoginFlow) { // Only close others if not part of the login flow
            [confirmationModal, questionNavigatorModal, imageViewerModal, messengerModal, noteModal, clearLogModal, announcementsModal, osceNavigatorModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
                if (modal) modal.classList.add('hidden');
            });
        }
        modalBackdrop.classList.remove('hidden');
        userCardModal.classList.remove('hidden');
        profileEditView.classList.add('hidden');
        profileDetailsView.classList.remove('hidden');
        profileEditError.classList.add('hidden');

        cardUserName.textContent = appState.currentUser.Name;
        userAvatar.src = AVATAR_BASE_URL + appState.currentUser.Name; // Default avatar

        try {
            const response = await fetch(`${API_URL}?request=getUserCardData&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Failed to fetch user card data.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            appState.userCardData = data.cardData;
            renderUserCard(appState.userCardData);
            populateAvatarSelection(); // Populate avatars once data is loaded
        } catch (error) {
            console.error("Error loading user card data:", error);
            profileEditError.textContent = `Error loading profile: ${error.message}`;
            profileEditError.classList.remove('hidden');
        }
    }

    function renderUserCard(cardData) {
        if (!cardData) return;

        // Display nickname if available, otherwise display full name
        const displayName = cardData.Nickname && cardData.Nickname.trim() !== '' ? cardData.Nickname : appState.currentUser.Name;
        cardUserName.textContent = displayName;
        cardUserNickname.textContent = cardData.Nickname && cardData.Nickname.trim() !== '' ? `(${appState.currentUser.Name})` : ''; // Show real name in parentheses if nickname is used

        cardQuizScore.textContent = cardData.QuizScore !== undefined ? cardData.QuizScore : '0';
        userAvatar.src = cardData.User_Img || (AVATAR_BASE_URL + appState.currentUser.Name);
        headerUserAvatar.src = userAvatar.src; // Update header avatar

        if (cardData.ExamDate) {
            const examDate = new Date(cardData.ExamDate);
            if (!isNaN(examDate)) {
                cardExamDate.textContent = examDate.toLocaleDateString('en-GB');
                const daysLeft = calculateDaysLeft(examDate);
                cardDaysLeft.textContent = daysLeft >= 0 ? `${daysLeft} days left` : 'Exam passed';
                cardDaysLeft.classList.toggle('text-red-600', daysLeft < 0);
                cardDaysLeft.classList.toggle('text-green-600', daysLeft >= 0);
            } else {
                cardExamDate.textContent = 'Invalid Date';
                cardDaysLeft.textContent = 'N/A';
            }
        } else {
            cardExamDate.textContent = 'Not Set';
            cardDaysLeft.textContent = 'N/A';
        }
    }

    function calculateDaysLeft(examDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate day calculation
        examDate.setHours(0, 0, 0, 0);

        const diffTime = examDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    function toggleProfileEditMode(isEditing) {
        if (isEditing) {
            profileDetailsView.classList.add('hidden');
            profileEditView.classList.remove('hidden');
            editNickname.value = appState.userCardData.Nickname || '';
            editExamDate.value = appState.userCardData.ExamDate ? new Date(appState.userCardData.ExamDate).toISOString().split('T')[0] : '';
            // Select current avatar
            avatarSelectionGrid.querySelectorAll('img').forEach(img => {
                img.classList.remove('border-blue-500', 'border-2');
                if (img.src === userAvatar.src) {
                    img.classList.add('border-blue-500', 'border-2');
                }
            });
        } else {
            profileDetailsView.classList.remove('hidden');
            profileEditView.classList.add('hidden');
            profileEditError.classList.add('hidden');
        }
    }

    function populateAvatarSelection() {
        avatarSelectionGrid.innerHTML = '';
        AVATAR_OPTIONS.forEach(seed => {
            const img = document.createElement('img');
            img.src = AVATAR_BASE_URL + seed;
            img.alt = seed;
            img.className = 'w-12 h-12 rounded-full cursor-pointer hover:opacity-80 transition-opacity';
            if (userAvatar.src === img.src) {
                img.classList.add('border-blue-500', 'border-2');
            }
            img.addEventListener('click', () => {
                avatarSelectionGrid.querySelectorAll('img').forEach(i => i.classList.remove('border-blue-500', 'border-2'));
                img.classList.add('border-blue-500', 'border-2');
                userAvatar.src = img.src; // Update the main avatar preview
            });
            avatarSelectionGrid.appendChild(img);
        });
    }

    async function handleSaveProfile() {
        profileEditError.classList.add('hidden');
        const newNickname = editNickname.value.trim();
        const newExamDate = editExamDate.value;
        const newAvatarUrl = userAvatar.src; // Get the currently selected avatar URL

        const payload = {
            eventType: 'updateUserCardData',
            userId: appState.currentUser.UniqueID,
            nickname: newNickname,
            examDate: newExamDate,
            userImg: newAvatarUrl
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // Use no-cors for simple requests to Google Apps Script
                body: JSON.stringify(payload)
            });

            // Update local state immediately
            appState.userCardData.Nickname = newNickname;
            appState.userCardData.ExamDate = newExamDate;
            appState.userCardData.User_Img = newAvatarUrl;
            renderUserCard(appState.userCardData); // Re-render user card to reflect changes
            updateUserProfileHeader(); // Update header with new nickname/avatar
            toggleProfileEditMode(false); // Switch back to view mode
            showConfirmationModal('Profile Updated', 'Your profile has been successfully updated!', () => modalBackdrop.classList.add('hidden'));

        } catch (error) {
            console.error("Error saving profile:", error);
            profileEditError.textContent = `Failed to save profile: ${error.message}. Please try again.`;
            profileEditError.classList.remove('hidden');
        }
    }

    function updateUserProfileHeader() {
        if (appState.currentUser && appState.userCardData) {
            const displayName = appState.userCardData.Nickname && appState.userCardData.Nickname.trim() !== ''
                ? appState.userCardData.Nickname
                : appState.currentUser.Name;
            userNameDisplay.textContent = displayName;
            headerUserAvatar.src = appState.userCardData.User_Img || (AVATAR_BASE_URL + appState.currentUser.Name);
        } else if (appState.currentUser) {
            userNameDisplay.textContent = appState.currentUser.Name;
            headerUserAvatar.src = AVATAR_BASE_URL + appState.currentUser.Name;
        }
    }
    // --- END: NEW USER CARD FUNCTIONS ---

    // --- START: NEW MESSENGER FUNCTIONS ---
    async function showMessengerModal() {
        if (!appState.currentUser || appState.currentUser.Role === 'Guest') {
            showConfirmationModal('Guest Mode', 'Please log in to use the messenger.', () => modalBackdrop.classList.add('hidden'));
            return;
        }

        // Close all other modals before opening messenger modal
        [confirmationModal, questionNavigatorModal, imageViewerModal, userCardModal, noteModal, clearLogModal, announcementsModal, osceNavigatorModal, studyPlannerInitialSetup].forEach(modal => { // ADDED studyPlannerInitialSetup
            if (modal) modal.classList.add('hidden');
        });
        modalBackdrop.classList.remove('hidden');
        messengerModal.classList.remove('hidden');
        messagesList.innerHTML = '<p class="text-center text-slate-500">Loading messages...</p>';
        messengerError.classList.add('hidden');
        messageInput.value = '';

        await fetchAndRenderMessages(); // Fetch and render messages immediately
    }

    async function fetchAndRenderMessages() {
        try {
            const response = await fetch(`${API_URL}?request=getMessages&userId=${appState.currentUser.UniqueID}&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Failed to fetch messages.');
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            appState.userMessages = data.messages || [];
            renderMessages();
        } catch (error) {
            console.error("Error loading messages:", error);
            messengerError.textContent = `Error loading messages: ${error.message}`;
            messengerError.classList.remove('hidden');
        }
    }

    function renderMessages() {
        messagesList.innerHTML = '';
        if (appState.userMessages.length === 0) {
            messagesList.innerHTML = `<p class="text-center text-slate-500">No messages yet. Send your first message!</p>`;
            return;
        }

        appState.userMessages.forEach(msg => {
            const messageDiv = document.createElement('div');
            const timestamp = new Date(msg.Timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            // User's message
            if (msg.UserMessage && String(msg.UserMessage).trim() !== '') {
                messageDiv.innerHTML += `
                    <div class="flex justify-end mb-2">
                        <div class="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                            <p class="text-sm">${msg.UserMessage}</p>
                            <p class="text-xs text-right opacity-80 mt-1">${timestamp} (You)</p>
                        </div>
                    </div>
                `;
            }
            // Admin's reply
            if (msg.AdminReply && String(msg.AdminReply).trim() !== '') {
                messageDiv.innerHTML += `
                    <div class="flex justify-start mb-2">
                        <div class="bg-gray-200 text-slate-800 p-3 rounded-lg max-w-[80%]">
                            <p class="text-sm">${msg.AdminReply}</p>
                            <p class="text-xs text-left opacity-80 mt-1">${timestamp} (Admin)</p>
                        </div>
                    </div>
                `;
            }
            messagesList.appendChild(messageDiv);
        });
        messagesList.scrollTop = messagesList.scrollHeight; // Scroll to bottom
    }

    async function handleSendMessageBtn() {
        messengerError.classList.add('hidden');
        const messageText = messageInput.value.trim();

        if (!messageText) {
            messengerError.textContent = 'Message cannot be empty.';
            messengerError.classList.remove('hidden');
            return;
        }

        if (!appState.currentUser || appState.currentUser.Role === 'Guest') {
            messengerError.textContent = 'Please log in to send messages.';
            messengerError.classList.remove('hidden');
            return;
        }

        sendMessageBtn.disabled = true;
        sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';

        const payload = {
            eventType: 'sendMessage',
            userId: appState.currentUser.UniqueID,
            userName: appState.currentUser.Name,
            message: messageText
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // Keep no-cors for now, but be aware of limitations
                body: JSON.stringify(payload)
            });

            // After sending, re-fetch messages to get potential admin replies
            await fetchAndRenderMessages();
            messageInput.value = ''; // Clear input

        } catch (error) {
            console.error("Error sending message:", error);
            messengerError.textContent = `Failed to send message: ${error.message}. Please try again.`;
            messengerError.classList.remove('hidden');
        } finally {
            sendMessageBtn.disabled = false;
            sendMessageBtn.textContent = 'Send';
        }
    }
    // --- END: NEW MESSENGER FUNCTIONS ---

    // --- START: ROLE PERMISSIONS FUNCTIONS ---
    function checkPermission(feature) {
        if (!appState.currentUser || appState.currentUser.Role === 'Guest') {
            showConfirmationModal('Access Denied', 'Please log in to access this feature.', () => modalBackdrop.classList.add('hidden'));
            return false;
        }
        // If userRoles is not loaded or the specific feature is not defined, assume access is denied.
        // Or, if the feature is explicitly set to FALSE.
        if (!appState.userRoles || appState.userRoles[feature] === undefined || String(appState.userRoles[feature]).toLowerCase() !== 'true') {
            showConfirmationModal('Access Denied', `Your current role does not have access to the "${feature}" feature.`, () => modalBackdrop.classList.add('hidden'));
            return false;
        }
        return true;
    }

    function applyRolePermissions() {
        const role = appState.userRoles;
        if (!role) return; // No role data loaded yet

        // Map feature names to their corresponding buttons/elements
        const featureElements = {
            'Lectures': lecturesBtn,
            'MCQBank': qbankBtn,
            'LerningMode': learningModeBtn,
            'OSCEBank': osceBtn,
            'LeadersBoard': leaderboardBtn,
            'Radio': radioBtn,
            'Library': libraryBtn,
            'StudyPlanner': studyPlannerBtn, // ADDED: Study Planner button
        };

        for (const feature in featureElements) {
            const element = featureElements[feature];
            if (element) {
                const hasAccess = String(role[feature]).toLowerCase() === 'true';
                element.disabled = !hasAccess;
                element.classList.toggle('disabled-feature', !hasAccess); // Add a class for styling disabled features
                // Optionally, change text or add tooltip for disabled features
                if (!hasAccess) {
                    element.title = `Access to ${feature} is not granted for your role.`;
                } else {
                    element.title = ''; // Clear title if access is granted
                }
            }
        }
    }
    // --- END: ROLE PERMISSIONS FUNCTIONS ---

    // --- START: STUDY PLANNER FUNCTIONS ---
    async function showStudyPlannerScreen() {
        if (!checkPermission('StudyPlanner')) return;
        showScreen(studyPlannerContainer);
        appState.navigationHistory.push(showStudyPlannerScreen);
        studyPlannerLoader.classList.remove('hidden');
        studyPlannerContent.classList.add('hidden');
        studyPlannerInitialSetup.classList.add('hidden');
        studyPlannerError.classList.add('hidden');

        await loadUserData(); // Ensure latest study plan and user card data are loaded

        if (!appState.userCardData || !appState.userCardData.ExamDate) {
            promptForExamDate();
        } else if (!appState.studyPlannerData) {
            generateInitialStudyPlanPrompt();
        } else {
            renderStudyPlan();
        }
        studyPlannerLoader.classList.add('hidden');
    }

    function promptForExamDate() {
        studyPlannerInitialSetup.classList.remove('hidden');
        studyPlannerContent.classList.add('hidden');
        studyPlannerExamDateInput.value = appState.userCardData && appState.userCardData.ExamDate ? new Date(appState.userCardData.ExamDate).toISOString().split('T')[0] : '';
        studyPlannerGenerateBtn.textContent = 'Set Exam Date & Generate Plan';
        studyPlannerGenerateBtn.onclick = async () => {
            const examDate = studyPlannerExamDateInput.value;
            if (!examDate) {
                studyPlannerError.textContent = 'Please select your exam date.';
                studyPlannerError.classList.remove('hidden');
                return;
            }
            studyPlannerError.classList.add('hidden');

            // Save exam date to user card
            const payload = {
                eventType: 'updateUserCardData',
                userId: appState.currentUser.UniqueID,
                examDate: examDate
            };
            try {
                await fetch(API_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(payload)
                });
                appState.userCardData.ExamDate = examDate; // Update local state
                generateInitialStudyPlanPrompt(); // Proceed to generate plan
            } catch (error) {
                console.error("Error saving exam date:", error);
                studyPlannerError.textContent = `Failed to save exam date: ${error.message}`;
                studyPlannerError.classList.remove('hidden');
            }
        };
    }

    function generateInitialStudyPlanPrompt() {
        studyPlannerInitialSetup.classList.remove('hidden');
        studyPlannerContent.classList.add('hidden');
        studyPlannerExamDateInput.value = appState.userCardData.ExamDate ? new Date(appState.userCardData.ExamDate).toISOString().split('T')[0] : '';
        studyPlannerExamDateInput.disabled = true; // Disable date input after it's set
        studyPlannerGenerateBtn.textContent = 'Generate Initial Plan';
        studyPlannerGenerateBtn.onclick = generateInitialStudyPlan;
    }

    async function generateInitialStudyPlan() {
        studyPlannerError.classList.add('hidden');
        const examDateStr = appState.userCardData.ExamDate;
        if (!examDateStr) {
            studyPlannerError.textContent = 'Exam date is not set. Please set it first.';
            studyPlannerError.classList.remove('hidden');
            return;
        }

        const examDate = new Date(examDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        examDate.setHours(0, 0, 0, 0);

        const daysRemaining = calculateDaysLeft(examDate);

        if (daysRemaining <= 0) {
            studyPlannerError.textContent = 'Exam date is in the past or today. Please select a future date.';
            studyPlannerError.classList.remove('hidden');
            return;
        }

        const allChapters = Object.keys(appState.groupedLectures);
        const totalLectures = Object.values(appState.groupedLectures).reduce((sum, chapter) => sum + chapter.topics.length, 0);
        const totalQuestions = appState.allQuestions.length;

        const plan = [];
        let currentLectureIndex = 0;
        let currentQuestionIndex = 0;

        const lecturesPerDay = Math.ceil(totalLectures / daysRemaining);
        const questionsPerDay = Math.ceil(totalQuestions / daysRemaining);

        for (let i = 0; i < daysRemaining; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayPlan = {
                date: date.toISOString().split('T')[0],
                tasks: []
            };

            // Add lectures
            let lecturesAdded = 0;
            while (lecturesAdded < lecturesPerDay && currentLectureIndex < allChapters.length) {
                const chapterName = allChapters[currentLectureIndex];
                const chapterLectures = appState.groupedLectures[chapterName].topics;
                if (chapterLectures.length > 0) {
                    dayPlan.tasks.push({
                        type: 'lecture',
                        name: `Study Lectures from ${chapterName}`,
                        chapter: chapterName,
                        count: chapterLectures.length,
                        completed: false
                    });
                    lecturesAdded += chapterLectures.length;
                }
                currentLectureIndex++;
            }

            // Add questions
            let questionsAdded = 0;
            const availableQuestions = appState.allQuestions.slice(currentQuestionIndex);
            if (availableQuestions.length > 0) {
                dayPlan.tasks.push({
                    type: 'quiz',
                    name: `Practice Questions`,
                    count: Math.min(questionsPerDay, availableQuestions.length),
                    completed: false
                });
                currentQuestionIndex += Math.min(questionsPerDay, availableQuestions.length);
                questionsAdded += Math.min(questionsPerDay, availableQuestions.length);
            }

            plan.push(dayPlan);
        }

        appState.studyPlannerData = plan;
        await saveStudyPlanToBackend(plan);
        renderStudyPlan();
    }

    async function saveStudyPlanToBackend(plan) {
        const payload = {
            eventType: 'saveStudyPlan',
            userId: appState.currentUser.UniqueID,
            studyPlan: JSON.stringify(plan)
        };
        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            console.log("Study plan saved successfully.");
        } catch (error) {
            console.error("Error saving study plan:", error);
        }
    }

    function renderStudyPlan() {
        studyPlannerInitialSetup.classList.add('hidden');
        studyPlannerContent.classList.remove('hidden');
        studyPlanDaysContainer.innerHTML = '';
        studyPlanWeaknessesContainer.innerHTML = '';

        if (!appState.studyPlannerData || appState.studyPlannerData.length === 0) {
            studyPlannerContent.innerHTML = `<p class="text-center text-slate-500">No study plan found. Generate one above!</p>`;
            return;
        }

        // Render weaknesses and suggestions
        const weakChapters = identifyWeakChapters();
        if (weakChapters.length > 0) {
            studyPlanWeaknessesContainer.innerHTML = `
                <h4 class="text-lg font-bold text-red-700 mb-2 flex items-center"><i class="fas fa-exclamation-triangle mr-2"></i> Your Weaknesses</h4>
                <p class="text-sm text-slate-600 mb-3">Consider adding review tasks for these chapters:</p>
                <ul class="list-disc list-inside space-y-1">
                    ${weakChapters.map(chapter => `<li>${chapter}</li>`).join('')}
                </ul>
                <hr class="my-4">
            `;
        } else {
            studyPlanWeaknessesContainer.innerHTML = `<p class="text-center text-green-600 font-semibold mb-4">No major weaknesses detected. Keep up the great work!</p><hr class="my-4">`;
        }


        appState.studyPlannerData.forEach((day, dayIndex) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'bg-white rounded-lg shadow-md p-4 mb-4';
            dayDiv.dataset.dayIndex = dayIndex;

            const date = new Date(day.date);
            const today = new Date();
            today.setHours(0,0,0,0);
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today;

            let dateDisplay = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            if (isToday) dateDisplay += ' (Today)';
            if (isPast) dateDisplay += ' (Past)';

            dayDiv.innerHTML = `
                <h4 class="font-bold text-lg mb-3 ${isToday ? 'text-blue-600' : (isPast ? 'text-slate-500' : 'text-slate-800')}">
                    ${dateDisplay}
                </h4>
                <ul class="space-y-2 study-plan-tasks" data-day-index="${dayIndex}">
                    ${day.tasks.map((task, taskIndex) => `
                        <li class="flex items-center justify-between p-2 border rounded-md bg-slate-50 ${task.completed ? 'bg-green-100 border-green-300' : ''}" draggable="true" data-task-index="${taskIndex}">
                            <div class="flex items-center flex-grow">
                                <i class="fas fa-grip-vertical text-slate-400 mr-2 cursor-grab"></i>
                                <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3 task-checkbox" ${task.completed ? 'checked disabled' : ''} data-day-index="${dayIndex}" data-task-index="${taskIndex}">
                                <span class="text-slate-700 ${task.completed ? 'line-through text-slate-500' : ''}">${task.name} ${task.count ? `(${task.count})` : ''}</span>
                                ${task.type === 'quiz' && !task.completed ? `<button class="start-quiz-task-btn ml-auto text-blue-600 hover:text-blue-800 text-sm" data-day-index="${dayIndex}" data-task-index="${taskIndex}"><i class="fas fa-play-circle mr-1"></i> Start Quiz</button>` : ''}
                            </div>
                            <button class="delete-task-btn text-red-500 hover:text-red-700 ml-2" data-day-index="${dayIndex}" data-task-index="${taskIndex}"><i class="fas fa-trash"></i></button>
                        </li>
                    `).join('')}
                </ul>
                <div class="mt-4 flex gap-2">
                    <input type="text" class="add-task-input w-full p-2 border rounded-md text-sm" placeholder="Add custom task...">
                    <button class="add-task-btn bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm">Add</button>
                </div>
            `;
            studyPlanDaysContainer.appendChild(dayDiv);
        });

        addDragAndDropListeners();
        addStudyPlanEventListeners();
    }

    function addDragAndDropListeners() {
        const taskLists = document.querySelectorAll('.study-plan-tasks');
        let draggedItem = null;

        taskLists.forEach(list => {
            list.addEventListener('dragstart', (e) => {
                draggedItem = e.target;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedItem.dataset.taskIndex);
                setTimeout(() => draggedItem.classList.add('opacity-50'), 0);
            });

            list.addEventListener('dragend', () => {
                draggedItem.classList.remove('opacity-50');
                draggedItem = null;
            });

            list.addEventListener('dragover', (e) => {
                e.preventDefault(); // Necessary to allow dropping
                const target = e.target.closest('li');
                if (target && target !== draggedItem && target.parentNode === list) {
                    const boundingBox = target.getBoundingClientRect();
                    const offset = e.clientY - boundingBox.top;
                    if (offset > boundingBox.height / 2) {
                        list.insertBefore(draggedItem, target.nextSibling);
                    } else {
                        list.insertBefore(draggedItem, target);
                    }
                }
            });

            list.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItem) {
                    const fromDayIndex = parseInt(draggedItem.parentNode.dataset.dayIndex);
                    const fromTaskIndex = parseInt(draggedItem.dataset.taskIndex);
                    const toDayIndex = parseInt(list.dataset.dayIndex);
                    const toTaskIndex = Array.from(list.children).indexOf(draggedItem);

                    // Update appState.studyPlannerData
                    const task = appState.studyPlannerData[fromDayIndex].tasks.splice(fromTaskIndex, 1)[0];
                    appState.studyPlannerData[toDayIndex].tasks.splice(toTaskIndex, 0, task);

                    saveStudyPlanToBackend(appState.studyPlannerData);
                    renderStudyPlan(); // Re-render to ensure data consistency and correct indices
                }
            });
        });
    }

    function addStudyPlanEventListeners() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const dayIndex = parseInt(e.target.dataset.dayIndex);
                const taskIndex = parseInt(e.target.dataset.taskIndex);
                const task = appState.studyPlannerData[dayIndex].tasks[taskIndex];
                task.completed = e.target.checked;
                e.target.disabled = e.target.checked; // Disable checkbox if completed
                saveStudyPlanToBackend(appState.studyPlannerData);
                renderStudyPlan(); // Re-render to update styling
            });
        });

        document.querySelectorAll('.delete-task-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const dayIndex = parseInt(e.target.dataset.dayIndex);
                const taskIndex = parseInt(e.target.dataset.taskIndex);
                showConfirmationModal('Delete Task?', 'Are you sure you want to delete this task?', () => {
                    appState.studyPlannerData[dayIndex].tasks.splice(taskIndex, 1);
                    saveStudyPlanToBackend(appState.studyPlannerData);
                    renderStudyPlan();
                    modalBackdrop.classList.add('hidden');
                });
            });
        });

        document.querySelectorAll('.add-task-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const dayDiv = e.target.closest('.bg-white');
                const dayIndex = parseInt(dayDiv.dataset.dayIndex);
                const input = dayDiv.querySelector('.add-task-input');
                const taskName = input.value.trim();
                if (taskName) {
                    appState.studyPlannerData[dayIndex].tasks.push({
                        type: 'custom',
                        name: taskName,
                        completed: false
                    });
                    saveStudyPlanToBackend(appState.studyPlannerData);
                    renderStudyPlan();
                    input.value = '';
                }
            });
        });

        document.querySelectorAll('.start-quiz-task-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const dayIndex = parseInt(e.target.dataset.dayIndex);
                const taskIndex = parseInt(e.target.dataset.taskIndex);
                const task = appState.studyPlannerData[dayIndex].tasks[taskIndex];

                if (task.type === 'quiz' && task.chapter) {
                    const questions = appState.allQuestions.filter(q => q.chapter === task.chapter);
                    if (questions.length > 0) {
                        const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, task.count);
                        launchQuiz(shuffled, `Study Plan Quiz: ${task.chapter}`);
                        // Mark task as completed after quiz starts (or after completion, depending on desired flow)
                        task.completed = true;
                        saveStudyPlanToBackend(appState.studyPlannerData);
                        renderStudyPlan();
                    } else {
                        alert('No questions found for this chapter.');
                    }
                } else if (task.type === 'quiz' && !task.chapter) { // Generic quiz task
                    const shuffled = [...appState.allQuestions].sort(() => Math.random() - 0.5).slice(0, task.count);
                    launchQuiz(shuffled, `Study Plan Quiz`);
                    task.completed = true;
                    saveStudyPlanToBackend(appState.studyPlannerData);
                    renderStudyPlan();
                }
            });
        });
    }

    function updateStudyPlanProgress(eventType, itemName) {
        if (!appState.studyPlannerData) return;

        appState.studyPlannerData.forEach(day => {
            day.tasks.forEach(task => {
                if (!task.completed) {
                    if (eventType === 'lecture' && task.type === 'lecture' && itemName.includes(task.chapter)) {
                        // This is a simplified check. A more robust solution would track individual lectures.
                        // For now, if a lecture from a chapter is viewed, the chapter's lecture task is marked.
                        task.completed = true;
                    } else if (eventType === 'quiz' && task.type === 'quiz' && itemName.includes('Study Plan Quiz')) {
                        // This is a generic quiz task. If a quiz is completed, mark it.
                        task.completed = true;
                    }
                }
            });
        });
        saveStudyPlanToBackend(appState.studyPlannerData);
        renderStudyPlan(); // Re-render to show updated progress
    }

    function identifyWeakChapters() {
        const chapterScores = {}; // { chapterName: { correct: X, total: Y } }

        // Initialize all chapters from appState.allChaptersNames
        appState.allChaptersNames.forEach(chapter => {
            chapterScores[chapter] = { correct: 0, total: 0 };
        });

        // Aggregate quiz results by chapter
        appState.fullActivityLog.filter(log => log.eventType === 'FinishQuiz' && log.details).forEach(log => {
            try {
                const quizDetails = JSON.parse(log.details);
                quizDetails.forEach(detail => {
                    const question = appState.allQuestions.find(q => q.UniqueID === detail.qID);
                    if (question && question.chapter) {
                        const chapter = question.chapter;
                        const isCorrect = question.answerOptions.find(opt => opt.isCorrect).text === detail.ans;

                        if (!chapterScores[chapter]) {
                            chapterScores[chapter] = { correct: 0, total: 0 };
                        }
                        chapterScores[chapter].total++;
                        if (isCorrect) {
                            chapterScores[chapter].correct++;
                        }
                    }
                });
            } catch (e) {
                console.error("Error parsing quiz details for weakness identification:", e);
            }
        });

        const weakChapters = [];
        for (const chapter in chapterScores) {
            const { correct, total } = chapterScores[chapter];
            if (total > 5 && (correct / total < 0.6)) { // Example: more than 5 questions, less than 60% accuracy
                weakChapters.push(chapter);
            }
        }
        return weakChapters.sort();
    }

    // --- END: STUDY PLANNER FUNCTIONS ---


    // --- EVENT LISTENERS ---
    loginForm.addEventListener('submit', handleLogin);
    freeTestBtn.addEventListener('click', startFreeTest);
    lecturesBtn.addEventListener('click', showLecturesScreen);
    qbankBtn.addEventListener('click', showQbankScreen);
    libraryBtn.addEventListener('click', showLibraryScreen);
    notesBtn.addEventListener('click', showNotesScreen);
    leaderboardBtn.addEventListener('click', showLeaderboardScreen);
    announcementsBtn.addEventListener('click', showAnnouncementsModal);
    osceBtn.addEventListener('click', showOsceScreen);
    learningModeBtn.addEventListener('click', showLearningModeBrowseScreen);
    messengerBtn.addEventListener('click', showMessengerModal); // ADDED: Messenger button listener
    studyPlannerBtn.addEventListener('click', showStudyPlannerScreen); // ADDED: Study Planner button listener

    const backButtons = [lecturesBackBtn, qbankBackBtn, listBackBtn, activityBackBtn, libraryBackBtn, notesBackBtn, leaderboardBackBtn, osceBackBtn, learningModeBackBtn, studyPlannerBackBtn]; // ADDED studyPlannerBackBtn
    backButtons.forEach(btn => btn.addEventListener('click', handleBackNavigation));

    globalHomeBtn.addEventListener('click', () => {
        if (appState.currentUser && appState.currentUser.Role === 'Guest') {
            showScreen(loginContainer);
            appState.currentUser = null;
        } else {
            showMainMenuScreen();
        }
    });
    logoutBtn.addEventListener('click', handleLogout);
    activityLogBtn.addEventListener('click', showActivityLog);

    logFilterAll.addEventListener('click', () => renderFilteredLog('all'));
    logFilterQuizzes.addEventListener('click', () => renderFilteredLog('quizzes'));
    logFilterLectures.addEventListener('click', () => renderFilteredLog('lectures'));

    notesFilterQuizzes.addEventListener('click', () => renderNotes('quizzes'));
    notesFilterLectures.addEventListener('click', () => renderNotes('lectures'));

    lectureSearchInput.addEventListener('keyup', (e) => renderLectures(e.target.value));

    startMockBtn.addEventListener('click', handleMockExamStart);
    browseByChapterBtn.addEventListener('click', () => showChapterList('All', false));
    browseBySourceBtn.addEventListener('click', () => showSourceList(false));
    toggleCustomOptionsBtn.addEventListener('click', () => customExamOptions.classList.toggle('visible'));
    practiceMistakesBtn.addEventListener('click', startIncorrectQuestionsQuiz);
    practiceBookmarkedBtn.addEventListener('click', startBookmarkedQuestionsQuiz);

    // --- START: ADD SIMULATION EVENT LISTENER ---
    startSimulationBtn.addEventListener('click', handleStartSimulation);
    // --- END: ADD SIMULATION EVENT LISTENER ---

    hintBtn.addEventListener('click', () => hintText.classList.remove('hidden'));
    flagBtn.addEventListener('click', toggleFlag);
    endQuizBtn.addEventListener('click', () => triggerEndQuiz(false));
    previousBtn.addEventListener('click', handlePreviousQuestion);
    nextSkipBtn.addEventListener('click', handleNextQuestion);
    restartBtn.addEventListener('click', () => launchQuiz(appState.currentQuiz.originalQuestions, quizTitle.textContent.replace('Review: ', '')));
    resultsHomeBtn.addEventListener('click', () => {
        if (appState.currentUser.Role === 'Guest') {
            showScreen(loginContainer);
            appState.currentUser = null;
        } else {
            showMainMenuScreen();
        }
    });
    reviewIncorrectBtn.addEventListener('click', startIncorrectReview);

    quizNoteBtn.addEventListener('click', () => {
        const currentQuestion = appState.currentQuiz.questions[appState.currentQuiz.currentQuestionIndex];
        openNoteModal('quiz', currentQuestion.UniqueID, currentQuestion.question);
    });

    toggleOsceOptionsBtn.addEventListener('click', () => customOsceOptions.classList.toggle('visible'));
    startOsceSlayerBtn.addEventListener('click', startOsceSlayer);
    startCustomOsceBtn.addEventListener('click', startCustomOsce);
    endOsceQuizBtn.addEventListener('click', () => endOsceQuiz(false));
    osceNextBtn.addEventListener('click', handleOsceNext);
    oscePreviousBtn.addEventListener('click', handleOscePrevious);
    osceNavigatorBtn.addEventListener('click', showOsceNavigator);
    osceNavigatorCloseBtn.addEventListener('click', () => modalBackdrop.classList.add('hidden'));

    learningBrowseByChapterBtn.addEventListener('click', () => showChapterList('All', true));
    learningBrowseBySourceBtn.addEventListener('click', () => showSourceList(true));
    endLearningBtn.addEventListener('click', showLearningModeBrowseScreen);
    learningNextBtn.addEventListener('click', handleLearningNext);
    learningPreviousBtn.addEventListener('click', handleLearningPrevious);
    learningSearchBtn.addEventListener('click', handleLearningSearch);
    qbankSearchBtn.addEventListener('click', handleQBankSearch);
    qbankStartSearchQuizBtn.addEventListener('click', startSearchedQuiz);

    modalCancelBtn.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
    modalConfirmBtn.addEventListener('click', () => { if (appState.modalConfirmAction) appState.modalConfirmAction(); });
    navigatorBtn.addEventListener('click', showQuestionNavigator);
    navigatorCloseBtn.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
    imageViewerCloseBtn.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
    noteCancelBtn.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
        noteModal.classList.add('hidden');
    });
    noteSaveBtn.addEventListener('click', handleSaveNote);
    announcementsCloseBtn.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
        announcementsModal.classList.add('hidden');
    });

    clearLogBtn.addEventListener('click', () => {
        modalBackdrop.classList.remove('hidden');
        clearLogModal.classList.remove('hidden');
    });
    clearLogCancelBtn.addEventListener('click', () => {
        modalBackdrop.classList.add('hidden');
        clearLogModal.classList.add('hidden');
    });
    clearQuizLogsBtn.addEventListener('click', () => handleClearLogs('quiz'));
    clearLectureLogsBtn.addEventListener('click', () => handleClearLogs('lecture'));
    clearAllLogsBtn.addEventListener('click', () => handleClearLogs('all'));

    radioBtn.addEventListener('click', () => {
        radioBannerContainer.classList.toggle('open');
    });
    radioCloseBtn.addEventListener('click', () => {
        radioBannerContainer.classList.remove('open');
    });

    sourceSelectMock.addEventListener('change', updateChapterFilter);
    selectAllSourcesMock.addEventListener('change', (e) => {
        sourceSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        updateChapterFilter();
    });

    selectAllChaptersMock.addEventListener('change', (e) => {
        chapterSelectMock.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });

    // ADDED: User Card Event Listeners
    userProfileHeaderBtn.addEventListener('click', () => showUserCardModal(false)); // Open user card from header
    userAvatar.addEventListener('click', () => showUserCardModal(false)); // Open user card from modal itself
    userCardCloseBtn.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
    editProfileBtn.addEventListener('click', () => toggleProfileEditMode(true));
    cancelEditProfileBtn.addEventListener('click', () => toggleProfileEditMode(false));
    saveProfileBtn.addEventListener('click', handleSaveProfile);

    // ADDED: Messenger Event Listeners
    messengerCloseBtn.addEventListener('click', () => modalBackdrop.classList.add('hidden'));
    sendMessageBtn.addEventListener('click', handleSendMessageBtn);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessageBtn();
        }
    });


    // --- INITIAL LOAD ---
    loadContentData();
});

