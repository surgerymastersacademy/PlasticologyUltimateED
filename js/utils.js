// js/utils.js

// This file contains utility and helper functions that can be used across the application.

/**
 * Parses raw question data from the backend into a structured format.
 * @param {Array} data - Array of question objects from Google Sheets.
 * @returns {Array} - Array of formatted question objects.
 */
export function parseQuestions(data) {
    if (!data) return [];
    return data.filter(row => row.Question && String(row.Question).trim()).map(row => {
        const answerOptions = [];
        if (row.CorrectAnswer && String(row.CorrectAnswer).trim() !== '') answerOptions.push({ text: String(row.CorrectAnswer), isCorrect: true, rationale: row.CorrectRationale || '' });
        if (row.IncorrectAnswer1 && String(row.IncorrectAnswer1).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer1), isCorrect: false, rationale: row.IncorrectRationale1 || '' });
        if (row.IncorrectAnswer2 && String(row.IncorrectAnswer2).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer2), isCorrect: false, rationale: row.IncorrectRationale2 || '' });
        if (row.IncorrectAnswer3 && String(row.IncorrectAnswer3).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer3), isCorrect: false, rationale: row.IncorrectRationale3 || '' });
        // --- ADDED THIS LINE TO SUPPORT THE 5TH OPTION ---
        if (row.IncorrectAnswer4 && String(row.IncorrectAnswer4).trim() !== '') answerOptions.push({ text: String(row.IncorrectAnswer4), isCorrect: false, rationale: row.IncorrectRationale4 || '' });
        
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

/**
 * --- NEW: Parses raw theory question data from the backend. ---
 * @param {Array} data - Array of theory question objects from Google Sheets.
 * @returns {Array} - Array of formatted theory question objects.
 */
export function parseTheoryQuestions(data) {
    if (!data) return [];
    return data.filter(row => row.QuestionText && String(row.QuestionText).trim()).map(row => {
        return {
            UniqueID: row.UniqueID,
            Chapter: row.Chapter || 'Uncategorized',
            Source: row.Source || 'Uncategorized',
            QuestionText: row.QuestionText,
            ModelAnswer: row.ModelAnswer || 'No model answer provided.',
            Keywords: row.Keywords || '',
            Audio_URL: row.Audio_URL || '',
            Img_URL: row.Img_URL || ''
        };
    });
}


/**
 * Groups raw lecture data by chapter.
 * @param {Array} lectureData - Array of lecture objects from Google Sheets.
 * @returns {Object} - An object where keys are chapter names.
 */
export function groupLecturesByChapter(lectureData) {
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
                link: row.LectureURL,
                Keywords: row.Keywords
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

/**
 * Parses raw OSCE case data from the backend.
 * @param {Array} data - Array of OSCE case objects.
 * @returns {Array} - Formatted array of OSCE cases.
 */
export function parseOsceCases(data) {
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

/**
 * Parses raw OSCE question data from the backend.
 * @param {Array} data - Array of OSCE question objects.
 * @returns {Array} - Formatted array of OSCE questions.
 */
export function parseOsceQuestions(data) {
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


/**
 * Formats seconds into a MM:SS string.
 * @param {number} seconds - The total seconds.
 * @returns {string} - The formatted time string.
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Calculates the number of days left until a given exam date.
 * @param {Date} examDate - The date of the exam.
 * @returns {number} - The number of days remaining.
 */
export function calculateDaysLeft(examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate day calculation
    const targetDate = new Date(examDate);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
