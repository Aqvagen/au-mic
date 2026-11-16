/* =========================================================
   Ядро: общий объект AU создаётся до всех экранов
   ========================================================= */
(function (G) {
  'use strict';
  var AU = G.AU = G.AU || {};
  AU.D = G.D;
  AU.L = G.L;
  AU.state = AU.state || { S: null, loc: null, dlg: null, screen: 'title' };
})(window);
