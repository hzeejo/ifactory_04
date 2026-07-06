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

    $flipCards.find('.card_front .btn_linePrimary').on('click', function () {
      $(this).closest('.flip_card').addClass('open');
      if ($flipCards.length === $flipCards.filter('.open').length) {
        showComplete();
      }
    });

    $('.flip_wrap > .btn_linePrimary2_sm').on('click', function () {
      $flipCards.addClass('open');
      showComplete();
    });
  })();

});
