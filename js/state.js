// js/state.js

// This file holds the centralized state and global constants for the application.

// --- URL FOR GOOGLE SHEETS ---
// Make sure to update this link with the one you get after deploying the Google Apps Script
export const API_URL = 'https://script.google.com/macros/s/AKfycbxS4JqdtlcCud_OO3zlVVeCQAUwg2Al1xG3QqITq24vEI5UolL5YL_W1kfnC5soOaiFcQ/exec';

// --- SIMULATION SETTINGS ---
export const SIMULATION_Q_COUNT = 100; // The number of questions for the simulation
export const SIMULATION_TOTAL_TIME_MINUTES = 120; // The total time in minutes for the simulation
export const DEFAULT_TIME_PER_QUESTION = 45;

// --- AVATAR SETTINGS ---
export const AVATAR_BASE_URL = "https://api.dicebear.com/7.x/initials/svg?seed=";
export const AVATAR_OPTIONS = [
    "User", "Avatar", "Profile", "Person", "Guest", "Student", "Doctor", "Nurse",
    "Medical", "Health", "Science", "Knowledge", "Book", "Study", "Exam", "Quiz",
    "Success", "Champion", "Winner", "Learner"
];


// --- Centralized Application State ---
export const appState = {
    // Content Data
    allQuestions: [],
    allOsceCases: [],
    allOsceQuestions: [],
    groupedLectures: {},
    mcqBooks: [],
    allAnnouncements: [],
    allRoles: [],
    allChaptersNames: [],
    allSourcesNames: [], // ADDED: To store unique source names for filtering

    // User Data
    currentUser: null,
    userCardData: null,
    viewedLectures: new Set(),
    bookmarkedQuestions: new Set(),
    fullActivityLog: [],
    userQuizNotes: [],
    userLectureNotes: [],
    userMessages: [],
    studyPlannerData: null,

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
};
