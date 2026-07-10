$(function () {

  // 퀴즈 14-1/14-2: 체크 시 정답/오답 모달 표시
  function bindAnswerToggle(iconSelector, checkboxIndex) {
    if (!$(iconSelector).length) return;
    var $checkbox = $('.check_list .checkbox_item').eq(checkboxIndex).find('.checkbox_input');
    var $quizPop = $('.quiz_pop');
    var $mainQ = $('.main_q');

    $checkbox.on('change', function () {
      var isChecked = $(this).is(':checked');
      $quizPop.toggleClass('is_hidden', !isChecked);
      $mainQ.toggleClass('is_blur', isChecked);
    });
  }
  bindAnswerToggle('.icon_quiz_correct', 0);
  bindAnswerToggle('.icon_quiz_wrong', 2);

  // 퀴즈 16: 드래그 앤 드롭 빈칸 채우기
  (function () {
    var $dragitemsWrap = $('.dragitems_wrap');
    if (!$dragitemsWrap.length) return;

    var $dragBox = $('.drag_box');
    var $quizPop = $('.quiz_pop');
    var $mainQ = $('.main_q');
    var totalBoxes = $dragBox.length;
    var $dragging = null;

    var $dragboxWrap = $('.dragbox_wrap');
    if ($mainQ.length && $dragboxWrap.length) {
      var offsetTop = $dragboxWrap[0].getBoundingClientRect().top - $mainQ[0].getBoundingClientRect().top;
      $quizPop.css('top', offsetTop + 'px');
    }

    $dragitemsWrap.on('dragstart', 'li', function (e) {
      $dragging = $(this).addClass('is_dragging');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      e.originalEvent.dataTransfer.setData('text/plain', $dragging.text().trim());
    });

    $dragitemsWrap.on('dragend', 'li', function () {
      $(this).removeClass('is_dragging');
    });

    $dragBox.on('dragover', function (e) {
      if ($(this).hasClass('is_filled')) return;
      e.preventDefault();
      $(this).addClass('is_over');
    });

    $dragBox.on('dragleave', function () {
      $(this).removeClass('is_over');
    });

    $dragBox.on('drop', function (e) {
      e.preventDefault();
      $(this).removeClass('is_over');
      if ($(this).hasClass('is_filled') || !$dragging) return;

      var answer = $(this).find('p').text().trim();
      var dragged = $dragging.text().trim();

      if (answer === dragged) {
        $(this).find('p').removeClass('semantic_03');
        $(this).addClass('is_filled');
        $dragging.removeClass('is_dragging').addClass('is_used');

        if ($dragBox.filter('.is_filled').length === totalBoxes) {
          $quizPop.removeClass('is_hidden');
          $mainQ.addClass('is_blur');

          setTimeout(function () {
            $quizPop.addClass('is_hidden');
            $mainQ.removeClass('is_blur');
          }, 1500);
        }
      } else {
        var $wrong = $dragging.addClass('is_wrong');
        setTimeout(function () {
          $wrong.removeClass('is_wrong is_dragging');
        }, 400);
      }
      $dragging = null;
    });
  })();

  // 심화활동 3: 3열(a-d / 1-4 / 가-라) 점(dot) 연결 매칭
  (function () {
    var $matchWrap = $('.match_wrap');
    if (!$matchWrap.length) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = $matchWrap.find('.match_lines')[0];
    var $fromDot = null;
    var $tempLine = null;

    function wrapRect() {
      return $matchWrap[0].getBoundingClientRect();
    }

    function dotCenter($dot) {
      var r = $dot[0].getBoundingClientRect();
      var wrap = wrapRect();
      return { x: r.left + r.width / 2 - wrap.left, y: r.top + r.height / 2 - wrap.top };
    }

    function makeLine(cls) {
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('class', cls);
      svg.appendChild(line);
      return $(line);
    }

    function setLine($line, x1, y1, x2, y2) {
      $line.attr({ x1: x1, y1: y1, x2: x2, y2: y2 });
    }

    $matchWrap.on('mousedown', '.dot', function (e) {
      var $dot = $(this);
      if ($dot.hasClass('is_connected')) return;
      e.preventDefault();
      $fromDot = $dot;
      var c = dotCenter($fromDot);
      $tempLine = makeLine('temp_line');
      setLine($tempLine, c.x, c.y, c.x, c.y);
      $(document).on('mousemove.matchdrag', onMove);
      $(document).on('mouseup.matchdrag', onUp);
    });

    function onMove(e) {
      if (!$tempLine) return;
      var wrap = wrapRect();
      setLine($tempLine, dotCenter($fromDot).x, dotCenter($fromDot).y, e.clientX - wrap.left, e.clientY - wrap.top);
    }

    function onUp(e) {
      $(document).off('.matchdrag');
      if ($tempLine) { $tempLine.remove(); $tempLine = null; }
      if (!$fromDot) return;

      var $target = $(document.elementFromPoint(e.clientX, e.clientY)).closest('.dot');
      var matched = false;

      if ($target.length && !$target.is($fromDot) && !$target.hasClass('is_connected') &&
          String($target.data('match')) === String($fromDot.data('match'))) {
        var c1 = dotCenter($fromDot), c2 = dotCenter($target);
        var $line = makeLine('match_line');
        setLine($line, c1.x, c1.y, c2.x, c2.y);
        $fromDot.add($target).addClass('is_connected');
        matched = true;
      }

      if (!matched && $target.length) {
        var $li = $target.closest('li').addClass('is_wrong');
        setTimeout(function () { $li.removeClass('is_wrong'); }, 400);
      }
      $fromDot = null;
    }
  })();

  // 스터디 08/09: 장바구니 다이어리 결제 애니메이션
  (function () {
    var $diaryRecord = $('.diary_record');
    if (!$diaryRecord.length) return;

    var $payBtn       = $('.split_light .btn_bgDark');
    var $diaryLis     = $diaryRecord.find('ul li');
    var $diaryUl      = $diaryRecord.find('ul');
    var $yodongPocket = $diaryRecord.children('.pocket').first();
    var $remainPocket = $diaryRecord.children('.pocket').last();
    var $nextBtn      = $('.diray_wrap [class^="btn_line"]');

    // 이미 표시된 값을 그대로 읽어옴
    var products = $diaryLis.map(function () {
      var $li = $(this);
      return {
        name: $li.find('.body_01').text().trim(),
        price: Math.abs(parseInt($li.find('.num_03').text().replace(/[^\d-]/g, ''), 10))
      };
    }).get();

    var totalMoney = parseInt($yodongPocket.find('.num_03').text().replace(/[^\d]/g, ''), 10);
    var paidCount = 0, diaryIndex = 0;

    // 초기 상태
    $diaryLis.add($diaryUl).add($remainPocket).add($nextBtn).addClass('is_hidden');
    $yodongPocket.find('.body_01, .num_03').text('');

    function typewrite($el, text, speed) {
      speed = speed || 80;
      return new Promise(function (resolve) {
        $el.text('');
        var i = 0;
        var t = setInterval(function () {
          $el.text($el.text() + text[i++]);
          if (i >= text.length) { clearInterval(t); resolve(); }
        }, speed);
      });
    }

    // 1. 페이지 진입 → 용돈 받음 → 결제하기 활성화
    function wait(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    async function startIntro() {
      await typewrite($yodongPocket.find('.body_01'), '용돈 받음');
      await typewrite($yodongPocket.find('.num_03'), totalMoney.toLocaleString());
      await wait(400);
      $payBtn.prop('disabled', false);
    }

    // 2. 결제하기 클릭
    $payBtn.on('click', async function () {
      var toProcess = [];
      $('.option_item').each(function (i) {
        if ($(this).find('.checkbox_input').prop('checked') && !$(this).data('paid'))
          toProcess.push({ $item: $(this), i: i });
      });
      if (!toProcess.length) return;

      $payBtn.prop('disabled', true);

      for (const { $item, i } of toProcess) {
        var $li = $diaryLis.eq(diaryIndex);
        if (diaryIndex === 0) $diaryUl.removeClass('is_hidden');
        $li.find('.body_01, .num_03').text('');
        $li.removeClass('is_hidden');
        await typewrite($li.find('.body_01'), products[i].name);
        await typewrite($li.find('.num_03'), '-' + products[i].price.toLocaleString());
        totalMoney -= products[i].price;
        paidCount++;
        diaryIndex++;
        $item.data('paid', true).find('.checkbox_input').prop('checked', false);
        $item.addClass('is-paid');
      }

      // 3. 전체 결제 완료 → 남은 돈
      if (paidCount >= products.length) {
        $remainPocket.find('.body_01, .num_03').text('');
        $remainPocket.removeClass('is_hidden');
        await typewrite($remainPocket.find('.body_01'), '남은 돈');
        await typewrite($remainPocket.find('.num_03'), totalMoney.toLocaleString());
        // 4. 다음 버튼
        $nextBtn.removeClass('is_hidden');
      } else {
        $payBtn.prop('disabled', false);
      }
    });

    startIntro();
  })();

  // 스터디 11: 인플레이션/화폐 착각 카드 플립
  (function () {
    var $flipCards = $('.flip_card');
    if (!$flipCards.length) return;

    function showComplete() {
      $('.flip_wrap > .btn_linePrimary2_sm').addClass('is_hidden');
      $('.btm_btn').removeClass('is_hidden');
    }

    // 카드 플립(.7s)과 뒷면 리스트 순차 등장(마지막 delay .65s + .35s)이 모두 끝난 뒤 노출
    function showCompleteAfterFlip() {
      setTimeout(showComplete, 1000);
    }

    $flipCards.on('click', function () {
      var $card = $(this);
      var $wrap = $card.closest('.flip_wrap');

      // flip_wrap.ty3(단면 카드)는 뒷면이 없으므로 플립하지 않음
      if ($wrap.hasClass('ty3')) return;

      // flip_wrap.ty2(퀴즈 카드)는 클릭할 때마다 앞/뒤로 무한 반복 플립
      if ($wrap.hasClass('ty2')) {
        $card.toggleClass('open');
        return;
      }

      if ($card.hasClass('open')) return;
      $card.addClass('open');
      if ($flipCards.length === $flipCards.filter('.open').length) {
        showCompleteAfterFlip();
      }
    });

    // ox_check 영역은 카드 뒤집기가 아닌 O/X 정답 선택 영역이므로 플립 클릭과 분리
    $flipCards.find('.ox_check').on('click', function (e) {
      e.stopPropagation();
    });

    $flipCards.find('.ox_check button').on('click', function () {
      $(this).addClass('is_selected').siblings().removeClass('is_selected');
    });

    // 단면 카드(ty3)의 '이해완료' 버튼: 클릭 시 완료 dim 레이어를 자연스럽게 노출
    $flipCards.find('.btn_linePrimary3_sm').on('click', function () {
      $(this).closest('.flip_card').find('.dim_complete').removeClass('is_hidden');
    });

    $('.flip_wrap > .btn_linePrimary2_sm').on('click', function () {
      $flipCards.addClass('open');
      showCompleteAfterFlip();
    });
  })();

  // 시뮬레이터: 물가상승률 가로 슬라이더(0~6) 드래그
  (function () {
    var $range = $('.chart_range');
    if (!$range.length) return;

    function updateFill() {
      var min = Number($range.attr('min'));
      var max = Number($range.attr('max'));
      var pct = ((Number($range.val()) - min) / (max - min)) * 100;
      $range.css('background', 'linear-gradient(to right, var(--primary-02) 0%, var(--primary-02) ' + pct + '%, var(--white) ' + pct + '%, var(--white) 100%)');
    }

    $range.on('input', updateFill);
    updateFill();
  })();

  // 시뮬레이터: '계산기 사용' 체크 시 sim_left에 dim + 계산기 영역 노출
  (function () {
    var $simLeft = $('.sim_left');
    if (!$simLeft.find('.calc_dim').length) return;

    var $calcCheckbox = $('.info_alert .checkbox_dark');
    $calcCheckbox.on('change', function () {
      $simLeft.toggleClass('is_calc', $(this).is(':checked'));
    });
    $simLeft.toggleClass('is_calc', $calcCheckbox.is(':checked'));
  })();

});
