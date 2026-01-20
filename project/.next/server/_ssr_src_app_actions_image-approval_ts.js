"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_src_app_actions_image-approval_ts";
exports.ids = ["_ssr_src_app_actions_image-approval_ts"];
exports.modules = {

/***/ "(ssr)/./src/app/actions/image-approval.ts":
/*!*******************************************!*\
  !*** ./src/app/actions/image-approval.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   approveImage: () => (/* binding */ approveImage),
/* harmony export */   flagImageForRevision: () => (/* binding */ flagImageForRevision),
/* harmony export */   rejectAndRegenerate: () => (/* binding */ rejectAndRegenerate)
/* harmony export */ });
/* harmony import */ var next_dist_client_app_call_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/client/app-call-server */ "(ssr)/./node_modules/next/dist/client/app-call-server.js");
/* harmony import */ var next_dist_client_app_call_server__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_client_app_call_server__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var private_next_rsc_action_client_wrapper__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! private-next-rsc-action-client-wrapper */ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js");



function __build_action__(action, args) {
  return (0,next_dist_client_app_call_server__WEBPACK_IMPORTED_MODULE_0__.callServer)(action.$$id, args)
}

/* __next_internal_action_entry_do_not_use__ {"346ba9c452a7e581a4c0c637ab9f28247ab22632":"rejectAndRegenerate","4fb5e6fa98fc6c8ec07dfa0e4c24b6be968ee358":"flagImageForRevision","82045e82bb8ba620b742e52f6b7b27d212adb9f0":"approveImage"} */ var flagImageForRevision = (0,private_next_rsc_action_client_wrapper__WEBPACK_IMPORTED_MODULE_1__.createServerReference)("4fb5e6fa98fc6c8ec07dfa0e4c24b6be968ee358");

var approveImage = (0,private_next_rsc_action_client_wrapper__WEBPACK_IMPORTED_MODULE_1__.createServerReference)("82045e82bb8ba620b742e52f6b7b27d212adb9f0");
var rejectAndRegenerate = (0,private_next_rsc_action_client_wrapper__WEBPACK_IMPORTED_MODULE_1__.createServerReference)("346ba9c452a7e581a4c0c637ab9f28247ab22632");



/***/ })

};
;