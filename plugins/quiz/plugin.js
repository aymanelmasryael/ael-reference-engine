(function () {
  "use strict";

  var STORAGE_KEY = "ael_quiz_progress";

  var AELQuizPlugin = {
    name: "quiz",
    version: "1.0.0",
    description: "Interactive quiz system for AEL Engineering References",
    author: "Ayman Elmasry \u2014 AEL Digital Studio",

    state: {
      currentQuiz: null,
      currentQuestion: 0,
      answers: {},
      results: null,
      startTime: null,
      timerInterval: null,
      mode: "all",
      filteredQuestions: null,
      modal: null
    },

    /* =================================================================
       INSTALL
       ================================================================= */

    install: function (api) {
      this.api = api;

      api.hook("after:render", function () {
        this.init();
      }.bind(this));

      api.command("quiz", function (args) {
        this.handleCommand(args);
      }.bind(this));

      api.events.on("theme:changed", function () {
        this.updateStyles();
      }.bind(this));

      this.injectCSS();

      console.log(
        "%c AEL Quiz Plugin v" + this.version + " installed ",
        "background:#0074FF;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold"
      );
    },

    /* =================================================================
       INIT
       ================================================================= */

    init: function () {
      var data;
      try {
        data = this.api.engine.getData();
      } catch (e) {
        return;
      }
      if (!data || !data.quizzes || !data.quizzes.length) return;
      this.renderQuizButtons(data.quizzes);
    },

    /* =================================================================
       RENDER QUIZ BUTTONS ON CATEGORY CARDS + GLOBAL FLOATING BUTTON
       ================================================================= */

    renderQuizButtons: function (quizzes) {
      var self = this;
      var cards = document.querySelectorAll("[data-category]");

      cards.forEach(function (card) {
        if (card.querySelector(".ael-quiz-launch-btn")) return;
        var category = card.getAttribute("data-category");
        var matching = quizzes.filter(function (q) { return q.category === category; });
        if (!matching.length) return;

        var btn = document.createElement("button");
        btn.className = "ael-quiz-launch-btn";
        btn.textContent = "Quiz (" + matching.length + ")";
        btn.setAttribute("aria-label", "Start quiz for " + category);
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (matching.length === 1) {
            self.startQuiz(matching[0].id);
          } else {
            self.showQuizList(matching);
          }
        });
        card.style.position = "relative";
        card.appendChild(btn);
      });

      if (!document.querySelector(".ael-quiz-global-btn")) {
        var globalBtn = document.createElement("button");
        globalBtn.className = "ael-quiz-global-btn";
        globalBtn.innerHTML = '<span class="ael-quiz-global-icon">&#9998;</span><span class="ael-quiz-global-label">Quizzes</span>';
        globalBtn.setAttribute("aria-label", "Open quiz list");
        globalBtn.addEventListener("click", function () {
          self.showQuizList(quizzes);
        });
        document.body.appendChild(globalBtn);
      }
    },

    /* =================================================================
       COMMAND HANDLER  (ael quiz [id] [mode])
       ================================================================= */

    handleCommand: function (args) {
      var data;
      try {
        data = this.api.engine.getData();
      } catch (e) {
        this.showNotification("No engine data available.", "error");
        return;
      }
      if (!data || !data.quizzes || !data.quizzes.length) {
        this.showNotification("No quizzes found in this reference.", "info");
        return;
      }
      var quizzes = data.quizzes;

      if (args && args.length > 0) {
        var id = args[0];
        var mode = args[1] || "all";
        if (mode === "single" || mode === "timed") {
          this.state.mode = mode;
        }
        var found = quizzes.filter(function (q) { return q.id === id; })[0];
        if (found) {
          this.startQuiz(found.id);
        } else {
          this.showNotification('Quiz "' + id + '" not found.', "error");
        }
      } else {
        this.showQuizList(quizzes);
      }
    },

    /* =================================================================
       NOTIFICATION TOAST
       ================================================================= */

    showNotification: function (message, type) {
      var existing = document.querySelector(".ael-quiz-notification");
      if (existing) existing.remove();

      var el = document.createElement("div");
      el.className = "ael-quiz-notification ael-quiz-notification--" + (type || "info");
      el.textContent = message;
      document.body.appendChild(el);

      requestAnimationFrame(function () {
        el.classList.add("ael-quiz-notification--visible");
      });

      setTimeout(function () {
        el.classList.remove("ael-quiz-notification--visible");
        setTimeout(function () { if (el.parentNode) el.remove(); }, 400);
      }, 3000);
    },

    /* =================================================================
       QUIZ LIST MODAL
       ================================================================= */

    showQuizList: function (quizzes) {
      var self = this;
      if (!quizzes) {
        var data;
        try { data = this.api.engine.getData(); } catch (e) { return; }
        quizzes = (data && data.quizzes) || [];
      }
      if (!quizzes.length) {
        this.showNotification("No quizzes available.", "info");
        return;
      }

      var modal = this.createModal();
      var progress = this.getAllProgress();
      var content = modal.querySelector(".ael-quiz-modal-content");

      var header = document.createElement("div");
      header.className = "ael-quiz-list-header";
      var title = document.createElement("h2");
      title.className = "ael-quiz-list-title";
      title.textContent = "Available Quizzes";
      var subtitle = document.createElement("p");
      subtitle.className = "ael-quiz-list-subtitle";
      subtitle.textContent = quizzes.length + " quiz" + (quizzes.length !== 1 ? "es" : "") + " available";
      header.appendChild(title);
      header.appendChild(subtitle);
      content.appendChild(header);

      var list = document.createElement("div");
      list.className = "ael-quiz-list";

      quizzes.forEach(function (quiz) {
        var item = document.createElement("div");
        item.className = "ael-quiz-list-item";

        var saved = progress[quiz.id];
        var statusBadge = "";
        if (saved) {
          var pct = Math.round((saved.score / saved.total) * 100);
          statusBadge = '<span class="ael-quiz-list-badge">' + pct + "%</span>";
        }
        var questionCount = (quiz.questions && quiz.questions.length) || 0;

        item.innerHTML =
          '<div class="ael-quiz-list-item-header">' +
            '<h3 class="ael-quiz-list-item-title">' + self.escapeHtml(quiz.title || quiz.id) + "</h3>" +
            statusBadge +
          "</div>" +
          '<p class="ael-quiz-list-item-desc">' + self.escapeHtml(quiz.description || "") + "</p>" +
          '<div class="ael-quiz-list-item-meta">' +
            '<span class="ael-quiz-list-item-meta-tag">' + self.escapeHtml(quiz.difficulty || "general") + "</span>" +
            '<span class="ael-quiz-list-item-meta-tag">' + questionCount + " question" + (questionCount !== 1 ? "s" : "") + "</span>" +
            (quiz.category ? '<span class="ael-quiz-list-item-meta-tag">' + self.escapeHtml(quiz.category) + "</span>" : "") +
          "</div>" +
          '<button class="ael-quiz-list-item-btn">Start Quiz</button>';

        item.querySelector(".ael-quiz-list-item-btn").addEventListener("click", function () {
          self.closeModal();
          self.startQuiz(quiz.id);
        });
        list.appendChild(item);
      });

      content.appendChild(list);
      this.openModal(modal);
    },

    /* =================================================================
       START QUIZ
       ================================================================= */

    startQuiz: function (quizId) {
      var data;
      try { data = this.api.engine.getData(); } catch (e) {
        this.showNotification("No engine data available.", "error");
        return;
      }
      if (!data || !data.quizzes) {
        this.showNotification("No quizzes found.", "error");
        return;
      }

      var quiz = data.quizzes.filter(function (q) { return q.id === quizId; })[0];
      if (!quiz || !quiz.questions || !quiz.questions.length) {
        this.showNotification("Quiz has no questions.", "error");
        return;
      }

      this.state.currentQuiz = quiz;
      this.state.currentQuestion = 0;
      this.state.answers = {};
      this.state.results = null;
      this.state.startTime = Date.now();
      this.state.filteredQuestions = quiz.questions.slice();

      if (this.state.mode === "single") {
        this.state.filteredQuestions = [quiz.questions[0]];
      }

      if (this.state.timerInterval) {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = null;
      }

      var modal = this.createModal();
      this.state.modal = modal;
      this.renderQuestion(modal);
      this.openModal(modal);

      if (this.state.mode === "timed") {
        this.startTimer(modal);
      }

      this.api.events.emit("quiz:started", {
        quizId: quiz.id,
        questionCount: this.state.filteredQuestions.length,
        mode: this.state.mode
      });
    },

    /* =================================================================
       TIMER
       ================================================================= */

    startTimer: function (modal) {
      var timerEl = modal.querySelector(".ael-quiz-timer");
      if (!timerEl) return;
      var seconds = 0;
      var self = this;
      this.state.timerInterval = setInterval(function () {
        seconds++;
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        timerEl.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
      }, 1000);
    },

    stopTimer: function () {
      if (this.state.timerInterval) {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = null;
      }
    },

    /* =================================================================
       RENDER QUESTION
       ================================================================= */

    renderQuestion: function (modal) {
      var self = this;
      var questions = this.state.filteredQuestions;
      var idx = this.state.currentQuestion;
      var question = questions[idx];

      if (!question) { this.submitQuiz(modal); return; }

      var content = modal.querySelector(".ael-quiz-modal-content");
      content.innerHTML = "";

      /* --- header --- */
      var header = document.createElement("div");
      header.className = "ael-quiz-question-header";
      var quizTitle = document.createElement("h2");
      quizTitle.className = "ael-quiz-question-title";
      quizTitle.textContent = this.state.currentQuiz ? this.state.currentQuiz.title : "Quiz";
      header.appendChild(quizTitle);
      if (this.state.mode === "timed") {
        var timer = document.createElement("span");
        timer.className = "ael-quiz-timer";
        timer.textContent = "00:00";
        header.appendChild(timer);
      }
      content.appendChild(header);

      /* --- progress --- */
      var progressWrap = document.createElement("div");
      progressWrap.className = "ael-quiz-progress-wrap";
      var progressLabel = document.createElement("div");
      progressLabel.className = "ael-quiz-progress-label";
      progressLabel.textContent = "Question " + (idx + 1) + " of " + questions.length;
      var progressBar = document.createElement("div");
      progressBar.className = "ael-quiz-progress-bar";
      var progressFill = document.createElement("div");
      progressFill.className = "ael-quiz-progress-fill";
      progressFill.style.width = ((idx + 1) / questions.length * 100) + "%";
      progressBar.appendChild(progressFill);
      progressWrap.appendChild(progressLabel);
      progressWrap.appendChild(progressBar);
      content.appendChild(progressWrap);

      /* --- question card --- */
      var card = document.createElement("div");
      card.className = "ael-quiz-question-card";
      var questionText = document.createElement("div");
      questionText.className = "ael-quiz-question-text";
      questionText.innerHTML = this.formatQuestion(question.question);
      card.appendChild(questionText);

      /* --- options --- */
      var optionsWrap = document.createElement("div");
      optionsWrap.className = "ael-quiz-options";

      if (!question.options || !question.options.length) {
        var noOpts = document.createElement("p");
        noOpts.className = "ael-quiz-no-options";
        noOpts.textContent = "No options available for this question.";
        optionsWrap.appendChild(noOpts);
      } else {
        question.options.forEach(function (opt, i) {
          var optBtn = document.createElement("button");
          optBtn.className = "ael-quiz-option";
          if (self.state.answers[idx] === i) {
            optBtn.classList.add("ael-quiz-option--selected");
          }
          var letter = document.createElement("span");
          letter.className = "ael-quiz-option-letter";
          letter.textContent = String.fromCharCode(65 + i);
          var label = document.createElement("span");
          label.className = "ael-quiz-option-label";
          label.textContent = opt;
          optBtn.appendChild(letter);
          optBtn.appendChild(label);
          optBtn.addEventListener("click", function () {
            self.selectOption(i, optionsWrap);
          });
          optionsWrap.appendChild(optBtn);
        });
      }

      card.appendChild(optionsWrap);
      content.appendChild(card);

      /* --- hidden explanation area --- */
      var explanationArea = document.createElement("div");
      explanationArea.className = "ael-quiz-explanation-area";
      explanationArea.style.display = "none";
      content.appendChild(explanationArea);

      /* --- navigation --- */
      var nav = document.createElement("div");
      nav.className = "ael-quiz-nav";

      var prevBtn = document.createElement("button");
      prevBtn.className = "ael-quiz-nav-btn ael-quiz-nav-btn--prev";
      prevBtn.textContent = "Previous";
      prevBtn.disabled = idx === 0;
      prevBtn.addEventListener("click", function () { self.prevQuestion(modal); });

      var nextBtn = document.createElement("button");
      nextBtn.className = "ael-quiz-nav-btn ael-quiz-nav-btn--next";
      if (idx === questions.length - 1) {
        nextBtn.textContent = "Submit";
        nextBtn.classList.add("ael-quiz-nav-btn--submit");
      } else {
        nextBtn.textContent = "Next";
      }
      nextBtn.addEventListener("click", function () {
        if (idx === questions.length - 1) {
          self.submitQuiz(modal);
        } else {
          self.nextQuestion(modal);
        }
      });

      nav.appendChild(prevBtn);
      nav.appendChild(nextBtn);
      content.appendChild(nav);
    },

    /* =================================================================
       FORMAT QUESTION TEXT (inline code + bold)
       ================================================================= */

    formatQuestion: function (text) {
      if (!text) return "";
      text = text.replace(/`([^`]+)`/g, '<code class="ael-quiz-code">$1</code>');
      text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      return text;
    },

    /* =================================================================
       SELECT OPTION
       ================================================================= */

    selectOption: function (index, optionsWrap) {
      this.state.answers[this.state.currentQuestion] = index;
      var buttons = optionsWrap.querySelectorAll(".ael-quiz-option");
      buttons.forEach(function (btn, i) {
        btn.classList.remove("ael-quiz-option--selected");
        if (i === index) btn.classList.add("ael-quiz-option--selected");
      });
    },

    /* =================================================================
       NAVIGATION
       ================================================================= */

    nextQuestion: function (modal) {
      if (this.state.currentQuestion < this.state.filteredQuestions.length - 1) {
        this.state.currentQuestion++;
        this.renderQuestion(modal);
      }
    },

    prevQuestion: function (modal) {
      if (this.state.currentQuestion > 0) {
        this.state.currentQuestion--;
        this.renderQuestion(modal);
      }
    },

    /* =================================================================
       SUBMIT QUIZ
       ================================================================= */

    submitQuiz: function (modal) {
      this.stopTimer();
      var questions = this.state.filteredQuestions;
      var answers = this.state.answers;
      var correct = 0;
      var incorrect = 0;
      var unanswered = 0;
      var details = [];
      var self = this;

      questions.forEach(function (q, i) {
        var selected = answers[i];
        var isCorrect = selected === q.answer;
        if (selected === undefined || selected === null) {
          unanswered++;
        } else if (isCorrect) {
          correct++;
        } else {
          incorrect++;
        }
        details.push({
          question: q.question,
          options: q.options,
          correctAnswer: q.answer,
          selectedAnswer: selected !== undefined ? selected : null,
          isCorrect: isCorrect,
          explanation: q.explanation || ""
        });
      });

      var total = questions.length;
      var score = total > 0 ? Math.round((correct / total) * 100) : 0;
      var elapsed = Date.now() - this.state.startTime;

      this.state.results = {
        score: score,
        correct: correct,
        incorrect: incorrect,
        unanswered: unanswered,
        total: total,
        details: details,
        elapsed: elapsed,
        quizId: this.state.currentQuiz ? this.state.currentQuiz.id : "unknown"
      };

      this.saveProgress(this.state.results.quizId, score, total, correct);

      this.api.events.emit("quiz:completed", {
        quizId: this.state.results.quizId,
        score: score,
        correct: correct,
        total: total,
        elapsed: elapsed
      });

      this.showResults(modal);
    },

    /* =================================================================
       SHOW RESULTS
       ================================================================= */

    showResults: function (modal) {
      var self = this;
      var r = this.state.results;
      if (!r) return;

      var content = modal.querySelector(".ael-quiz-modal-content");
      content.innerHTML = "";

      var wrap = document.createElement("div");
      wrap.className = "ael-quiz-results";

      /* --- score circle --- */
      var circleWrap = document.createElement("div");
      circleWrap.className = "ael-quiz-results-circle-wrap";
      var circle = document.createElement("div");
      circle.className = "ael-quiz-results-circle";
      var circumference = 2 * Math.PI * 54;
      circle.innerHTML =
        '<svg viewBox="0 0 120 120">' +
          '<circle class="ael-quiz-results-circle-bg" cx="60" cy="60" r="54" />' +
          '<circle class="ael-quiz-results-circle-fill" cx="60" cy="60" r="54" ' +
            'stroke-dasharray="' + circumference + '" ' +
            'stroke-dashoffset="' + circumference + '" />' +
        "</svg>" +
        '<span class="ael-quiz-results-score-text">0%</span>';
      circleWrap.appendChild(circle);
      wrap.appendChild(circleWrap);

      /* animate circle after paint */
      requestAnimationFrame(function () {
        setTimeout(function () {
          var fill = circle.querySelector(".ael-quiz-results-circle-fill");
          var text = circle.querySelector(".ael-quiz-results-score-text");
          if (fill) {
            var offset = circumference - (r.score / 100) * circumference;
            fill.style.strokeDashoffset = String(offset);
            fill.style.transition = "stroke-dashoffset 1s ease-out, stroke 0.4s ease";
            if (r.score >= 80) {
              fill.style.stroke = "var(--ael-color-success, #00FF88)";
            } else if (r.score >= 50) {
              fill.style.stroke = "var(--ael-color-primary, #0074FF)";
            } else {
              fill.style.stroke = "var(--ael-color-error, #FF4444)";
            }
          }
          var current = 0;
          var target = r.score;
          var step = Math.max(1, Math.floor(target / 40));
          var counter = setInterval(function () {
            current += step;
            if (current >= target) { current = target; clearInterval(counter); }
            if (text) text.textContent = current + "%";
          }, 25);
        }, 100);
      });

      /* --- title --- */
      var resultTitle = document.createElement("h2");
      resultTitle.className = "ael-quiz-results-title";
      if (r.score === 100) resultTitle.textContent = "Perfect Score!";
      else if (r.score >= 80) resultTitle.textContent = "Great Job!";
      else if (r.score >= 50) resultTitle.textContent = "Not Bad!";
      else resultTitle.textContent = "Keep Practicing!";
      wrap.appendChild(resultTitle);

      /* --- stats --- */
      var stats = document.createElement("div");
      stats.className = "ael-quiz-results-stats";
      var statItems = [
        { label: "Correct", value: r.correct, cls: "correct" },
        { label: "Incorrect", value: r.incorrect, cls: "incorrect" },
        { label: "Unanswered", value: r.unanswered, cls: "unanswered" },
        { label: "Time", value: this.formatTime(r.elapsed), cls: "time" }
      ];
      statItems.forEach(function (s) {
        var item = document.createElement("div");
        item.className = "ael-quiz-results-stat ael-quiz-results-stat--" + s.cls;
        item.innerHTML =
          '<span class="ael-quiz-results-stat-value">' + s.value + "</span>" +
          '<span class="ael-quiz-results-stat-label">' + s.label + "</span>";
        stats.appendChild(item);
      });
      wrap.appendChild(stats);

      /* --- review --- */
      var reviewTitle = document.createElement("h3");
      reviewTitle.className = "ael-quiz-results-review-title";
      reviewTitle.textContent = "Review";
      wrap.appendChild(reviewTitle);

      var reviewList = document.createElement("div");
      reviewList.className = "ael-quiz-results-review-list";

      r.details.forEach(function (d, i) {
        var item = document.createElement("div");
        item.className = "ael-quiz-results-review-item";

        var statusIcon = d.isCorrect ? "&#10003;" : (d.selectedAnswer === null ? "&#8212;" : "&#10007;");
        var statusCls = d.isCorrect ? "correct" : (d.selectedAnswer === null ? "unanswered" : "incorrect");
        var questionHtml = self.formatQuestion(d.question);

        var optionsHtml = "";
        if (d.options && d.options.length) {
          optionsHtml = '<div class="ael-quiz-results-review-options">';
          d.options.forEach(function (opt, oi) {
            var optCls = "ael-quiz-results-review-option";
            if (oi === d.correctAnswer) optCls += " ael-quiz-results-review-option--correct";
            if (oi === d.selectedAnswer && !d.isCorrect) optCls += " ael-quiz-results-review-option--wrong";
            var marker = "";
            if (oi === d.correctAnswer) marker = " &#10003;";
            if (oi === d.selectedAnswer && !d.isCorrect) marker = " &#10007;";
            optionsHtml +=
              '<div class="' + optCls + '">' +
                '<span class="ael-quiz-results-review-option-letter">' + String.fromCharCode(65 + oi) + "</span>" +
                "<span>" + self.escapeHtml(opt) + marker + "</span>" +
              "</div>";
          });
          optionsHtml += "</div>";
        }

        var explanationHtml = "";
        if (d.explanation) {
          explanationHtml =
            '<div class="ael-quiz-results-review-explanation">' +
              "<strong>Explanation:</strong> " + self.formatQuestion(d.explanation) +
            "</div>";
        }

        item.innerHTML =
          '<div class="ael-quiz-results-review-item-header">' +
            '<span class="ael-quiz-results-review-item-icon ael-quiz-results-review-item-icon--' + statusCls + '">' + statusIcon + "</span>" +
            '<span class="ael-quiz-results-review-item-num">Q' + (i + 1) + "</span>" +
          "</div>" +
          '<div class="ael-quiz-results-review-item-body">' +
            '<div class="ael-quiz-results-review-item-question">' + questionHtml + "</div>" +
            optionsHtml +
            explanationHtml +
          "</div>";

        reviewList.appendChild(item);
      });

      wrap.appendChild(reviewList);

      /* --- action buttons --- */
      var actions = document.createElement("div");
      actions.className = "ael-quiz-results-actions";

      var retryBtn = document.createElement("button");
      retryBtn.className = "ael-quiz-results-btn ael-quiz-results-btn--retry";
      retryBtn.textContent = "Retry Failed";
      retryBtn.addEventListener("click", function () { self.retryQuiz(modal); });

      var retryAllBtn = document.createElement("button");
      retryAllBtn.className = "ael-quiz-results-btn ael-quiz-results-btn--retry-all";
      retryAllBtn.textContent = "Retry All";
      retryAllBtn.addEventListener("click", function () {
        self.closeModal();
        self.startQuiz(self.state.results.quizId);
      });

      var closeBtn = document.createElement("button");
      closeBtn.className = "ael-quiz-results-btn ael-quiz-results-btn--close";
      closeBtn.textContent = "Close";
      closeBtn.addEventListener("click", function () { self.closeModal(); });

      actions.appendChild(retryBtn);
      actions.appendChild(retryAllBtn);
      actions.appendChild(closeBtn);
      wrap.appendChild(actions);

      content.appendChild(wrap);
    },

    /* =================================================================
       RETRY QUIZ (only failed questions)
       ================================================================= */

    retryQuiz: function (modal) {
      var r = this.state.results;
      if (!r) return;

      var failedIds = [];
      r.details.forEach(function (d, i) {
        if (!d.isCorrect) failedIds.push(i);
      });
      if (!failedIds.length) {
        this.showNotification("No failed questions to retry!", "success");
        return;
      }

      var quiz = this.state.currentQuiz;
      if (!quiz || !quiz.questions) return;

      var failedQuestions = failedIds.map(function (i) { return quiz.questions[i]; });

      this.state.currentQuiz = quiz;
      this.state.currentQuestion = 0;
      this.state.answers = {};
      this.state.results = null;
      this.state.startTime = Date.now();
      this.state.filteredQuestions = failedQuestions;
      this.state.mode = "all";

      this.renderQuestion(modal);
    },

    /* =================================================================
       PROGRESS PERSISTENCE  (localStorage)
       ================================================================= */

    getAllProgress: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },

    saveProgress: function (quizId, score, total, correct) {
      try {
        var all = this.getAllProgress();
        all[quizId] = {
          score: score,
          total: total,
          correct: correct,
          completedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch (e) { /* storage unavailable */ }
    },

    getProgress: function (quizId) {
      var all = this.getAllProgress();
      return all[quizId] || null;
    },

    /* =================================================================
       FORMAT TIME
       ================================================================= */

    formatTime: function (ms) {
      var totalSec = Math.floor(ms / 1000);
      var m = Math.floor(totalSec / 60);
      var s = totalSec % 60;
      if (m > 0) return m + "m " + (s < 10 ? "0" : "") + s + "s";
      return s + "s";
    },

    /* =================================================================
       ESCAPE HTML
       ================================================================= */

    escapeHtml: function (str) {
      if (!str) return "";
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    },

    /* =================================================================
       MODAL CREATE / OPEN / CLOSE
       ================================================================= */

    createModal: function () {
      this.closeModal();

      var overlay = document.createElement("div");
      overlay.className = "ael-quiz-modal-overlay";

      var modal = document.createElement("div");
      modal.className = "ael-quiz-modal";

      var closeBtn = document.createElement("button");
      closeBtn.className = "ael-quiz-modal-close";
      closeBtn.innerHTML = "&times;";
      closeBtn.setAttribute("aria-label", "Close quiz");
      closeBtn.addEventListener("click", function () {
        this.closeModal();
      }.bind(this));

      var content = document.createElement("div");
      content.className = "ael-quiz-modal-content";

      modal.appendChild(closeBtn);
      modal.appendChild(content);
      overlay.appendChild(modal);

      /* close on overlay click */
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) this.closeModal();
      }.bind(this));

      /* close on Escape */
      var escHandler = function (e) {
        if (e.key === "Escape") {
          this.closeModal();
          document.removeEventListener("keydown", escHandler);
        }
      }.bind(this);
      document.addEventListener("keydown", escHandler);

      return overlay;
    },

    openModal: function (overlay) {
      this.stopTimer();
      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        overlay.classList.add("ael-quiz-modal-overlay--visible");
      });
    },

    closeModal: function () {
      this.stopTimer();
      var overlay = document.querySelector(".ael-quiz-modal-overlay");
      if (overlay) {
        overlay.classList.remove("ael-quiz-modal-overlay--visible");
        setTimeout(function () {
          if (overlay.parentNode) overlay.remove();
        }, 300);
      }
      document.body.style.overflow = "";
    },

    /* =================================================================
       UPDATE STYLES (theme change hook)
       ================================================================= */

    updateStyles: function () {
      /* re-inject CSS to pick up new variable values */
      var existing = document.getElementById("ael-quiz-plugin-css");
      if (existing) existing.remove();
      this.injectCSS();
    },

    /* =================================================================
       INJECT CSS
       ================================================================= */

    injectCSS: function () {
      if (document.getElementById("ael-quiz-plugin-css")) return;

      var style = document.createElement("style");
      style.id = "ael-quiz-plugin-css";
      style.textContent = CSS_STRING;
      document.head.appendChild(style);
    }
  };

  /* ===================================================================
     CSS  (injected at runtime so plugin is self-contained)
     =================================================================== */

  var CSS_STRING = [
    '/* ── AEL Quiz Plugin  v1.0.0 ─────────────────────────────────────── */',

    /* --- Launch button on cards --- */
    '.ael-quiz-launch-btn {',
    '  position: absolute; bottom: 12px; right: 12px;',
    '  background: var(--ael-color-primary, #0074FF);',
    '  color: #fff; border: none; border-radius: 6px;',
    '  padding: 6px 14px; font-size: 13px; font-weight: 600;',
    '  cursor: pointer; z-index: 2;',
    '  transition: transform 0.15s ease, box-shadow 0.15s ease;',
    '}',
    '.ael-quiz-launch-btn:hover {',
    '  transform: translateY(-1px);',
    '  box-shadow: 0 4px 12px rgba(0,116,255,0.35);',
    '}',

    /* --- Global floating button --- */
    '.ael-quiz-global-btn {',
    '  position: fixed; bottom: 28px; right: 28px; z-index: 9990;',
    '  display: flex; align-items: center; gap: 8px;',
    '  background: var(--ael-color-primary, #0074FF);',
    '  color: #fff; border: none; border-radius: 50px;',
    '  padding: 14px 22px; font-size: 15px; font-weight: 600;',
    '  cursor: pointer; box-shadow: 0 6px 24px rgba(0,116,255,0.4);',
    '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
    '}',
    '.ael-quiz-global-btn:hover {',
    '  transform: translateY(-2px) scale(1.03);',
    '  box-shadow: 0 10px 32px rgba(0,116,255,0.5);',
    '}',
    '.ael-quiz-global-icon { font-size: 20px; }',

    /* --- Notification toast --- */
    '.ael-quiz-notification {',
    '  position: fixed; top: 24px; left: 50%; transform: translateX(-50%) translateY(-20px);',
    '  z-index: 10000; padding: 12px 24px; border-radius: 8px;',
    '  font-size: 14px; font-weight: 500; opacity: 0;',
    '  transition: opacity 0.3s ease, transform 0.3s ease;',
    '  pointer-events: none;',
    '}',
    '.ael-quiz-notification--visible { opacity: 1; transform: translateX(-50%) translateY(0); }',
    '.ael-quiz-notification--info { background: var(--ael-color-primary, #0074FF); color: #fff; }',
    '.ael-quiz-notification--error { background: var(--ael-color-error, #FF4444); color: #fff; }',
    '.ael-quiz-notification--success { background: var(--ael-color-success, #00FF88); color: #000; }',

    /* --- Modal overlay --- */
    '.ael-quiz-modal-overlay {',
    '  position: fixed; inset: 0; z-index: 9999;',
    '  display: flex; align-items: center; justify-content: center;',
    '  background: rgba(0,0,0,0); backdrop-filter: blur(0px);',
    '  transition: background 0.3s ease, backdrop-filter 0.3s ease;',
    '  padding: 20px;',
    '}',
    '.ael-quiz-modal-overlay--visible {',
    '  background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);',
    '}',

    /* --- Modal --- */
    '.ael-quiz-modal {',
    '  position: relative; width: 100%; max-width: 680px; max-height: 90vh;',
    '  background: var(--ael-color-surface, #1a1a2e);',
    '  border: 1px solid var(--ael-color-border, rgba(255,255,255,0.08));',
    '  border-radius: 16px; overflow: hidden;',
    '  box-shadow: 0 24px 80px rgba(0,0,0,0.5);',
    '  transform: scale(0.92) translateY(20px); opacity: 0;',
    '  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;',
    '}',
    '.ael-quiz-modal-overlay--visible .ael-quiz-modal {',
    '  transform: scale(1) translateY(0); opacity: 1;',
    '}',

    /* --- Modal close button --- */
    '.ael-quiz-modal-close {',
    '  position: absolute; top: 16px; right: 16px; z-index: 10;',
    '  background: rgba(255,255,255,0.06); border: none; border-radius: 8px;',
    '  width: 36px; height: 36px; font-size: 22px;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.5));',
    '  cursor: pointer; display: flex; align-items: center; justify-content: center;',
    '  transition: background 0.15s ease;',
    '}',
    '.ael-quiz-modal-close:hover { background: rgba(255,255,255,0.12); }',

    /* --- Modal content --- */
    '.ael-quiz-modal-content {',
    '  padding: 32px; overflow-y: auto; max-height: 90vh;',
    '  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;',
    '}',

    /* --- Quiz list --- */
    '.ael-quiz-list-header { text-align: center; margin-bottom: 28px; }',
    '.ael-quiz-list-title {',
    '  font-size: 24px; font-weight: 700; margin: 0 0 6px;',
    '  color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-list-subtitle {',
    '  font-size: 14px; margin: 0;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.5));',
    '}',
    '.ael-quiz-list { display: flex; flex-direction: column; gap: 12px; }',
    '.ael-quiz-list-item {',
    '  background: var(--ael-color-surface-alt, rgba(255,255,255,0.04));',
    '  border: 1px solid var(--ael-color-border, rgba(255,255,255,0.06));',
    '  border-radius: 12px; padding: 20px;',
    '  transition: border-color 0.2s ease, box-shadow 0.2s ease;',
    '}',
    '.ael-quiz-list-item:hover {',
    '  border-color: var(--ael-color-primary, #0074FF);',
    '  box-shadow: 0 0 0 1px var(--ael-color-primary, #0074FF);',
    '}',
    '.ael-quiz-list-item-header {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  margin-bottom: 6px;',
    '}',
    '.ael-quiz-list-item-title {',
    '  font-size: 16px; font-weight: 600; margin: 0;',
    '  color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-list-badge {',
    '  background: var(--ael-color-success, #00FF88); color: #000;',
    '  padding: 3px 10px; border-radius: 20px;',
    '  font-size: 12px; font-weight: 700;',
    '}',
    '.ael-quiz-list-item-desc {',
    '  font-size: 13px; margin: 0 0 10px;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.5));',
    '}',
    '.ael-quiz-list-item-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }',
    '.ael-quiz-list-item-meta-tag {',
    '  background: rgba(255,255,255,0.06); padding: 3px 10px; border-radius: 6px;',
    '  font-size: 12px; color: var(--ael-color-text-secondary, rgba(255,255,255,0.5));',
    '  text-transform: capitalize;',
    '}',
    '.ael-quiz-list-item-btn {',
    '  background: var(--ael-color-primary, #0074FF); color: #fff; border: none;',
    '  border-radius: 8px; padding: 10px 24px; font-size: 14px; font-weight: 600;',
    '  cursor: pointer; transition: background 0.15s ease, transform 0.15s ease;',
    '}',
    '.ael-quiz-list-item-btn:hover {',
    '  background: color-mix(in srgb, var(--ael-color-primary, #0074FF) 85%, #000);',
    '  transform: translateY(-1px);',
    '}',

    /* --- Question header --- */
    '.ael-quiz-question-header {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  margin-bottom: 20px;',
    '}',
    '.ael-quiz-question-title {',
    '  font-size: 18px; font-weight: 700; margin: 0;',
    '  color: var(--ael-color-text, #fff);',
    '}',

    /* --- Timer --- */
    '.ael-quiz-timer {',
    '  font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums;',
    '  color: var(--ael-color-error, #FF4444);',
    '  background: rgba(255,68,68,0.1); padding: 4px 12px; border-radius: 8px;',
    '}',

    /* --- Progress bar --- */
    '.ael-quiz-progress-wrap { margin-bottom: 24px; }',
    '.ael-quiz-progress-label {',
    '  font-size: 13px; margin-bottom: 8px;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.5));',
    '}',
    '.ael-quiz-progress-bar {',
    '  height: 6px; border-radius: 3px;',
    '  background: rgba(255,255,255,0.06); overflow: hidden;',
    '}',
    '.ael-quiz-progress-fill {',
    '  height: 100%; border-radius: 3px;',
    '  background: linear-gradient(90deg, var(--ael-color-primary, #0074FF), #00a8ff);',
    '  transition: width 0.4s cubic-bezier(0.4,0,0.2,1);',
    '}',

    /* --- Question card --- */
    '.ael-quiz-question-card {',
    '  background: var(--ael-color-surface-alt, rgba(255,255,255,0.03));',
    '  border: 1px solid var(--ael-color-border, rgba(255,255,255,0.06));',
    '  border-radius: 12px; padding: 24px; margin-bottom: 24px;',
    '}',
    '.ael-quiz-question-text {',
    '  font-size: 16px; line-height: 1.7; margin-bottom: 20px;',
    '  color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-code {',
    '  background: rgba(0,116,255,0.15); color: #6cb4ff;',
    '  padding: 2px 8px; border-radius: 4px;',
    '  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace; font-size: 0.9em;',
    '}',

    /* --- Options --- */
    '.ael-quiz-options { display: flex; flex-direction: column; gap: 10px; }',
    '.ael-quiz-no-options {',
    '  font-size: 14px; font-style: italic;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.4));',
    '}',
    '.ael-quiz-option {',
    '  display: flex; align-items: center; gap: 14px;',
    '  background: var(--ael-color-surface, rgba(255,255,255,0.02));',
    '  border: 2px solid var(--ael-color-border, rgba(255,255,255,0.08));',
    '  border-radius: 10px; padding: 14px 18px;',
    '  cursor: pointer; text-align: left; width: 100%;',
    '  font-size: 15px; color: var(--ael-color-text, #fff);',
    '  transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;',
    '}',
    '.ael-quiz-option:hover {',
    '  border-color: var(--ael-color-primary, #0074FF);',
    '  background: rgba(0,116,255,0.06);',
    '  transform: translateX(4px);',
    '}',
    '.ael-quiz-option--selected {',
    '  border-color: var(--ael-color-primary, #0074FF) !important;',
    '  background: rgba(0,116,255,0.12) !important;',
    '  box-shadow: 0 0 0 1px var(--ael-color-primary, #0074FF);',
    '}',
    '.ael-quiz-option-letter {',
    '  display: flex; align-items: center; justify-content: center;',
    '  width: 32px; height: 32px; border-radius: 8px;',
    '  background: rgba(255,255,255,0.06); font-weight: 700; font-size: 14px;',
    '  flex-shrink: 0; transition: background 0.15s ease, color 0.15s ease;',
    '}',
    '.ael-quiz-option--selected .ael-quiz-option-letter {',
    '  background: var(--ael-color-primary, #0074FF); color: #fff;',
    '}',
    '.ael-quiz-option-label { flex: 1; line-height: 1.5; }',

    /* --- Navigation buttons --- */
    '.ael-quiz-nav {',
    '  display: flex; justify-content: space-between; gap: 12px;',
    '}',
    '.ael-quiz-nav-btn {',
    '  padding: 12px 28px; border-radius: 10px; border: none;',
    '  font-size: 14px; font-weight: 600; cursor: pointer;',
    '  transition: background 0.15s ease, transform 0.1s ease, opacity 0.15s ease;',
    '}',
    '.ael-quiz-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }',
    '.ael-quiz-nav-btn--prev {',
    '  background: rgba(255,255,255,0.06);',
    '  color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-nav-btn--prev:hover:not(:disabled) { background: rgba(255,255,255,0.1); }',
    '.ael-quiz-nav-btn--next {',
    '  background: var(--ael-color-primary, #0074FF); color: #fff;',
    '  margin-left: auto;',
    '}',
    '.ael-quiz-nav-btn--next:hover:not(:disabled) {',
    '  background: color-mix(in srgb, var(--ael-color-primary, #0074FF) 85%, #000);',
    '  transform: translateY(-1px);',
    '}',
    '.ael-quiz-nav-btn--submit {',
    '  background: var(--ael-color-success, #00FF88); color: #000;',
    '}',
    '.ael-quiz-nav-btn--submit:hover:not(:disabled) {',
    '  background: color-mix(in srgb, var(--ael-color-success, #00FF88) 85%, #000);',
    '  transform: translateY(-1px);',
    '}',

    /* --- Results --- */
    '.ael-quiz-results { text-align: center; }',
    '.ael-quiz-results-circle-wrap { margin-bottom: 24px; }',
    '.ael-quiz-results-circle {',
    '  position: relative; width: 120px; height: 120px; margin: 0 auto;',
    '}',
    '.ael-quiz-results-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }',
    '.ael-quiz-results-circle-bg {',
    '  fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 8;',
    '}',
    '.ael-quiz-results-circle-fill {',
    '  fill: none; stroke: var(--ael-color-primary, #0074FF); stroke-width: 8;',
    '  stroke-linecap: round;',
    '}',
    '.ael-quiz-results-score-text {',
    '  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;',
    '  font-size: 28px; font-weight: 800; color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-results-title {',
    '  font-size: 24px; font-weight: 700; margin: 0 0 20px;',
    '  color: var(--ael-color-text, #fff);',
    '}',

    /* --- Stats grid --- */
    '.ael-quiz-results-stats {',
    '  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;',
    '  margin-bottom: 28px;',
    '}',
    '.ael-quiz-results-stat {',
    '  background: var(--ael-color-surface-alt, rgba(255,255,255,0.04));',
    '  border-radius: 10px; padding: 14px 8px;',
    '}',
    '.ael-quiz-results-stat-value {',
    '  display: block; font-size: 22px; font-weight: 700; margin-bottom: 4px;',
    '  color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-results-stat-label {',
    '  display: block; font-size: 12px;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.5));',
    '}',
    '.ael-quiz-results-stat--correct .ael-quiz-results-stat-value { color: var(--ael-color-success, #00FF88); }',
    '.ael-quiz-results-stat--incorrect .ael-quiz-results-stat-value { color: var(--ael-color-error, #FF4444); }',

    /* --- Review list --- */
    '.ael-quiz-results-review-title {',
    '  text-align: left; font-size: 18px; font-weight: 600; margin: 0 0 14px;',
    '  color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-results-review-list { display: flex; flex-direction: column; gap: 12px; text-align: left; }',
    '.ael-quiz-results-review-item {',
    '  background: var(--ael-color-surface-alt, rgba(255,255,255,0.03));',
    '  border: 1px solid var(--ael-color-border, rgba(255,255,255,0.06));',
    '  border-radius: 10px; padding: 16px;',
    '}',
    '.ael-quiz-results-review-item-header {',
    '  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;',
    '}',
    '.ael-quiz-results-review-item-icon {',
    '  display: flex; align-items: center; justify-content: center;',
    '  width: 28px; height: 28px; border-radius: 50%; font-size: 14px; font-weight: 700;',
    '}',
    '.ael-quiz-results-review-item-icon--correct {',
    '  background: rgba(0,255,136,0.15); color: var(--ael-color-success, #00FF88);',
    '}',
    '.ael-quiz-results-review-item-icon--incorrect {',
    '  background: rgba(255,68,68,0.15); color: var(--ael-color-error, #FF4444);',
    '}',
    '.ael-quiz-results-review-item-icon--unanswered {',
    '  background: rgba(255,255,255,0.06); color: var(--ael-color-text-secondary, rgba(255,255,255,0.4));',
    '}',
    '.ael-quiz-results-review-item-num {',
    '  font-size: 13px; font-weight: 600;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.5));',
    '}',
    '.ael-quiz-results-review-item-question {',
    '  font-size: 14px; line-height: 1.6; margin-bottom: 10px;',
    '  color: var(--ael-color-text, #fff);',
    '}',
    '.ael-quiz-results-review-options { display: flex; flex-direction: column; gap: 6px; }',
    '.ael-quiz-results-review-option {',
    '  display: flex; align-items: center; gap: 10px;',
    '  font-size: 13px; color: var(--ael-color-text-secondary, rgba(255,255,255,0.6));',
    '  padding: 6px 10px; border-radius: 6px;',
    '}',
    '.ael-quiz-results-review-option-letter {',
    '  font-weight: 700; width: 22px; text-align: center;',
    '}',
    '.ael-quiz-results-review-option--correct {',
    '  background: rgba(0,255,136,0.08); color: var(--ael-color-success, #00FF88);',
    '}',
    '.ael-quiz-results-review-option--wrong {',
    '  background: rgba(255,68,68,0.08); color: var(--ael-color-error, #FF4444);',
    '  text-decoration: line-through;',
    '}',
    '.ael-quiz-results-review-explanation {',
    '  margin-top: 10px; padding: 10px 14px; border-radius: 8px;',
    '  background: rgba(0,116,255,0.08); border-left: 3px solid var(--ael-color-primary, #0074FF);',
    '  font-size: 13px; line-height: 1.6;',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.7));',
    '}',

    /* --- Result action buttons --- */
    '.ael-quiz-results-actions {',
    '  display: flex; justify-content: center; gap: 12px; margin-top: 28px;',
    '  flex-wrap: wrap;',
    '}',
    '.ael-quiz-results-btn {',
    '  padding: 12px 24px; border-radius: 10px; border: none;',
    '  font-size: 14px; font-weight: 600; cursor: pointer;',
    '  transition: background 0.15s ease, transform 0.1s ease;',
    '}',
    '.ael-quiz-results-btn--retry {',
    '  background: var(--ael-color-error, #FF4444); color: #fff;',
    '}',
    '.ael-quiz-results-btn--retry:hover {',
    '  background: color-mix(in srgb, var(--ael-color-error, #FF4444) 85%, #000);',
    '  transform: translateY(-1px);',
    '}',
    '.ael-quiz-results-btn--retry-all {',
    '  background: var(--ael-color-primary, #0074FF); color: #fff;',
    '}',
    '.ael-quiz-results-btn--retry-all:hover {',
    '  background: color-mix(in srgb, var(--ael-color-primary, #0074FF) 85%, #000);',
    '  transform: translateY(-1px);',
    '}',
    '.ael-quiz-results-btn--close {',
    '  background: rgba(255,255,255,0.06);',
    '  color: var(--ael-color-text-secondary, rgba(255,255,255,0.6));',
    '}',
    '.ael-quiz-results-btn--close:hover { background: rgba(255,255,255,0.1); }',

    /* --- Responsive --- */
    '@media (max-width: 600px) {',
    '  .ael-quiz-modal { max-height: 95vh; }',
    '  .ael-quiz-modal-content { padding: 20px; }',
    '  .ael-quiz-results-stats { grid-template-columns: repeat(2, 1fr); }',
    '  .ael-quiz-global-btn { bottom: 16px; right: 16px; padding: 12px 18px; font-size: 14px; }',
    '}'

  ].join("\n");

  /* ===================================================================
     REGISTER PLUGIN
     =================================================================== */

  if (window.AEL) {
    window.AEL.use(AELQuizPlugin);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (window.AEL) {
        window.AEL.use(AELQuizPlugin);
      } else {
        console.warn("AEL Quiz Plugin: window.AEL not found. Plugin not registered.");
      }
    });
  }

})();
