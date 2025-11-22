// js/features/performance.js

import { appState } from '../state.js';

/**
 * Analyzes user's quiz history to find strengths and weaknesses by chapter.
 * @returns {object|null} An object with strengths and weaknesses arrays, or null if not enough data.
 */
export function analyzePerformanceByChapter() {
    const quizLogs = appState.fullActivityLog.filter(log => log.eventType === 'FinishQuiz' && log.Details && log.Details.length > 2);
    if (quizLogs.length < 3) return null; // Not enough quiz data to analyze

    // Create a map for quick lookup of question details (chapter and correct answer)
    const questionDetailsMap = new Map();
    appState.allQuestions.forEach(q => {
        const correctAnswer = q.answerOptions.find(opt => opt.isCorrect);
        if (correctAnswer) {
            questionDetailsMap.set(q.UniqueID, { 
                chapter: q.chapter, 
                correctAnswer: correctAnswer.text 
            });
        }
    });

    const chapterStats = {};

    // Iterate through quiz logs to gather stats
    quizLogs.forEach(log => {
        try {
            const details = JSON.parse(log.Details);
            details.forEach(item => {
                const questionData = questionDetailsMap.get(item.qID);
                if (questionData) {
                    const chapter = questionData.chapter;
                    // Initialize stats for the chapter if it's the first time we see it
                    if (!chapterStats[chapter]) {
                        chapterStats[chapter] = { correct: 0, total: 0 };
                    }
                    chapterStats[chapter].total++;
                    if (item.ans === questionData.correctAnswer) {
                        chapterStats[chapter].correct++;
                    }
                }
            });
        } catch (e) {
            console.error("Could not parse quiz log details:", log.Details, e);
        }
    });

    const performanceArray = [];
    // Calculate accuracy for each chapter
    for (const chapter in chapterStats) {
        const stats = chapterStats[chapter];
        // Only consider chapters with a meaningful number of attempts (e.g., 5 or more)
        if (stats.total >= 5) {
            performanceArray.push({
                chapter: chapter,
                accuracy: (stats.correct / stats.total) * 100
            });
        }
    }

    if (performanceArray.length < 2) return null; // Not enough data for a meaningful comparison

    // Sort chapters from highest accuracy to lowest
    performanceArray.sort((a, b) => b.accuracy - a.accuracy);

    // Identify strengths (e.g., accuracy >= 80%) and weaknesses (e.g., accuracy < 60%)
    const strengths = performanceArray.filter(p => p.accuracy >= 80).slice(0, 2).map(p => p.chapter);
    const weaknesses = performanceArray.filter(p => p.accuracy < 60).slice(0, -3).map(p => p.chapter); // Get the bottom 2

    if (strengths.length === 0 && weaknesses.length === 0) return null;

    return { strengths, weaknesses };
}
