// js/utils.js (FINAL VERSION)

export function parseQuestions(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(row => row && row.Question && String(row.Question).trim()).map(row => {
        const answerOptions = [];
        const questionType = (row.QuestionType && typeof row.QuestionType === 'string') ? row.QuestionType.toLowerCase().trim() : 'single';

        if (questionType === 'multiple') {
            const rawCorrect = row.CorrectAnswer ? String(row.CorrectAnswer) : '';
            const correctAnswers = rawCorrect.split('||').map(a => a.trim()).filter(a => a);
            correctAnswers.forEach(answerText => {
                answerOptions.push({ text: answerText, isCorrect: true, rationale: row.CorrectRationale || '' });
            });
        } else {
            if (row.CorrectAnswer && String(row.CorrectAnswer).trim()) {
                answerOptions.push({ text: String(row.CorrectAnswer), isCorrect: true, rationale: row.CorrectRationale || '' });
            }
        }

        for (let i = 1; i <= 4; i++) {
            const incorrectAnswerKey = `IncorrectAnswer${i}`;
            const incorrectRationaleKey = `IncorrectRationale${i}`;
            if (row[incorrectAnswerKey] && String(row[incorrectAnswerKey]).trim()) {
                answerOptions.push({ text: String(row[incorrectAnswerKey]), isCorrect: false, rationale: row[incorrectRationaleKey] || '' });
            }
        }
        
        return {
            UniqueID: row.UniqueID || `generated_${Math.random()}`,
            QuestionType: questionType,
            chapter: (row.Chapter && String(row.Chapter).trim()) ? row.Chapter : 'Uncategorized',
            question: row.Question,
            hint: row.Hint || '',
            source: row.Source || '',
            ImageURL: row.ImageURL || '',
            answerOptions: answerOptions,
            CorrectAnswer: row.CorrectAnswer,
            Keywords: row.Keywords || ''
        };
    });
}

export function parseTheoryQuestions(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(row => row && row.QuestionText && String(row.QuestionText).trim()).map(row => ({
        UniqueID: row.UniqueID || `theory_${Math.random()}`,
        Chapter: row.Chapter || 'Uncategorized',
        Source: row.Source || 'Uncategorized',
        QuestionText: row.QuestionText,
        ModelAnswer: row.ModelAnswer || 'No model answer provided.',
        Keywords: row.Keywords || '',
        Audio_URL: row.Audio_URL || '',
        Img_URL: row.Img_URL || ''
    }));
}

export function groupLecturesByChapter(lectureData) {
    if (!Array.isArray(lectureData)) return {};
    const chapters = {};
    lectureData.forEach(row => {
        if (!row) return;
        const chapterName = row.Chapter;
        if (!chapterName || String(chapterName).length < 2) return;
        
        if (!chapters[chapterName]) {
            chapters[chapterName] = { topics: [], mock: null, icon: '' };
        }
        
        if (row.LectureName) {
            chapters[chapterName].topics.push({
                id: row.UniqueID || `lec_${Math.random()}`,
                name: row.LectureName,
                link: row.LectureURL || '#',
                Keywords: row.Keywords || ''
            });
        }
        
        if (row['Mock Name'] && row['Mock Link'] && !chapters[chapterName].mock) {
            chapters[chapterName].mock = { link: row['Mock Link'], name: row['Mock Name'] || 'Mock Exam' };
        }
        
        if (row.ChapterIcon && !chapters[chapterName].icon) {
            chapters[chapterName].icon = row.ChapterIcon;
        }
    });
    return chapters;
}

export function parseOsceCases(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(row => row && row.CaseID && row.Title).map(row => ({
        CaseID: row.CaseID,
        Title: row.Title,
        ImageURL: row.ImageURL || '',
        Hint: row.Hint || '',
        CaseDescription: row.CaseDescription || 'No description available.',
        AudioURL: row.AudioURL || '',
        Chapter: row.Chapter || 'Uncategorized',
        Source: row.Source || 'Uncategorized'
    }));
}

export function parseOsceQuestions(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(row => row && row.QuestionID && row.CaseID).map(row => {
        const answerOptions = [];
        if (row.CorrectAnswer) answerOptions.push({ text: String(row.CorrectAnswer), isCorrect: true, rationale: row.CorrectRationale || '' });
        if (row.IncorrectAnswer1) answerOptions.push({ text: String(row.IncorrectAnswer1), isCorrect: false, rationale: row.IncorrectRationale1 || '' });
        if (row.IncorrectAnswer2) answerOptions.push({ text: String(row.IncorrectAnswer2), isCorrect: false, rationale: row.IncorrectRationale2 || '' });
        if (row.IncorrectAnswer3) answerOptions.push({ text: String(row.IncorrectAnswer3), isCorrect: false, rationale: row.IncorrectRationale3 || '' });

        return {
            QuestionID: row.QuestionID,
            CaseID: row.CaseID,
            QuestionType: row.QuestionType || 'MCQ',
            QuestionText: row.QuestionText || 'Question text missing',
            EssayModelAnswer: row.EssayModelAnswer || '',
            ImageURL: row.ImageURL || '',
            AudioURL: row.AudioURL || '',
            answerOptions: answerOptions
        };
    });
}

export function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function calculateDaysLeft(examDate) {
    if (!examDate) return -1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(examDate);
    targetDate.setHours(0, 0, 0, 0);

    if (isNaN(targetDate.getTime())) return -1;
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
