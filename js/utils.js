// V.1.8 - 2025-10-06
// js/utils.js

export function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * NEW: Add the missing calculateDaysLeft function back.
 */
export function calculateDaysLeft(dateString) {
    if (!dateString) return null;
    const today = new Date();
    const expiryDate = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

export function groupLecturesByChapter(lectures) {
    if (!lectures || lectures.length === 0) return {};
    return lectures.reduce((acc, lecture) => {
        const chapter = lecture.Chapter || 'Uncategorized';
        if (!acc[chapter]) {
            acc[chapter] = [];
        }
        acc[chapter].push(lecture);
        return acc;
    }, {});
}

export function parseQuestions(questions) {
    if (!questions || questions.length === 0) return [];
    questions.forEach(q => {
        q.question = q.question || q.Question; 
        q.CorrectAnswer = q.CorrectAnswer || q.correctanswer;
    });
    return questions;
}

export function parseOsceCases(cases) {
    if (!cases || cases.length === 0) return [];
    return cases;
}

export function parseOsceQuestions(questions) {
    if (!questions || questions.length === 0) return [];
    return questions;
}

export function parseTheoryQuestions(questions) {
    if (!questions || questions.length === 0) return [];
    return questions;
}
