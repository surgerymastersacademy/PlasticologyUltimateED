// V.1.1 - 2025-10-06
// js/state.js

export const API_URL = 'https://script.google.com/macros/s/AKfycbxS4JqdtlcCud_OO3zlWVeCQAUwg2Al1xG3QqITq24vEI5UolL5YL_W1kfnC5soOaiFcQ/exec'; // <-- Don't forget to put your NEW URL here!

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

    // Current theory session state
    currentTheorySession: {
        questions: [],
        currentIndex: 0,
        isExamMode: false,
        title: '',
        timerInterval: null
    },

    // --- NEW: Add matching exam state ---
    currentMatching: {
        sets: [],
        setIndex: 0,
        userMatches: [], // Will be an array of objects e.g. [{premiseId: answerId}, ...]
        timerInterval: null,
        score: 0,
        totalPremises: 0,
        isReviewMode: false
    },
};
