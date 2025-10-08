
// Matching Bank - Dashboard Integrated
(function(){
  const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzx8gRgbYZw8Rrg348q2dlsRd7yQ9IXUNUPBDUf-Q5Wb9LntLuKY-ozmnbZOOuQsDU_3w/exec";

  // Simple event bus-safe init
  window.initMatchingBank = function initMatchingBank(){
    const section = document.getElementById('matching-bank-section');
    if (!section) return;

    // Build UI if empty
    if (!section.dataset.built){
      section.innerHTML = `
        <div class="matching-menu-container">
          <h2 class="mb-2"><i class="fas fa-puzzle-piece"></i> Matching Bank <small class="muted">Test Connections</small></h2>
          <div class="matching-grid">
            <label>عدد المجموعات
              <input type="number" id="matching-set-count" value="1" min="1" max="20">
            </label>
            <label>الوقت/مجموعة (ث)
              <input type="number" id="matching-timer-input" value="60" min="10">
            </label>
            <button id="start-matching-btn" class="btn primary">ابدأ</button>
            <button id="check-answers-btn" class="btn">Check Answers</button>
          </div>
        </div>
        <div id="matching-exam-container" class="hidden">
          <div id="matching-question-area" class="matching-two-col">
            <div class="premise-column"></div>
            <div class="answers-column" id="matching-answers-area"></div>
          </div>
          <div id="result-container" class="mt-2"></div>
        </div>
      `;
      section.dataset.built = "1";

      attachMatchingLogic();
    }
  };

  function attachMatchingLogic(){
    const startBtn = document.getElementById('start-matching-btn');
    const examContainer = document.getElementById('matching-exam-container');
    const premisesColumn = document.querySelector('.premise-column');
    const answersColumn = document.getElementById('matching-answers-area');
    const checkBtn = document.getElementById('check-answers-btn');
    const resultContainer = document.getElementById('result-container');

    const mockQuestions = [
      { id: 1, question: "ما هو السبب الرئيسي لمرض السكري؟", answer: "نقص الإنسولين أو مقاومة الجسم له" },
      { id: 2, question: "ما هو العرض الأساسي لالتهاب الزائدة الدودية؟", answer: "ألم في الجانب الأيمن السفلي من البطن" },
      { id: 3, question: "ما هو العلاج الأولي للحساسية؟", answer: "مضادات الهيستامين" },
      { id: 4, question: "أي إجراء يُستخدم لإزالة الزائدة الدودية؟", answer: "استئصال الزائدة الدودية" },
      { id: 5, question: "ما هو الفحص الأفضل لتشخيص كسر في العظم؟", answer: "الأشعة السينية (X-Ray)" }
    ];

    let selectedAnswerElement = null;
    let userMatches = {};

    function shuffleArray(arr){ return [...arr].sort(()=>Math.random()-0.5); }

    function startMatching(){
      examContainer.classList.remove('hidden');
      resultContainer.innerHTML = "";
      premisesColumn.innerHTML = "";
      answersColumn.innerHTML = "";
      userMatches = {};
      selectedAnswerElement = null;

      const shuffled = shuffleArray(mockQuestions);
      const answersShuffled = shuffleArray(mockQuestions);

      shuffled.forEach((item, idx) => {
        const dropZone = document.createElement('div');
        dropZone.className = 'premise-drop-zone card';
        dropZone.dataset.premiseId = item.id;
        dropZone.innerHTML = `<strong>${idx+1}.</strong> ${item.question}`;
        dropZone.addEventListener('click', ()=>handlePremiseClick(dropZone));
        premisesColumn.appendChild(dropZone);
      });

      answersShuffled.forEach(item => {
        const ans = document.createElement('div');
        ans.className = 'answer-option chip';
        ans.textContent = item.answer;
        ans.dataset.answerId = item.id;
        ans.addEventListener('click', ()=>handleAnswerClick(ans));
        answersColumn.appendChild(ans);
      });
    }

    function handleAnswerClick(el){
      if (selectedAnswerElement === el){
        el.classList.remove('answer-selected');
        selectedAnswerElement = null;
        return;
      }
      if (selectedAnswerElement){
        selectedAnswerElement.classList.remove('answer-selected');
      }
      selectedAnswerElement = el;
      el.classList.add('answer-selected');
    }

    function handlePremiseClick(zone){
      if (!selectedAnswerElement) return;
      const existing = zone.querySelector('.answer-option');
      if (existing) {
        document.getElementById('matching-answers-area').appendChild(existing);
      }
      zone.appendChild(selectedAnswerElement);
      userMatches[zone.dataset.premiseId] = selectedAnswerElement.dataset.answerId;
      selectedAnswerElement.classList.remove('answer-selected');
      selectedAnswerElement = null;
    }

    function checkAnswers(){
      let correct = 0;
      document.querySelectorAll('.premise-drop-zone').forEach(zone=>{
        const pid = zone.dataset.premiseId;
        const matchedAid = userMatches[pid];
        const correctRow = mockQuestions.find(q=>q.id == pid);
        const correctAnswer = correctRow ? correctRow.answer : null;

        const userAnswerEl = zone.querySelector('.answer-option');
        if (!userAnswerEl) return;

        if (String(correctRow.id) === String(matchedAid)){
          userAnswerEl.classList.add('correct-match');
          correct++;
        } else {
          userAnswerEl.classList.add('incorrect-match');
          const reveal = document.createElement('div');
          reveal.className = 'correct-answer-reveal';
          reveal.textContent = `الصحيح: ${correctAnswer}`;
          zone.appendChild(reveal);
        }
      });

      resultContainer.innerHTML = `<h3>النتيجة: ${correct} من 5 صحيحة</h3>`;
      sendResultToSheet(correct, 5, userMatches);
    }

    function sendResultToSheet(score, total, userMatches){
      const payload = {
        Timestamp: new Date().toISOString(),
        UserID: "student123@example.com",
        UserName: "Student Tester",
        EventType: "FinishMatchingQuiz",
        Chapter: "",
        Score: score,
        TotalQuestions: total,
        Details: JSON.stringify(userMatches),
        AttemptedQuestions: Object.keys(userMatches).length
      };
      try{
        fetch(APP_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(payload)
        }).then(()=>console.log("MatchingBank: result sent."));
      }catch(e){ console.warn("MatchingBank send failed", e); }
    }

    startBtn.addEventListener('click', startMatching);
    checkBtn.addEventListener('click', checkAnswers);
  }

  // Inject nav item dynamically if sidebar/nav exists; else create fallback floating button
  document.addEventListener('DOMContentLoaded', ()=>{
    const addNav = ()=>{
      const candidates = Array.from(document.querySelectorAll('aside, .sidebar, nav, .nav, .menu, .drawer, .sidenav'));
      let container = candidates.find(el => el.querySelector('ul')) || candidates[0];
      let ul = container ? (container.querySelector('ul') || container) : null;

      if (ul){
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.id = 'nav-matching';
        li.innerHTML = '<i class="fas fa-puzzle-piece"></i> Matching Bank';
        li.style.cursor = 'pointer';
        li.addEventListener('click', openMatchingSection);
        ul.appendChild(li);
      } else {
        // Fallback floating button
        const btn = document.createElement('button');
        btn.id = 'nav-matching-fallback';
        btn.title = 'Matching Bank';
        btn.innerHTML = '🧩 Matching';
        btn.className = 'floating-matching-btn';
        btn.addEventListener('click', openMatchingSection);
        document.body.appendChild(btn);
      }
    };

    function openMatchingSection(){
      // Hide other sections
      document.querySelectorAll('.feature-section').forEach(s=>s.classList.add('hidden'));
      // Show our section
      const sec = document.getElementById('matching-bank-section');
      if (sec){ sec.classList.remove('hidden'); }
      // Build UI
      if (window.initMatchingBank) window.initMatchingBank();
      // Scroll into view
      sec && sec.scrollIntoView({behavior:'smooth', block:'start'});
    }

    addNav();
  });
})();
