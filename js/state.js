// js/state.js (FINAL VERSION - Includes Matching Game State)

export const API_URL = 'https://script.google.com/macros/s/AKfycbzx8gRgbYZw8Rrg348q2dlsRd7yQ9IXUNUPBDUf-Q5Wb9LntLuKY-ozmnbZOOuQsDU_3w/exec';

// Change this number whenever you update your Google Sheet content
export const APP_VERSION = '1.1'; 

export const SIMULATION_Q_COUNT = 100;
export const SIMULATION_TOTAL_TIME_MINUTES = 120;
export const DEFAULT_TIME_PER_QUESTION = 45;
export const AVATAR_BASE_URL = "https://api.dicebear.com/7.x/initials/svg?seed=";
export const AVATAR_OPTIONS = [ "User", "Avatar", "Profile", "Person", "Guest", "Student", "Doctor", "Nurse", "Medical", "Health", "Science", "Knowledge", "Book", "Study", "Exam", "Quiz", "Success", "Champion", "Winner", "Learner" ];

export const appState = {
    // Content Data
    allQuestions: [],
    allFreeTestQuestions: [],
    allOsceCases: [],
    allOsceQuestions: [],
    groupedLectures: {},
    mcqBooks: [],
    allAnnouncements: [],
    allRoles: [],
    allChaptersNames: [],
    allTheoryQuestions: [],
    
    // User Data
    currentUser: null,
    userCardData: null,
    viewedLectures: new Set(),
    bookmarkedQuestions: new Set(),
    answeredQuestions: new Set(),
    fullActivityLog: [],
    userQuizNotes: [],
    userLectureNotes: [],
    userMessages: [],
    userTheoryLogs: [],
    
    // Planner State
    studyPlans: [], 
    activeStudyPlan: null, 

    // Navigation & UI State
    navigationHistory: [],
    activityChartInstance: null,
    currentNote: { type: null, itemId: null, itemTitle: null },
    modalConfirmAction: null,
    qbankSearchResults: [],
    messengerPollInterval: null,

    // Current Quiz State
    currentQuiz: {
        questions: [],
        originalQuestions: [],
        userAnswers: [],
        originalUserAnswers: [],
        currentQuestionIndex: 0,
        score: 0,
        timerInterval: null,
        simulationTimerInterval: null,
        flaggedIndices: new Set(),
        isReviewMode: false,
        isSimulationMode: false,
        isPracticingMistakes: false,
        timePerQuestion: 45,
        isSimulationReview: false
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

    // Current Learning Mode State
    currentLearning: {
        questions: [],
        currentIndex: 0,
        title: ''
    },

    // Theory Session State
    currentTheorySession: {
        questions: [],
        currentIndex: 0,
        isExamMode: false,
        title: '',
        timerInterval: null
    },

    // --- NEW: Current Matching Game State ---
    currentMatching: {
        allSets: [], // Array of sets (each set has premises and shuffled answers)
        currentSetIndex: 0,
        userMatches: {}, // Map of PremiseID -> AnswerID for current set
        score: 0,
        timerInterval: null,
        timePerSet: 60,
        selectedAnswerElement: null // To track which answer is clicked
    },
};
