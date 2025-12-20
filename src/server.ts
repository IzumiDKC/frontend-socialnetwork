// import {
//   AngularNodeAppEngine,
//   createNodeRequestHandler,
//   isMainModule,
//   writeResponseToNodeResponse,
// } from '@angular/ssr/node';
// import express from 'express';
// import { dirname, resolve } from 'node:path';
// import { fileURLToPath } from 'node:url';

// const serverDistFolder = dirname(fileURLToPath(import.meta.url));
// const browserDistFolder = resolve(serverDistFolder, '../browser');

// const app = express();
// const angularApp = new AngularNodeAppEngine();

// /**
//  * 1. FIX LỖI CSP (Content Security Policy)
//  * Mở quyền tối đa cho môi trường Dev để không bị chặn DevTools/Google Translate
//  */
// app.use((req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
//   );
//   next();
// });

// /**
//  * 2. Phục vụ file tĩnh
//  */
// app.use(
//   express.static(browserDistFolder, {
//     maxAge: '1y',
//     index: false,
//     redirect: false,
//   }),
// );

// /**
//  * 3. Xử lý SSR & Routing
//  * SỬA LỖI QUAN TRỌNG: Không truyền đường dẫn (như '*' hay '/**') vào app.use
//  * Để trống tham số đầu tiên nghĩa là "Áp dụng cho mọi Request".
//  * Điều này tránh hoàn toàn lỗi "Missing parameter name".
//  */
// app.use((req, res, next) => {
//   // Bỏ qua /api để Proxy xử lý
//   if (req.baseUrl.startsWith('/api') || req.path.startsWith('/api')) {
//     return next();
//   }

//   angularApp
//     .handle(req)
//     .then((response) => {
//       if (response) {
//         writeResponseToNodeResponse(response, res);
//       } else {
//         // Fallback: Nếu SSR không render được, chuyển tiếp để Angular Dev Server trả về index.html
//         next();
//       }
//     })
//     .catch(next);
// });

// /**
//  * Khởi động Server
//  */
// if (isMainModule(import.meta.url) || process.env['pm_id']) {
//   const port = process.env['PORT'] || 4000;
//   app.listen(port, () => {
//     console.log(`Node Express server listening on http://localhost:${port}`);
//   });
// }

// export const reqHandler = createNodeRequestHandler(app);