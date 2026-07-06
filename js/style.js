$(function () {

  // 퀴즈 14-1: 정답 체크 시 정답 모달 표시
  (function () {
    if (!$('.icon_quiz_correct').length) return;
    var $correct = $('.check_list .checkbox_item').eq(0).find('.checkbox_input');

    $correct.on('change', function () {
      var isChecked = $(this).is(':checked');
      $('.quiz_pop').toggleClass('is_hidden', !isChecked);
      $('.main_q').toggleClass('is_blur', isChecked);
    });
  })();

  // 퀴즈 14-2: 오답 체크 시 오답 모달 표시
  (function () {
    if (!$('.icon_quiz_wrong').length) return;
    var $wrong = $('.check_list .checkbox_item').eq(2).find('.checkbox_input');

    $wrong.on('change', function () {
      var isChecked = $(this).is(':checked');
      $('.quiz_pop').toggleClass('is-hidden', !isChecked);
      $('.main_q').toggleClass('is_blur', isChecked);
    });
  })();

  // 퀴즈 16: 드래그 앤 드롭 빈칸 채우기
  (function () {
    var $dragitemsWrap = $('.dragitems_wrap');
    if (!$dragitemsWrap.length) return;

    var $dragging = null;
    var $mainQ = $('.main_q');
    var $dragboxWrap = $('.dragbox_wrap');
    if ($mainQ.length && $dragboxWrap.length) {
      var mainQTop = $mainQ[0].getBoundingClientRect().top;
      var dragboxTop = $dragboxWrap[0].getBoundingClientRect().top;
      $('.quiz_pop').css('top', (dragboxTop - mainQTop) + 'px');
    }

    $dragitemsWrap.on('dragstart', 'li', function (e) {
      $dragging = $(this);
      $(this).addClass('is_dragging');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      e.originalEvent.dataTransfer.setData('text/plain', $(this).text().trim());
    });

    $dragitemsWrap.on('dragend', 'li', function () {
      $(this).removeClass('is_dragging');
    });

    $('.drag_box').on('dragover', function (e) {
      if ($(this).hasClass('is_filled')) return;
      e.preventDefault();
      $(this).addClass('is_over');
    });

    $('.drag_box').on('dragleave', function () {
      $(this).removeClass('is_over');
    });

    $('.drag_box').on('drop', function (e) {
      e.preventDefault();
      $(this).removeClass('is_over');
      if ($(this).hasClass('is_filled') || !$dragging) return;

      var answer = $(this).find('p').text().trim();
      var dragged = $dragging.text().trim();

      if (answer === dragged) {
        $(this).find('p').removeClass('semantic_03');
        $(this).addClass('is_filled');
        $dragging.removeClass('is_dragging').addClass('is_used');

        if ($('.drag_box').length === $('.drag_box.is_filled').length) {
          $('.quiz_pop').removeClass('is_hidden');
          $('.main_q').addClass('is_blur');

          setTimeout(function () {
            $('.quiz_pop').addClass('is_hidden');
            $('.main_q').removeClass('is_blur');
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
    var $diaryLis     = $('.diary_record ul li');
    var $diaryUl      = $('.diary_record ul');
    var $yodongPocket = $('.diary_record > .pocket:first-child');
    var $remainPocket = $('.diary_record > .pocket:last-child');
    var $nextBtn      = $('.diray_wrap [class^="btn_line"]');

    // 페이지별로 값이 다르므로(08=1년 전, 09=현재) 마크업에 이미 표시된 값을 그대로 읽어온다
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
    $diaryLis.add($diaryUl).add($remainPocket).add($nextBtn).addClass('is-hidden');
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
    async function startIntro() {
      await typewrite($yodongPocket.find('.body_01'), '용돈 받음');
      await typewrite($yodongPocket.find('.num_03'), totalMoney.toLocaleString());
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

      for (var idx = 0; idx < toProcess.length; idx++) {
        var $item = toProcess[idx].$item;
        var i = toProcess[idx].i;
        var $li = $diaryLis.eq(diaryIndex);
        if (diaryIndex === 0) $diaryUl.removeClass('is-hidden');
        $li.find('.body_01, .num_03').text('');
        $li.removeClass('is-hidden');
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
        $remainPocket.removeClass('is-hidden');
        await typewrite($remainPocket.find('.body_01'), '남은 돈');
        await typewrite($remainPocket.find('.num_03'), totalMoney.toLocaleString());
        // 4. 다음 버튼
        $nextBtn.removeClass('is-hidden');
      } else {
        $payBtn.prop('disabled', false);
      }
    });

    startIntro();
  })();

  // 스터디 11: 인플레이션/화폐 착각 카드 플립
  (function () {
    if (!$('.flip_card').length) return;

    function showComplete() {
      $('.flip_wrap > .btn_linePrimary2_sm').addClass('is-hidden');
      $('.btm_btn').removeClass('is-hidden');
    }

    $('.flip_card .card_front .btn_linePrimary').on('click', function () {
      $(this).closest('.flip_card').addClass('open');
      if ($('.flip_card').length === $('.flip_card.open').length) {
        showComplete();
      }
    });

    $('.flip_wrap > .btn_linePrimary2_sm').on('click', function () {
      $('.flip_card').addClass('open');
      showComplete();
    });
  })();

});
