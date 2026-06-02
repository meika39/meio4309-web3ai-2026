/* ==========================================================================
   CalmTask - Premium Client-Side Application Logic & UX Features
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. アプリの状態管理
    // ----------------------------------------------------------------------
    let originalTask = "";
    let steps = [];
    let currentIndex = 0;
    let history = [];
    
    // タイマー変数
    let timerInterval = null;
    let timerDuration = 600; // 10分 (秒)
    let isTimerRunning = false;

    // スケジュール状態管理 (初期予定: 12:00〜13:00 お昼ご飯)
    let schedules = [
        { title: "🍽 お昼ご飯", start: 12, end: 13 }
    ];
    let assignedTasks = {}; // slotIndex: stepIndex

    // ----------------------------------------------------------------------
    // 2. DOM要素の取得
    // ----------------------------------------------------------------------
    const taskInput = document.getElementById('taskInput');
    const decomposeBtn = document.getElementById('decomposeBtn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    const inputPanel = document.getElementById('inputPanel');
    const focusPanel = document.getElementById('focusPanel');
    const previewPanel = document.getElementById('previewPanel');
    const historyPanel = document.getElementById('historyPanel');
    
    const parentTaskTitle = document.getElementById('parentTaskTitle');
    const currentStepText = document.getElementById('currentStepText');
    const currentStepDesc = document.getElementById('currentStepDesc');
    
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressBar');
    const completedCount = document.getElementById('completedCount');
    
    const timerDisplay = document.getElementById('timerDisplay');
    const timerToggleBtn = document.getElementById('timerToggleBtn');
    const timerResetBtn = document.getElementById('timerResetBtn');
    
    const supportBtn = document.getElementById('supportBtn');
    const completeBtn = document.getElementById('completeBtn');
    const supportMessageBox = document.getElementById('supportMessageBox');
    const supportMessageText = document.getElementById('supportMessageText');
    const easyActionBtn = document.getElementById('easyActionBtn');
    
    const stepsList = document.getElementById('stepsList');
    const historyList = document.getElementById('historyList');
    const resetAppBtn = document.getElementById('resetAppBtn');

    // スケジュール用DOM要素
    const schedulePanel = document.getElementById('schedulePanel');
    const timelineList = document.getElementById('timelineList');
    const addSchedBtn = document.getElementById('addSchedBtn');
    const schedTitleInput = document.getElementById('schedTitle');
    const schedStartSelect = document.getElementById('schedStart');
    const schedEndSelect = document.getElementById('schedEnd');
    const autoAssignBtn = document.getElementById('autoAssignBtn');
    const presetSchedBtns = document.querySelectorAll('.preset-sched-btn');

    // ----------------------------------------------------------------------
    // 3. 細分化プリセットデータ
    // ----------------------------------------------------------------------
    const presets = {
        "課題のレポートを書く": [
            { text: "デスクに向かい、座って深呼吸をする", desc: "まずは姿勢を整えて息を吸うだけ。完璧です。" },
            { text: "パソコンの電源を入れて、ブラウザを開く", desc: "資料やWordのことはまだ考えず、起動するだけです。" },
            { text: "レポートのファイル（または新規作成）を開く", desc: "文字を書く必要はありません。白い画面を出すだけでOK。" },
            { text: "タイトルと自分の名前だけを入力する", desc: "これで書類の10%は完成したようなものです！" },
            { text: "レポートの見出し（構成）を1つだけコピペか入力する", desc: "「はじめに」だけでも構いません。大枠を作りましょう。" },
            { text: "参考にする資料やウェブサイトを1つだけ開く", desc: "読むのは見出しだけでOKです。ざっと眺めましょう。" },
            { text: "最初の1文（例：『本レポートでは…』）を打ち込む", desc: "クオリティは気にせず、とにかく1行書くだけで大勝利です！" }
        ],
        "就活の準備・企業研究": [
            { text: "お気に入りのノートとペン（またはスマホ）を手元に置く", desc: "準備するだけで脳が活動モードに入り始めます。" },
            { text: "就活サイトか検索エンジンを開く", desc: "まだ何も検索しなくて大丈夫。画面を見るだけです。" },
            { text: "少しでも興味のある企業（または業界）を1社だけ検索する", desc: "深く調べず、名前を見るだけで十分です。" },
            { text: "その企業のホームページの『社長メッセージ』か『理念』を見る", desc: "文字数が多いところは飛ばして、写真や太字だけを眺めましょう。" },
            { text: "『へえ、そうなんだ』と思った言葉をノートに1つメモする", desc: "あなたの素直な感想やキーワードを1行書くだけで完璧です。" },
            { text: "マイページ等のブックマークやカレンダーで直近の日程を1つ確認する", desc: "確認するだけ。行動する必要はまだありません。" }
        ],
        "散らかった部屋の掃除": [
            { text: "部屋の中央に立ち、伸びをする", desc: "体を動かしてリフレッシュ。ストレッチしましょう。" },
            { text: "ゴミ箱を目の前に持ってくる", desc: "ゴミ箱の移動だけで、掃除の8割は終わりました。" },
            { text: "目の前にある明らかなゴミを『3つだけ』拾って捨てる", desc: "ティッシュのゴミやペットボトルなど、簡単なものでOK。" },
            { text: "床に落ちている洋服を1着だけハンガーに掛けるか畳む", desc: "全部ではなく、まずは『たった1着』だけです。" },
            { text: "机の上にある不要なものを引き出しにしまうかゴミ箱へ", desc: "目の前の視界を少しだけクリアにしましょう。" },
            { text: "片付いた狭い範囲だけを見て『よくやった！』と呟く", desc: "掃除のコツは完璧を目指さないこと。今日のあなたは最高です！" }
        ]
    };

    // 汎用細分化テンプレート（入力がプリセット以外の場合）
    function getGenericSteps(taskName) {
        return [
            { text: `「${taskName}」に必要な道具（PC、筆記用具など）を用意する`, desc: "準備をするだけで全体の半分は終わったようなものです。" },
            { text: "デスクの前に座り、肩の力を抜いて深呼吸をする", desc: "まずは3秒息を吸って、吐き出しましょう。" },
            { text: "関連するアプリ、または書類を1つだけ開く", desc: "中身はまだ見なくて大丈夫。ただ開くだけです。" },
            { text: "最初の『1分だけ』取り組める小さな作業を決める", desc: "タイトルを書く、最初の1項目を眺める、何でも構いません。" },
            { text: "とにかくクオリティを無視して、1回だけ手を動かす", desc: "ひどい出来でも構いません。まずは形にするだけで100点です！" },
            { text: "キリが良くなくても、5分経ったら一度休む準備をする", desc: "続けられそうなら続けてもよし、ここで止めても大進歩です。" }
        ];
    }

    // ----------------------------------------------------------------------
    // 4. Web Audio API によるチャイム音合成
    // ----------------------------------------------------------------------
    function playSuccessSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // 心が落ち着き、達成感を感じるアルペジオ (Cメジャーセブンス)
            const notes = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
            const now = ctx.currentTime;
            
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine'; // 優しい正弦波
                osc.frequency.setValueAtTime(freq, now + i * 0.08);
                
                // フェードアウト設定
                gain.gain.setValueAtTime(0.15, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.6);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.65);
            });
        } catch (e) {
            console.log("AudioContext is not supported or blocked by user gesture:", e);
        }
    }

    // ゆるサポート用の優しい音 (Fメジャー)
    function playRelaxSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const notes = [349.23, 440.00, 523.25]; // F4, A4, C5 (優しい和音)
            const now = ctx.currentTime;
            
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'triangle'; // より丸みのある音
                osc.frequency.setValueAtTime(freq, now);
                
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(now);
                osc.stop(now + 1.3);
            });
        } catch (e) {
            console.log("AudioContext relaxation sound failed:", e);
        }
    }

    // ----------------------------------------------------------------------
    // 5. パーティクル（キラキラ）演出ロジック
    // ----------------------------------------------------------------------
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 6 + 2;
            this.speedX = Math.random() * 8 - 4;
            this.speedY = Math.random() * -8 - 2; // 上方向へ噴射
            this.gravity = 0.18;
            this.color = `hsl(${Math.random() * 60 + 260}, 100%, 75%)`; // 紫〜青〜ピンク系
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.01;
        }

        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= this.decay;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // キラキラした星型を描く
            const spikes = 4;
            const outerRadius = this.size;
            const innerRadius = this.size / 2;
            let rot = Math.PI / 2 * 3;
            let cx = this.x;
            let cy = this.y;
            let step = Math.PI / spikes;

            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                cx = this.x + Math.cos(rot) * outerRadius;
                cy = this.y + Math.sin(rot) * outerRadius;
                ctx.lineTo(cx, cy);
                rot += step;

                cx = this.x + Math.cos(rot) * innerRadius;
                cy = this.y + Math.sin(rot) * innerRadius;
                ctx.lineTo(cx, cy);
                rot += step;
            }
            ctx.lineTo(this.x, this.y - outerRadius);
            ctx.closePath();
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    function createSparkles(x, y) {
        for (let i = 0; i < 40; i++) {
            particles.push(new Particle(x, y));
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ----------------------------------------------------------------------
    // 6. アプリケーションコントロールロジック
    // ----------------------------------------------------------------------
    
    // アプリ初期化
    function initApp(taskName) {
        originalTask = taskName;
        
        // プリセットがあれば利用、なければ生成
        if (presets[taskName]) {
            steps = JSON.parse(JSON.stringify(presets[taskName]));
        } else {
            steps = getGenericSteps(taskName);
        }
        
        currentIndex = 0;
        history = [];
        
        // パネル切り替えと2カラムグリッド配置
        document.querySelector('.app-main').classList.add('active-task-layout');
        inputPanel.classList.add('hidden');
        focusPanel.classList.remove('hidden');
        schedulePanel.classList.remove('hidden');
        previewPanel.classList.remove('hidden');
        historyPanel.classList.remove('hidden');
        
        // テキスト初期表示
        parentTaskTitle.textContent = originalTask;
        updateFocusCard();
        renderRoadmap();
        renderHistory();
        updateProgress();
        
        // タイムライン描画と自動配分
        autoAssignTasks();
        
        // タイマーリセット
        resetTimer();
    }

    // フォーカスカードの更新
    function updateFocusCard() {
        if (currentIndex < steps.length) {
            currentStepText.textContent = steps[currentIndex].text;
            currentStepDesc.textContent = steps[currentIndex].desc;
            supportMessageBox.classList.add('hidden');
            
            // できたボタン・ゆるボタンを有効化
            completeBtn.disabled = false;
            supportBtn.disabled = false;
        } else {
            // 全タスク完了
            currentStepText.innerHTML = "✨ おめでとうございます！ ✨";
            currentStepDesc.textContent = "全ての小さなステップを完了しました。本当に素晴らしい進歩です！";
            completeBtn.disabled = true;
            supportBtn.disabled = true;
            supportMessageBox.classList.add('hidden');
            stopTimer();
            playSuccessSound();
            createSparkles(window.innerWidth / 2, window.innerHeight / 2 - 50);
        }
    }

    // 進捗の更新
    function updateProgress() {
        if (steps.length === 0) return;
        const percent = Math.round((currentIndex / steps.length) * 100);
        progressPercent.textContent = `${percent}%`;
        progressBar.style.width = `${percent}%`;
        completedCount.textContent = currentIndex;
    }

    // ロードマッププレビューの描画
    function renderRoadmap() {
        stepsList.innerHTML = '';
        steps.forEach((step, idx) => {
            const li = document.createElement('li');
            
            if (idx < currentIndex) {
                li.className = 'completed';
            } else if (idx === currentIndex) {
                li.className = 'current';
            }
            
            li.innerHTML = `
                <span class="step-num">${idx + 1}</span>
                <span class="step-title">${step.text}</span>
            `;
            stepsList.appendChild(li);
        });
    }

    // 履歴（あゆみ）の描画
    function renderHistory() {
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li style="background: none; border: none; color: var(--text-dim);">まだ完了したステップはありません。一歩ずつ進みましょう。</li>';
            return;
        }
        
        // 新しい履歴が上に来るように表示
        [...history].reverse().forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div style="display: flex; flex-direction: column; width: 100%;">
                    <span>✓ ${item.text}</span>
                    <span class="history-time">${item.time}</span>
                </div>
            `;
            historyList.appendChild(li);
        });
    }

    // ----------------------------------------------------------------------
    // 7. イベントリスナーとインタラクション
    // ----------------------------------------------------------------------
    
    // 細分化して始めるボタン
    decomposeBtn.addEventListener('click', () => {
        const taskName = taskInput.value.trim();
        if (taskName) {
            initApp(taskName);
        } else {
            taskInput.focus();
            taskInput.placeholder = "何かタスクを入力してください！";
        }
    });

    // Enterキーでも起動可能にする
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            decomposeBtn.click();
        }
    });

    // プリセット提案ボタン
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const task = btn.getAttribute('data-task');
            taskInput.value = task;
            initApp(task);
        });
    });

    // できた！ボタン
    completeBtn.addEventListener('click', (e) => {
        if (currentIndex >= steps.length) return;
        
        // キラキラ演出をボタン位置で発生させる
        const rect = completeBtn.getBoundingClientRect();
        createSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
        
        // チャイム音再生
        playSuccessSound();

        // 履歴に追加
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        history.push({
            text: steps[currentIndex].text,
            time: timeStr
        });

        // インデックスを増やす
        currentIndex++;
        
        // UI更新
        updateFocusCard();
        renderRoadmap();
        renderHistory();
        updateProgress();
        
        // スケジュール内のタスク進行状況も連動更新
        autoAssignTasks();
    });

    // 今は無理かも...（ゆるサポート）
    supportBtn.addEventListener('click', () => {
        playRelaxSound();
        supportMessageBox.classList.remove('hidden');
        
        const relaxationMessages = [
            "焦る必要は1ミリもありません。ゆっくり深呼吸を1回しましょう。それだけで十分素晴らしい一歩です。",
            "予定通りいかなくても問題ありません。ゲームの攻略本も、たまには寄り道するものです。今は少し難易度を下げてみませんか？",
            "脳が『少し疲れたよ』とサインを出している証拠です。よく気がつきましたね。休むこともプロの判断です。",
            "100点満点中、1点でも動けば合格です。完璧主義を一度脇に置いて、最もハードルの低い動きをしましょう。"
        ];
        
        const randomMsg = relaxationMessages[Math.floor(Math.random() * relaxationMessages.length)];
        supportMessageText.textContent = randomMsg;
        
        // できた・ゆるボタンを一時的に制限
        supportBtn.disabled = true;
    });

    // もっと簡単なアクションにする
    easyActionBtn.addEventListener('click', () => {
        if (currentIndex >= steps.length) return;
        
        // 現在のタスクを極限まで簡単なものへ上書きする
        const ultraEasyActions = [
            { text: "背筋を伸ばして、大きく深呼吸を1回だけする", desc: "これで酸素が脳に届き、タスクに向けた素晴らしい最初の一歩が完了します。" },
            { text: "デスクの上のスマホを画面が見えないように裏返す", desc: "通知の誘惑をなくすだけで、驚くほど不安が減ります。" },
            { text: "パソコン、またはノートをただ開いて10秒間眺める", desc: "何も書かなくていいです。開くポーズを取るだけで完璧です。" },
            { text: "「よし！」と小さな声で声に出して言ってみる", desc: "言葉のアクションは最も軽く、脳に最もポジティブに作用します。" }
        ];
        
        const easyStep = ultraEasyActions[Math.floor(Math.random() * ultraEasyActions.length)];
        
        // 現在のステップを上書き
        steps[currentIndex].text = `🌟 ${easyStep.text}`;
        steps[currentIndex].desc = easyStep.desc;
        
        updateFocusCard();
        renderRoadmap();
        
        // ゆるサポートエリアを閉じる
        supportMessageBox.classList.add('hidden');
        supportBtn.disabled = false;
    });

    // 最初からやり直す
    resetAppBtn.addEventListener('click', () => {
        stopTimer();
        document.querySelector('.app-main').classList.remove('active-task-layout');
        inputPanel.classList.remove('hidden');
        focusPanel.classList.add('hidden');
        schedulePanel.classList.add('hidden');
        previewPanel.classList.add('hidden');
        historyPanel.classList.add('hidden');
        taskInput.value = "";
    });

    // ----------------------------------------------------------------------
    // 8. タイマーロジック
    // ----------------------------------------------------------------------
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timerDuration);
    }

    function startTimer() {
        if (isTimerRunning) return;
        isTimerRunning = true;
        timerToggleBtn.textContent = "⏸ 一時停止";
        timerToggleBtn.classList.remove('btn-secondary');
        timerToggleBtn.classList.add('btn-outline');
        
        timerInterval = setInterval(() => {
            if (timerDuration > 0) {
                timerDuration--;
                updateTimerDisplay();
            } else {
                // タイマーアップ
                stopTimer();
                playSuccessSound();
                createSparkles(window.innerWidth / 2, window.innerHeight / 2);
                alert("10分のプチ集中時間が完了しました！素晴らしい！少し休憩しましょう。");
                resetTimer();
            }
        }, 1000);
    }

    function stopTimer() {
        if (!isTimerRunning) return;
        isTimerRunning = false;
        clearInterval(timerInterval);
        timerToggleBtn.textContent = "▶ スタート";
        timerToggleBtn.classList.remove('btn-outline');
        timerToggleBtn.classList.add('btn-secondary');
    }

    function resetTimer() {
        stopTimer();
        timerDuration = 600; // 10分に戻す
        updateTimerDisplay();
    }

    timerToggleBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    });

    timerResetBtn.addEventListener('click', () => {
        resetTimer();
    });

    // ----------------------------------------------------------------------
    // 9. スケジュール＆タイムスロット連携機能 (CalmTask v2)
    // ----------------------------------------------------------------------
    
    // スケジュール自動配分アルゴリズム
    function autoAssignTasks() {
        assignedTasks = {};
        let stepIdx = currentIndex;
        
        // 08:00〜24:00 (16時間枠、インデックス0が08:00)
        for (let slot = 0; slot < 16; slot++) {
            const hour = slot + 8;
            
            // この時間枠が固定予定と重なっているか
            const isBusy = schedules.some(s => hour >= s.start && hour < s.end);
            if (!isBusy) {
                // 空き時間があれば未完了のステップを配分
                if (stepIdx < steps.length) {
                    assignedTasks[slot] = stepIdx;
                    stepIdx++;
                }
            }
        }
        renderTimeline();
    }

    // タイムラインのレンダリング
    function renderTimeline() {
        timelineList.innerHTML = '';
        
        for (let slot = 0; slot < 16; slot++) {
            const startHour = slot + 8;
            const endHour = startHour + 1;
            const startStr = `${startHour.toString().padStart(2, '0')}:00`;
            const endStr = `${endHour.toString().padStart(2, '0')}:00`;
            
            // 固定予定があるかチェック
            const busySchedIdx = schedules.findIndex(s => startHour >= s.start && startHour < s.end);
            
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            if (busySchedIdx !== -1) {
                // 固定予定スロット
                const sched = schedules[busySchedIdx];
                item.classList.add('slot-busy');
                
                const isFirstHour = startHour === sched.start;
                const deleteBtnHtml = isFirstHour 
                    ? `<button class="delete-sched-btn" data-index="${busySchedIdx}">✕</button>` 
                    : '';
                
                item.innerHTML = `
                    <div class="timeline-time">${startStr} - ${endStr}</div>
                    <div class="timeline-content">
                        <span class="timeline-title">${sched.title}</span>
                        ${deleteBtnHtml}
                    </div>
                `;
            } else if (assignedTasks[slot] !== undefined) {
                // タスク配分スロット
                const stepIndex = assignedTasks[slot];
                const step = steps[stepIndex];
                item.classList.add('slot-task');
                
                const isCompleted = stepIndex < currentIndex;
                const statusIcon = isCompleted ? '✓' : '🎯';
                const textStyle = isCompleted ? 'text-decoration: line-through; opacity: 0.5;' : '';
                
                item.innerHTML = `
                    <div class="timeline-time">${startStr} - ${endStr}</div>
                    <div class="timeline-content" style="${textStyle}">
                        <span class="timeline-title">${statusIcon} ${step.text}</span>
                        <span style="font-size: 0.72rem; color: var(--text-dim); margin-left: 6px;">(極小)</span>
                    </div>
                `;
            } else {
                // 空き時間スロット
                item.classList.add('slot-free');
                item.innerHTML = `
                    <div class="timeline-time">${startStr} - ${endStr}</div>
                    <div class="timeline-content">
                        <span class="timeline-title" style="font-style: italic; opacity: 0.65;">✨ 空き時間（タスク可能）</span>
                    </div>
                `;
            }
            
            timelineList.appendChild(item);
        }
        
        // 予定の削除ボタンにリスナーを設定
        document.querySelectorAll('.delete-sched-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                schedules.splice(idx, 1);
                autoAssignTasks();
            });
        });
    }

    // 新規予定の追加
    function addSchedule(title, start, end) {
        if (!title) return;
        if (start >= end) {
            alert("終了時間は開始時間より後に設定してください。");
            return;
        }
        
        // 重複チェック
        const hasOverlap = schedules.some(s => {
            return (start < s.end && end > s.start);
        });
        
        if (hasOverlap) {
            alert("他の予定と重なっています。時間を調整してください。");
            return;
        }
        
        schedules.push({ title, start, end });
        schedules.sort((a, b) => a.start - b.start);
        
        schedTitleInput.value = '';
        autoAssignTasks();
    }

    // 予定の追加ボタン
    addSchedBtn.addEventListener('click', () => {
        const title = schedTitleInput.value.trim();
        const start = parseInt(schedStartSelect.value);
        const end = parseInt(schedEndSelect.value);
        addSchedule(title, start, end);
    });

    // 予定のプリセットボタン
    presetSchedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.getAttribute('data-title');
            const start = parseInt(btn.getAttribute('data-start'));
            const end = parseInt(btn.getAttribute('data-end'));
            addSchedule(title, start, end);
        });
    });

    // タスクを自動配分ボタン
    autoAssignBtn.addEventListener('click', () => {
        autoAssignTasks();
        playRelaxSound();
    });
});
