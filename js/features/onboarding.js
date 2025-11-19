// js/features/onboarding.js (FIXED VERSION)
// تم إصلاح مشكلة تعليق زر الإنهاء

import * as dom from '../dom.js';
import * as ui from '../ui.js';

// تعريف خطوات الجولة
const TOUR_STEPS = [
    {
        elementId: 'streak-container',
        title: 'Daily Streak 🔥',
        text: 'Track your consistency! Open the app daily to keep your streak alive.'
    },
    {
        elementId: 'lectures-btn',
        title: 'Video Lectures',
        text: 'Watch organized video lessons grouped by chapter. Don\'t forget to mark them as viewed!'
    },
    {
        elementId: 'qbank-btn',
        title: 'Question Bank',
        text: 'The core of Plasticology. Create exams, simulations, and practice your mistakes.'
    },
    {
        elementId: 'matching-btn',
        title: 'Matching Bank',
        text: 'Test your connections. Match diseases to symptoms or treatments in a fun, interactive way.'
    },
    {
        elementId: 'theory-btn',
        title: 'Theory & Essays',
        text: 'Study theory questions in Flashcard mode or test yourself in Exam mode.'
    },
    {
        elementId: 'study-planner-btn',
        title: 'Smart Planner',
        text: 'Create a study schedule. The app will generate daily tasks and quizzes for you.'
    },
    {
        elementId: 'leaderboard-btn',
        title: 'Leaderboard',
        text: 'See how you rank against other doctors based on your quiz scores.'
    }
];

let currentStepIndex = 0;

/**
 * يتحقق مما إذا كان المستخدم يزور التطبيق لأول مرة بعد التحديث
 */
export function checkAndTriggerOnboarding() {
    const hasSeenTour = localStorage.getItem('plasticology_tour_v3_seen');
    
    // إذا لم ير الجولة من قبل، وكان في القائمة الرئيسية (مسجل الدخول)
    if (!hasSeenTour && !dom.mainMenuContainer.classList.contains('hidden')) {
        showWelcomeModal();
    }
}

/**
 * يظهر نافذة الترحيب
 */
export function showWelcomeModal() {
    dom.modalBackdrop.classList.remove('hidden');
    dom.onboardingModal.classList.remove('hidden');
}

/**
 * يبدأ الجولة التعريفية
 */
export function startTour() {
    // إخفاء نافذة الترحيب
    dom.onboardingModal.classList.add('hidden');
    dom.modalBackdrop.classList.remove('hidden'); // الإبقاء على الخلفية المظلمة للتركيز
    
    // تسجيل أن المستخدم رأى الجولة
    localStorage.setItem('plasticology_tour_v3_seen', 'true');

    currentStepIndex = 0;
    highlightStep(currentStepIndex);
}

/**
 * ينهي الجولة
 */
export function endTour() {
    // 1. إزالة التأثيرات البصرية
    const activeHighlights = document.querySelectorAll('.tour-highlight');
    activeHighlights.forEach(el => el.classList.remove('tour-highlight'));
    
    // 2. إخفاء عناصر الجولة
    dom.tourTooltip.classList.add('hidden');
    dom.onboardingModal.classList.add('hidden');
    
    // 3. هام جداً: إخفاء الخلفية المظلمة ليعود التطبيق للعمل
    dom.modalBackdrop.classList.add('hidden');
    
    // 4. تسجيل الانتهاء
    localStorage.setItem('plasticology_tour_v3_seen', 'true');
}

function highlightStep(index) {
    // إزالة التظليل السابق
    const prevHighlights = document.querySelectorAll('.tour-highlight');
    prevHighlights.forEach(el => el.classList.remove('tour-highlight'));

    // إذا انتهت الخطوات
    if (index >= TOUR_STEPS.length) {
        // بدلاً من عرض نافذة تأكيد معلقة، سننهي الجولة مباشرة
        // أو نعرض رسالة شكر بسيطة تغلق نفسها
        endTour();
        
        // خيار إضافي: عرض رسالة نجاح صغيرة (اختياري)
        // alert("You're ready to go! Good luck."); 
        return;
    }

    const step = TOUR_STEPS[index];
    const element = document.getElementById(step.elementId);

    // إذا كان العنصر غير موجود (مثلاً الـ Streak مخفي في الموبايل)، انتقل للتالي
    if (!element || element.offsetParent === null) {
        currentStepIndex++;
        highlightStep(currentStepIndex);
        return;
    }

    // 1. تظليل العنصر
    element.classList.add('tour-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 2. عرض صندوق الشرح
    const tooltip = dom.tourTooltip;
    
    dom.tourTitle.textContent = step.title;
    dom.tourText.textContent = step.text;
    dom.tourStepCount.textContent = `${index + 1} / ${TOUR_STEPS.length}`;

    tooltip.classList.remove('hidden');
}

// الانتقال للخطوة التالية
export function nextTourStep() {
    currentStepIndex++;
    highlightStep(currentStepIndex);
}
