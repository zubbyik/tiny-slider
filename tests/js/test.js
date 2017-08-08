if (!Object.keys) Object.keys = function(o) {
  if (o !== Object(o))
    throw new TypeError('Object.keys called on a non-object');
  var k=[],p;
  for (p in o) if (Object.prototype.hasOwnProperty.call(o,p)) k.push(p);
  return k;
}

var resultsDiv = doc.querySelector('.test-results'),
    windowWidth = (document.documentElement || document.body.parentNode || document.body).clientWidth,
    multiplyer = 100,
    edgePadding = 50,
    gutter = 10,
    ua = navigator.userAgent,
    tabindex = (ua.indexOf('MSIE 9.0') > -1 || ua.indexOf('MSIE 8.0') > -1) ? 'tabIndex' : 'tabindex',
    canFireKeydown;

document.onkeydown = function (e) {
  e = e || window.event;
  var body = document.body;
  if (e.ctrlKey === true && e.keyCode === 192) {
    if (body.getAttribute('data-fire-keyevent') !== 'true') {
      body.setAttribute('data-fire-keyevent', 'true');
    }
  }
};

fire(document, 'keydown', {'ctrlKey': true, 'keyCode': 192});
canFireKeydown = (document.body.getAttribute('data-fire-keyevent') === 'true') ? true : false;

window.onload = function () {
  testBase();
  testNonLoop();
  testRewind();
  testFixedWidth();
  testFixedWidthGutter();
  testFixedWidthEdgePadding();
  testFixedWidthEdgePaddingGutter();
  testVertical();
  testVerticalGutter();
  testVerticalEdgePadding();
  testVerticalEdgePaddingGutter();
  testResponsive();
  testMouseDrag();
  testGutter();
  testEdgePadding();
  testEdgePaddingGutter();
  testFewitems();
  testSlideByPage();
  testArrowKeys();
  testAutoplay();
  testAnimation1();
  testAnimation2();
  testLazyload();
  testCustomize();
  testAutoHeight();
  testNested();
};


// window.onresize = function () {
//   resultsDiv.innerHTML = '';
//   testBase();
// };

// ### base
function testBase () {
  var id = 'base',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  runTest('Outer wrapper: classes', function () {
    return containsClasses(info.container.parentNode.parentNode, ['tns-outer']);
  });

  runTest('Inner wrapper: classes', function () {
    return containsClasses(info.container.parentNode, ['tns-inner', 'tns-ovh']);
  });

  runTest('Container: classes', function () {
    return containsClasses(info.container, ['base','tns-slider','tns-carousel','tns-horizontal']);
  });

  runTest('Slides: width, count, id, class, aria-hidden, tabindex', function () {
    return checkSlidesAttrs(id);
  });

  runTest('Slides: position', function () {
    return checkPositionEdgePadding(id);
  });

  runTest('Controls: class, aria-label, aria-controls, data-controls, tabindex', function () {
    return checkControlsAttrs(id);
  });

  runTest('Nav items: data-nav, hidden', function () {
    var navItems = info.navItems,
        nav0 = navItems[0],
        nav1 = navItems[1];
    return nav0.getAttribute('data-nav') === '0' &&
      !nav0.hasAttribute('hidden') &&
      nav1.getAttribute('data-nav') === '1' &&
      nav1.hasAttribute('hidden');
  });

  var controlsClick = addTest('Controls: click functions');
  var navClick = addTest('Nav: click functions');
  var controlsKeydown = addTest('Controls: keydown events');
  var navKeydown = addTest('Nav: keydown events');
  var testGoto = addTest('Goto: Random numbers');

  /* ### check controls click functions
   *
   */
  checkControlsClick(controlsClick, id, 11).then(function () {
    /* ### check nav click functions
     *
     */
    return Promise.resolve().then(function () {
      var assertion,
          slideItems = info.slideItems,
          visibleNavIndexes = info.visibleNavIndexes,
          len = visibleNavIndexes.length;

      for (var i = len; i--;) {
        info.navItems[visibleNavIndexes[i]].click();
        var current = slider.getInfo().index,
            currentSlide = slideItems[current];
        if (assertion !== false) {
          assertion = 
            info.navItems[visibleNavIndexes[i]].getAttribute('aria-selected') === 'true' &&
            current%info.slideCount === visibleNavIndexes[i] &&
            compare2Nums(currentSlide.getBoundingClientRect().left, 0) &&
            currentSlide.getAttribute('aria-hidden') === 'false';
        }
      }

      updateTest(navClick, assertion);
    });
  }).then(function () {
    // browser support fire keyevents
    if (canFireKeydown) {

      /* ### check controls keydown functions
       * 
       */
      return Promise.resolve().then(function () {
        var assertion;

        // fire keydown events on left arrow
        return repeat(function () {
          fire(info.controlsContainer, 'keydown', {'keyCode': 37}); 
        }, 3).then(function () {
          return Promise.resolve().then(function () {
            var prev = info.index,
                current = slider.getInfo().index,
                absIndex = getAbsIndex(prev, -3, info),
                currentSlide = info.slideItems[current],
                wrapper = info.container.parentNode;
                
            assertion = 
              current%info.slideCount === absIndex &&
              info.navItems[absIndex].getAttribute('aria-selected') === 'true' &&
              compare2Nums(currentSlide.getBoundingClientRect().left, wrapper.getBoundingClientRect().left);
          });
        }).then(function () {
          if (assertion) {

            // fire keydown events on right arrow
            return repeat(function () { 
              fire(info.controlsContainer, 'keydown', {'keyCode': 39});
            }, 3).then(function () {
              return Promise.resolve().then(function () {
                var current = slider.getInfo().index,
                    absIndex = 0,
                    currentSlide = info.slideItems[current],
                    wrapper = info.container.parentNode;
                    
                assertion = 
                  current%info.slideCount === absIndex &&
                  info.navItems[absIndex].getAttribute('aria-selected') === 'true' &&
                  compare2Nums(currentSlide.getBoundingClientRect().left, wrapper.getBoundingClientRect().left);
              });
            });
          } else {
            return Promise.resolve();
          }
        }).then(function () {
          return Promise.resolve().then(function () {
            updateTest(controlsKeydown, assertion);
          });
        }).then(function () {

          /* ### check nav keydown functions
           * 
           */
          // reset assertion
          assertion = undefined;
          var info = slider.getInfo(),
              slideCount = info.slideCount,
              navItems = info.navItems,
              slideItems = info.slideItems,
              visibleNavIndexes = info.visibleNavIndexes,
              wrapperLeft = info.container.parentNode.getBoundingClientRect().left;

          return new Promise(function(resolve) {
            // focus on the 1st nav item
            navItems[visibleNavIndexes[0]].focus();
            // fire keydown event on right arrow
            // the 2nd nav item get focused
            fire(navItems[visibleNavIndexes[0]], 'keydown', {'keyCode': 39});
            resolve();
          }).then(function() {
            return new Promise(function(resolve) {
              assertion = document.activeElement === navItems[visibleNavIndexes[1]];
              resolve();
            });
          }).then(function() {
            // press "Enter"
            return new Promise(function(resolve) {
              fire(navItems[visibleNavIndexes[1]], 'keydown', {'keyCode': 13});
              resolve();
            });
          }).then(function() {
            return new Promise(function (resolve) {
              var current = slider.getInfo().index,
                  currentSlide = slideItems[current];

              if (assertion) {
                assertion = current%slideCount === visibleNavIndexes[1] &&
                  info.navItems[visibleNavIndexes[1]].getAttribute('aria-selected') === 'true' &&
                  compare2Nums(currentSlide.getBoundingClientRect().left, wrapperLeft);
              }
              resolve();
            });
          }).then(function () {
            return new Promise(function (resolve) {
              // fire keydown event on left arrow
              // the 1st nav item get focused
              fire(navItems[visibleNavIndexes[1]], 'keydown', {'keyCode': 37});
              resolve();
            });
          }).then(function() {
            return new Promise(function(resolve) {
              if (assertion) {
                assertion = document.activeElement === navItems[visibleNavIndexes[0]];
              }
              resolve();
            })
          }).then(function () {
            return new Promise(function(resolve) {
              // fire keydown event on down arrow
              // the 3nd nav item get focused
              fire(navItems[visibleNavIndexes[0]], 'keydown', {'keyCode': 40});
              resolve();
            })
          }).then(function() {
            return new Promise(function(resolve) {
              if (assertion) {
                assertion = document.activeElement === navItems[visibleNavIndexes[2]];
              }
              resolve();
            });
          }).then(function(){
            return new Promise(function(resolve) {
              // press "Space"
              fire(navItems[visibleNavIndexes[2]], 'keydown', {'keyCode': 32});
              resolve();
            });
          }).then(function() {
            return new Promise(function (resolve) {
              var current = slider.getInfo().index,
                  currentSlide = slideItems[current];

              if (assertion) {
                assertion = current%slideCount === visibleNavIndexes[2] &&
                  info.navItems[visibleNavIndexes[2]].getAttribute('aria-selected') === 'true' &&
                  compare2Nums(currentSlide.getBoundingClientRect().left, wrapperLeft);
              }
              resolve();
            });
          }).then(function() {
            return new Promise(function(resolve) {
              // fire keydown event on up arrow
              // the 1st nav item get focused
              fire(navItems[visibleNavIndexes[2]], 'keydown', {'keyCode': 38});
              resolve();
            });
          }).then(function() {
            return new Promise(function(resolve) {
              if (assertion) {
                assertion = document.activeElement === navItems[visibleNavIndexes[0]];
              }
              resolve();
            });
          }).then(function() {
            return new Promise(function(resolve) {
              // press "Enter"
              fire(navItems[visibleNavIndexes[0]], 'keydown', {'keyCode': 13});
              resolve();
            });
          }).then(function(){
            return new Promise(function (resolve) {
              var current = slider.getInfo().index,
                  currentSlide = slideItems[current];

              if (assertion) {
                assertion = current%slideCount === visibleNavIndexes[0] &&
                  info.navItems[visibleNavIndexes[0]].getAttribute('aria-selected') === 'true' &&
                  compare2Nums(currentSlide.getBoundingClientRect().left, wrapperLeft);
              }
              resolve();
            });
          }).then(function(){
            updateTest(navKeydown, assertion);
          });
        });
      });

    // browser not support fire keyevents
    // manual test needed
    } else {
      return Promise.resolve().then(function () {
        updateTest(controlsKeydown, '?');
        updateTest(navKeydown, '?');
      });
    }
  }).then(function() {
    var slideCount = info.slideCount,
        controls = document.querySelector('#base_wrapper .goto-controls'),
        input = controls.querySelector('input'),
        button = controls.querySelector('.button');

    var assertion,
        mul = 100;

    function checkGoto() {
      var number = Math.round(Math.random() * mul);
      input.value = number;
      button.click();
      while (number < 0) { number += slideCount; }
      if (assertion !== false) {
        assertion = slider.getInfo().index%slideCount === number%slideCount;
      }
    }

    repeat(checkGoto, 3).then(function () {
      mul = -100;
      return repeat(checkGoto, 3);
    }).then(function() {
      updateTest(testGoto, assertion);
    });
  });
}

function testNonLoop() {
  var id = 'non-loop',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  runTest('Slide: count && Controls: disabled', function () {
    return info.slideItems.length === info.slideCount &&
      info.prevButton.hasAttribute('disabled');
  });

  var test = addTest('Controls: click functions');
  var assertion,
      prevButton = info.prevButton,
      nextButton = info.nextButton,
      navItems = info.navItems,
      slideItems = info.slideItems;

  new Promise(function(resolve) {
    // click next button once
    nextButton.click();
    resolve();
  }).then(function() {
    return new Promise(function(resolve) {
      assertion = !prevButton.hasAttribute('disabled');
      resolve();
    });
  }).then(function() {
    // click next button (slideCount - items) times
    return repeat(function () { nextButton.click(); }, (info.slideCount - info.items - 1));
  }).then(function() {
    return new Promise(function(resolve) {
      var current = info.slideCount - info.items;
      if (assertion) {
        assertion = 
          nextButton.hasAttribute('disabled') &&
          navItems[current].getAttribute('aria-selected') === 'true' &&
          slideItems[current].getAttribute('aria-hidden') === 'false' &&
          compare2Nums(slideItems[current].getBoundingClientRect().left, 0);
      }
      resolve();
    });
  }).then(function() {
    return new Promise(function(resolve) {
      // click next button once
      nextButton.click();
      resolve();
    });
  }).then(function() {
    if (assertion) {
      return new Promise(function(resolve) {
        var current = info.slideCount - info.items;
        assertion = 
          navItems[current].getAttribute('aria-selected') === 'true' &&
          slideItems[current].getAttribute('aria-hidden') === 'false';
      resolve();
      });
    } else {
      return Promise.resolve();
    }
  }).then(function() {
    return new Promise(function (resolve) {
      // click prev button once
      prevButton.click();
      resolve();
    });
  }).then(function() {
    if (assertion) {
      return new Promise(function(resolve) {
        assertion = !nextButton.hasAttribute('disabled');
        resolve();
      });
    } else {
      return Promise.resolve();
    }
  }).then(function() {
    return repeat(function () { 
      // click prev button (slideCount - items) times
      prevButton.click(); 
    }, (info.slideCount - info.items - 1) ).then(function() {
      var current = 0;
      if (assertion) {
        assertion = 
          prevButton.hasAttribute('disabled') &&
          navItems[current].getAttribute('aria-selected') === 'true' &&
          slideItems[current].getAttribute('aria-hidden') === 'false' &&
          compare2Nums(slideItems[current].getBoundingClientRect().left, 0);
      }
    });
  }).then(function() {
    updateTest(test, assertion);
  });
}

function testRewind() {
  var id = 'rewind',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  runTest('Slide: count && Controls: disabled', function () {
    return info.slideItems.length === info.slideCount &&
      info.prevButton.hasAttribute('disabled');
  });

  var test = addTest('Controls: click functions');
  // runTest('Controls: click functions', function () {
  // });
  var assertion,
      prevButton = info.prevButton,
      nextButton = info.nextButton,
      navItems = info.navItems,
      slideItems = info.slideItems;

  new Promise(function(resolve) {
    // click next button once
    nextButton.click();
    resolve();
  }).then(function() {
    return new Promise(function(resolve) {
      assertion = !prevButton.hasAttribute('disabled');
      resolve();
    });
  }).then(function() {
    if (assertion) {
      // click next button (slideCount - items) times
      return repeat(function () {
        nextButton.click();
      }, (info.slideCount - info.items - 1)).then(function() {
        var current = info.slideCount - info.items;
        return new Promise(function(resolve) {
          assertion = !nextButton.hasAttribute('disabled') &&
            navItems[current].getAttribute('aria-selected') === 'true' &&
            slideItems[current].getAttribute('aria-hidden') === 'false' &&
            compare2Nums(slideItems[current].getBoundingClientRect().left, 0);
          resolve();
        });
      }).then(function() {
        if (assertion) {
          // click next button once
          return new Promise(function(resolve) {
            nextButton.click();
            resolve();
          }).then(function() {
            return new Promise(function(resolve) {
              var current = 0;
              assertion = prevButton.hasAttribute('disabled') &&
                navItems[current].getAttribute('aria-selected') === 'true' &&
                slideItems[current].getAttribute('aria-hidden') === 'false' &&
                compare2Nums(slideItems[current].getBoundingClientRect().left, 0);
              resolve();
            });
          });
        } else {
          return Promise.resolve();
        }
      });
    } else {
      return Promise.resolve();
    }
  }).then(function() {
    updateTest(test, assertion);
  });
}

function testFixedWidth() {
  var id = 'fixedWidth',
      fixedWidth = 300,
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  runTest('Slides: position', function () {
    var assertion,
        slideItems = info.slideItems,
        slideCount = info.slideCount,
        items = info.items;
    assertion = items === Math.floor(windowWidth / fixedWidth) &&
      compare2Nums(slideItems[slideCount*2].getBoundingClientRect().left, 0);
    return assertion;
  });

  var controlsClick = addTest('Controls: click functions');
  checkControlsClick(controlsClick, id, (info.slideCount * 3 + 2));
}

function testFixedWidthGutter () {
  var id = 'fixedWidth-gutter',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  runTest('Slides: gutter', function () {
    var slideItems = info.slideItems;
    return compare2Nums(slideItems[0].clientWidth, 310);
  });
}

function testFixedWidthEdgePadding () {
  var id = 'fixedWidth-edgePadding',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slides: edge padding', function () {
    var slideItems = info.slideItems,
        cloneCount = info.cloneCount,
        items = info.items;

    return compare2Nums(slideItems[cloneCount].getBoundingClientRect().left, windowWidth - slideItems[cloneCount + items - 1].getBoundingClientRect().right);
  });
}

function testFixedWidthEdgePaddingGutter () {
  var id = 'fixedWidth-edgePadding-gutter',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slides: edge padding', function () {
    var slideItems = info.slideItems,
        cloneCount = info.cloneCount,
        items = info.items;

    return compare2Nums(slideItems[cloneCount].getBoundingClientRect().left, windowWidth - slideItems[cloneCount + items - 1].getBoundingClientRect().right + gutter);
  });
}

function testVertical () {
  var id = 'vertical',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  runTest('Inner wrapper: classes', function () {
    return containsClasses(info.container.parentNode, ['tns-inner', 'tns-ovh']);
  });

  runTest('Container: classes', function () {
    return containsClasses(info.container, ['tns-slider', 'tns-carousel', 'tns-vertical']);
  });

  runTest('Slides: width', function () {
    var slideItems = info.slideItems;

    return compare2Nums(slideItems[0].getBoundingClientRect().left, 0) &&
      compare2Nums(slideItems[0].getBoundingClientRect().right, windowWidth);
  });

  runTest('Slides: position', function () {
    return checkPositionEdgePadding(id, true);
  });

  var controlsClick = addTest('slides: click functions');
  checkControlsClick(controlsClick, id, 11, 'top');
}

function testVerticalGutter() {
  var id = 'vertical-gutter',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slides: position, gutter', function () {
    var slideItems = info.slideItems,
        cloneCount = info.cloneCount,
        firstRect = slideItems[cloneCount].getBoundingClientRect(),
        secondRect = slideItems[cloneCount + 1].getBoundingClientRect(),
        lastRect = slideItems[cloneCount + info.items - 1].getBoundingClientRect(),
        innerWrapperRect = info.container.parentNode.getBoundingClientRect();

    return compare2Nums(firstRect.top, innerWrapperRect.top) &&
      compare2Nums(firstRect.bottom, secondRect.top - gutter) &&
      compare2Nums(lastRect.bottom, innerWrapperRect.bottom - gutter);
  });
}

function testVerticalEdgePadding () {
  var id = 'vertical-edgePadding',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slides: position, edge padding', function () {
    return checkPositionEdgePadding(id, true);
  });
}

function testVerticalEdgePaddingGutter () {
  var id = 'vertical-edgePadding-gutter',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slides: position, edge padding', function () {
    return checkPositionEdgePadding(id, true);
  });}

function testResponsive() {
  var id = 'responsive',
      slider = sliders[id],
      info = slider.getInfo(),
      responsive = options[id]['responsive'],
      bps = Object.keys(responsive).sort(function (a, b) { return a - b; });

  addTitle(id);

  var init = addTest('Slides: init');
  var resize = addTest('Slides: resize');
  var newWindow = document.createElement('iframe');
  newWindow.setAttribute('frameBorder', '0');
  newWindow.style.cssText = 'width: ' + (Number(bps[0]) + 20) + 'px; height: 1000px; border-width: 0; overflow: hidden;';
  newWindow.src = 'iframe.html';

  if (newWindow.addEventListener) {
    newWindow.addEventListener('load', responsiveTestsOnload, false);
  } else if (newWindow.readyState) {
    newWindow.onreadystatechange = function () {
      if (newWindow.readyState === 'complete') {
        responsiveTestsOnload();
      }
    }
  }

  document.body.appendChild(newWindow);

  function responsiveTestsOnload () {
    try {
      var doc = newWindow.contentDocument? newWindow.contentDocument: newWindow.contentWindow.document,
          nextButton = doc.querySelector('[data-controls="next"]');

      var assertion,
          container = doc.querySelector('#' + id),
          slideItems = container.children,
          wrapper = container.parentNode,
          items = responsive[bps[0]].items,
          index = info.index + items,
          firstRect,
          lastRect,
          wrapperRect;

      new Promise(function(resolve) {
        nextButton.click();
        resolve();
      }).then(function() {
        return new Promise(function(resolve) {
          firstRect = slideItems[index].getBoundingClientRect();
          lastRect = slideItems[index + items - 1].getBoundingClientRect();
          wrapperRect = wrapper.getBoundingClientRect();

          assertion = 
            compare2Nums(firstRect.left, wrapperRect.left) &&
            compare2Nums(lastRect.right, wrapperRect.right);
          resolve();
        });
      }).then(function() {
        if (assertion) {
          init.className = 'item-success';

          // resize window
          return new Promise(function(resolve) {
            newWindow.style.width = (Number(bps[0]) + 20) + 'px';
            resolve();
          }).then(function() {
            return wait(500).then(function() {
              items = responsive[bps[0]].items;
              lastRect = slideItems[index + items - 1].getBoundingClientRect();
              wrapperRect = wrapper.getBoundingClientRect();

              assertion = 
                compare2Nums(firstRect.left, wrapperRect.left) &&
                compare2Nums(lastRect.right, wrapperRect.right);

              updateTest(resize, assertion);
              document.body.removeChild(newWindow);
            });
          });
        } else {
          init.className = resize.className = 'item-fail';
          document.body.removeChild(newWindow);
        }
      });
    } catch (e) {
      init.className = 'item-notsure';
      resize.className = 'item-notsure';
    }
  }
}

function testMouseDrag() {
  var id = 'mouse-drag',
      slider = sliders[id],
      info = slider.getInfo(),
      container = info.container;

  addTitle(id);
  var test = addTest('Mouse drag');
  updateTest(test, '-notsure');
}

function testGutter() {
  var id = 'gutter',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slide: gutter', function () {
    var slideItems = info.slideItems,
        cloneCount = info.cloneCount,
        firstRect = slideItems[cloneCount].getBoundingClientRect(),
        secondRect = slideItems[cloneCount + 1].getBoundingClientRect();
    // There is no "gap" between the two slides
    // because the gap is made by padding
    return compare2Nums(firstRect.right, secondRect.left);
  });
}

function testEdgePadding() {
  var id = 'edgePadding',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slide: position', function () {
    return checkPositionEdgePadding(id, 0);
  });
}

function testEdgePaddingGutter() {
  var id = 'edgePadding-gutter',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slide: position', function () {
    return checkPositionEdgePadding(id);
  });
}

function testFewitems() {
  var id = 'few-items',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  runTest('Slide: count, controls: hidden, nav: hidden', function () {
    return compare2Nums(info.slideItems[info.slideCount * 3 - 1].getBoundingClientRect().right, windowWidth) &&
      info.controlsContainer.hasAttribute('hidden') &&
      info.navContainer.hasAttribute('hidden');
  });
}

function testSlideByPage () {
  var id = 'slide-by-page',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);
  var controlsClick = addTest('Controls: click');
  checkControlsClick(controlsClick, id, 11);
}

function testArrowKeys () {
  var id = 'arrowKeys',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  var test = addTest('Slides: keydown');
  // can fire keydown event
  if (canFireKeydown) {
    var assertion,
        container = info.container,
        slideBy = info.slideBy,
        index = slider.getInfo().index;
    
    new Promise(function(resolve) {
      // fire keydown event on right arrow
      fire(document, 'keydown', { 'keyCode': 39 });
      resolve();
    }).then(function() {
      return new Promise(function(resolve) {
        assertion = slider.getInfo().index === index + slideBy;
        resolve();
      });
    }).then(function() {
      if (assertion) {
        return new Promise(function(resolve) {
          // fire keydown event on right arrow
          fire(document, 'keydown', { 'keyCode': 39 });
          resolve();
        }).then(function() {
          return new Promise(function(resolve) {
            assertion = slider.getInfo().index === index + slideBy * 2;
            resolve();
          });
        }).then(function() {
          if (assertion) {
            return new Promise(function(resolve) {
              // fire keydown event on left arrow
              fire(document, 'keydown', { 'keyCode': 37 });
              resolve();
            }).then(function() {
              return new Promise(function(resolve) {
                assertion = slider.getInfo().index === index + slideBy;
                resolve();
              });
            }).then(function() {
              if (assertion) {
                return new Promise(function(resolve) {
                  // fire keydown event on left arrow
                  fire(document, 'keydown', { 'keyCode': 37 });
                  resolve();
                }).then(function() {
                  return new Promise(function(resolve) {
                    assertion = slider.getInfo().index === index;
                    resolve();
                  });
                });
              } else {
                return Promise.resolve();
              }
            })
          } else {
            return Promise.resolve();
          }
        })
      } else {
        return Promise.resolve();
      }
    }).then(function() {
      updateTest(test, assertion);
    });

  // can't fire keydown event
  // manual test needed
  } else {
    updateTest(test, '-notsure');
  }
}

function testAutoplay () {
  var id = 'autoplay',
      slider = sliders[id],
      info = slider.getInfo(),
      opt = options[id],
      buttons = info.navContainer.children,
      autoplayButton = buttons[buttons.length - 1];

  addTitle(id);
  runTest('autoplayButton: attrs', function () {
    return autoplayButton.getAttribute('data-action') === 'stop' && 
      autoplayButton.textContent.indexOf('Stop Animation') > -1;
  });

  var timeout = 0;
  if (opt['autoplayTimeout']) { timeout += opt['autoplayTimeout']; }
  if (opt['speed']) { timeout += opt['speed']; }

  var testClick = addTest('autoplayButton: click');
  var test1 = addTest('Slide: autoplay');
  var test2 = addTest('Slide: autoplay pause');

  var assertion;
  new Promise(function(resolve) {
    // click autoplay button once
    // pause
    autoplayButton.click();
    resolve();
  }).then(function() {
    return new Promise(function(resolve) {
      assertion = 
          autoplayButton.getAttribute('data-action') === 'start' &&
          autoplayButton.textContent.indexOf('Start Animation') > -1;
      resolve();
    });
  }).then(function() {
    if (assertion) {
      return new Promise(function(resolve) {
        // click autoplay button the second time
        // restart
        autoplayButton.click();
        resolve();
      }).then(function() {
        return new Promise(function (resolve) {
          assertion = 
              autoplayButton.getAttribute('data-action') === 'stop' &&
              autoplayButton.textContent.indexOf('Stop Animation') > -1;
          resolve();
        });
      });
    } else {
      return Promise.resolve();
    }
  }).then(function() {
    return new Promise(function(resolve) {
      updateTest(testClick, assertion);
      resolve();
    });
  }).then(function() {
    /* ### test autoplay
     *
     */
    return testAutoplayFn(id, test1, timeout, false);
  }).then(function() {
    /* ### test autoplay pause
     *
     */
    return wait(timeout).then(function() {
      return new Promise(function(resolve) {
        autoplayButton.click();
        resolve();
      });
    }).then(function() {
      return testAutoplayFn(id, test2, timeout, true);
    });
  });
}

function testAnimation1 () {
  var id = 'animation1',
      slider = sliders[id],
      info = slider.getInfo(),
      slideCountNew = info.slideCountNew,
      items = info.items,
      slideItems = info.slideItems,
      opt = options[id],
      animateIn = opt['animateIn'] ? opt['animateIn'] : 'tns-fadeIn',
      animateOut = opt['animateOut'] ? opt['animateOut'] : 'tns-fadeOut',
      animateNormal = 'tns-normal',
      speed = opt['speed'] ? opt['speed'] : 0;

  if (localStorage['tnsAnDu'] === 'false') {
    animateIn = 'tns-fadeIn';
    animateOut = 'tns-fadeOut';
  }

  addTitle(id);

  function checkAnimationClasses() {
    var assertion,
        index = slider.getInfo().index;

    for (var i = slideCountNew; i--;) {
      if (assertion !== false) {
        assertion = (i >= index && i < index + items) ? containsClasses(slideItems[i], animateIn) : containsClasses(slideItems[i], animateNormal);
      }
    }

    return assertion;
  }

  runTest('Slides: classes on init', function () {
    return checkAnimationClasses();
  });

  var test = addTest('Slides: classes after click');
  new Promise(function(resolve) {
    info.nextButton.click();
    resolve();
  }).then(function() {
    return wait(speed + 300).then(function() {
      updateTest(test, checkAnimationClasses());
    });
  });
}

function testAnimation2 () {
  var id = 'animation2',
      slider = sliders[id],
      info = slider.getInfo(),
      container = info.container,
      slideItems = info.slideItems,
      items = info.items,
      slideCount = info.slideCount,
      nextButton = info.nextButton;

  addTitle(id);

  var test = addTest('Slides: position after click');
  var count = info.slideCountNew + 1;
  var assertion;

  repeat(function () {
    // click next button *count* times
    nextButton.click();
  }, count).then(function() {
    return wait(300).then(function() {
      return new Promise(function(resolve) {
        var index = slider.getInfo().index,
            rect = container.parentNode.getBoundingClientRect();
            
        assertion = 
          index%slideCount === count*items%slideCount &&
          compare2Nums(slideItems[index].getBoundingClientRect().left, rect.left) &&
          compare2Nums(slideItems[index + items - 1].getBoundingClientRect().right, rect.right);
        resolve();
      }).then(function() {
        updateTest(test, assertion);
      });
    });
  });
}

function testLazyload () {
  var id = 'lazyload',
      slider = sliders[id],
      info = slider.getInfo();

  var edgePadding = options[id]['edgePadding'],
      slideBy = options[id]['slideBy'] || 1,
      slideItems = info.slideItems,
      items = info.items,
      index = info.index,
      first = index,
      last = index + items - 1;

  if (edgePadding) {
    first -= 1;
    last += 1;  
  }

  addTitle(id);

  runTest('Slide: init', function () {
    var imgFirst = slideItems[first].querySelector('img'),
        imgLast = slideItems[last].querySelector('img'),
        imgPrev = slideItems[first - 1].querySelector('img'),
        imgNext = slideItems[last + 1].querySelector('img');

    return imgFirst.getAttribute('src') === imgFirst.getAttribute('data-src') &&
      imgLast.getAttribute('src') === imgLast.getAttribute('data-src') &&
      imgPrev.getAttribute('src') !== imgPrev.getAttribute('data-src') && 
      imgNext.getAttribute('src') !== imgNext.getAttribute('data-src') &&
      containsClasses(imgFirst, 'loaded') &&
      containsClasses(imgLast, 'loaded') &&
      !containsClasses(imgPrev, 'loaded') &&
      !containsClasses(imgNext, 'loaded'); 
  });

  var test = addTest('Controls: click'),
      assertion;

  new Promise(function(resolve) {
    info.nextButton.click();
    resolve();
  }).then(function() {
    for (var i = last + 1; i < last + 1 + slideBy; i++) {
      if (assertion === undefined || assertion !== false) {
        var img = slideItems[i].querySelector('img');
        assertion = img.getAttribute('src') === img.getAttribute('data-src') &&
          containsClasses(img, 'loaded');
      }
    }
    updateTest(test, assertion);
  });
}

function testCustomize () {
  var id = 'customize',
      slider = sliders[id],
      info = slider.getInfo(),
      opt = options[id],
      autoplayButton = document.querySelector(opt['autoplayButton']);

  addTitle(id);

  // stop autoplay and go to the first slide
  // before testing slide attrs
  if (opt['autoplay']) {
    autoplayButton.click();
    slider.goTo(0);
  }
  runTest('Slides: width, count, id, class, aria-hidden, tabindex', function () {
    return checkSlidesAttrs(id);
  });
  if (opt['autoplay']) {
    autoplayButton.click();
  }

  runTest('Controls: aria-label, aria-controls, data-controls, tabindex', function () {
    return checkControlsAttrs(id);
  });

  runTest('Nav: aria-label, data-nav, tabindex, aria-selected, aria-controls', function () {
    var assertion,
        info = slider.getInfo(),
        slideCount = info.slideCount,
        absIndex = info.index%slideCount,
        navContainer = info.navContainer,
        navItems = info.navItems;

    assertion = navContainer.getAttribute('aria-label') === 'Carousel Pagination';

    while (absIndex < 0) { absIndex += slideCount; }
    for (var i = slideCount; i--;) {
      var arr = (i === absIndex) ? ['0', 'true'] : ['-1', 'false']; 
      nav = navItems[i];
      if (assertion) {
        assertion = 
          nav.getAttribute('data-nav') === i.toString() &&
          nav.getAttribute('aria-controls') === id + '-item' + i &&
          nav.getAttribute(tabindex) === arr[0] &&
          nav.getAttribute('aria-selected') === arr[1];
      }
    }
    return assertion;
  });

  var controlsClick = addTest('Controls: click functions');
  checkControlsClick(controlsClick, id, 11);

  if (opt['autoplay']) {
    var timeout = 100;
    if (opt['autoplayTimeout']) { timeout += opt['autoplayTimeout']; }
    if (opt['speed']) { timeout += opt['speed']; }

    var test1 = addTest('Slide: autoplay');
    testAutoplayFn(id, test1, timeout, false);

    var test2 = addTest('Slide: autoplay pause');
    wait(timeout).then(function() {
      return new Promise(function(resolve) {
        autoplayButton.click();
        resolve();
      }).then(function() {
        testAutoplayFn(id, test2, timeout, true);
      });
    });
  }
}

function testAutoHeight () {
  var id = 'autoHeight',
      slider = sliders[id],
      info = slider.getInfo();

  addTitle(id);

  var test1 = addTest('Slide: init');
  var test2 = addTest('Slide: click');
  imagesLoaded(info.container, function () {
    var assertion,
        wrapper = info.container.parentNode,
        slideItems = info.slideItems,
        nextButton = info.nextButton;

    assertion = containsClasses(wrapper, ['tns-ah']) &&
      compare2Nums(wrapper.clientHeight, slideItems[info.index].clientHeight);
    updateTest(test1, assertion);

    assertion = null;
    repeat(function () {
      nextButton.click();
      if (assertion || assertion === null) {
        assertion = compare2Nums(wrapper.clientHeight, slideItems[slider.getInfo().index].clientHeight);
      }
    }, 2).then(function() {
      updateTest(test2, assertion);
    });
  });
}

function testNested () {
  var id = 'nested',
      slider = sliders[id],
      info = slider.getInfo(),
      index = info.index,
      slideBy = info.slideBy,
      nextButton = info.nextButton,
      prevButton = info.prevButton,
      assertion,
      _id = 'nested_inner',
      _slider = sliders[_id],
      _info = _slider.getInfo(),
      _index = _info.index,
      _slideBy = _info.slideBy,
      _nextButton = _info.nextButton,
      _edgePadding = _info.edgePadding ? _info.edgePadding : 0,
      _assertion;

  addTitle(id);
  runTest('Slides: position', function () {
    return checkPositionEdgePadding(id);
  });
  var test = addTest('Controls: click');

  addTitle(_id);
  runTest('Slides: position', function () {
    return checkPositionEdgePadding(_id);
  });
  var _test = addTest('Controls: click');

  new Promise(function(resolve) {
    nextButton.click();
    resolve();
  }).then(function() {
    return new Promise(function(resolve) {
      assertion = slider.getInfo().index === index + slideBy &&
        _slider.getInfo().index === _index;
      updateTest(test, assertion);
      resolve();
    });
  }).then(function () {
    return new Promise(function(resolve) {
      prevButton.click();
      _nextButton.click();
      resolve();
    }).then(function() {
      return new Promise(function(resolve) {
        _assertion = _slider.getInfo().index === _index + _slideBy &&
          slider.getInfo().index === index;    
        updateTest(_test, _assertion);
        resolve();
      });
    });
  });
}

function wait(ms) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, ms);
  });
}

function addTitle(str) {
  var title = doc.createElement('div');
  title.className = 'title';
  title.textContent = str;
  resultsDiv.appendChild(title);
}

function addTest(str, postfix) {
  var test = doc.createElement('div');
  if (!postfix) { postfix = '-running'; }
  test.className = 'item' + postfix;
  test.textContent = str;
  resultsDiv.appendChild(test);
  return test;
}

function updateTest(test, assertion) {
  switch(assertion) {
    case true:
      test.className = 'item-success';
      break;
    case false:
      test.className = 'item-fail';
      break;
    default:
      test.className = 'item-notsure';
  }
}

function runTest(str, fn) {
  var test = addTest(str);
  test.className = (fn()) ? 'item-success' : 'item-fail';
}

function containsClasses(el, arr) {
  var len = arr.length,
      classes = el.className,
      assertion = true;

  for (var i = 0; i < len; i++) {
    if (classes.indexOf(arr[i]) < 0) { assertion = false; }
  }

  return assertion;
}

function compare2Nums(a, b) {
  // var gap = (ua.indexOf('MSIE 8.0') > -1) ? 2 : 1;
  return Math.abs(a - b) <= 2;
}

function getAbsIndex(current, clicks, info) {
  return (current + info.slideBy * clicks + info.slideCount * multiplyer)%info.slideCount;
}

function repeat(fn, count, timeout) {
  var promise = Promise.resolve();

  if (timeout) {
    while (count > 0) {
      promise = promise.then(function () {
        return wait(timeout);
      }).then(function () {
        return new Promise(function (resolve, reject) {
          fn();
          resolve();
        });
      });

      count--;
    }
  } else {
    while (count > 0) {
      promise = promise.then(function () {
        return new Promise(function (resolve, reject) {
          fn();
          resolve();
        });
      });

      count--;
    }
  }

  return promise;
}

function checkSlidesAttrs(id) {
  var info = sliders[id].getInfo(),
      slideItems = info.slideItems,
      index = info.index,
      items = info.items,
      slideCount = info.slideCount,
      firstVisible = slideItems[index],
      lastVisible = slideItems[index + items - 1],
      firstVisiblePrev = slideItems[index - 1],
      lastVisibleNext = slideItems[index + items],
      checkLastItem = (options[id]['axis'] === 'vertical') ? true : compare2Nums(slideItems[slideItems.length - 1].getBoundingClientRect().top, info.container.parentNode.getBoundingClientRect().top);

  return slideItems.length === info.slideCount * 5 &&
    containsClasses(firstVisible, ['tns-item']) &&
    firstVisible.id === id + '-item' + 0 &&
    firstVisible.getAttribute('aria-hidden') === 'false' &&
    !firstVisible.hasAttribute('tabindex') &&
    firstVisiblePrev.id === '' &&
    firstVisiblePrev.getAttribute('aria-hidden') === 'true' &&
    firstVisiblePrev.getAttribute('tabindex') === '-1' &&
    lastVisible.id === id + '-item' + (items - 1) &&
    lastVisible.getAttribute('aria-hidden') === 'false' &&
    !lastVisible.hasAttribute('tabindex') &&
    lastVisibleNext.getAttribute('aria-hidden') === 'true' &&
    lastVisibleNext.getAttribute('tabindex') === '-1' &&
    compare2Nums(firstVisible.clientWidth, windowWidth / items) &&
    checkLastItem;
}

function checkControlsAttrs(id) {
  var info = sliders[id].getInfo(),
      controlsContainer = info.controlsContainer,
      prevButton = info.prevButton,
      nextButton = info.nextButton,
      checkClass = options[id]['controlsContainer'] ? true : containsClasses(controlsContainer, 'tns-controls');
  return checkClass &&
    controlsContainer.getAttribute('aria-label') === 'Carousel Navigation' &&
    controlsContainer.getAttribute(tabindex) === '0' &&
    prevButton.getAttribute(tabindex) === '-1' &&
    prevButton.getAttribute('data-controls') === 'prev' &&
    prevButton.getAttribute('aria-controls') === id &&
    nextButton.getAttribute(tabindex) === '-1' &&
    nextButton.getAttribute('data-controls') === 'next' &&
    nextButton.getAttribute('aria-controls') === id;
}

function checkControlsClick(test, id, count, vertical) {
  var assertion,
      slider = sliders[id],
      info = slider.getInfo(),
      container = info.container,
      wrapper = container.parentNode,
      slideCount = info.slideCount,
      navItems = info.navItems,
      slideItems = info.slideItems,
      items = info.items,
      edge1 = 'left',
      edge2 = 'right';

  if (vertical) {
    edge1 = 'top';
    edge2 = 'bottom';
  }
      
  function getAssertion (absIndex) {
    var index = sliders[id].getInfo().index,
        first = slideItems[index],
        last = slideItems[index + items - 1],
        checkLastEdge = options[id]['fixedWidth'] ? true : compare2Nums(last.getBoundingClientRect()[edge2], wrapper.getBoundingClientRect()[edge2]);
        
    return absIndex === index%slideCount &&
      navItems[absIndex].getAttribute('aria-selected') === 'true' &&
      first.getAttribute('aria-hidden') === 'false' &&
      !first.hasAttribute(tabindex) &&
      last.getAttribute('aria-hidden') === 'false' &&
      !last.hasAttribute(tabindex) &&
      compare2Nums(first.getBoundingClientRect()[edge1], wrapper.getBoundingClientRect()[edge1]) &&
      checkLastEdge;
  }

  // click prev button n times
  var current = info.index;
  var promise = (id === 'customize') ? 
      repeat(function () { simulateClick(info.prevButton); }, count) : 
      repeat(function () { info.prevButton.click(); }, count);

  return promise.then(function () {
    return new Promise(function (resolve, reject) {
      var absIndex = getAbsIndex(current, -count, info);
      assertion = getAssertion(absIndex);
      resolve();
    });
  }).then(function () {
    if (assertion) {
      var clickNext = (id === 'customize') ? 
          repeat(function () { simulateClick(info.nextButton); }, count) : 
          repeat(function () { info.nextButton.click(); }, count);

      return clickNext.then(function () {
        return new Promise(function (resolve, reject) {
          assertion = getAssertion(0);
          resolve();
        });
      });
    } else {
      return Promise.resolve();
    }
  }).then(function () {
    return Promise.resolve().then(function () {
      updateTest(test, assertion);
    });
  });
}

function checkPositionEdgePadding (id, vertical) {
  var opt = options[id],
      info = sliders[id].getInfo();

  padding = opt.edgePadding ? opt.edgePadding : 0;
  gap = opt.gutter ? opt.gutter : 0;
  vertical = vertical || false;

  var slideItems = info.slideItems,
      cloneCount = info.cloneCount,
      wrapper = info.container.parentNode,
      first = slideItems[cloneCount],
      last = slideItems[cloneCount + info.items - 1],
      edge1 = (vertical) ? 'top' : 'left',
      edge2 = (vertical) ? 'bottom' : 'right',
      gutterAdjust = (vertical) ? 0 : (padding) ? gap : 0;

  if (!vertical) { wrapper = wrapper.parentNode; }
  var wrapperRect = wrapper.getBoundingClientRect();

  return compare2Nums(first.getBoundingClientRect()[edge1] - (padding + gap), wrapperRect[edge1]) &&
    compare2Nums(last.getBoundingClientRect()[edge2] - gutterAdjust, wrapperRect[edge2] - (padding + gap));
}

function testAutoplayFn (id, el, timeout, equal) {
  var assertion,
      current = sliders[id].getInfo().index;

  return wait(timeout).then(function() {
    return new Promise(function(resolve) {
      assertion = current === sliders[id].getInfo().index;
      assertion = (equal) ? assertion : !assertion;
      updateTest(el, assertion);
      resolve();
    });
  });
}

