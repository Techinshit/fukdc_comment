// ==UserScript==
// @name         FuckDC_img_comment
// @namespace    dc-imgcmt-off
// @version      1.3.0
// @description  디시인사이드 PC·모바일에서 이미지 댓글을 자동 OFF하고 숨깁니다 (성능 최적화 및 프리징 해결)
// @author       이미지댓글 오프
// @match        https://gall.dcinside.com/*
// @match        http://gall.dcinside.com/*
// @match        https://*.gall.dcinside.com/*
// @match        https://m.dcinside.com/*
// @match        http://m.dcinside.com/*
// @match        https://gallog.dcinside.com/*
// @match        http://gallog.dcinside.com/*
// @icon         https://nstatic.dcinside.com/dc/m/img/dcinside_icon.png
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @license      MIT
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  var NATIVE_KEY = "show_img_comment";
  var SETTING_KEY = "dc_imgcmt_off_enabled";
  var PANEL_KEY = "dc_imgcmt_off_panel";
  var STYLE_ID = "dc-imgcmt-off-style";
  var ROOT_CLASS = "dc-imgcmt-off";

  // CSS로 UI 상에서 원천적으로 안 보이게 처리
  var HIDE_CSS =
    "html." + ROOT_CLASS + " .img-comment," +
    "html." + ROOT_CLASS + " .img_comment," +
    "html." + ROOT_CLASS + " .img_comment_box," +
    "html." + ROOT_CLASS + " .btn-imgcomment," +
    "html." + ROOT_CLASS + " .btn_imgcmtopen," +
    "html." + ROOT_CLASS + " [id^='img_comment_div']," +
    "html." + ROOT_CLASS + " [id^='img_comment_open_btn']," +
    "html." + ROOT_CLASS + " [id^='img_comment_write_div']," +
    "html." + ROOT_CLASS + " .gall-thum-btm .img-comment," +
    "html." + ROOT_CLASS + " .writing_view_box .img_comment," +
    "html." + ROOT_CLASS + " .write_div .img_comment," +
    "html." + ROOT_CLASS + " .img_memo_wrap," +
    "html." + ROOT_CLASS + " .image-comment-box," +
    "html." + ROOT_CLASS + " .img_reply_wrap" +
    "{ display:none!important;visibility:hidden!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;border:0!important; pointer-events:none!important; }";

  var UI_CSS =
    "#dc-imgcmt-off-fab{position:fixed;z-index:2147483000;right:12px;bottom:18px;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;}" +
    "#dc-imgcmt-off-fab button{appearance:none;border:1px solid rgba(236,232,223,.18);background:#14161c;color:#ece8df;border-radius:999px;padding:8px 12px;font-size:12px;line-height:1.2;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.28); cursor:pointer;}" +
    "#dc-imgcmt-off-fab button[data-on='0']{opacity:.7}" +
    "#dc-imgcmt-off-panel{width:min(280px,calc(100vw - 24px));background:#14161c;color:#ece8df;border:1px solid rgba(236,232,223,.14);border-radius:16px;padding:12px 14px 14px;box-shadow:0 16px 40px rgba(0,0,0,.4);}" +
    "#dc-imgcmt-off-panel[hidden]{display:none!important}" +
    "#dc-imgcmt-off-panel h2{margin:0 0 6px;font-size:13px;font-weight:700}" +
    "#dc-imgcmt-off-panel p{margin:0 0 10px;font-size:11px;line-height:1.45;color:#9a958c}" +
    "#dc-imgcmt-off-panel .row{display:flex;gap:8px}" +
    "#dc-imgcmt-off-panel .row button{flex:1;border-radius:10px}" +
    "@media (max-width:720px){#dc-imgcmt-off-fab{bottom:72px;right:10px}}";

  function gmGet(key, fallback) {
    try { if (typeof GM_getValue === "function") return GM_getValue(key, fallback); } catch (e) {}
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e2) { return fallback; }
  }

  function gmSet(key, value) {
    try {
      if (typeof GM_setValue === "function") { GM_setValue(key, value); return; }
    } catch (e) {}
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e2) {}
  }

  function isEnabled() {
    return gmGet(SETTING_KEY, true) !== false;
  }

  // 핵심 로직: 쿠키만 깔끔하게 변경 (무한루프 방지)
  function applyNativeCookie() {
    if (isEnabled()) {
      try { localStorage.setItem(NATIVE_KEY, "hide"); } catch (e) {}
      document.cookie = "img_comment=0; domain=.dcinside.com; path=/; expires=Thu, 31 Dec 2099 23:59:59 GMT;";
    } else {
      try { localStorage.removeItem(NATIVE_KEY); } catch (e) {}
      document.cookie = "img_comment=1; domain=.dcinside.com; path=/; expires=Thu, 31 Dec 2099 23:59:59 GMT;";
    }
  }

  function applyRootClass() {
    var root = document.documentElement;
    if (!root) return;
    if (isEnabled()) root.classList.add(ROOT_CLASS);
    else root.classList.remove(ROOT_CLASS);
  }

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var css = HIDE_CSS + UI_CSS;
    if (typeof GM_addStyle === "function") {
      try {
        var node = GM_addStyle(css);
        if (node) { node.id = STYLE_ID; return; }
      } catch (e) {}
    }
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  function updateFab() {
    var btn = document.getElementById("dc-imgcmt-off-toggle");
    if (!btn) return;
    var on = isEnabled();
    btn.setAttribute("data-on", on ? "1" : "0");
    btn.textContent = on ? "이미지댓글 OFF" : "이미지댓글 ON";
  }

  function ensureFab() {
    if (document.getElementById("dc-imgcmt-off-fab") || !document.body) return;
    var wrap = document.createElement("div");
    wrap.id = "dc-imgcmt-off-fab";
    wrap.innerHTML =
      '<div id="dc-imgcmt-off-panel" hidden>' +
      "<h2>이미지댓글 오프</h2>" +
      "<p>본문 짤과 일반 댓글은 그대로 두고, 이미지에 달리는 댓글만 자동으로 끕니다. 적용/해제 후 페이지를 새로고침하세요.</p>" +
      '<div class="row">' +
      '<button type="button" id="dc-imgcmt-off-enable">차단 적용</button>' +
      '<button type="button" id="dc-imgcmt-off-disable">차단 해제</button>' +
      "</div></div>" +
      '<button type="button" id="dc-imgcmt-off-toggle">이미지댓글 OFF</button>';
    document.body.appendChild(wrap);

    document.getElementById("dc-imgcmt-off-toggle").addEventListener("click", function () {
      var panel = document.getElementById("dc-imgcmt-off-panel");
      var open = panel.hasAttribute("hidden");
      if (open) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
      gmSet(PANEL_KEY, open);
    });
    
    document.getElementById("dc-imgcmt-off-enable").addEventListener("click", function () {
      gmSet(SETTING_KEY, true);
      applyNativeCookie();
      applyRootClass();
      updateFab();
      location.reload(); // 안정성을 위해 새로고침 추가
    });
    
    document.getElementById("dc-imgcmt-off-disable").addEventListener("click", function () {
      gmSet(SETTING_KEY, false);
      applyNativeCookie(); 
      applyRootClass();
      updateFab();
      location.reload(); // 안정성을 위해 새로고침 추가
    });
    
    if (gmGet(PANEL_KEY, false)) {
      document.getElementById("dc-imgcmt-off-panel").removeAttribute("hidden");
    }
    updateFab();
  }

  // 초기 실행부 (안전한 부분만 실행)
  applyRootClass();
  applyNativeCookie();
  injectCss();

  // 메뉴 커맨드 등록
  if (typeof GM_registerMenuCommand === "function") {
    try {
      GM_registerMenuCommand("이미지 댓글 차단 켜기", function () {
        gmSet(SETTING_KEY, true);
        applyNativeCookie();
        applyRootClass();
        location.reload();
      });
      GM_registerMenuCommand("이미지 댓글 차단 끄기", function () {
        gmSet(SETTING_KEY, false);
        applyNativeCookie();
        applyRootClass();
        location.reload();
      });
    } catch (e) {}
  }

  function onReady() {
    injectCss();
    applyRootClass();
    ensureFab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();