// V.1.5 - 2025-10-06
// js/utils.js

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
    // The issue was that the property names from Google Sheets can be inconsistent.
    // This ensures we always use the same keys: 'question' and 'CorrectAnswer'.
    questions.forEach(q => {
        q.question = q.question || q.Question; // Use lowercase 'question' if it exists, otherwise use 'Question'
        q.CorrectAnswer = q.CorrectAnswer || q.correctanswer; // Same for CorrectAnswer
    });
    // This debugging line helped us find the inconsistency.
    console.log("Parsed Questions Sample:", questions[0]); 
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
